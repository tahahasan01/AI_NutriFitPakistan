"""Vercel Python entrypoint for the FastAPI backend.

Vercel's Python runtime serves the ASGI `app` exported here. Deploy this as a
SEPARATE Vercel project with the Root Directory set to the repo root (so the
ML modules and datasets in Diet_Plan_Model/ and Work_Out_Model/ are included).
See DEPLOY.md.
"""

from backend.main import app  # noqa: F401  (ASGI app served by Vercel)
