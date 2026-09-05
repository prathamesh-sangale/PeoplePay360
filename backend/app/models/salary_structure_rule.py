from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import (
    Boolean,
    Integer,
    BigInteger,
    DateTime,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.salary_structure import SalaryStructure
    from app.models.salary_rule import SalaryRule


class SalaryStructureRule(Base):
    __tablename__ = "salary_structure_rules"
    __table_args__ = (
        CheckConstraint(
            "sequence >= 0",
            name="chk_salary_structure_rules_sequence_non_negative",
        ),
        UniqueConstraint(
            "salary_structure_id",
            "salary_rule_id",
            name="uq_salary_structure_rule",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    salary_structure_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("salary_structures.id", ondelete="CASCADE"),
        nullable=False,
    )
    salary_rule_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("salary_rules.id", ondelete="RESTRICT"),
        nullable=False,
    )
    sequence: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    salary_structure: Mapped[SalaryStructure] = relationship(
        "SalaryStructure", back_populates="structure_rules"
    )
    salary_rule: Mapped[SalaryRule] = relationship(
        "SalaryRule", back_populates="structure_rules"
    )
