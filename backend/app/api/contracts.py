from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.contract import Contract
from app.models.employee import Employee
from app.models.department import Department
from app.models.salary_structure import SalaryStructure
from app.models.working_schedule import WorkingSchedule
from typing import Optional

router = APIRouter()

@router.get("")
def list_contracts(
    status: Optional[str] = None,
    department_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Contract)
    if status:
        query = query.filter(Contract.status == status)

    contracts = query.order_by(desc(Contract.start_date)).all()
    results = []
    for c in contracts:
        emp = db.query(Employee).filter(Employee.id == c.employee_id).first()
        dept = db.query(Department).filter(Department.id == c.department_id).first() if c.department_id else (
            db.query(Department).filter(Department.id == emp.department_id).first() if emp and emp.department_id else None
        )
        struct = db.query(SalaryStructure).filter(SalaryStructure.id == c.salary_structure_id).first() if c.salary_structure_id else None
        sched = db.query(WorkingSchedule).filter(WorkingSchedule.id == c.working_schedule_id).first() if c.working_schedule_id else None

        if department_id and (not dept or str(dept.id) != department_id):
            continue

        results.append({
            "id": str(c.id),
            "contract_name": f"{emp.first_name} {emp.last_name} - Contract" if emp else c.contract_number,
            "contract_reference": c.contract_number,
            "contract_number": c.contract_number,
            "employee": {
                "id": str(emp.id) if emp else None,
                "name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
                "code": emp.employee_code if emp else "",
                "department": dept.name if dept else "Engineering",
            },
            "wage": float(c.wage) if c.wage else 0.0,
            "currency": "INR",
            "status": c.status,
            "state": c.status,
            "start_date": c.start_date.isoformat() if c.start_date else None,
            "end_date": c.end_date.isoformat() if c.end_date else None,
            "date_start": c.start_date.isoformat() if c.start_date else None,
            "date_end": c.end_date.isoformat() if c.end_date else None,
            "salary_structure": struct.name if struct else "Indian Standard Salary Structure",
            "working_schedule": sched.name if sched else "Standard Tech Shift",
            "hours_per_week": float(sched.weekly_hours) if sched else 40.0,
        })
    return results

@router.get("/{id}")
def get_contract_detail(id: str, db: Session = Depends(get_db)):
    c = None
    if id.isdigit():
        c = db.query(Contract).filter(Contract.id == int(id)).first()
    if not c:
        c = db.query(Contract).filter(Contract.contract_number == id).first()
    if not c:
        c = db.query(Contract).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contract not found")

    emp = db.query(Employee).filter(Employee.id == c.employee_id).first()
    dept = db.query(Department).filter(Department.id == c.department_id).first() if c.department_id else (
        db.query(Department).filter(Department.id == emp.department_id).first() if emp and emp.department_id else None
    )
    struct = db.query(SalaryStructure).filter(SalaryStructure.id == c.salary_structure_id).first() if c.salary_structure_id else None
    sched = db.query(WorkingSchedule).filter(WorkingSchedule.id == c.working_schedule_id).first() if c.working_schedule_id else None

    return {
        "id": str(c.id),
        "contract_number": c.contract_number,
        "contract_name": f"{emp.first_name} {emp.last_name} - Contract" if emp else c.contract_number,
        "contract_reference": c.contract_number,
        "wage": float(c.wage) if c.wage else 0.0,
        "currency": "INR",
        "status": c.status,
        "state": c.status,
        "start_date": c.start_date.isoformat() if c.start_date else None,
        "end_date": c.end_date.isoformat() if c.end_date else None,
        "date_start": c.start_date.isoformat() if c.start_date else None,
        "date_end": c.end_date.isoformat() if c.end_date else None,
        "employee": {
            "id": str(emp.id) if emp else None,
            "name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "code": emp.employee_code if emp else "",
            "email": emp.email if emp else "",
            "department": dept.name if dept else "Engineering",
        },
        "salary_structure": struct.name if struct else "Indian Standard Salary Structure",
        "working_schedule": sched.name if sched else "Standard Tech Shift",
        "hours_per_week": float(sched.weekly_hours) if sched else 40.0,
    }
