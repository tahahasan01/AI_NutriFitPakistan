"""Workout routes: generate plan, swap exercise. Auth required (was public before)."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request

from .. import ml
from ..models import User
from ..ratelimit import limit
from ..schemas import SwapExerciseIn, WorkoutProfileIn
from ..security import get_current_user

logger = logging.getLogger("nutrifit.workout")
router = APIRouter(prefix="/api/workout", tags=["workout"])


@router.post("/generate")
@limit("60/hour")
def generate(request: Request, payload: WorkoutProfileIn, user: User = Depends(get_current_user)):
    try:
        return ml.generate_workout(
            payload.age, payload.gender, payload.weight, payload.height,
            payload.goal, payload.activity, payload.preference,
        )
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Workout dataset unavailable.")
    except Exception:
        logger.exception("workout generate failed")
        raise HTTPException(status_code=500, detail="Server error generating workout.")


@router.post("/swap")
@limit("120/hour")
def swap(request: Request, payload: SwapExerciseIn, user: User = Depends(get_current_user)):
    alts = ml.swap_workout(payload.current, payload.preference)
    return {"alternatives": alts}
