from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING, Optional, List
from sqlalchemy import (
    String,
    Text,
    Integer,
    BigInteger,
    Date,
    DateTime,
    ForeignKey,
    CheckConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.salary_structure import SalaryStructure
    from app.models.user import User
    from app.models.payrun_employee import PayrunEmployee
    from app.models.payslip import Payslip
    from app.models.payroll_warning import PayrollWarning


class Payrun(Base):
    __tablename__ = "payruns"
    __table_args__ = (
        CheckConstraint(
            "period_end >= period_start",
            name="chk_payruns_period_end_ge_start",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    salary_structure_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("salary_structures.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    period_start: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    period_end: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(30), default="DRAFT", nullable=False, index=True
    )
    computed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    validated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    paid_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    sent_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    salary_structure: Mapped[SalaryStructure] = relationship(
        "SalaryStructure", back_populates="payruns"
    )
    created_by_user: Mapped[User] = relationship(
        "User", back_populates="created_payruns"
    )
    payrun_employees: Mapped[List[PayrunEmployee]] = relationship(
        "PayrunEmployee", back_populates="payrun"
    )
    payslips: Mapped[List[Payslip]] = relationship(
        "Payslip", back_populates="payrun"
    )
    payroll_warnings: Mapped[List[PayrollWarning]] = relationship(
        "PayrollWarning", back_populates="payrun"
    )
