from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING, Optional, List
from sqlalchemy import (
    String,
    Integer,
    Date,
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.department import Department
    from app.models.job import Job
    from app.models.employee_type import EmployeeType
    from app.models.contract import Contract
    from app.models.employee_schedule_assignment import EmployeeScheduleAssignment
    from app.models.employee_bank_account import EmployeeBankAccount
    from app.models.attendance import Attendance
    from app.models.time_off_allocation import TimeOffAllocation
    from app.models.time_off_request import TimeOffRequest
    from app.models.payrun_employee import PayrunEmployee
    from app.models.payslip import Payslip
    from app.models.payroll_warning import PayrollWarning


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        unique=True,
        nullable=True,
    )
    employee_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    date_of_joining: Mapped[date] = mapped_column(Date, nullable=False)

    department_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("departments.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    job_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("jobs.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    employee_type_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("employee_types.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    manager_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("employees.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(String(30), default="ACTIVE", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user: Mapped[Optional[User]] = relationship("User", back_populates="employee")
    department: Mapped[Department] = relationship(
        "Department", foreign_keys=[department_id], back_populates="employees"
    )
    job: Mapped[Job] = relationship("Job", back_populates="employees")
    employee_type: Mapped[EmployeeType] = relationship(
        "EmployeeType", back_populates="employees"
    )
    manager: Mapped[Optional[Employee]] = relationship(
        "Employee",
        foreign_keys=[manager_id],
        remote_side=[id],
        back_populates="direct_reports",
    )
    direct_reports: Mapped[List[Employee]] = relationship(
        "Employee", foreign_keys=[manager_id], back_populates="manager"
    )
    managed_department: Mapped[Optional[Department]] = relationship(
        "Department",
        foreign_keys="Department.manager_id",
        back_populates="manager",
        uselist=False,
    )
    contracts: Mapped[List[Contract]] = relationship(
        "Contract", back_populates="employee"
    )
    schedule_assignments: Mapped[List[EmployeeScheduleAssignment]] = relationship(
        "EmployeeScheduleAssignment", back_populates="employee"
    )
    bank_accounts: Mapped[List[EmployeeBankAccount]] = relationship(
        "EmployeeBankAccount", back_populates="employee"
    )
    attendances: Mapped[List[Attendance]] = relationship(
        "Attendance", back_populates="employee"
    )
    time_off_allocations: Mapped[List[TimeOffAllocation]] = relationship(
        "TimeOffAllocation", back_populates="employee"
    )
    time_off_requests: Mapped[List[TimeOffRequest]] = relationship(
        "TimeOffRequest", back_populates="employee"
    )
    payrun_employees: Mapped[List[PayrunEmployee]] = relationship(
        "PayrunEmployee", back_populates="employee"
    )
    payslips: Mapped[List[Payslip]] = relationship(
        "Payslip", back_populates="employee"
    )
    payroll_warnings: Mapped[List[PayrollWarning]] = relationship(
        "PayrollWarning", back_populates="employee"
    )
