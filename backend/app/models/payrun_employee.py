from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import (
    String,
    Integer,
    BigInteger,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.payrun import Payrun
    from app.models.employee import Employee
    from app.models.payslip import Payslip


class PayrunEmployee(Base):
    __tablename__ = "payrun_employees"
    __table_args__ = (
        UniqueConstraint("payrun_id", "employee_id", name="uq_payrun_employee"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    payrun_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("payruns.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    employee_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("employees.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    selection_status: Mapped[str] = mapped_column(
        String(30), default="SELECTED", nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    payrun: Mapped[Payrun] = relationship("Payrun", back_populates="payrun_employees")
    employee: Mapped[Employee] = relationship(
        "Employee", back_populates="payrun_employees"
    )
    payslip: Mapped[Optional[Payslip]] = relationship(
        "Payslip", back_populates="payrun_employee", uselist=False
    )
