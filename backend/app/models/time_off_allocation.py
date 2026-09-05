from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional, List
from sqlalchemy import (
    String,
    Text,
    Integer,
    Numeric,
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
    from app.models.time_off_type import TimeOffType
    from app.models.user import User
    from app.models.time_off_request import TimeOffRequest


class TimeOffAllocation(Base):
    __tablename__ = "time_off_allocations"
    __table_args__ = (
        CheckConstraint(
            "allocated_amount >= 0",
            name="chk_allocations_allocated_non_negative",
        ),
        CheckConstraint(
            "taken_amount >= 0",
            name="chk_allocations_taken_non_negative",
        ),
        CheckConstraint(
            "taken_amount <= allocated_amount",
            name="chk_allocations_taken_le_allocated",
        ),
        CheckConstraint(
            "end_date >= start_date",
            name="chk_allocations_end_date_ge_start",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("employees.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    time_off_type_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("time_off_types.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    allocated_amount: Mapped[Decimal] = mapped_column(
        Numeric(8, 2), nullable=False
    )
    taken_amount: Mapped[Decimal] = mapped_column(
        Numeric(8, 2), default=Decimal("0.00"), nullable=False
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    end_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(30), default="DRAFT", nullable=False, index=True
    )
    approved_by_user_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=True,
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
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
        "Employee", back_populates="time_off_allocations"
    )
    time_off_type: Mapped[TimeOffType] = relationship(
        "TimeOffType", back_populates="allocations"
    )
    approved_by_user: Mapped[Optional[User]] = relationship(
        "User", back_populates="approved_allocations"
    )
    requests: Mapped[List[TimeOffRequest]] = relationship(
        "TimeOffRequest", back_populates="allocation"
    )
