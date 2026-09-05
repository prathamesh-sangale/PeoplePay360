from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.job import Job
from app.models.employee import Employee
from app.auth.rbac import require_role
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()


class JobCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    is_active: bool = True


class JobUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("")
def list_jobs(db: Session = Depends(get_db)):
    """Returns all job titles and roles with employee counts."""
    jobs = db.query(Job).all()
    results = []
    for j in jobs:
        emp_count = db.query(func.count(Employee.id)).filter(
            Employee.job_id == j.id, Employee.status == "ACTIVE"
        ).scalar() or 0
        total_emp_count = db.query(func.count(Employee.id)).filter(
            Employee.job_id == j.id
        ).scalar() or 0

        results.append({
            "id": str(j.id),
            "name": j.name,
            "code": j.code,
            "description": j.description or f"{j.name} Job Role",
            "employee_count": emp_count,
            "total_employees": total_emp_count,
            "is_active": j.is_active,
        })
    return results


@router.get("/{id}")
def get_job_detail(id: int, db: Session = Depends(get_db)):
    """Returns job detail with assigned employees."""
    j = db.query(Job).filter(Job.id == id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Job not found")

    employees = db.query(Employee).filter(Employee.job_id == j.id).all()
    emp_list = [
        {
            "id": str(e.id),
            "employee_code": e.employee_code,
            "full_name": f"{e.first_name} {e.last_name}",
            "email": e.email,
            "status": e.status,
            "date_of_joining": e.date_of_joining.isoformat() if e.date_of_joining else None,
        }
        for e in employees
    ]

    return {
        "id": str(j.id),
        "name": j.name,
        "code": j.code,
        "description": j.description,
        "is_active": j.is_active,
        "employee_count": len([e for e in employees if e.status == "ACTIVE"]),
        "total_employees": len(employees),
        "employees": emp_list,
    }


@router.post("", dependencies=[Depends(require_role("HR", "ADMIN"))])
def create_job(payload: JobCreate, db: Session = Depends(get_db)):
    """Creates a new job role. Requires HR or ADMIN role."""
    existing = db.query(Job).filter(
        (Job.name.ilike(payload.name.strip())) | (Job.code.ilike(payload.code.strip()))
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Job with name '{payload.name}' or code '{payload.code}' already exists.",
        )

    job = Job(
        name=payload.name.strip(),
        code=payload.code.strip().upper(),
        description=payload.description,
        is_active=payload.is_active,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    return {
        "status": "success",
        "message": f"Job role '{job.name}' created successfully.",
        "id": str(job.id),
    }


@router.put("/{id}", dependencies=[Depends(require_role("HR", "ADMIN"))])
def update_job(id: int, payload: JobUpdate, db: Session = Depends(get_db)):
    """Updates an existing job role. Requires HR or ADMIN role."""
    job = db.query(Job).filter(Job.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if payload.name is not None:
        job.name = payload.name.strip()
    if payload.code is not None:
        job.code = payload.code.strip().upper()
    if payload.description is not None:
        job.description = payload.description
    if payload.is_active is not None:
        job.is_active = payload.is_active

    db.commit()
    db.refresh(job)

    return {
        "status": "success",
        "message": f"Job role '{job.name}' updated successfully.",
        "id": str(job.id),
    }


@router.delete("/{id}", dependencies=[Depends(require_role("HR", "ADMIN"))])
def delete_job(id: int, db: Session = Depends(get_db)):
    """Deactivates a job role. Requires HR or ADMIN role."""
    job = db.query(Job).filter(Job.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.is_active = False
    db.commit()
    return {"status": "success", "message": f"Job role '{job.name}' deactivated."}
