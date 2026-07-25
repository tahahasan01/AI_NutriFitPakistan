"""Database models: User and per-user weekly weight logs."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str | None] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(20))
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    weight_logs: Mapped[list["UserWeightLog"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class UserWeightLog(Base):
    __tablename__ = "user_weight_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True
    )
    label: Mapped[str] = mapped_column(String(16), nullable=False)      # "start", "week1"...
    week_index: Mapped[int] = mapped_column(Integer, nullable=False)     # 0=start..6=week6
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    goal_mode: Mapped[str | None] = mapped_column(String(16))            # loss|gain|maintain
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="weight_logs")

    __table_args__ = (UniqueConstraint("user_id", "week_index", name="uq_user_week"),)


class UserProfile(Base):
    """Persisted body stats + goal, used to compute targets and prefill forms."""

    __tablename__ = "user_profile"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("user.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    age: Mapped[int] = mapped_column(Integer, default=25)
    gender: Mapped[int] = mapped_column(Integer, default=0)      # 0=male, 1=female
    weight_kg: Mapped[float] = mapped_column(Float, default=70)
    height_cm: Mapped[float] = mapped_column(Float, default=175)
    goal: Mapped[int] = mapped_column(Integer, default=0)        # 0=loss,1=gain,2=maintain
    activity: Mapped[int] = mapped_column(Integer, default=2)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )


class MealLog(Base):
    """A food the user actually ate — the write-side data loop."""

    __tablename__ = "meal_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True
    )
    log_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    meal_type: Mapped[str] = mapped_column(String(16), nullable=False)  # Breakfast/Lunch/Dinner/Snack
    food_name: Mapped[str] = mapped_column(String(160), nullable=False)
    quantity_g: Mapped[float] = mapped_column(Float, default=100)
    calories: Mapped[float] = mapped_column(Float, default=0)
    protein: Mapped[float] = mapped_column(Float, default=0)
    carbs: Mapped[float] = mapped_column(Float, default=0)
    fat: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Conversation(Base):
    """An AI-coach chat thread (ChatGPT-style history)."""

    __tablename__ = "conversation"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(120), default="New chat")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan",
        order_by="ChatMessage.id",
    )


class ChatMessage(Base):
    """One turn in a Conversation."""

    __tablename__ = "chat_message"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    conversation_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("conversation.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(16), nullable=False)  # user | assistant
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")


class FoodFeedback(Base):
    """Implicit taste signal (e.g. a meal swap) — training data for ranking."""

    __tablename__ = "food_feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True
    )
    food_name: Mapped[str] = mapped_column(String(160), nullable=False)
    meal_type: Mapped[str | None] = mapped_column(String(16))
    signal: Mapped[str] = mapped_column(String(16), nullable=False)  # swap_out | like | log
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
