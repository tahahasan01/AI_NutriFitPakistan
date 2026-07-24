"""Diet routes: generate plan, swap meal, meal details."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status

from .. import ml
from ..models import User
from ..ratelimit import limit
from ..schemas import DietPlanOut, DietProfileIn, MealDetailsIn, SwapMealIn
from ..security import get_current_user

logger = logging.getLogger("nutrifit.diet")
router = APIRouter(prefix="/api/diet", tags=["diet"])

_GOAL_LABELS = ["Weight Loss", "Muscle Gain", "Maintain"]


@router.post("/generate", response_model=DietPlanOut)
@limit("60/hour")
def generate(request: Request, payload: DietProfileIn, user: User = Depends(get_current_user)):
    try:
        result = ml.generate_diet(
            payload.age, payload.gender, payload.weight, payload.height,
            payload.goal, payload.activity, payload.allergies,
        )
    except Exception:
        logger.exception("diet generate failed")
        raise HTTPException(status_code=500, detail="Server error generating plan.")
    if not result:
        raise HTTPException(status_code=502, detail="Unable to generate meal plan.")
    return {"success": True, **result}


@router.post("/swap")
@limit("120/hour")
def swap(request: Request, payload: SwapMealIn, user: User = Depends(get_current_user)):
    alts = ml.swap_meal(
        payload.current_meal_name, payload.goal, payload.meal_type,
        target_calories=payload.target_calories, allergies=payload.allergies,
    )
    if not alts:
        raise HTTPException(status_code=404, detail="No suitable alternatives found")
    return {
        "current_meal": payload.current_meal_name,
        "goal": _GOAL_LABELS[payload.goal],
        "meal_type": payload.meal_type,
        "alternatives": alts,
        "message": f"Found {len(alts)} alternatives for {payload.current_meal_name}",
    }


@router.post("/meal-details")
def details(payload: MealDetailsIn, user: User = Depends(get_current_user)):
    result = ml.meal_details(payload.meal_name, payload.quantity)
    if result is None:
        raise HTTPException(status_code=404, detail=f'Meal "{payload.meal_name}" not found')
    return result
