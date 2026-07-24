"""Health check (no auth)."""

from __future__ import annotations

from fastapi import APIRouter

from .. import ml

router = APIRouter(tags=["health"])


@router.get("/api/health")
@router.get("/health")
def health():
    dm = ml.diet_model
    return {
        "status": "healthy",
        "ml_backend": getattr(dm, "backend", "unknown"),
        "model_loaded": dm.combined_data is not None,
        "total_foods": len(dm.combined_data) if dm.combined_data is not None else 0,
    }
