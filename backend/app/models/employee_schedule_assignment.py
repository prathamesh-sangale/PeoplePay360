from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import (
    Boolean,
    Integer,
    Date,
    DateTime,
    ForeignKey,
    CheckConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.employee import Employee
    from app.models.working_schedule import WorkingSchedule


class EmployeeScheduleAssignment(Base):
    __tablename__ = "employee_schedule_assignments"
    __table_args__ = (
        CheckConstraint(
            "end_date IS NULL OR end_date >= start_date",
            name="chk_schedule_assign_end_date_after_start",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("employees.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    working_schedule_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("working_schedules.id", ondelete="RESTRICT"),
        nullable=False,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    employee: Mapped[Employee] = relationship(
        "Employee", back_populates="schedule_assignments"
    )
    working_schedule: Mapped[WorkingSchedule] = relationship(
        "WorkingSchedule", back_populates="assignments"
    )
