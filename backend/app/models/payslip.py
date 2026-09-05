from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional, List
from sqlalchemy import (
    String,
    Integer,
    BigInteger,
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
    from app.models.payrun import Payrun
    from app.models.employee import Employee
    from app.models.payrun_employee import PayrunEmployee
    from app.models.salary_structure import SalaryStructure
    from app.models.contract import Contract
    from app.models.payslip_line import PayslipLine
    from app.models.payroll_warning import PayrollWarning


class Payslip(Base):
    __tablename__ = "payslips"
    __table_args__ = (
        CheckConstraint("worked_days >= 0", name="chk_payslips_worked_days_non_negative"),
        CheckConstraint("basic_amount >= 0", name="chk_payslips_basic_non_negative"),
        CheckConstraint("gross_amount >= 0", name="chk_payslips_gross_non_negative"),
        CheckConstraint("deduction_amount >= 0", name="chk_payslips_deduction_non_negative"),
        CheckConstraint("contribution_amount >= 0", name="chk_payslips_contribution_non_negative"),
        CheckConstraint("net_amount >= 0", name="chk_payslips_net_non_negative"),
        CheckConstraint("period_end >= period_start", name="chk_payslips_period_end_ge_start"),
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
    payrun_employee_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("payrun_employees.id", ondelete="RESTRICT"),
        unique=True,
        nullable=False,
    )
    salary_structure_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("salary_structures.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    contract_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("contracts.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    period_start: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    period_end: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    worked_days: Mapped[Decimal] = mapped_column(
        Numeric(8, 2), default=Decimal("0.00"), nullable=False
    )
    basic_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal("0.00"), nullable=False
    )
    gross_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal("0.00"), nullable=False
    )
    deduction_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal("0.00"), nullable=False
    )
    contribution_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal("0.00"), nullable=False
    )
    net_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal("0.00"), nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30), default="DRAFT", nullable=False, index=True
    )
    pdf_generated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    sent_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    payrun: Mapped[Payrun] = relationship("Payrun", back_populates="payslips")
    employee: Mapped[Employee] = relationship("Employee", back_populates="payslips")
    payrun_employee: Mapped[PayrunEmployee] = relationship(
        "PayrunEmployee", back_populates="payslip"
    )
    salary_structure: Mapped[SalaryStructure] = relationship(
        "SalaryStructure", back_populates="payslips"
    )
    contract: Mapped[Contract] = relationship("Contract", back_populates="payslips")
    lines: Mapped[List[PayslipLine]] = relationship(
        "PayslipLine", back_populates="payslip", cascade="all, delete-orphan"
    )
    payroll_warnings: Mapped[List[PayrollWarning]] = relationship(
        "PayrollWarning", back_populates="payslip"
    )
