from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional, List
from sqlalchemy import String, Boolean, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.role import Role
    from app.models.employee import Employee
    from app.models.attendance_correction import AttendanceCorrection
    from app.models.time_off_allocation import TimeOffAllocation
    from app.models.time_off_request import TimeOffRequest
    from app.models.payrun import Payrun
    from app.models.payroll_warning import PayrollWarning
    from app.models.notification import Notification


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    role_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False
    )
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    role: Mapped[Role] = relationship("Role", back_populates="users")
    employee: Mapped[Optional[Employee]] = relationship(
        "Employee", back_populates="user", uselist=False
    )
    attendance_corrections: Mapped[List[AttendanceCorrection]] = relationship(
        "AttendanceCorrection", back_populates="corrected_by_user"
    )
    approved_allocations: Mapped[List[TimeOffAllocation]] = relationship(
        "TimeOffAllocation", back_populates="approved_by_user"
    )
    approved_time_off_requests: Mapped[List[TimeOffRequest]] = relationship(
        "TimeOffRequest", back_populates="approved_by_user"
    )
    created_payruns: Mapped[List[Payrun]] = relationship(
        "Payrun", back_populates="created_by_user"
    )
    resolved_payroll_warnings: Mapped[List[PayrollWarning]] = relationship(
        "PayrollWarning", back_populates="resolved_by_user"
    )
    notifications: Mapped[List[Notification]] = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )
