from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional, List
from sqlalchemy import String, Text, Boolean, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.employee import Employee
    from app.models.contract import Contract


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    manager_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey(
            "employees.id",
            use_alter=True,
            name="fk_departments_manager_id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    manager: Mapped[Optional[Employee]] = relationship(
        "Employee", foreign_keys=[manager_id], back_populates="managed_department"
    )
    employees: Mapped[List[Employee]] = relationship(
        "Employee", foreign_keys="Employee.department_id", back_populates="department"
    )
    contracts: Mapped[List[Contract]] = relationship("Contract", back_populates="department")
