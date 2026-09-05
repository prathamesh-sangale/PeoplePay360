from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional, List
from sqlalchemy import (
    String,
    Text,
    Boolean,
    BigInteger,
    DateTime,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.contract import Contract
    from app.models.salary_structure_rule import SalaryStructureRule
    from app.models.payrun import Payrun
    from app.models.payslip import Payslip


class SalaryStructure(Base):
    __tablename__ = "salary_structures"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    contracts: Mapped[List[Contract]] = relationship(
        "Contract", back_populates="salary_structure"
    )
    structure_rules: Mapped[List[SalaryStructureRule]] = relationship(
        "SalaryStructureRule", back_populates="salary_structure", cascade="all, delete-orphan"
    )
    payruns: Mapped[List[Payrun]] = relationship(
        "Payrun", back_populates="salary_structure"
    )
    payslips: Mapped[List[Payslip]] = relationship(
        "Payslip", back_populates="salary_structure"
    )
