from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.employee_type import EmployeeType
from app.models.employee import Employee
from app.auth.rbac import require_role
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()


class EmployeeTypeCreate(BaseModel):
    name: str
    code: str


class EmployeeTypeUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None


@router.get("")
def list_employee_types(db: Session = Depends(get_db)):
    """Returns all employee contract/employment types with live headcount."""
    types = db.query(EmployeeType).all()
    results = []
    for t in types:
        emp_count = db.query(func.count(Employee.id)).filter(
            Employee.employee_type_id == t.id, Employee.status == "ACTIVE"
        ).scalar() or 0
        total_count = db.query(func.count(Employee.id)).filter(
            Employee.employee_type_id == t.id
        ).scalar() or 0

        results.append({
            "id": str(t.id),
            "name": t.name,
            "code": t.code,
            "employee_count": emp_count,
            "total_employees": total_count,
        })
    return results


@router.post("", dependencies=[Depends(require_role("HR", "ADMIN"))])
def create_employee_type(payload: EmployeeTypeCreate, db: Session = Depends(get_db)):
    """Creates a new employee type. Requires HR or ADMIN role."""
    existing = db.query(EmployeeType).filter(
        (EmployeeType.name.ilike(payload.name.strip())) | (EmployeeType.code.ilike(payload.code.strip()))
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Employee type with name '{payload.name}' or code '{payload.code}' already exists.",
        )

    emp_type = EmployeeType(
        name=payload.name.strip(),
        code=payload.code.strip().upper(),
    )
    db.add(emp_type)
    db.commit()
    db.refresh(emp_type)

    return {
        "status": "success",
        "message": f"Employee type '{emp_type.name}' created successfully.",
        "id": str(emp_type.id),
    }


@router.put("/{id}", dependencies=[Depends(require_role("HR", "ADMIN"))])
def update_employee_type(id: int, payload: EmployeeTypeUpdate, db: Session = Depends(get_db)):
    """Updates an existing employee type. Requires HR or ADMIN role."""
    emp_type = db.query(EmployeeType).filter(EmployeeType.id == id).first()
    if not emp_type:
        raise HTTPException(status_code=404, detail="Employee type not found")

    if payload.name is not None:
        emp_type.name = payload.name.strip()
    if payload.code is not None:
        emp_type.code = payload.code.strip().upper()

    db.commit()
    db.refresh(emp_type)

    return {
        "status": "success",
        "message": f"Employee type '{emp_type.name}' updated successfully.",
        "id": str(emp_type.id),
    }
