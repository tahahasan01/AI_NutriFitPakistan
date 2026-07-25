"""Profile, meal logging, food search, and swap feedback — the data loop."""


import logging
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import ml
from ..database import get_db
from ..models import FoodFeedback, MealLog, User, UserProfile
from ..schemas import MealLogIn, ProfileIn, SwapFeedbackIn
from ..security import get_current_user

logger = logging.getLogger("nutrifit.tracking")
router = APIRouter(prefix="/api", tags=["tracking"])

MEAL_ORDER = {"Breakfast": 0, "Lunch": 1, "Dinner": 2, "Snack": 3}


def _parse_date(s: str | None) -> date:
    if not s:
        return date.today()
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError:
        return date.today()


def _profile_payload(p: UserProfile) -> dict:
    targets = ml.compute_targets(p.age, p.gender, p.weight_kg, p.height_cm, p.goal, p.activity)
    return {
        "age": p.age, "gender": p.gender, "weight": p.weight_kg, "height": p.height_cm,
        "goal": p.goal, "activity": p.activity, "targets": targets,
    }


# ---------------- Profile ----------------
@router.get("/profile")
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.scalar(select(UserProfile).where(UserProfile.user_id == user.id))
    if not p:
        return {"exists": False}
    return {"exists": True, **_profile_payload(p)}


@router.put("/profile")
def put_profile(payload: ProfileIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.scalar(select(UserProfile).where(UserProfile.user_id == user.id))
    if not p:
        p = UserProfile(user_id=user.id)
        db.add(p)
    p.age, p.gender = payload.age, payload.gender
    p.weight_kg, p.height_cm = payload.weight, payload.height
    p.goal, p.activity = payload.goal, payload.activity
    db.commit()
    db.refresh(p)
    return {"exists": True, **_profile_payload(p)}


# ---------------- Food search ----------------
@router.get("/foods/search")
def foods_search(q: str = Query(default=""), limit: int = Query(default=20, le=50),
                 user: User = Depends(get_current_user)):
    return {"results": ml.search_foods(q, limit)}


# ---------------- Meal log ----------------
def _log_to_dict(m: MealLog) -> dict:
    return {
        "id": m.id, "meal_type": m.meal_type, "food_name": m.food_name,
        "quantity_g": m.quantity_g, "calories": m.calories,
        "protein": m.protein, "carbs": m.carbs, "fat": m.fat,
    }


def _day_totals(rows) -> dict:
    return {
        "calories": round(sum(r.calories for r in rows), 1),
        "protein": round(sum(r.protein for r in rows), 1),
        "carbs": round(sum(r.carbs for r in rows), 1),
        "fat": round(sum(r.fat for r in rows), 1),
    }


@router.post("/log/meal", status_code=201)
def log_meal(payload: MealLogIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = MealLog(
        user_id=user.id, log_date=_parse_date(payload.date), meal_type=payload.meal_type,
        food_name=payload.food_name, quantity_g=payload.quantity_g, calories=payload.calories,
        protein=payload.protein, carbs=payload.carbs, fat=payload.fat,
    )
    db.add(m)
    # every log is also a positive taste signal
    db.add(FoodFeedback(user_id=user.id, food_name=payload.food_name,
                        meal_type=payload.meal_type, signal="log"))
    db.commit()
    db.refresh(m)
    return _log_to_dict(m)


@router.get("/log/day")
def log_day(date: str | None = Query(default=None), user: User = Depends(get_current_user),
            db: Session = Depends(get_db)):
    d = _parse_date(date)
    rows = list(db.scalars(select(MealLog).where(
        MealLog.user_id == user.id, MealLog.log_date == d)))
    rows.sort(key=lambda r: MEAL_ORDER.get(r.meal_type, 9))
    p = db.scalar(select(UserProfile).where(UserProfile.user_id == user.id))
    target = ml.compute_targets(p.age, p.gender, p.weight_kg, p.height_cm, p.goal, p.activity) if p else None
    return {"date": d.isoformat(), "meals": [_log_to_dict(m) for m in rows],
            "totals": _day_totals(rows), "target": target}


@router.delete("/log/meal/{meal_id}")
def delete_meal(meal_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = db.get(MealLog, meal_id)
    if not m or m.user_id != user.id:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(m)
    db.commit()
    return {"success": True}


@router.get("/log/summary")
def log_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    start = today - timedelta(days=6)
    rows = list(db.scalars(select(MealLog).where(
        MealLog.user_id == user.id, MealLog.log_date >= start)))

    by_day: dict[str, list] = {}
    for r in rows:
        by_day.setdefault(r.log_date.isoformat(), []).append(r)

    week = []
    for i in range(7):
        d = (start + timedelta(days=i)).isoformat()
        week.append({"date": d, "calories": round(sum(x.calories for x in by_day.get(d, [])), 0)})

    # streak: consecutive days up to today with >=1 logged meal
    streak = 0
    dd = today
    while by_day.get(dd.isoformat()):
        streak += 1
        dd -= timedelta(days=1)

    todays = by_day.get(today.isoformat(), [])
    p = db.scalar(select(UserProfile).where(UserProfile.user_id == user.id))
    target = ml.compute_targets(p.age, p.gender, p.weight_kg, p.height_cm, p.goal, p.activity) if p else None
    return {"today": _day_totals(todays), "meals_logged_today": len(todays),
            "target": target, "streak": streak, "week": week}


# ---------------- Swap feedback ----------------
@router.post("/log/feedback", status_code=201)
def swap_feedback(payload: SwapFeedbackIn, user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    db.add(FoodFeedback(user_id=user.id, food_name=payload.food_name,
                        meal_type=payload.meal_type, signal=payload.signal or "swap_out"))
    db.commit()
    return {"success": True}
