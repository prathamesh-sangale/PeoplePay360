from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional, List
from sqlalchemy import (
    String,
    Text,
    Boolean,
    Integer,
    DateTime,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.time_off_allocation import TimeOffAllocation
    from app.models.time_off_request import TimeOffRequest


class TimeOffType(Base):
    __tablename__ = "time_off_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), default="DAYS", nullable=False)
    allocation_required: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    approval_required: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    payroll_integration: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    allocations: Mapped[List[TimeOffAllocation]] = relationship(
        "TimeOffAllocation", back_populates="time_off_type"
    )
    requests: Mapped[List[TimeOffRequest]] = relationship(
        "TimeOffRequest", back_populates="time_off_type"
    )
