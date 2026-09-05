from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.department import Department
from app.models.employee import Employee
from app.auth.rbac import require_role
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()


class DepartmentCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    manager_id: Optional[int] = None
    is_active: bool = True


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    manager_id: Optional[int] = None
    is_active: Optional[bool] = None


@router.get("")
def list_departments(db: Session = Depends(get_db)):
    """Returns all departments with live employee counts, manager info, and active status."""
    depts = db.query(Department).all()
    results = []
    for d in depts:
        emp_count = db.query(func.count(Employee.id)).filter(
            Employee.department_id == d.id, Employee.status == "ACTIVE"
        ).scalar() or 0
        total_emp_count = db.query(func.count(Employee.id)).filter(
            Employee.department_id == d.id
        ).scalar() or 0
        mgr = db.query(Employee).filter(Employee.id == d.manager_id).first() if d.manager_id else None

        results.append({
            "id": str(d.id),
            "name": d.name,
            "code": d.code,
            "description": d.description or f"{d.name} Department",
            "manager": {
                "id": str(mgr.id) if mgr else None,
                "name": f"{mgr.first_name} {mgr.last_name}" if mgr else None,
                "code": mgr.employee_code if mgr else None,
            } if mgr else None,
            "employee_count": emp_count,
            "total_employees": total_emp_count,
            "is_active": d.is_active,
        })
    return results


@router.get("/{id}")
def get_department_detail(id: int, db: Session = Depends(get_db)):
    """Returns detailed department information including assigned employees."""
    d = db.query(Department).filter(Department.id == id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Department not found")

    employees = db.query(Employee).filter(Employee.department_id == d.id).all()
    mgr = db.query(Employee).filter(Employee.id == d.manager_id).first() if d.manager_id else None

    emp_list = [
        {
            "id": str(e.id),
            "employee_code": e.employee_code,
            "full_name": f"{e.first_name} {e.last_name}",
            "email": e.email,
            "phone": e.phone,
            "status": e.status,
            "date_of_joining": e.date_of_joining.isoformat() if e.date_of_joining else None,
        }
        for e in employees
    ]

    return {
        "id": str(d.id),
        "name": d.name,
        "code": d.code,
        "description": d.description,
        "is_active": d.is_active,
        "manager": {
            "id": str(mgr.id) if mgr else None,
            "name": f"{mgr.first_name} {mgr.last_name}" if mgr else None,
        } if mgr else None,
        "employee_count": len([e for e in employees if e.status == "ACTIVE"]),
        "total_employees": len(employees),
        "employees": emp_list,
    }


@router.post("", dependencies=[Depends(require_role("HR", "ADMIN"))])
def create_department(payload: DepartmentCreate, db: Session = Depends(get_db)):
    """Creates a new department. Requires HR or ADMIN role."""
    existing = db.query(Department).filter(
        (Department.name.ilike(payload.name.strip())) | (Department.code.ilike(payload.code.strip()))
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Department with name '{payload.name}' or code '{payload.code}' already exists.",
        )

    dept = Department(
        name=payload.name.strip(),
        code=payload.code.strip().upper(),
        description=payload.description,
        manager_id=payload.manager_id,
        is_active=payload.is_active,
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)

    return {
        "status": "success",
        "message": f"Department '{dept.name}' created successfully.",
        "id": str(dept.id),
    }


@router.put("/{id}", dependencies=[Depends(require_role("HR", "ADMIN"))])
def update_department(id: int, payload: DepartmentUpdate, db: Session = Depends(get_db)):
    """Updates an existing department. Requires HR or ADMIN role."""
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    if payload.name is not None:
        dept.name = payload.name.strip()
    if payload.code is not None:
        dept.code = payload.code.strip().upper()
    if payload.description is not None:
        dept.description = payload.description
    if payload.manager_id is not None:
        dept.manager_id = payload.manager_id if payload.manager_id > 0 else None
    if payload.is_active is not None:
        dept.is_active = payload.is_active

    db.commit()
    db.refresh(dept)

    return {
        "status": "success",
        "message": f"Department '{dept.name}' updated successfully.",
        "id": str(dept.id),
    }


@router.delete("/{id}", dependencies=[Depends(require_role("HR", "ADMIN"))])
def delete_department(id: int, db: Session = Depends(get_db)):
    """Deactivates a department. Requires HR or ADMIN role."""
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    dept.is_active = False
    db.commit()
    return {"status": "success", "message": f"Department '{dept.name}' deactivated."}
