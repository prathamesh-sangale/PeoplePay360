from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional, List
from sqlalchemy import (
    String,
    Text,
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
    from app.models.employee import Employee
    from app.models.department import Department
    from app.models.job import Job
    from app.models.working_schedule import WorkingSchedule
    from app.models.salary_structure import SalaryStructure
    from app.models.payslip import Payslip


class Contract(Base):
    __tablename__ = "contracts"
    __table_args__ = (
        CheckConstraint("wage >= 0", name="chk_contracts_wage_non_negative"),
        CheckConstraint(
            "end_date IS NULL OR end_date >= start_date",
            name="chk_contracts_end_date_after_start",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("employees.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    department_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("departments.id", ondelete="RESTRICT"),
        nullable=False,
    )
    job_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("jobs.id", ondelete="RESTRICT"),
        nullable=False,
    )
    working_schedule_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("working_schedules.id", ondelete="RESTRICT"),
        nullable=True,
    )
    salary_structure_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("salary_structures.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    contract_number: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    wage: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), default="DRAFT", nullable=False, index=True
    )
    employment_terms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    employee: Mapped[Employee] = relationship("Employee", back_populates="contracts")
    department: Mapped[Department] = relationship(
        "Department", back_populates="contracts"
    )
    job: Mapped[Job] = relationship("Job", back_populates="contracts")
    working_schedule: Mapped[Optional[WorkingSchedule]] = relationship(
        "WorkingSchedule", back_populates="contracts"
    )
    salary_structure: Mapped[Optional[SalaryStructure]] = relationship(
        "SalaryStructure", back_populates="contracts"
    )
    payslips: Mapped[List[Payslip]] = relationship(
        "Payslip", back_populates="contract"
    )
