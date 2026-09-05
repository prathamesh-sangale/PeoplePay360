from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional, List
from sqlalchemy import (
    String,
    Text,
    Integer,
    Numeric,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Index,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.employee import Employee
    from app.models.attendance_correction import AttendanceCorrection


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        CheckConstraint(
            "check_out IS NULL OR check_out >= check_in",
            name="chk_attendance_checkout_after_checkin",
        ),
        CheckConstraint(
            "worked_hours IS NULL OR worked_hours >= 0",
            name="chk_attendance_worked_hours_non_negative",
        ),
        Index("ix_attendance_employee_checkin", "employee_id", "check_in"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("employees.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    check_in: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    check_out: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    worked_hours: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(6, 2), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(30), default="PRESENT", nullable=False, index=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    employee: Mapped[Employee] = relationship(
        "Employee", back_populates="attendances"
    )
    corrections: Mapped[List[AttendanceCorrection]] = relationship(
        "AttendanceCorrection", back_populates="attendance"
    )
