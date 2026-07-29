"""Pydantic request/response schemas with validation."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ---------- Auth ----------
class SignupIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=20)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def _strip_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name is required.")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    id: int
    name: Optional[str] = None
    email: str
    phone: Optional[str] = None


class ProfileUpdateIn(BaseModel):
    name: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)


class PasswordChangeIn(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class AuthStatus(BaseModel):
    authenticated: bool
    user: Optional[UserOut] = None


# ---------- Diet ----------
class DietProfileIn(BaseModel):
    age: int = Field(ge=1, le=120)
    gender: int = Field(ge=0, le=1, description="0=male, 1=female")
    weight: float = Field(ge=30, le=300, description="kg")
    height: float = Field(ge=100, le=250, description="cm")
    goal: int = Field(ge=0, le=2, description="0=loss, 1=gain, 2=maintain")
    activity: int = Field(ge=0, le=4)
    allergies: List[str] = Field(default_factory=list)


class Meal(BaseModel):
    name: str
    quantity: float
    calories: float
    protein: float
    carbs: float
    fat: float
    sugar: float = 0
    fiber: float = 0


class DayPlan(BaseModel):
    day: Optional[str] = None
    day_number: Optional[int] = None
    meals: List[Meal]


class Targets(BaseModel):
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0


class Totals(BaseModel):
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0


class DietPlanOut(BaseModel):
    success: bool = True
    weekly_plan: List[DayPlan]
    targets: Targets
    tdee: float
    totals: Totals


class SwapMealIn(BaseModel):
    current_meal_name: str
    goal: int = Field(ge=0, le=2)
    meal_type: str
    target_calories: Optional[float] = None
    allergies: List[str] = Field(default_factory=list)

    @field_validator("meal_type")
    @classmethod
    def _valid_meal_type(cls, v: str) -> str:
        if v not in {"Breakfast", "Lunch", "Dinner", "Snack"}:
            raise ValueError("meal_type must be one of Breakfast, Lunch, Dinner, Snack")
        return v


class MealDetailsIn(BaseModel):
    meal_name: str
    quantity: float = Field(default=100, gt=0, le=2000)


# ---------- Workout ----------
class WorkoutProfileIn(BaseModel):
    age: int = Field(default=30, ge=1, le=120)
    gender: int = Field(default=0, ge=0, le=1)
    weight: float = Field(default=70, ge=30, le=300)
    height: float = Field(default=170, ge=100, le=250)
    goal: int = Field(default=2, ge=0, le=2)
    activity: int = Field(default=2, ge=0, le=4)
    preference: str = Field(default="Gym")

    @field_validator("preference")
    @classmethod
    def _valid_pref(cls, v: str) -> str:
        if v.lower() not in {"gym", "home"}:
            raise ValueError("preference must be 'Gym' or 'Home'")
        return v.capitalize()


class SwapExerciseIn(BaseModel):
    current: Dict[str, Any]
    preference: str = "Gym"


# ---------- Progress ----------
class WeightsIn(BaseModel):
    weights: Dict[str, Optional[float]] = Field(default_factory=dict)
    goal_mode: Optional[str] = None


# ---------- Profile ----------
class ProfileIn(BaseModel):
    age: int = Field(ge=1, le=120)
    gender: int = Field(ge=0, le=1)
    weight: float = Field(ge=30, le=300)
    height: float = Field(ge=100, le=250)
    goal: int = Field(ge=0, le=2)
    activity: int = Field(ge=0, le=4)


# ---------- Meal logging ----------
class MealLogIn(BaseModel):
    date: Optional[str] = None  # YYYY-MM-DD; defaults to today
    meal_type: str = Field(default="Snack")
    food_name: str = Field(min_length=1, max_length=160)
    quantity_g: float = Field(default=100, gt=0, le=3000)
    calories: float = Field(ge=0)
    protein: float = 0
    carbs: float = 0
    fat: float = 0

    @field_validator("meal_type")
    @classmethod
    def _mt(cls, v: str) -> str:
        norm = (v or "").strip().title()
        return norm if norm in {"Breakfast", "Lunch", "Dinner", "Snack"} else "Snack"


class SwapFeedbackIn(BaseModel):
    food_name: str = Field(min_length=1, max_length=160)
    meal_type: Optional[str] = None
    signal: str = Field(default="swap_out")


# ---------- Activity (GPS tracking) ----------
class ActivityIn(BaseModel):
    kind: str = Field(default="walk")  # walk | run | ride
    distance_km: float = Field(ge=0, le=500)
    duration_s: int = Field(ge=0, le=86400)
    calories: float = Field(ge=0, le=20000)
    route: Optional[List[List[float]]] = None  # [[lat, lng], ...]

    @field_validator("kind")
    @classmethod
    def _kind(cls, v: str) -> str:
        norm = (v or "").strip().lower()
        return norm if norm in {"walk", "run", "ride"} else "walk"
