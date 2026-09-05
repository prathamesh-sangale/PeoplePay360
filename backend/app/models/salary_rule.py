from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional, List
from sqlalchemy import (
    String,
    Text,
    Boolean,
    Integer,
    BigInteger,
    Numeric,
    DateTime,
    CheckConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.salary_structure_rule import SalaryStructureRule
    from app.models.payslip_line import PayslipLine


class SalaryRule(Base):
    __tablename__ = "salary_rules"
    __table_args__ = (
        CheckConstraint("sequence >= 0", name="chk_salary_rules_sequence_non_negative"),
        CheckConstraint(
            "amount IS NULL OR amount >= 0",
            name="chk_salary_rules_amount_non_negative",
        ),
        CheckConstraint(
            "percentage IS NULL OR percentage >= 0",
            name="chk_salary_rules_percentage_non_negative",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    sequence: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    calculation_type: Mapped[str] = mapped_column(String(30), nullable=False)
    amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    percentage: Mapped[Optional[Decimal]] = mapped_column(Numeric(7, 4), nullable=True)
    formula: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    structure_rules: Mapped[List[SalaryStructureRule]] = relationship(
        "SalaryStructureRule", back_populates="salary_rule"
    )
    payslip_lines: Mapped[List[PayslipLine]] = relationship(
        "PayslipLine", back_populates="salary_rule"
    )
