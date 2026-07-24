"""Optional rate limiting via slowapi. Degrades to a no-op if slowapi is absent."""

from __future__ import annotations

import logging

logger = logging.getLogger("nutrifit.ratelimit")

try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address

    from .settings import get_settings

    limiter = Limiter(
        key_func=get_remote_address,
        storage_uri=get_settings().RATELIMIT_STORAGE_URI,
    )
    RATELIMIT_AVAILABLE = True
except Exception:  # pragma: no cover
    limiter = None
    RATELIMIT_AVAILABLE = False
    logger.warning("slowapi not installed; rate limiting disabled.")


def limit(rule: str):
    """Apply a rate limit if slowapi is available, else no-op.

    Note: routes decorated with this MUST declare a `request: Request` parameter
    for slowapi to read the client key.
    """
    def decorator(fn):
        return limiter.limit(rule)(fn) if RATELIMIT_AVAILABLE else fn
    return decorator
