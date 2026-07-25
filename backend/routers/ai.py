"""NutriFit AI assistant — a single chat that logs meals from natural language
and coaches the user, grounded in their profile, today's log, and the verified
desi food dataset.

Provider-flexible: uses Groq or any OpenAI-compatible endpoint (via the `openai`
SDK) or Anthropic (via the `anthropic` SDK), whichever key is configured. The
feature is optional — with no provider key the endpoint returns 503 and the rest
of the app is unaffected.
"""

import json
import logging
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import ml
from ..database import get_db
from ..models import ChatMessage, Conversation, FoodFeedback, MealLog, User, UserProfile
from ..ratelimit import limit
from ..security import get_current_user
from ..settings import get_settings

logger = logging.getLogger("nutrifit.ai")
router = APIRouter(prefix="/api/ai", tags=["ai"])

try:
    from openai import OpenAI
    _OPENAI_OK = True
except Exception:  # pragma: no cover
    OpenAI = None
    _OPENAI_OK = False

try:
    import anthropic
    _ANTHROPIC_OK = True
except Exception:  # pragma: no cover
    anthropic = None
    _ANTHROPIC_OK = False

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
# gpt-oss-20b has far more reliable tool-calling on Groq than Llama-3.3
# (which intermittently emits malformed <function=…> calls that get rejected).
DEFAULT_MODELS = {"groq": "openai/gpt-oss-20b", "openai": "gpt-4o-mini",
                  "anthropic": "claude-sonnet-5"}
MEAL_ORDER = {"Breakfast": 0, "Lunch": 1, "Dinner": 2, "Snack": 3}
MAX_TOOL_ROUNDS = 6


# ---------------- request schema ----------------
class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversation_id: int | None = None
    date: str | None = None


# recent turns kept as model context (older history stays in the DB / UI)
CONTEXT_TURNS = 20


# ---------------- provider resolution ----------------
def _resolve_provider():
    """Return (kind, client, model) or (None, None, None) if unconfigured."""
    s = get_settings()
    # Fail fast on rate limits instead of the SDK's long default backoff.
    opts = {"max_retries": 1, "timeout": 30.0}
    if s.GROQ_API_KEY and _OPENAI_OK:
        return ("openai", OpenAI(api_key=s.GROQ_API_KEY, base_url=GROQ_BASE_URL, **opts),
                s.AI_MODEL or DEFAULT_MODELS["groq"])
    if s.OPENAI_API_KEY and _OPENAI_OK:
        return ("openai", OpenAI(api_key=s.OPENAI_API_KEY, **opts), s.AI_MODEL or DEFAULT_MODELS["openai"])
    if s.ANTHROPIC_API_KEY and _ANTHROPIC_OK:
        return ("anthropic", anthropic.Anthropic(api_key=s.ANTHROPIC_API_KEY),
                s.AI_MODEL or DEFAULT_MODELS["anthropic"])
    return (None, None, None)


# ---------------- helpers ----------------
def _parse_date(s: str | None) -> date:
    if not s:
        return date.today()
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError:
        return date.today()


def _day_state(db: Session, user_id: int, d: date) -> dict:
    rows = list(db.scalars(select(MealLog).where(
        MealLog.user_id == user_id, MealLog.log_date == d)))
    rows.sort(key=lambda r: MEAL_ORDER.get(r.meal_type, 9))
    totals = {
        "calories": round(sum(r.calories for r in rows), 1),
        "protein": round(sum(r.protein for r in rows), 1),
        "carbs": round(sum(r.carbs for r in rows), 1),
        "fat": round(sum(r.fat for r in rows), 1),
    }
    p = db.scalar(select(UserProfile).where(UserProfile.user_id == user_id))
    target = (ml.compute_targets(p.age, p.gender, p.weight_kg, p.height_cm, p.goal, p.activity)
              if p else None)
    remaining = None
    if target:
        remaining = {k: round(target[k] - totals[k], 1)
                     for k in ("calories", "protein", "carbs", "fat")}
    return {
        "date": d.isoformat(),
        "meals": [{"meal_type": m.meal_type, "food_name": m.food_name,
                   "quantity_g": m.quantity_g, "calories": m.calories,
                   "protein": m.protein, "carbs": m.carbs, "fat": m.fat} for m in rows],
        "totals": totals, "target": target, "remaining": remaining,
        "has_profile": p is not None,
    }


def _system_prompt(day: dict) -> str:
    prof = "no profile set yet — suggest they set it on the Diet page for personalized targets"
    if day.get("target"):
        t = day["target"]
        prof = (f"targets: {t['calories']:.0f} kcal, {t['protein']:.0f}g protein, "
                f"{t['carbs']:.0f}g carbs, {t['fat']:.0f}g fat")
    rem = day.get("remaining")
    rem_s = ""
    if rem:
        rem_s = (f"\nRemaining today: {rem['calories']:.0f} kcal, {rem['protein']:.0f}g P, "
                 f"{rem['carbs']:.0f}g C, {rem['fat']:.0f}g F.")
    logged = day.get("totals", {})
    return (
        "You are NutriFit's AI coach for Pakistani users. You do two things: "
        "(1) log meals from natural language, and (2) coach on nutrition & fitness.\n\n"
        "Rules:\n"
        "- Understand desi foods and phrasing (biryani, nihari, aloo gosht, '2 roti', "
        "chai, lassi) as well as English.\n"
        "- To log a meal, call search_foods for EACH distinct food separately "
        "(e.g. 'roti' and 'chicken karahi' in separate calls). Pass the EXACT per-100g "
        "macros it returns to log_meal — do NOT alter them. Only if a food has no match, "
        "estimate its per-100g values and say you estimated it.\n"
        "- Infer a sensible quantity in grams (1 roti ~40g, 1 cup cooked rice ~150g, "
        "1 egg ~50g). Confirm big assumptions briefly.\n"
        "- Pick meal_type from context; default to Snack.\n"
        "- After logging, tell the user what you logged and how it fits their remaining budget.\n"
        "- Be concise, warm, and practical. Give numbers. Never invent the user's data — "
        "use the tools.\n"
        "- Format replies with clean markdown so they render nicely: a short opening line, "
        "then details as a compact markdown table or bulleted list, and end with the key "
        "takeaway (e.g. remaining budget) in **bold**. Keep it tight — no walls of text.\n"
        "- Not a doctor; add a short caution for medical questions.\n\n"
        f"User context — {prof}.\n"
        f"Logged so far today: {logged.get('calories', 0):.0f} kcal, "
        f"{logged.get('protein', 0):.0f}g P, {logged.get('carbs', 0):.0f}g C, "
        f"{logged.get('fat', 0):.0f}g F.{rem_s}"
    )


# Single tool spec; rendered into each provider's format below.
_TOOL_DEFS = [
    {
        "name": "search_foods",
        "description": "Search NutriFit's verified per-100g food dataset (Pakistani + global). "
                       "Use before logging to get accurate macros.",
        "parameters": {
            "type": "object",
            "properties": {"query": {"type": "string", "description": "food name, e.g. 'chicken karahi'"}},
            "required": ["query"],
        },
    },
    {
        "name": "log_meal",
        "description": "Log a meal to the user's diary for today. Provide per-100g macros "
                       "(from search_foods, or your estimate) and the quantity eaten in grams.",
        "parameters": {
            "type": "object",
            "properties": {
                "food_name": {"type": "string"},
                "meal_type": {"type": "string", "enum": ["Breakfast", "Lunch", "Dinner", "Snack"]},
                "quantity_g": {"type": "number", "description": "grams eaten"},
                "per100_calories": {"type": "number"},
                "per100_protein": {"type": "number"},
                "per100_carbs": {"type": "number"},
                "per100_fat": {"type": "number"},
            },
            "required": ["food_name", "meal_type", "quantity_g",
                         "per100_calories", "per100_protein", "per100_carbs", "per100_fat"],
        },
    },
    {
        "name": "get_day",
        "description": "Get the user's current logged totals, targets, and remaining budget for today.",
        "parameters": {"type": "object", "properties": {}},
    },
]


def _dispatch(name: str, args: dict, *, db: Session, user_id: int, d: date, actions: list) -> dict:
    if name == "search_foods":
        return {"results": ml.search_foods(str(args.get("query", "")), 12)}
    if name == "get_day":
        return _day_state(db, user_id, d)
    if name == "log_meal":
        qty = max(0.0, float(args.get("quantity_g", 0)))
        f = qty / 100.0
        cal = round(float(args.get("per100_calories", 0)) * f, 1)
        pro = round(float(args.get("per100_protein", 0)) * f, 1)
        carb = round(float(args.get("per100_carbs", 0)) * f, 1)
        fat = round(float(args.get("per100_fat", 0)) * f, 1)
        mt = str(args.get("meal_type", "Snack")).strip().title()
        if mt not in MEAL_ORDER:
            mt = "Snack"
        name_ = str(args.get("food_name", "Food")).strip()[:160] or "Food"
        m = MealLog(user_id=user_id, log_date=d, meal_type=mt, food_name=name_,
                    quantity_g=qty, calories=cal, protein=pro, carbs=carb, fat=fat)
        db.add(m)
        db.add(FoodFeedback(user_id=user_id, food_name=name_, meal_type=mt, signal="log"))
        db.commit()
        logged = {"meal_type": mt, "food_name": name_, "quantity_g": qty,
                  "calories": cal, "protein": pro, "carbs": carb, "fat": fat}
        actions.append({"type": "logged", **logged})
        return {"ok": True, "logged": logged, "day": _day_state(db, user_id, d)}
    return {"error": f"unknown tool {name}"}


# ---------------- provider loops ----------------
def _run_openai(client, model, system, msgs, tool_ctx) -> str:
    tools = [{"type": "function", "function": t} for t in _TOOL_DEFS]
    messages = [{"role": "system", "content": system}] + msgs
    resp = client.chat.completions.create(model=model, messages=messages, tools=tools,
                                          max_tokens=1024, temperature=0.3)
    msg = resp.choices[0].message
    rounds = 0
    while getattr(msg, "tool_calls", None) and rounds < MAX_TOOL_ROUNDS:
        rounds += 1
        messages.append(msg.model_dump(exclude_none=True))
        for tc in msg.tool_calls:
            try:
                args = json.loads(tc.function.arguments or "{}")
            except json.JSONDecodeError:
                args = {}
            result = _dispatch(tc.function.name, args, **tool_ctx)
            messages.append({"role": "tool", "tool_call_id": tc.id,
                             "content": json.dumps(result)})
        resp = client.chat.completions.create(model=model, messages=messages, tools=tools,
                                              max_tokens=1024, temperature=0.3)
        msg = resp.choices[0].message
    return (msg.content or "").strip()


def _run_anthropic(client, model, system, msgs, tool_ctx) -> str:
    tools = [{"name": t["name"], "description": t["description"], "input_schema": t["parameters"]}
             for t in _TOOL_DEFS]
    messages = list(msgs)
    resp = client.messages.create(model=model, max_tokens=1024, system=system,
                                  tools=tools, messages=messages)
    rounds = 0
    while resp.stop_reason == "tool_use" and rounds < MAX_TOOL_ROUNDS:
        rounds += 1
        tool_results = []
        for block in resp.content:
            if getattr(block, "type", None) == "tool_use":
                result = _dispatch(block.name, dict(block.input or {}), **tool_ctx)
                tool_results.append({"type": "tool_result", "tool_use_id": block.id,
                                     "content": json.dumps(result)})
        messages.append({"role": "assistant", "content": [b.model_dump() for b in resp.content]})
        messages.append({"role": "user", "content": tool_results})
        resp = client.messages.create(model=model, max_tokens=1024, system=system,
                                      tools=tools, messages=messages)
    return "".join(getattr(b, "text", "") for b in resp.content
                   if getattr(b, "type", None) == "text").strip()


def _title_from(text: str) -> str:
    t = " ".join(text.strip().split())
    return (t[:60] + "…") if len(t) > 60 else (t or "New chat")


def _own_conversation(db: Session, user_id: int, conv_id: int) -> Conversation | None:
    c = db.get(Conversation, conv_id)
    return c if c and c.user_id == user_id else None


# ---------------- conversation history ----------------
@router.get("/conversations")
def list_conversations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = list(db.scalars(select(Conversation).where(Conversation.user_id == user.id)
                           .order_by(Conversation.updated_at.desc())))
    return {"conversations": [{"id": c.id, "title": c.title,
                               "updated_at": c.updated_at.isoformat() if c.updated_at else None}
                              for c in rows]}


@router.get("/conversations/{conv_id}")
def get_conversation(conv_id: int, user: User = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    c = _own_conversation(db, user.id, conv_id)
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    return {"id": c.id, "title": c.title,
            "messages": [{"role": m.role, "content": m.content} for m in c.messages]}


@router.delete("/conversations/{conv_id}")
def delete_conversation(conv_id: int, user: User = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    c = _own_conversation(db, user.id, conv_id)
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(c)
    db.commit()
    return {"success": True}


@router.post("/chat")
@limit("60/hour")
def chat(request: Request, payload: ChatIn,
         user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    kind, client, model = _resolve_provider()
    if not client:
        raise HTTPException(status_code=503,
                            detail="AI assistant is not configured. Set GROQ_API_KEY "
                                   "(or OPENAI_API_KEY / ANTHROPIC_API_KEY).")

    # Resolve or create the conversation, then load prior turns for context.
    conv = _own_conversation(db, user.id, payload.conversation_id) if payload.conversation_id else None
    if conv is None:
        conv = Conversation(user_id=user.id, title=_title_from(payload.message))
        db.add(conv)
        db.commit()
        db.refresh(conv)
    prior = [{"role": m.role, "content": m.content} for m in conv.messages][-CONTEXT_TURNS:]
    db.add(ChatMessage(conversation_id=conv.id, role="user", content=payload.message))
    db.commit()

    d = _parse_date(payload.date)
    system = _system_prompt(_day_state(db, user.id, d))
    msgs = prior + [{"role": "user", "content": payload.message}]
    actions: list = []
    tool_ctx = {"db": db, "user_id": user.id, "d": d, "actions": actions}

    run = _run_anthropic if kind == "anthropic" else _run_openai
    reply, last_exc = None, None
    for attempt in range(2):  # one retry — model can emit a malformed tool call
        try:
            reply = run(client, model, system, msgs, tool_ctx)
            break
        except Exception as exc:  # provider/network errors
            last_exc = exc
            logger.warning("AI provider error (%s/%s) attempt %d: %s", kind, model, attempt + 1, exc)
            if actions:  # already logged this turn; don't retry (avoid double-logging)
                break
    if reply is None:
        if actions:  # the log succeeded even though the final reply didn't
            reply = "Done — I've logged that. (I had a small hiccup finishing my reply.)"
        else:
            logger.error("AI provider failed (%s/%s): %s", kind, model, last_exc)
            is_rate_limited = getattr(last_exc, "status_code", None) == 429 or "429" in str(last_exc)
            if is_rate_limited:
                raise HTTPException(status_code=429,
                                    detail="The AI is busy right now (rate limit). Please try again in a moment.")
            raise HTTPException(status_code=502, detail="AI service error. Please try again.")

    reply = reply or "Sorry, I didn't catch that — could you rephrase?"
    db.add(ChatMessage(conversation_id=conv.id, role="assistant", content=reply))
    conv.updated_at = func.now()
    db.commit()

    return {"reply": reply, "actions": actions, "day": _day_state(db, user.id, d),
            "conversation_id": conv.id, "title": conv.title}
