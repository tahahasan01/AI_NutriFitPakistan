# 🥗 NutriFit Pakistan

**AI-assisted nutrition & fitness, built for desi plates.** Personalized 7-day
meal plans, 6-day workout splits, food logging, and progress tracking — powered
by a verified, per-100g dataset of Pakistani + global foods and correct
sports-nutrition math (Mifflin–St Jeor TDEE + Atwater macros).

> Most trackers assume Western diets and guess at desi portions. NutriFit is
> local-first by design: your biryani, nihari, and daal are counted correctly,
> and every plan is matched to *your* calorie **and** macro targets — not just a
> number on a screen.

**Stack:** FastAPI (Python) · Next.js 14 App Router (TypeScript, Tailwind) ·
SQLAlchemy · Neon/Postgres · deployed on Vercel.

---

## Table of contents

- [Features](#features)
- [How it works](#how-it-works)
- [Architecture](#architecture)
- [Accuracy & methodology](#accuracy--methodology)
- [Repository layout](#repository-layout)
- [Quick start (local)](#quick-start-local)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Testing](#testing)
- [Security posture](#security-posture)
- [Roadmap](#roadmap)

---

## Features

**Nutrition**
- 🍽️ **7-day meal plans** matched to your calorie *and* macro targets
  (protein / carbs / fat), using real Pakistani meals — biryani, karahi, daal,
  chaat — portioned to hit the goal, not random serving sizes.
- 🔁 **Smart swaps** — don't like a meal? Swap it for a goal-aware alternative.
- 🔍 **Food search & logging** — search 150+ verified foods, log what you eat,
  and see your day's calories/macros vs target.
- 🔥 **Daily diary & streaks** — a food log ("Today") with running totals and a
  logging streak to build the habit.

**Fitness**
- 🏋️ **6-day workout splits** (Push / Pull / Legs / Core / Upper / Full Body),
  for **home or gym**, with per-exercise calorie burn from MET values.
- ▶️ **Form videos** — every exercise links to a YouTube search for that
  specific movement's proper form.

**Tracking & personalization**
- 📊 **Dashboard + BMI calculator** as the post-login home.
- 📈 **Progress tracking** — weekly weight log with trend charts and automatic
  **plateau detection**.
- ⚙️ **Settings** — light/dark mode, avatar upload, profile & security, account
  deletion.
- 🧭 **App shell** — collapsible sidebar, sticky top bar, fully responsive
  (mobile + desktop).

**Foundations**
- 🔐 Session auth (signed, `HttpOnly` cookies), PBKDF2 password hashing, rate
  limiting, security headers, Pydantic validation on every request.

---

## How it works

```
1. Tell us about you   →   age, weight, height, goal, activity  (~20 seconds)
2. Get your plan       →   calorie- & macro-matched 7-day menu + 6-day split
3. Track & adapt       →   log meals, swap what you dislike, watch for plateaus
```

Targets are computed with the **exact Mifflin–St Jeor** equation and **correct
Atwater factors** (protein/carb = 4 kcal/g, **fat = 9 kcal/g**). Meals are then
selected to steer each day toward your macro split — so a weight-loss day lands
near its protein/carb/fat targets instead of becoming an all-protein, zero-carb
plate.

---

## Architecture

The frontend proxies `/api/*` to the backend via a Next.js rewrite, so session
cookies stay **first-party** and the browser only ever talks to one origin.

```
┌──────────────┐   /api/* (Next.js rewrite proxy)   ┌───────────────────────┐
│   Next.js    │  ───────────────────────────────▶  │      FastAPI API       │
│  (Vercel)    │     cookie session (SameSite=Lax)  │  auth · diet · workout │
│  App Router  │  ◀───────────────────────────────  │  tracking · progress   │
└──────────────┘                                     └───────────┬───────────┘
                                                                 │
                                    ┌────────────────────────────┼───────────────┐
                                    │  Diet_Plan_Model (targets + macro-aware     │
                                    │  meal selection)   ·   Work_Out_Model (MET  │
                                    │  calories, split builder)   ·   Neon/Postgres│
                                    └─────────────────────────────────────────────┘
```

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, lucide-react |
| Backend | FastAPI, Starlette SessionMiddleware, SQLAlchemy 2.0, Pydantic v2, slowapi |
| Data/ML | pandas, NumPy, scikit-learn; optional PyTorch ranker |
| Database | SQLite (dev) · Neon/Postgres or MySQL (prod), via `psycopg` v3 / PyMySQL |
| Hosting | Vercel (frontend + Python backend), or any Docker host |

---

## Accuracy & methodology

Accuracy is the product. The numbers are independently verifiable:

- **TDEE / BMR** — Mifflin–St Jeor, exact. e.g. male, 25 y, 70 kg, 175 cm,
  moderate → BMR 1673.75 × 1.55 = **2594 kcal**.
- **Macros** — Atwater factors with **fat = 9 kcal/g** (a common bug in other
  apps is treating fat as 4). A weight-loss split is 30% P / 35% C / 35% F.
- **Food dataset** — a **curated, per-100g, Atwater-consistent** table of **150
  Pakistani + global foods** (31 breakfast, 38 lunch, 38 dinner, 43 snacks),
  each verified within ~7% of authoritative (USDA/standard) values. Rebuild &
  validate with:
  ```bash
  python Diet_Plan_Model/build_dataset.py
  ```
  Validation blocks any row that isn't per-100g, isn't Atwater-consistent
  (`Calories ≈ 4·carb + 4·protein + 9·fat`), has zero macros, or leaves a meal
  type short on variety.
- **Macro-aware meal selection** — each meal is chosen to move the day's
  *remaining* protein/carb/fat budget toward target (not just calories), and
  unrealistic single-food portions are penalized. Result: a weight-loss day now
  lands ≈ 161 P / 202 C / 90 F against a 165 / 193 / 86 target.
- **Workout calories** — standard MET equation
  `kcal = MET × 3.5 × weight_kg / 200 × minutes`. Exercises are distributed
  across each day's target muscles, and Olympic/explosive lifts are kept off the
  isolation splits.

> The original upstream datasets mixed per-serving and per-100g values with
> ~14–21% Atwater-inconsistent rows and ~6% zero-macro rows. They were replaced
> because the model assumes per-100g.

---

## Repository layout

```
.
├── api/
│   └── index.py            # Vercel Python entrypoint (exposes the ASGI app)
├── vercel.json             # Vercel build/route config for the backend
├── requirements.txt        # backend deps (inlined for Vercel)
│
├── backend/                # FastAPI application
│   ├── main.py             # app assembly (middleware, routers, lifespan)
│   ├── settings.py         # env-driven config (dev SQLite fallback, prod guards)
│   ├── database.py         # SQLAlchemy engine/session (+ psycopg URL normalize)
│   ├── models.py           # User, UserWeightLog, UserProfile, MealLog, FoodFeedback
│   ├── schemas.py          # Pydantic request/response models
│   ├── security.py         # PBKDF2 hashing + auth dependency
│   ├── ratelimit.py        # optional slowapi rate limiting
│   ├── ml.py               # loads diet/workout ML, diet post-processing
│   ├── routers/            # auth · diet · workout · progress · tracking · health
│   ├── tests/              # pytest smoke suite
│   └── .env.example
│
├── frontend/               # Next.js app (TypeScript, Tailwind)
│   ├── app/                # landing, login/signup, dashboard, log, diet,
│   │                       #   workout, progress, settings
│   ├── components/         # Shell, Sidebar, Navbar, ThemeToggle, Avatar,
│   │                       #   MacroDonut, PrefsProvider, RequireAuth
│   ├── lib/                # api client, shared types
│   ├── next.config.js      # /api proxy → BACKEND_URL
│   └── .env.example
│
├── Diet_Plan_Model/        # Diet ML + data
│   ├── diet_model.py       # targets (Mifflin-St Jeor + Atwater) + macro-aware plan
│   ├── build_dataset.py    # regenerates & validates the food tables
│   └── cleaned_foods_dataset.csv, cleaned_snacks_dataset.csv
│
└── Work_Out_Model/         # Workout ML + data
    ├── utils.py            # split builder, MET calories, video links, swaps
    └── workoutdata_with_estimated_met.csv
```

---

## Quick start (local)

**Prerequisites:** Python 3.10+ (3.11 recommended), Node.js 18+. PyTorch is
**optional** (the app runs on the exact-formula path by default).

### 1. Backend (FastAPI)

```bash
python -m venv .venv
# Windows:  .venv\Scripts\activate   |   macOS/Linux:  source .venv/bin/activate
pip install -r backend/requirements.txt

uvicorn backend.main:app --reload --port 5000
```

- API root: http://localhost:5000 · Swagger docs: http://localhost:5000/docs
- Health: http://localhost:5000/api/health
- With no `DATABASE_URL`, a local `nutrifit_dev.db` (SQLite) is created
  automatically — no database setup needed for dev.

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.example .env.local        # BACKEND_URL=http://localhost:5000 (default)
npm run dev                       # http://localhost:3000
```

Open http://localhost:3000 → sign up → land on the dashboard → generate a Diet
plan / Workout, log meals, and track progress.

---

## API reference

All routes are under `/api`. ✅ = requires an authenticated session cookie.

### Auth
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| POST | `/api/auth/signup` | – | Register a new account |
| POST | `/api/auth/login` | – | Log in (sets session cookie) |
| POST | `/api/auth/logout` | ✅ | Log out |
| GET  | `/api/auth/me` | – | Current session status |
| POST | `/api/auth/change-password` | ✅ | Change password |
| DELETE | `/api/auth/account` | ✅ | Delete account |

### Diet
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| POST | `/api/diet/generate` | ✅ | Macro-aware 7-day meal plan |
| POST | `/api/diet/swap` | ✅ | Alternatives for a meal |
| POST | `/api/diet/meal-details` | ✅ | Nutrition for a food + quantity |

### Workout
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| POST | `/api/workout/generate` | ✅ | 6-day home/gym split |
| POST | `/api/workout/swap` | ✅ | Alternatives for an exercise |

### Tracking & profile
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| GET / PUT | `/api/profile` | ✅ | Read / update body profile & goal |
| GET | `/api/foods/search?q=` | ✅ | Search foods (per-100g macros) |
| POST | `/api/log/meal` | ✅ | Log a meal for a day |
| GET | `/api/log/day?date=` | ✅ | A day's meals + totals vs target |
| DELETE | `/api/log/meal/{id}` | ✅ | Remove a logged meal |
| GET | `/api/log/summary` | ✅ | Today's totals, streak, week trend |
| POST | `/api/log/feedback` | ✅ | Like/dislike signal for a food |

### Progress & health
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| GET / POST | `/api/progress/weights` | ✅ | Weekly weight log + plateau detection |
| GET | `/api/health` | – | Health check (`ml_backend: neural \| math`) |

---

## Data model

| Table | Purpose |
|---|---|
| `User` | Account: name, email, phone, PBKDF2 password hash |
| `UserProfile` | Age, gender, weight, height, goal, activity |
| `MealLog` | A logged meal: date, meal type, food, quantity, calories + macros |
| `UserWeightLog` | Weekly weight entries for trend/plateau analysis |
| `FoodFeedback` | Like/dislike/swap signals to personalize future plans |

Tables are auto-created on first run for convenience; add Alembic migrations for
production schema changes.

---

## Configuration

**Backend** (`backend/.env`):

| Variable | Required (prod) | Description |
|---|:---:|---|
| `NUTRIFIT_ENV` | – | `development` \| `production` \| `testing` |
| `NUTRIFIT_SECRET` | ✅ | Signs session cookies — `python -c "import secrets;print(secrets.token_hex(32))"` |
| `DATABASE_URL` | ✅ | `postgresql://…` (Neon) or `mysql+pymysql://…`; `postgres://` is auto-normalized to `psycopg` v3 |
| `AUTO_CREATE_DB` | – | `1` to create tables on startup |
| `CORS_ORIGINS` | – | Only if calling the API cross-origin (not via the Next proxy) |
| `RATELIMIT_STORAGE_URI` | – | `memory://` (single instance) or `redis://…` (multi-instance) |

In production the app **refuses to start** without `NUTRIFIT_SECRET` and
`DATABASE_URL`. No credentials are hardcoded anywhere.

**Frontend** (`frontend/.env.local` + Vercel project env):

| Variable | Description |
|---|---|
| `BACKEND_URL` | URL of the FastAPI backend the Next proxy forwards `/api/*` to |

---

## Deployment

Both halves deploy to **Vercel** from this one repo.

**Frontend** — import the repo, set **Root Directory** = `frontend`, and set
`BACKEND_URL` to the backend's public URL.

**Backend** — the repo root ships `vercel.json` + `api/index.py` (Vercel's
Python runtime serving the ASGI app) and a root `requirements.txt`. Create a
second Vercel project with the **repo root** as its root directory, add a
managed Postgres store (Neon) so `DATABASE_URL` is injected, and set:

```
NUTRIFIT_ENV=production
NUTRIFIT_SECRET=<token_hex(32)>
AUTO_CREATE_DB=1
```

Then point the frontend's `BACKEND_URL` at this project and redeploy.

**Docker (any Python host)** — as an alternative to Vercel:

```bash
docker build -f backend/Dockerfile -t nutrifit-api .
docker run -p 5000:5000 --env-file backend/.env nutrifit-api
```

Secure cookies + HSTS turn on automatically when `NUTRIFIT_ENV=production`; put
the backend behind HTTPS.

---

## Testing

```bash
pip install -r backend/requirements.txt
pytest backend/tests -q
```

The smoke suite covers signup/login/logout, auth enforcement, diet generation
(7 days, ≥3 meals/day), workout generation, progress save/read + plateau, and a
regression test that fat is counted at 9 kcal/g.

---

## Security posture

- Passwords hashed with **PBKDF2-SHA256** (240k iterations, per-user salt).
- Session cookies are signed, `HttpOnly`, `SameSite=Lax`, `Secure` in production.
- **Rate limiting** on auth and generation endpoints (slowapi).
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, HSTS in prod.
- **Pydantic validation** on every request body; generic auth errors (no user
  enumeration).
- Secrets and DB credentials come **only** from the environment.

---

## Roadmap

- Recipe-level meal composition (multiple foods per meal) for even tighter macro
  fit and more realistic portions.
- Barcode / photo food logging.
- Deeper workout personalization (equipment inventory, progressive overload).
- Curated per-exercise demo videos (replace search links).

---

<sub>Estimates are for planning, not medical advice.</sub>
