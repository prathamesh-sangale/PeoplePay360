from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import (
    String,
    Text,
    Boolean,
    Integer,
    BigInteger,
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.payrun import Payrun
    from app.models.payslip import Payslip
    from app.models.employee import Employee
    from app.models.user import User


class PayrollWarning(Base):
    __tablename__ = "payroll_warnings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    payrun_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("payruns.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    payslip_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("payslips.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    employee_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("employees.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    warning_type: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )
    severity: Mapped[str] = mapped_column(
        String(30), default="WARNING", nullable=False, index=True
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_resolved: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, index=True
    )
    resolved_by_user_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    payrun: Mapped[Payrun] = relationship("Payrun", back_populates="payroll_warnings")
    payslip: Mapped[Optional[Payslip]] = relationship(
        "Payslip", back_populates="payroll_warnings"
    )
    employee: Mapped[Optional[Employee]] = relationship(
        "Employee", back_populates="payroll_warnings"
    )
    resolved_by_user: Mapped[Optional[User]] = relationship(
        "User", back_populates="resolved_payroll_warnings"
    )
