# NutriFit Pakistan — AI-assisted Nutrition & Fitness

Personalized diet plans, workout generation, and progress tracking, tuned for
Pakistani cuisine and TDEE-based nutrition.

**Stack:** FastAPI (Python) backend + Next.js (App Router, TypeScript) frontend.
The frontend proxies `/api/*` to the backend, so session cookies stay
first-party and the browser only ever talks to one origin.

```
┌─────────────┐     /api/* (Next rewrite proxy)     ┌──────────────────┐
│  Next.js    │  ───────────────────────────────▶   │   FastAPI API    │
│  (Vercel)   │      cookie session (SameSite=Lax)   │  + ML modules    │
└─────────────┘                                      └──────────────────┘
                                                            │
                                                     MySQL / Postgres
```

---

## Repository layout

```
.
├── backend/                 # FastAPI application
│   ├── main.py              # app assembly (middleware, routers, lifespan)
│   ├── settings.py          # env-driven config (dev SQLite fallback, prod guards)
│   ├── database.py          # SQLAlchemy engine/session
│   ├── models.py            # User, UserWeightLog
│   ├── schemas.py           # Pydantic request/response models
│   ├── security.py          # PBKDF2 password hashing + auth dependency
│   ├── ratelimit.py         # optional slowapi rate limiting
│   ├── ml.py                # loads diet/workout ML, diet post-processing
│   ├── routers/             # auth, diet, workout, progress, health
│   ├── tests/               # end-to-end smoke tests (pytest)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/                # Next.js app (TypeScript, Tailwind)
│   ├── app/                 # landing/auth, diet, workout, progress pages
│   ├── components/          # Navbar, RequireAuth
│   ├── lib/                 # api client, shared types
│   ├── next.config.js       # /api proxy → BACKEND_URL
│   └── .env.example
├── Diet_Plan_Model/         # Diet ML (kept)
│   ├── diet_model.py        # targets (Mifflin-St Jeor + Atwater) + neural ranker
│   ├── cleaned_foods_dataset.csv, cleaned_snacks_dataset.csv
│   └── models/              # trained nets + scalers (used only if torch installed)
├── Work_Out_Model/          # Workout ML (kept)
│   ├── utils.py             # rule-based plan generation, MET calories, swaps
│   └── workoutdata_with_estimated_met.csv
└── render.yaml              # example backend deploy blueprint
```

---

## Prerequisites

- Python 3.10+ (3.11 recommended)
- Node.js 18+ (20/24 fine)
- A database: SQLite is used automatically in dev; MySQL/Postgres for production
- PyTorch is **optional** — see [ML backends](#ml-backends)

---

## Local development

### 1. Backend (FastAPI)

```bash
cd <repo-root>
python -m venv .venv
# Windows:  .venv\Scripts\activate     |  macOS/Linux:  source .venv/bin/activate
pip install -r backend/requirements.txt

cp backend/.env.example backend/.env   # optional; dev works with defaults
uvicorn backend.main:app --reload --port 5000
```

- API root: http://localhost:5000
- Interactive docs (Swagger): http://localhost:5000/docs
- Health: http://localhost:5000/api/health
- With no `DATABASE_URL`, a local `nutrifit_dev.db` (SQLite) is created automatically.

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.example .env.local           # BACKEND_URL=http://localhost:5000
npm run dev                          # http://localhost:3000
```

Open http://localhost:3000, sign up, and use Diet / Workout / Progress.

---

## Food dataset (accuracy)

The food/snack tables are a **curated, per-100g, Atwater-consistent** dataset of
**150 Pakistani + common global foods** (31 breakfast, 38 lunch, 38 dinner, 43
snacks), verified within ~7% of authoritative (USDA/standard) per-100g values.
It is generated and validated by a script:

```bash
python Diet_Plan_Model/build_dataset.py
```

This rebuilds `cleaned_foods_dataset.csv` and `cleaned_snacks_dataset.csv`,
validating that every row is per-100g, Atwater-consistent
(`Calories = 4·carb + 4·protein + 9·fat − 2·fiber`), has non-zero macros, and
that each meal type has enough variety. To add or correct a food, edit the
`FOODS` / `SNACKS` tables in that script and re-run — validation blocks bad rows.

> The original datasets mixed per-serving and per-100g values with ~14–21%
> Atwater-inconsistent rows, ~6% zero-macro rows, and all-zero Sugars/Fiber
> columns. That data was replaced because the model assumes per-100g.

## ML backends

`diet_model.py` computes calorie/macro **targets** with the exact
Mifflin–St Jeor equation and correct Atwater factors (protein/carb = 4 kcal/g,
**fat = 9 kcal/g**). Food *ranking* uses a neural ranker when trained models are
present **and** PyTorch is installed; otherwise it uses the deterministic
formula-scored path. Both paths are accurate for targets — the ranker only
refines food ordering.

The stale pre-trained models (trained on the old inconsistent data) were removed,
so the app runs on the correct deterministic path by default. To (re)train the
ranker on the current dataset:

```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
python Diet_Plan_Model/diet_model.py --train    # writes models/ *.pt + scalers
```

Check which path is active: `GET /api/health` → `ml_backend: "neural" | "math"`.

---

## Testing

```bash
pip install -r backend/requirements.txt
pytest backend/tests -q
```

The smoke suite covers signup/login/logout, auth enforcement, diet generation
(7 days, ≥3 meals/day), workout generation, progress save/read + plateau, and a
regression test that fat is 9 kcal/g.

---

## Configuration (environment variables)

Backend (`backend/.env`):

| Variable            | Required (prod) | Description |
|---------------------|:---:|---|
| `NUTRIFIT_ENV`      |  –  | `development` \| `production` \| `testing` |
| `NUTRIFIT_SECRET`   | ✅  | Signs session cookies. `python -c "import secrets;print(secrets.token_hex(32))"` |
| `DATABASE_URL`      | ✅  | `mysql+pymysql://user:pass@host/nutrifit` or Postgres URL |
| `CORS_ORIGINS`      |  –  | Only if calling the API cross-origin (not via the Next proxy) |
| `RATELIMIT_STORAGE_URI` | – | `memory://` (single instance) or `redis://…` (multi-instance) |

In production the app **refuses to start** without `NUTRIFIT_SECRET` and
`DATABASE_URL`. No credentials are hardcoded anywhere.

Frontend (`frontend/.env.local`, and Vercel project env):

| Variable      | Description |
|---------------|---|
| `BACKEND_URL` | URL of the FastAPI backend the Next proxy forwards `/api/*` to |

---

## Deployment

**Frontend → Vercel:** import the repo, set the project **Root Directory** to
`frontend`, and set `BACKEND_URL` to your backend's public URL.

**Backend → any Python host** (Render/Railway/Fly/VM) via Docker:

```bash
docker build -f backend/Dockerfile -t nutrifit-api .
docker run -p 5000:5000 --env-file backend/.env nutrifit-api
```

or the provided `render.yaml` blueprint. Production serves via
`gunicorn` + `uvicorn` workers (see `backend/Procfile`). Put it behind HTTPS;
secure cookies are enabled automatically when `NUTRIFIT_ENV=production`.

For schema changes in production, add Alembic migrations (the app auto-creates
tables on first run for convenience).

---

## API surface

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| POST | `/api/auth/signup` | – | Register |
| POST | `/api/auth/login` | – | Log in (sets session cookie) |
| POST | `/api/auth/logout` | ✅ | Log out |
| GET | `/api/auth/me` | – | Session status |
| POST | `/api/diet/generate` | ✅ | 7-day meal plan |
| POST | `/api/diet/swap` | ✅ | Meal alternatives |
| POST | `/api/diet/meal-details` | ✅ | Nutrition for a food/quantity |
| POST | `/api/workout/generate` | ✅ | 6-day workout plan |
| POST | `/api/workout/swap` | ✅ | Exercise alternatives |
| GET/POST | `/api/progress/weights` | ✅ | Weekly weight log + plateau |
| GET | `/api/health` | – | Health check |

---

## Security posture

- Passwords hashed with PBKDF2-SHA256 (240k iterations, per-user salt).
- Session cookies are signed, `HttpOnly`, `SameSite=Lax`, `Secure` in production.
- Rate limiting on auth and generation endpoints (via `slowapi`).
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, HSTS in prod).
- Pydantic validation on every request body; generic auth errors (no user enumeration).
- Secrets and DB credentials come only from the environment.
