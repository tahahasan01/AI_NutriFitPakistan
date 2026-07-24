"""End-to-end smoke tests covering auth + all three feature flows."""


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "healthy"
    assert body["total_foods"] > 0


def test_auth_and_flows(client):
    # --- signup ---
    r = client.post("/api/auth/signup", json={
        "name": "Test User", "email": "test@example.com",
        "phone": "03001234567", "password": "supersecret1",
    })
    assert r.status_code == 201, r.text

    # duplicate signup rejected
    r = client.post("/api/auth/signup", json={
        "name": "Test User", "email": "test@example.com", "password": "supersecret1",
    })
    assert r.status_code == 409

    # weak password rejected by validation
    r = client.post("/api/auth/signup", json={
        "name": "X", "email": "x@example.com", "password": "short",
    })
    assert r.status_code == 422

    # --- unauthenticated access blocked ---
    assert client.post("/api/diet/generate", json={}).status_code in (401, 422)

    # --- login ---
    r = client.post("/api/auth/login", json={
        "email": "test@example.com", "password": "supersecret1",
    })
    assert r.status_code == 200, r.text
    assert r.json()["user"]["email"] == "test@example.com"

    # wrong password -> generic 401
    bad = client.post("/api/auth/login", json={
        "email": "test@example.com", "password": "wrongpass1",
    })
    assert bad.status_code == 401

    # --- me ---
    r = client.get("/api/auth/me")
    assert r.status_code == 200 and r.json()["authenticated"] is True

    # --- diet generate ---
    r = client.post("/api/diet/generate", json={
        "age": 25, "gender": 0, "weight": 70, "height": 175,
        "goal": 0, "activity": 2, "allergies": [],
    })
    assert r.status_code == 200, r.text
    plan = r.json()
    assert len(plan["weekly_plan"]) == 7
    assert all(len(day["meals"]) >= 3 for day in plan["weekly_plan"])
    assert plan["tdee"] > 0

    # --- workout generate ---
    r = client.post("/api/workout/generate", json={
        "age": 25, "gender": 0, "weight": 70, "height": 175,
        "goal": 0, "activity": 2, "preference": "Gym",
    })
    assert r.status_code == 200, r.text
    assert "plan" in r.json() and r.json()["total_calories"] >= 0

    # --- progress save + read ---
    r = client.post("/api/progress/weights", json={
        "weights": {"start": 80, "week1": 79.5, "week2": 79, "week3": 78.6},
        "goal_mode": "loss",
    })
    assert r.status_code == 200, r.text
    assert "plateau" in r.json()

    r = client.get("/api/progress/weights")
    assert r.status_code == 200
    assert r.json()["weights"]["start"] == 80

    # --- logout clears session ---
    assert client.post("/api/auth/logout").status_code == 200
    assert client.get("/api/auth/me").json()["authenticated"] is False


def test_fat_calorie_constant():
    """Regression: dietary fat must be 9 kcal/g (Atwater), not 8."""
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "Diet_Plan_Model"))
    import diet_model as dm
    assert dm.KCAL_PER_G_FAT == 9.0
