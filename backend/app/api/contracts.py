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


from pydantic import BaseModel
from datetime import date
from app.auth.rbac import require_role


class ContractCreate(BaseModel):
    employee_id: int
    contract_number: Optional[str] = None
    wage: float
    start_date: date
    end_date: Optional[date] = None
    salary_structure_id: Optional[int] = None
    working_schedule_id: Optional[int] = None
    status: str = "ACTIVE"


class ContractUpdate(BaseModel):
    wage: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    salary_structure_id: Optional[int] = None
    working_schedule_id: Optional[int] = None
    status: Optional[str] = None


@router.post("", dependencies=[Depends(require_role("HR", "ADMIN"))])
def create_contract(payload: ContractCreate, db: Session = Depends(get_db)):
    """
    Creates a new contract for an employee without destroying historical records.
    Requires HR or ADMIN role.
    """
    emp = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    c_num = payload.contract_number
    if not c_num:
        count = db.query(Contract).filter(Contract.employee_id == emp.id).count()
        c_num = f"CON-{emp.employee_code}-{(count + 1):02d}"

    struct_id = payload.salary_structure_id
    if not struct_id:
        first_struct = db.query(SalaryStructure).first()
        struct_id = first_struct.id if first_struct else 1

    sched_id = payload.working_schedule_id
    if not sched_id:
        first_sched = db.query(WorkingSchedule).first()
        sched_id = first_sched.id if first_sched else 1

    if payload.status.upper() == "ACTIVE":
        # Mark other active contracts as EXPIRED/SUPERSEDED to maintain clear single active contract
        db.query(Contract).filter(
            Contract.employee_id == emp.id,
            Contract.status == "ACTIVE"
        ).update({"status": "EXPIRED"})

    new_contract = Contract(
        employee_id=emp.id,
        department_id=emp.department_id,
        job_id=emp.job_id,
        salary_structure_id=struct_id,
        working_schedule_id=sched_id,
        contract_number=c_num,
        wage=payload.wage,
        start_date=payload.start_date,
        end_date=payload.end_date,
        status=payload.status.upper(),
    )
    db.add(new_contract)
    db.commit()
    db.refresh(new_contract)

    return {
        "status": "success",
        "message": f"Contract '{new_contract.contract_number}' registered successfully.",
        "id": str(new_contract.id),
        "contract_number": new_contract.contract_number,
    }


@router.put("/{id}", dependencies=[Depends(require_role("HR", "ADMIN"))])
def update_contract(id: int, payload: ContractUpdate, db: Session = Depends(get_db)):
    """Updates contract terms. Requires HR or ADMIN role."""
    c = db.query(Contract).filter(Contract.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contract not found")

    if payload.wage is not None:
        c.wage = payload.wage
    if payload.start_date is not None:
        c.start_date = payload.start_date
    if payload.end_date is not None:
        c.end_date = payload.end_date
    if payload.salary_structure_id is not None:
        c.salary_structure_id = payload.salary_structure_id
    if payload.working_schedule_id is not None:
        c.working_schedule_id = payload.working_schedule_id
    if payload.status is not None:
        c.status = payload.status.upper()

    db.commit()
    db.refresh(c)

    return {
        "status": "success",
        "message": f"Contract '{c.contract_number}' updated successfully.",
        "id": str(c.id),
    }

