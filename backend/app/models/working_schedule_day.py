from __future__ import annotations

from datetime import time
from typing import TYPE_CHECKING, Optional
from sqlalchemy import (
    Boolean,
    Integer,
    SmallInteger,
    Time,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.working_schedule import WorkingSchedule


class WorkingScheduleDay(Base):
    __tablename__ = "working_schedule_days"
    __table_args__ = (
        CheckConstraint(
            "day_of_week BETWEEN 0 AND 6",
            name="chk_working_schedule_days_day_range",
        ),
        CheckConstraint(
            "break_minutes >= 0",
            name="chk_working_schedule_days_break_non_negative",
        ),
        UniqueConstraint(
            "working_schedule_id",
            "day_of_week",
            name="uq_working_schedule_day",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    working_schedule_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("working_schedules.id", ondelete="CASCADE"),
        nullable=False,
    )
    day_of_week: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    start_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    end_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    break_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_working_day: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    working_schedule: Mapped[WorkingSchedule] = relationship(
        "WorkingSchedule", back_populates="days"
    )
