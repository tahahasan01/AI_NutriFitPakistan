"""Environment-driven settings for the NutriFit FastAPI backend.

No secrets are hardcoded. In production, SECRET_KEY and DATABASE_URL are
required and the app refuses to start without them. In development it falls
back to a random per-process secret and a local SQLite database so the API
runs out-of-the-box.
"""

from __future__ import annotations

import os
import secrets
from functools import lru_cache
from typing import List

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:  # python-dotenv optional
    pass


def _split_csv(value: str) -> List[str]:
    return [v.strip() for v in (value or "").split(",") if v.strip()]


class Settings:
    def __init__(self) -> None:
        self.ENV: str = os.environ.get("NUTRIFIT_ENV", "development").strip().lower()
        self.DEBUG: bool = os.environ.get("DEBUG", "").lower() in {"1", "true", "yes"}

        # --- Database ---
        self.DATABASE_URL: str | None = (
            os.environ.get("DATABASE_URL") or os.environ.get("SQLALCHEMY_DATABASE_URI")
        )

        # --- Secret / sessions ---
        self.SECRET_KEY: str | None = (
            os.environ.get("NUTRIFIT_SECRET") or os.environ.get("SECRET_KEY")
        )
        self.SESSION_COOKIE_NAME: str = os.environ.get("SESSION_COOKIE_NAME", "nutrifit_session")
        self.SESSION_MAX_AGE: int = int(os.environ.get("SESSION_MAX_AGE", 60 * 60 * 24 * 7))

        # --- CORS ---
        # Only needed if the frontend calls the API cross-origin (i.e. NOT via the
        # Next.js proxy). With the proxy, requests are same-origin and this stays empty.
        self.CORS_ORIGINS: List[str] = _split_csv(os.environ.get("CORS_ORIGINS", ""))

        # --- AI assistant (optional; feature disabled if no provider key) ---
        # Supports Groq / OpenAI-compatible and Anthropic. First key found wins,
        # in this order: Groq, OpenAI, Anthropic.
        self.GROQ_API_KEY: str | None = os.environ.get("GROQ_API_KEY")
        self.OPENAI_API_KEY: str | None = os.environ.get("OPENAI_API_KEY")
        self.ANTHROPIC_API_KEY: str | None = os.environ.get("ANTHROPIC_API_KEY")
        # Optional model override; each provider has a sensible default otherwise.
        self.AI_MODEL: str = os.environ.get("NUTRIFIT_AI_MODEL", "").strip()

        # --- Misc ---
        self.RATELIMIT_STORAGE_URI: str = os.environ.get("RATELIMIT_STORAGE_URI", "memory://")
        self.AUTO_CREATE_DB: bool = os.environ.get("AUTO_CREATE_DB", "1") == "1"
        self.LOG_LEVEL: str = os.environ.get("LOG_LEVEL", "INFO")

        self._finalize()

    @property
    def is_production(self) -> bool:
        return self.ENV == "production"

    @property
    def session_https_only(self) -> bool:
        # Secure cookies in production (served over HTTPS).
        return self.is_production

    def _finalize(self) -> None:
        if self.is_production:
            missing = []
            if not self.SECRET_KEY or self.SECRET_KEY == "your-secret-key-here":
                missing.append("NUTRIFIT_SECRET")
            if not self.DATABASE_URL:
                missing.append("DATABASE_URL")
            if missing:
                raise RuntimeError(
                    "Refusing to start in production without: "
                    + ", ".join(missing)
                    + ". Set them as environment variables."
                )
        else:
            if not self.SECRET_KEY:
                self.SECRET_KEY = secrets.token_hex(32)  # ephemeral dev key
            if not self.DATABASE_URL:
                base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                self.DATABASE_URL = f"sqlite:///{os.path.join(base, 'nutrifit_dev.db')}"


@lru_cache
def get_settings() -> "Settings":
    return Settings()
