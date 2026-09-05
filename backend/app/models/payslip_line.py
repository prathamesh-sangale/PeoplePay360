from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional
from sqlalchemy import (
    String,
    Text,
    Integer,
    BigInteger,
    Numeric,
    DateTime,
    ForeignKey,
    CheckConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.payslip import Payslip
    from app.models.salary_rule import SalaryRule


class PayslipLine(Base):
    __tablename__ = "payslip_lines"
    __table_args__ = (
        CheckConstraint("quantity >= 0", name="chk_payslip_lines_quantity_non_negative"),
        CheckConstraint("base_amount >= 0", name="chk_payslip_lines_base_amount_non_negative"),
        CheckConstraint("amount >= 0", name="chk_payslip_lines_amount_non_negative"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    payslip_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("payslips.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    salary_rule_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("salary_rules.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    sequence: Mapped[int] = mapped_column(Integer, default=100, nullable=False, index=True)
    calculation_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    quantity: Mapped[Decimal] = mapped_column(
        Numeric(12, 4), default=Decimal("1.0000"), nullable=False
    )
    rate: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 4), nullable=True
    )
    base_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal("0.00"), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal("0.00"), nullable=False
    )
    formula_snapshot: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    payslip: Mapped[Payslip] = relationship("Payslip", back_populates="lines")
    salary_rule: Mapped[Optional[SalaryRule]] = relationship(
        "SalaryRule", back_populates="payslip_lines"
    )
