from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List
from sqlalchemy import String, Boolean, Integer, Numeric, DateTime, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.working_schedule_day import WorkingScheduleDay
    from app.models.employee_schedule_assignment import EmployeeScheduleAssignment
    from app.models.contract import Contract


class WorkingSchedule(Base):
    __tablename__ = "working_schedules"
    __table_args__ = (
        CheckConstraint(
            "weekly_hours >= 0",
            name="chk_working_schedules_weekly_hours_non_negative",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    schedule_type: Mapped[str] = mapped_column(
        String(30), default="WEEKLY", nullable=False
    )
    weekly_hours: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("0.00"), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    days: Mapped[List[WorkingScheduleDay]] = relationship(
        "WorkingScheduleDay", back_populates="working_schedule", cascade="all, delete-orphan"
    )
    assignments: Mapped[List[EmployeeScheduleAssignment]] = relationship(
        "EmployeeScheduleAssignment", back_populates="working_schedule"
    )
    contracts: Mapped[List[Contract]] = relationship(
        "Contract", back_populates="working_schedule"
    )
