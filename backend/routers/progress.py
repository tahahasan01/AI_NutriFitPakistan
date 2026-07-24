"""Progress routes: weekly weight log with plateau detection."""

from __future__ import annotations

import logging
from typing import Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, UserWeightLog
from ..schemas import WeightsIn
from ..security import get_current_user

logger = logging.getLogger("nutrifit.progress")
router = APIRouter(prefix="/api/progress", tags=["progress"])

ORDERED_KEYS = ["start", "week1", "week2", "week3", "week4", "week5", "week6"]
_KEY_TO_INDEX = {k: i for i, k in enumerate(ORDERED_KEYS)}


def _parse_float(val) -> Optional[float]:
    try:
        if val is None:
            return None
        s = str(val).strip()
        return float(s) if s else None
    except (TypeError, ValueError):
        return None


def detect_plateau(weights: Dict[str, Optional[float]]) -> dict:
    values = [_parse_float(weights.get(k)) for k in ORDERED_KEYS]
    start = values[0]
    if start is None:
        return {"detected": False, "reason": "Starting weight not set yet.",
                "net_change_kg": None, "weeks_considered": 0}

    filled = [(i, v) for i, v in enumerate(values) if i >= 1 and v is not None]
    if len(filled) < 3:
        return {"detected": False,
                "reason": "Not enough data yet (need at least 3 weekly check-ins).",
                "net_change_kg": None, "weeks_considered": len(filled)}

    net_change = float(filled[-1][1] - start)
    negligible = abs(net_change) < 0.5

    has_drop = False
    for i in range(1, len(filled)):
        if (filled[i - 1][1] - filled[i][1]) >= 0.2:
            has_drop = True
            break

    plateau = negligible or not has_drop
    if plateau:
        reason = ("Body weight has changed less than 0.5 kg since you started."
                  if negligible else
                  "No meaningful week-to-week change detected across recent check-ins.")
    else:
        reason = "Weight trend shows meaningful change, no plateau detected."

    return {"detected": plateau, "reason": reason,
            "net_change_kg": round(net_change, 2), "weeks_considered": len(filled)}


@router.get("/weights")
def get_weights(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(UserWeightLog).filter(UserWeightLog.user_id == user.id).all()
    weights: Dict[str, Optional[float]] = {k: None for k in ORDERED_KEYS}
    goal_mode = None
    for log in logs:
        if 0 <= log.week_index < len(ORDERED_KEYS):
            weights[ORDERED_KEYS[log.week_index]] = float(log.weight_kg)
        if log.goal_mode and not goal_mode:
            goal_mode = log.goal_mode
    return {"success": True, "weights": weights,
            "goal_mode": goal_mode or "loss", "plateau": detect_plateau(weights)}


@router.post("/weights")
def save_weights(payload: WeightsIn, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    incoming = payload.weights or {}
    goal_mode = payload.goal_mode or None
    cleaned = {k: _parse_float(incoming.get(k)) for k in ORDERED_KEYS}

    for key, value in cleaned.items():
        if value is None:
            continue
        week_index = _KEY_TO_INDEX[key]
        log = (db.query(UserWeightLog)
               .filter(UserWeightLog.user_id == user.id,
                       UserWeightLog.week_index == week_index)
               .first())
        if log is None:
            db.add(UserWeightLog(user_id=user.id, label=key, week_index=week_index,
                                 weight_kg=value, goal_mode=goal_mode))
        else:
            log.weight_kg = value
            if goal_mode:
                log.goal_mode = goal_mode
    try:
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to save progress")
        raise HTTPException(status_code=500, detail="Failed to save progress.")

    return {"success": True, "weights": cleaned,
            "goal_mode": goal_mode, "plateau": detect_plateau(cleaned)}
