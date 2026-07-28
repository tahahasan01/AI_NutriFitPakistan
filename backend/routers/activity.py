"""GPS activity tracking (walk / run / ride) — Strava-style live sessions."""

import json
import logging
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Activity, User
from ..schemas import ActivityIn
from ..security import get_current_user

logger = logging.getLogger("nutrifit.activity")
router = APIRouter(prefix="/api/activity", tags=["activity"])

KIND_LABEL = {"walk": "Walk", "run": "Run", "ride": "Ride"}


def _to_dict(a: Activity) -> dict:
    try:
        route = json.loads(a.route) if a.route else []
    except (ValueError, TypeError):
        route = []
    pace = (a.duration_s / 60) / a.distance_km if a.distance_km > 0 else 0  # min/km
    return {
        "id": a.id,
        "kind": a.kind,
        "kind_label": KIND_LABEL.get(a.kind, a.kind.title()),
        "distance_km": round(a.distance_km, 2),
        "duration_s": a.duration_s,
        "calories": round(a.calories),
        "pace_min_km": round(pace, 2),
        "route": route,
        "date": a.log_date.isoformat(),
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


@router.post("", status_code=201)
def create_activity(payload: ActivityIn, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    a = Activity(
        user_id=user.id,
        kind=payload.kind,
        distance_km=payload.distance_km,
        duration_s=payload.duration_s,
        calories=payload.calories,
        route=json.dumps(payload.route) if payload.route else None,
        log_date=date.today(),
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return _to_dict(a)


@router.get("")
def list_activities(limit: int = Query(default=20, le=100),
                    user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = list(db.scalars(
        select(Activity).where(Activity.user_id == user.id)
        .order_by(Activity.id.desc()).limit(limit)
    ))
    return {"activities": [_to_dict(a) for a in rows]}


@router.get("/summary")
def activity_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    start = today - timedelta(days=6)
    rows = list(db.scalars(select(Activity).where(
        Activity.user_id == user.id, Activity.log_date >= start)))

    todays = [a for a in rows if a.log_date == today]
    return {
        "today": {
            "count": len(todays),
            "distance_km": round(sum(a.distance_km for a in todays), 2),
            "duration_s": sum(a.duration_s for a in todays),
            "calories": round(sum(a.calories for a in todays)),
        },
        "week": {
            "count": len(rows),
            "distance_km": round(sum(a.distance_km for a in rows), 2),
            "calories": round(sum(a.calories for a in rows)),
        },
    }


@router.delete("/{activity_id}")
def delete_activity(activity_id: int, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    a = db.get(Activity, activity_id)
    if not a or a.user_id != user.id:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(a)
    db.commit()
    return {"success": True}
