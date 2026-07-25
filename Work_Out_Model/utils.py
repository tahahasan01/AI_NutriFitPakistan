from __future__ import annotations
import pandas as pd
from typing import Dict, List, Any, Tuple

CALORIES_COEFF = 3.5 / 200.0
DEFAULT_DURATION_MIN = 10
KCALS_PER_KG = 7700.0

import re
from urllib.parse import quote_plus

# Dataset prefix/artifact tokens that leaked into exercise names (e.g.
# "FYR2 Dumbbell Clean", "HM Jumping Arm Circle", "Dumbbell Fix Dumbbell ...").
_NAME_ARTIFACTS = re.compile(
    r"\b(FYR2?|HM|BFR|AMRAP|WOD|EMOM|DB|KB)\b|\bDumbbell\s+Fix\b",
    flags=re.IGNORECASE,
)


def clean_exercise_name(name: str) -> str:
    """Strip dataset artifacts and collapse duplicate words in an exercise name."""
    n = _NAME_ARTIFACTS.sub(" ", str(name or ""))
    n = re.sub(r"\bFix\b", " ", n, flags=re.IGNORECASE)
    # collapse immediate duplicate words ("Dumbbell Dumbbell" -> "Dumbbell")
    n = re.sub(r"\b(\w+)(\s+\1\b)+", r"\1", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+", " ", n).strip()
    return n or str(name or "").strip()


def get_video_for_exercise(name: str) -> str:
    """A YouTube search link for the specific exercise's proper form.

    Search URLs always resolve (unlike the old deprecated `videoseries`
    embeds) and point at the actual movement rather than a generic playlist.
    """
    q = quote_plus(f"{clean_exercise_name(name)} exercise proper form")
    return f"https://www.youtube.com/results?search_query={q}"


def _s(x):
    v = "" if pd.isna(x) else str(x)
    return v


def calculate_calories(met: float, weight_kg: float, duration_min: int = DEFAULT_DURATION_MIN) -> float:
    return float(met * 3.5 * weight_kg / 200.0 * duration_min)


def filter_exercises(df: pd.DataFrame, preference: str, experience: str) -> pd.DataFrame:
    filtered = df.copy()
    equip = filtered["Equipment"].fillna("").astype(str)
    if preference and str(preference).lower() == "home":
        filtered = filtered[equip.str.lower().isin(["body only", "none", "no equipment"])].copy()
    if experience:
        diff = filtered["Difficulty"].fillna("").astype(str)
        filtered = filtered[diff.str.lower() == str(experience).lower()].copy()
    return filtered


def prioritize_by_goal(df: pd.DataFrame, goal: str) -> pd.DataFrame:
    met = pd.to_numeric(df["MET"], errors="coerce").fillna(0.0)
    if goal == "Fat Loss":
        return df.assign(_met=met).sort_values(by=["_met"], ascending=False).drop(columns=["_met"]) if "_met" in df.columns else df.assign(_met=met).sort_values(by=["_met"], ascending=False)
    if goal == "Muscle Gain":
        mech = df.get("Mechanics", pd.Series([""] * len(df))).fillna("").astype(str).str.lower().eq("compound").astype(int)
        diff_rank = df.get("Difficulty", pd.Series([""] * len(df))).fillna("").astype(str).str.lower().map({"beginner": 0, "intermediate": 1, "advanced": 2, "expert": 2}).fillna(0).astype(int)
        return df.assign(is_compound=mech, diff_rank=diff_rank, _met=met).sort_values(by=["is_compound", "diff_rank", "_met"], ascending=[False, False, True]).drop(columns=["_met"])
    strength_mask = df.get("Type", pd.Series([""] * len(df))).fillna("").astype(str).str.contains("strength", case=False, na=False)
    cardio_mask = df.get("Type", pd.Series([""] * len(df))).fillna("").astype(str).str.contains("cardio", case=False, na=False)
    strength_bias = df[strength_mask]
    cardio_bias = df[cardio_mask]
    mixed = pd.concat([strength_bias.head(3), cardio_bias.head(3)])
    remainder = df.drop(mixed.index, errors="ignore")
    return pd.concat([mixed, remainder])


def build_split() -> Dict[str, List[str]]:
    # Muscle names MUST match the dataset's BodyPart vocabulary, otherwise
    # pick_exercises() finds nothing and falls back to arbitrary exercises.
    # Dataset vocab: Abdominals, Abductors, Adductors, Biceps, Calves, Chest,
    # Forearms, Glutes, Hamstrings, Lats, Lower Back, Middle Back, Neck,
    # Quadriceps, Shoulders, Traps, Triceps.
    return {
        "Day 1 — Push (Chest/Shoulders/Triceps)": ["Chest", "Shoulders", "Triceps"],
        "Day 2 — Pull (Back/Biceps)": ["Lats", "Middle Back", "Lower Back", "Traps", "Biceps"],
        "Day 3 — Legs": ["Quadriceps", "Hamstrings", "Glutes", "Calves", "Adductors", "Abductors"],
        "Day 4 — Core": ["Abdominals"],
        "Day 5 — Upper": ["Chest", "Shoulders", "Lats", "Biceps", "Triceps"],
        "Day 6 — Full Body": ["Quadriceps", "Chest", "Lats", "Shoulders", "Hamstrings", "Abdominals"],
    }


# Olympic / explosive full-body lifts that don't belong on an isolated
# push/pull/legs day — the dataset labels them to a single muscle (usually
# Shoulders), so a snatch would otherwise land on "Push (Chest)" day.
_OLYMPIC_LIFT = re.compile(r"\b(?:snatch|clean|jerk|muscle[- ]?up|thruster)\b", re.IGNORECASE)


def _row_to_exercise(row: Any) -> Dict[str, Any]:
    instr = _s(row.get("Instructions"))
    instr = "" if instr.strip().lower() == "nan" else instr
    return {
        "Exercise_Name": row.get("Exercise_Name"),
        "Primary_Muscle": row.get("Primary_Muscle"),
        "Equipment": row.get("Equipment"),
        "Difficulty": row.get("Difficulty"),
        "Instructions": instr,
        "MET": float(row.get("MET", 0) or 0),
        "Type": row.get("Type"),
        "Mechanics": row.get("Mechanics"),
        "Level": row.get("Level"),
    }


def pick_exercises(df: pd.DataFrame, muscles: List[str], n: int = 6,
                   exclude_olympic: bool = True) -> List[Dict[str, Any]]:
    if not len(df):
        return []

    names = df.get("Exercise_Name", pd.Series([""] * len(df))).fillna("").astype(str)
    work = df
    if exclude_olympic:
        keep = ~names.str.contains(_OLYMPIC_LIFT)
        if keep.any():
            work = df[keep]

    prim = work.get("Primary_Muscle", pd.Series([""] * len(work))).fillna("").astype(str).str.lower()

    # Candidate rows per requested muscle, preserving the goal-prioritized order.
    per_muscle = []
    for m in muscles:
        ml = (m or "").strip().lower()
        rows = [row for _, row in work[prim == ml].iterrows()]
        if rows:
            per_muscle.append(rows)

    # Round-robin across the day's muscles so it actually trains each group
    # (e.g. Push day gets chest + shoulders + triceps, not 6 shoulder moves).
    chosen: List[Dict[str, Any]] = []
    seen = set()
    ptr = [0] * len(per_muscle)
    while len(chosen) < n and per_muscle:
        progressed = False
        for k in range(len(per_muscle)):
            if len(chosen) >= n:
                break
            rows = per_muscle[k]
            while ptr[k] < len(rows):
                row = rows[ptr[k]]
                ptr[k] += 1
                nm = str(row.get("Exercise_Name", ""))
                if nm in seen:
                    continue
                chosen.append(_row_to_exercise(row))
                seen.add(nm)
                progressed = True
                break
        if not progressed:
            break

    # Fallbacks: fill from the filtered pool, then the raw pool if still short.
    if len(chosen) < n:
        for _, row in work.iterrows():
            if len(chosen) >= n:
                break
            nm = str(row.get("Exercise_Name", ""))
            if nm in seen:
                continue
            chosen.append(_row_to_exercise(row))
            seen.add(nm)

    return chosen[:n]


def swap_alternatives(df: pd.DataFrame, current: Dict[str, Any], preference: str) -> List[Dict[str, Any]]:
    prim_series = df.get("Primary_Muscle", pd.Series([""] * len(df))).fillna("").astype(str).str.lower()
    diff_series = df.get("Difficulty", pd.Series([""] * len(df))).fillna("").astype(str).str.lower()
    cur_prim = _s(current.get("Primary_Muscle")).lower()
    cur_diff = _s(current.get("Difficulty")).lower()
    same = df[(prim_series == cur_prim) & (diff_series == cur_diff)]

    if preference and str(preference).lower() == "home":
        equip = same.get("Equipment", pd.Series([""] * len(same))).fillna("").astype(str).str.lower()
        same = same[equip.isin(["body only", "none", "no equipment"])].copy()
    if same.empty:
        mech_series = df.get("Mechanics", pd.Series([""] * len(df))).fillna("").astype(str).str.lower()
        mech = _s(current.get("Mechanics")).lower()
        alt = df[mech_series == mech].head(3)
        if alt.empty:
            # fallback by primary muscle only
            alt = df[prim_series == cur_prim].head(5)
    else:
        alt = same.head(5)
    out = []
    for _, r in alt.iterrows():
        instr = _s(r.get("Instructions"))
        instr = "" if instr.strip().lower() == "nan" else instr
        out.append({
            "Exercise_Name": r.get("Exercise_Name"),
            "Primary_Muscle": r.get("Primary_Muscle"),
            "Equipment": r.get("Equipment"),
            "Difficulty": r.get("Difficulty"),
            "Instructions": instr,
            "MET": float(r.get("MET", 0) or 0),
        })
    return out


def compute_pie_for_goal(goal: str) -> Tuple[List[str], List[int], List[str]]:
    labels = ["Cardio", "Strength", "Flexibility", "Core"]
    if goal == "Fat Loss":
        values = [45, 35, 5, 15]
    elif goal == "Muscle Gain":
        values = [15, 65, 5, 15]
    else:
        values = [25, 45, 10, 20]
    colors = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f"]  # distinct
    return labels, values, colors


def project_monthly_progress(daily_calories: List[float], goal: str) -> Tuple[List[str], List[float], float, str]:
    # Build 30-day projection by repeating weekly pattern
    if not daily_calories:
        return [str(i) for i in range(1, 31)], [0.0] * 30, 0.0, "No data"
    week = daily_calories
    month_cals: List[float] = []
    for i in range(30):
        month_cals.append(float(week[i % len(week)]))
    total_month = float(sum(month_cals))

    if goal == "Fat Loss":
        kg_change = -(total_month / KCALS_PER_KG)
        summary = f"Estimated weight change: {kg_change:.2f} kg loss over 30 days"
    elif goal == "Muscle Gain":
        # Heuristic small positive gain bounded
        kg_change = min(0.8, 0.00006 * total_month)
        summary = f"Estimated weight change: +{kg_change:.2f} kg gain over 30 days"
    else:
        kg_change = 0.0
        summary = "Estimated weight change: ~0.00 kg (maintenance)"

    labels = [f"Day {i}" for i in range(1, 31)]
    return labels, month_cals, kg_change, summary


def generate_workout_plan(df: pd.DataFrame, user: Dict[str, Any], duration_min: int = DEFAULT_DURATION_MIN) -> Tuple[Dict[str, List[Dict[str, Any]]], float, Dict[str, Any]]:
    preference = user.get("Workout Preference", "Gym")
    experience = user.get("Experience Level", "Beginner")
    goal = user.get("Goal", "Maintain")
    weight = float(user.get("Weight", 70))

    df2 = filter_exercises(df, preference=preference, experience=experience)
    df2 = prioritize_by_goal(df2, goal=goal)

    split = build_split()
    plan: Dict[str, List[Dict[str, Any]]] = {}
    daily_calories = []

    for day, muscles in split.items():
        # Olympic/explosive lifts are only appropriate on the full-body day.
        allow_olympic = "Full Body" in day
        picks = pick_exercises(df2, muscles=muscles, n=6, exclude_olympic=not allow_olympic)
        for ex in picks:
            ex["calories"] = round(calculate_calories(ex.get("MET", 0.0), weight, duration_min))
            instructions = _s(ex.get("Instructions"))
            if not instructions or instructions.strip() == "":
                instructions = f"Perform {ex.get('Exercise_Name', 'this exercise')} for the specified duration. Focus on proper form and controlled movements."
            ex["Instructions"] = instructions
        plan[day] = picks
        daily_calories.append(sum(ex["calories"] for ex in picks))

    total_calories = sum(daily_calories)

    pie_labels, pie_values, pie_colors = compute_pie_for_goal(goal)
    month_labels, month_values, kg_change, progress_summary = project_monthly_progress(daily_calories, goal)

    chart_data = {
        "pie": {"labels": pie_labels, "values": pie_values, "colors": pie_colors},
        "bar": {"labels": list(split.keys()), "values": daily_calories},
        "monthly": {"labels": month_labels, "calories": month_values, "kgChange": kg_change},
        "summary": progress_summary,
    }

    for day, exercises in plan.items():
        for ex in exercises:
            if ex.get("Exercise_Name"):
                ex["Exercise_Name"] = clean_exercise_name(ex["Exercise_Name"])
            ex["Video_URL"] = get_video_for_exercise(ex.get("Exercise_Name", ""))
    return plan, total_calories, chart_data
