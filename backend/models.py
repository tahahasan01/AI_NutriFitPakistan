"""Database models: User and per-user weekly weight logs."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
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
