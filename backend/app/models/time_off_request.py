from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional
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
    from app.models.time_off_allocation import TimeOffAllocation
    from app.models.user import User


class TimeOffRequest(Base):
    __tablename__ = "time_off_requests"
    __table_args__ = (
        CheckConstraint(
            "requested_amount > 0",
            name="chk_requests_requested_amount_positive",
        ),
        CheckConstraint(
            "end_date >= start_date",
            name="chk_requests_end_date_ge_start",
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
    allocation_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("time_off_allocations.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    end_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    requested_amount: Mapped[Decimal] = mapped_column(
        Numeric(8, 2), nullable=False
    )
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), default="PENDING", nullable=False, index=True
    )
    approved_by_user_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=True,
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    refused_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    refusal_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    employee: Mapped[Employee] = relationship(
        "Employee", back_populates="time_off_requests"
    )
    time_off_type: Mapped[TimeOffType] = relationship(
        "TimeOffType", back_populates="requests"
    )
    allocation: Mapped[Optional[TimeOffAllocation]] = relationship(
        "TimeOffAllocation", back_populates="requests"
    )
    approved_by_user: Mapped[Optional[User]] = relationship(
        "User", back_populates="approved_time_off_requests"
    )
