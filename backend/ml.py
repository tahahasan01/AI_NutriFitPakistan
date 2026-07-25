"""ML integration layer.

Loads the diet model and the workout dataset once at startup and exposes clean,
JSON-friendly functions. Reuses the existing ML code in Diet_Plan_Model/ and
Work_Out_Model/ without depending on the retired Flask layer.
"""

from __future__ import annotations

import logging
import os
import re
import sys
from typing import Any, Dict, List, Optional

import pandas as pd

logger = logging.getLogger("nutrifit.ml")

_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DIET_DIR = os.path.join(_REPO_ROOT, "Diet_Plan_Model")
_WORKOUT_DIR = os.path.join(_REPO_ROOT, "Work_Out_Model")

for _p in (_DIET_DIR, _WORKOUT_DIR):
    if _p not in sys.path:
        sys.path.insert(0, _p)

# Diet model (torch-optional; falls back to exact-formula path).
from diet_model import diet_model  # noqa: E402
# Workout planning utilities (self-contained).
from utils import (  # noqa: E402
    generate_workout_plan,
    swap_alternatives,
    DEFAULT_DURATION_MIN,
)

# ---------------------------------------------------------------------------
# Diet post-processing helpers (ported from the old Flask app).
# ---------------------------------------------------------------------------
RICE_PAT = re.compile(r"rice", re.I)
GRAVY_PAT = re.compile(r"(curry|karahi|nihari|qorma|handi|daal|dal|haleem|sabzi|korma)", re.I)
JUNK_PAT = re.compile(r"(pizza|burger|subway|domino|kfc|mcdonald|wrap|fries|pasta|nugget|sandwich)", re.I)
DESI_PAT = re.compile(
    r"(biryani|dal|daal|saag|korma|haleem|nihari|chapli|kabab|paratha|rajma|chole|aloo|"
    r"gobi|paneer|pulao|roti|sabzi|masoor|bhindi|kadhi|tandoori|karahi|handi|qorma|chana)",
    re.I,
)

def _strip_gram_suffix(name: str) -> str:
    return re.sub(r"\s+—\s*\d+\s*g$", "", str(name), flags=re.I).strip()


def _standardize_serving(name: str):
    base = _strip_gram_suffix(name)
    had_plate = re.search(r"\bplate\b", base, re.I) is not None
    had_bowl = re.search(r"\bbowl\b", base, re.I) is not None
    base = re.sub(r"\b(bowl|plate)\b", "", base, flags=re.I)
    base = re.sub(r"\s+", " ", base).strip()
    if had_plate:
        grams = 300
    elif had_bowl:
        grams = 250
    elif RICE_PAT.search(base):
        grams = 300
    elif GRAVY_PAT.search(base):
        grams = 250
    else:
        grams = 150
    return base, grams, f"{base} — {grams} g"


def _find_desi_alternative(target_cal, allergies=None, exclude_names=None) -> Optional[Dict[str, Any]]:
    df = getattr(diet_model, "combined_data", None)
    if df is None or len(df) == 0:
        return None
    df = df[~df["Food Name"].str.contains(JUNK_PAT, na=False)]
    desi = df[df["Food Name"].str.contains(DESI_PAT, na=False)]
    if not desi.empty:
        df = desi
    if allergies:
        al = [a.lower() for a in allergies]
        df = df[df["Food Name"].str.lower().apply(lambda x: not any(a in x for a in al))]
    if exclude_names:
        ex = [_strip_gram_suffix(n).lower() for n in exclude_names]
        df = df[~df["Food Name"].str.lower().isin(ex)]
    if df.empty:
        return None
    df = df.copy()
    df["diff"] = (df["Calories"] - target_cal).abs()
    row = df.sort_values("diff").iloc[0]
    _, grams, display = _standardize_serving(row["Food Name"])
    return {
        "name": display,
        "quantity": grams,
        "calories": int(round(row["Calories"] * grams / 100.0)),
        "protein": round(row.get("Protein (g)", row.get("Protein", 0)) * grams / 100.0, 1),
        "carbs": round(row.get("Carbohydrates (g)", row.get("Carbohydrates", 0)) * grams / 100.0, 1),
        "fat": round(row.get("Fat (g)", row.get("Fat", 0)) * grams / 100.0, 1),
    }


def _process_and_summarize(plan_data: Dict[str, Any], allergies: List[str]) -> Dict[str, Any]:
    new_week = []
    for day_data in plan_data["weekly_plan"]:
        meals = []
        for meal in day_data["meals"]:
            m = dict(meal)
            # The model already computed a serving quantity that matches the
            # meal's calories/macros (per-100g x qty/100). Keep them CONSISTENT:
            # display the actual quantity, do not override it to a fixed value.
            qty = int(round(float(m.get("quantity", 100))))
            base = _strip_gram_suffix(m.get("name", ""))
            m["quantity"] = qty
            m["name"] = f"{base} — {qty} g"
            meals.append(m)
        # Defensive: guarantee at least 3 items (the model normally returns 4).
        while len(meals) < 3:
            alt = _find_desi_alternative(400, allergies, exclude_names=[mm["name"] for mm in meals])
            if not alt:
                alt = {"name": "Whole Wheat Roti — 100 g", "quantity": 100,
                       "calories": 265, "protein": 8, "carbs": 50, "fat": 5, "fiber": 6, "sugar": 1}
            meals.append(alt)
        new_week.append({"day": day_data.get("day"),
                         "day_number": day_data.get("day_number"), "meals": meals})

    tc = tp = tcarb = tf = 0.0
    for d in new_week:
        for m in d["meals"]:
            for k in ("sugar", "fiber", "protein", "carbs", "fat", "calories"):
                m.setdefault(k, 0)
            tc += m["calories"]; tp += m["protein"]; tcarb += m["carbs"]; tf += m["fat"]

    return {
        "weekly_plan": new_week,
        "targets": plan_data.get("targets", {}),
        "tdee": plan_data.get("tdee", 0),
        "totals": {"calories": round(tc, 1), "protein": round(tp, 1),
                   "carbs": round(tcarb, 1), "fat": round(tf, 1)},
    }


# ---------------------------------------------------------------------------
# Workout dataset loading (self-contained; no Flask routes dependency).
# ---------------------------------------------------------------------------
_ALIAS_MAP = {
    "title": "Exercise_Name", "exercisename": "Exercise_Name", "name": "Exercise_Name",
    "bodypart": "Primary_Muscle", "primarymuscle": "Primary_Muscle", "musclegroup": "Primary_Muscle",
    "equipment": "Equipment", "level": "Level", "difficulty": "Difficulty",
    "difficultylevel": "Difficulty", "desc": "Instructions", "description": "Instructions",
    "instructions": "Instructions", "type": "Type", "category": "Type", "mechanics": "Mechanics",
    "movementtype": "Mechanics", "met": "MET", "mets": "MET",
    # The workout CSV stores MET-like values in a column named "Calories_Burned".
    "caloriesburned": "MET", "burnedcalories": "MET", "calories_burned": "MET",
    "burned_calories": "MET",
}
_WORKOUT_DATA_PATH = os.path.join(_WORKOUT_DIR, "workoutdata_with_estimated_met.csv")

_workout_df: Optional[pd.DataFrame] = None


def _norm_col(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(s).lower())


def _normalize_headers(df: pd.DataFrame) -> pd.DataFrame:
    rename = {}
    for col in list(df.columns):
        key = _norm_col(col)
        if key in _ALIAS_MAP and _ALIAS_MAP[key] not in df.columns:
            rename[col] = _ALIAS_MAP[key]
    if rename:
        df = df.rename(columns=rename)
    if "Difficulty" not in df.columns and "Level" in df.columns:
        df["Difficulty"] = df["Level"].astype(str)
    if "Mechanics" not in df.columns:
        df["Mechanics"] = "compound"
    if "Instructions" not in df.columns:
        df["Instructions"] = ""
    return df


def _load_workout_df() -> pd.DataFrame:
    global _workout_df
    if _workout_df is None:
        if not os.path.exists(_WORKOUT_DATA_PATH):
            raise FileNotFoundError(f"Workout dataset not found at {_WORKOUT_DATA_PATH}")
        df = _normalize_headers(pd.read_csv(_WORKOUT_DATA_PATH))
        minimal = ["Exercise_Name", "Primary_Muscle", "Equipment", "Difficulty", "MET"]
        missing = [c for c in minimal if c not in df.columns]
        if missing:
            raise ValueError(f"Workout dataset missing columns: {missing}")
        _workout_df = df
    return _workout_df


_GOAL_MAP = {0: "Fat Loss", 1: "Muscle Gain", 2: "Maintain"}
_ACTIVITY_MAP = {0: "Beginner", 1: "Beginner", 2: "Intermediate", 3: "Intermediate", 4: "Intermediate"}
_GENDER_MAP = {0: "Male", 1: "Female"}


# ---------------------------------------------------------------------------
# Public API used by routers
# ---------------------------------------------------------------------------
def startup_load() -> Dict[str, Any]:
    """Load datasets + models. Called once at app startup."""
    diet_model.load_data()
    diet_model.load_models()  # sets diet_model.backend to 'neural' or 'math'
    try:
        _load_workout_df()
        workout_ok = True
    except Exception:
        logger.exception("Workout dataset failed to load")
        workout_ok = False
    return {
        "diet_backend": getattr(diet_model, "backend", "unknown"),
        "diet_foods": len(diet_model.combined_data) if diet_model.combined_data is not None else 0,
        "workout_ok": workout_ok,
    }


def generate_diet(age, gender, weight, height, goal, activity, allergies) -> Optional[Dict[str, Any]]:
    raw = diet_model.generate_meal_plan(age, gender, weight, height, goal, activity)
    if not raw or not raw.get("weekly_plan"):
        return None
    return _process_and_summarize(raw, allergies or [])


def swap_meal(current_meal_name, goal, meal_type, target_calories=None, allergies=None) -> List[Dict[str, Any]]:
    alts = diet_model.get_meal_alternatives(current_meal_name, goal, meal_type)
    if not alts and target_calories and target_calories > 0:
        alt = _find_desi_alternative(target_calories, allergies or [], exclude_names=[current_meal_name])
        if alt:
            alts = [alt]
    return alts or []


def meal_details(meal_name: str, quantity: float) -> Optional[Dict[str, Any]]:
    df = diet_model.combined_data
    name = _strip_gram_suffix(meal_name)
    match = df[df["Food Name"].str.contains(name, case=False, na=False)]
    if len(match) == 0:
        return None
    meal = match.iloc[0]
    q = quantity
    return {
        "meal_name": meal["Food Name"],
        "quantity_grams": q,
        "nutritional_breakdown": {
            "calories": round(meal["Calories"] * q / 100, 1),
            "protein_g": round(meal.get("Protein (g)", meal.get("Protein", 0)) * q / 100, 1),
            "carbohydrates_g": round(meal.get("Carbohydrates (g)", meal.get("Carbohydrates", 0)) * q / 100, 1),
            "sugars_g": round(meal.get("Sugars (g)", 0) * q / 100, 1),
            "fat_g": round(meal.get("Fat (g)", meal.get("Fat", 0)) * q / 100, 1),
            "fiber_g": round(meal.get("Fiber (g)", 0) * q / 100, 1),
        },
        "additional_info": {
            "category": meal.get("Category"),
            "meal_type": meal.get("Meal_Type"),
            "is_snack": bool(meal.get("is_snack", 0)),
        },
    }


def generate_workout(age, gender, weight, height, goal, activity, preference) -> Dict[str, Any]:
    df = _load_workout_df()
    user = {
        "Age": age,
        "Gender": _GENDER_MAP.get(gender, "Other"),
        "Weight": weight,
        "Height": height,
        "Goal": _GOAL_MAP.get(goal, "Maintain"),
        "Experience Level": _ACTIVITY_MAP.get(activity, "Beginner"),
        "Workout Preference": preference,
    }
    plan, total_calories, chart_data = generate_workout_plan(df, user, duration_min=DEFAULT_DURATION_MIN)
    return {
        "plan": plan,
        "total_calories": total_calories,
        "duration_min": DEFAULT_DURATION_MIN,
        "preference": preference,
        "chart_data": chart_data,
    }


def swap_workout(current: Dict[str, Any], preference: str) -> List[Dict[str, Any]]:
    df = _load_workout_df()
    return swap_alternatives(df, current=current, preference=preference)


def compute_targets(age, gender, weight, height, goal, activity) -> Dict[str, Any]:
    """Exact Mifflin-St Jeor + Atwater targets (no ML needed)."""
    dm = diet_model
    tdee = dm._math_tdee(age, gender, weight, height, activity)
    tgt = dm._math_target_cal(tdee, goal)
    p, c, f = dm._math_macros(tgt, goal)
    return {
        "tdee": round(tdee, 1),
        "calories": round(tgt, 1),
        "protein": round(p, 1),
        "carbs": round(c, 1),
        "fat": round(f, 1),
    }


def search_foods(query: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Search the catalog; return per-100g nutrition so the client can scale."""
    df = diet_model.combined_data
    if df is None:
        return []
    q = (query or "").strip()
    sub = df if not q else df[df["Food Name"].str.contains(q, case=False, na=False)]
    out = []
    for _, r in sub.head(limit).iterrows():
        out.append({
            "name": r["Food Name"],
            "meal_type": r.get("Meal_Type"),
            "is_snack": bool(r.get("is_snack", 0)),
            "per100": {
                "calories": round(float(r.get("Calories", 0) or 0), 1),
                "protein": round(float(r.get("Protein (g)", 0) or 0), 1),
                "carbs": round(float(r.get("Carbohydrates (g)", 0) or 0), 1),
                "fat": round(float(r.get("Fat (g)", 0) or 0), 1),
            },
        })
    return out
