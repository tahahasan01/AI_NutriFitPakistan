"""Test fixtures: isolated SQLite DB + a TestClient with lifespan (ML load)."""

import os
import tempfile

# Configure the environment BEFORE importing the app (settings are cached).
_tmp_db = os.path.join(tempfile.gettempdir(), "nutrifit_test.db")
if os.path.exists(_tmp_db):
    os.remove(_tmp_db)
os.environ["NUTRIFIT_ENV"] = "development"
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp_db}"
os.environ["NUTRIFIT_SECRET"] = "test-secret-key-not-for-prod"

import pytest
from fastapi.testclient import TestClient

from backend.main import app


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:  # context manager triggers startup (ML load)
        yield c
