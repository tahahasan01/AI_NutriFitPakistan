"""NutriFit Pakistan — FastAPI application entrypoint.

Run (dev):  uvicorn backend.main:app --reload --port 5000
Run (prod): gunicorn backend.main:app -k uvicorn.workers.UvicornWorker -w 4 -b 0.0.0.0:5000
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware

from .database import init_db
from .settings import get_settings

settings = get_settings()

logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("nutrifit")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.AUTO_CREATE_DB:
        init_db()
    # Load ML datasets/models once.
    from . import ml
    info = ml.startup_load()
    logger.info("Startup complete: %s", info)
    yield


app = FastAPI(
    title="NutriFit Pakistan API",
    version="1.0.0",
    description="AI-assisted diet, workout, and progress tracking API.",
    lifespan=lifespan,
)

# --- Session cookie (signed; holds only user_id) ---
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    session_cookie=settings.SESSION_COOKIE_NAME,
    max_age=settings.SESSION_MAX_AGE,
    same_site="lax",
    https_only=settings.session_https_only,
)

# --- CORS (only when the frontend calls cross-origin; empty with the Next proxy) ---
if settings.CORS_ORIGINS:
    from fastapi.middleware.cors import CORSMiddleware

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# --- Rate limiting (optional) ---
from .ratelimit import RATELIMIT_AVAILABLE, limiter  # noqa: E402

if RATELIMIT_AVAILABLE:
    from slowapi import _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded
    from slowapi.middleware import SlowAPIMiddleware

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)


# --- Security headers on every response ---
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    if settings.session_https_only:
        response.headers.setdefault(
            "Strict-Transport-Security", "max-age=31536000; includeSubDomains"
        )
    return response


# --- Routers ---
from .routers import ai, auth, diet, health, progress, tracking, workout  # noqa: E402

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(diet.router)
app.include_router(workout.router)
app.include_router(progress.router)
app.include_router(tracking.router)
app.include_router(ai.router)


@app.exception_handler(500)
async def internal_error(request: Request, exc):  # pragma: no cover
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
