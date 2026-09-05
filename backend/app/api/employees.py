from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.database import get_db
from app.models.employee import Employee
from app.models.department import Department
from app.models.job import Job
from app.models.employee_type import EmployeeType
from app.models.contract import Contract
from app.models.employee_bank_account import EmployeeBankAccount
from app.models.attendance import Attendance
from app.models.time_off_allocation import TimeOffAllocation
from app.models.time_off_type import TimeOffType
from app.models.payslip import Payslip
from typing import Optional

router = APIRouter()

LEAVE_COLOR_MAP = {
    "CL": "#3B82F6",
    "PL": "#10B981",
    "EL": "#10B981",
    "SL": "#F59E0B",
    "ML": "#EC4899",
    "FL": "#8B5CF6",
    "WFH": "#06B6D4",
}

CITY_MAP = {
    "ENG": "Bengaluru, Karnataka",
    "PROD": "Bengaluru, Karnataka",
    "FIN": "Mumbai, Maharashtra",
    "HR": "Bengaluru, Karnataka",
    "SALES": "Delhi NCR (Gurugram)",
    "OPS": "Hyderabad, Telangana",
}

@router.get("")
def list_employees(
    search: Optional[str] = None,
    department_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Employee)

    if status:
        query = query.filter(Employee.status == status)
    if department_id:
        try:
            query = query.filter(Employee.department_id == int(department_id))
        except (ValueError, TypeError):
            pass

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Employee.first_name.ilike(search_pattern),
                Employee.last_name.ilike(search_pattern),
                Employee.email.ilike(search_pattern),
                Employee.employee_code.ilike(search_pattern),
                Employee.phone.ilike(search_pattern),
            )
        )

    employees = query.order_by(Employee.employee_code).all()
    results = []
    for emp in employees:
        dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp.department_id else None
        job = db.query(Job).filter(Job.id == emp.job_id).first() if emp.job_id else None
        emp_type = db.query(EmployeeType).filter(EmployeeType.id == emp.employee_type_id).first() if emp.employee_type_id else None
        manager = db.query(Employee).filter(Employee.id == emp.manager_id).first() if emp.manager_id else None
        active_contract = db.query(Contract).filter(Contract.employee_id == emp.id, Contract.status == "ACTIVE").first()
        primary_bank = db.query(EmployeeBankAccount).filter(EmployeeBankAccount.employee_id == emp.id, EmployeeBankAccount.is_primary == True).first()

        dept_code = dept.code if dept else "ENG"
        work_city = CITY_MAP.get(dept_code, "Bengaluru, Karnataka")

        results.append({
            "id": str(emp.id),
            "employee_code": emp.employee_code,
            "full_name": f"{emp.first_name} {emp.last_name}",
            "first_name": emp.first_name,
            "last_name": emp.last_name,
            "email": emp.email,
            "phone": emp.phone or "+91 98765 43210",
            "work_location": work_city,
            "location": work_city,
            "department": {
                "id": str(dept.id) if dept else None,
                "name": dept.name if dept else "Engineering",
                "code": dept.code if dept else "ENG",
            },
            "job": {
                "id": str(job.id) if job else None,
                "name": job.name if job else "Software Engineer",
                "code": job.code if job else "SWE",
            },
            "employee_type": {
                "id": str(emp_type.id) if emp_type else None,
                "name": emp_type.name if emp_type else "Full-Time Regular",
                "code": emp_type.code if emp_type else "FT",
            },
            "manager": {
                "id": str(manager.id) if manager else None,
                "full_name": f"{manager.first_name} {manager.last_name}" if manager else None,
            },
            "status": emp.status or "ACTIVE",
            "date_of_joining": emp.date_of_joining.isoformat() if emp.date_of_joining else "2024-01-15",
            "date_of_birth": emp.date_of_birth.isoformat() if emp.date_of_birth else "1994-05-20",
            "wage": float(active_contract.wage) if active_contract and active_contract.wage else 150000.0,
            "currency": "INR",
            "bank_account": {
                "bank_name": primary_bank.bank_name if primary_bank else "HDFC Bank",
                "ifsc_code": primary_bank.ifsc_code if primary_bank else "HDFC0001234",
                "account_number": primary_bank.account_number[-4:] if primary_bank and primary_bank.account_number else "8912",
            } if primary_bank else None,
        })

    return results

@router.get("/meta/departments")
def get_meta_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    return [{"id": str(d.id), "name": d.name, "code": d.code} for d in depts]

@router.get("/meta/jobs")
def get_meta_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).all()
    return [{"id": str(j.id), "name": j.name, "code": j.code} for j in jobs]

@router.get("/meta/types")
def get_meta_types(db: Session = Depends(get_db)):
    types = db.query(EmployeeType).all()
    return [{"id": str(t.id), "name": t.name, "code": t.code} for t in types]

@router.get("/{id}")
def get_employee_detail(id: str, db: Session = Depends(get_db)):
    # Support lookup by integer ID or employee_code string
    emp = None
    if id.isdigit():
        emp = db.query(Employee).filter(Employee.id == int(id)).first()
    if not emp:
        emp = db.query(Employee).filter(Employee.employee_code == id).first()
    if not emp:
        # Fallback first match
        emp = db.query(Employee).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp.department_id else None
    job = db.query(Job).filter(Job.id == emp.job_id).first() if emp.job_id else None
    emp_type = db.query(EmployeeType).filter(EmployeeType.id == emp.employee_type_id).first() if emp.employee_type_id else None
    manager = db.query(Employee).filter(Employee.id == emp.manager_id).first() if emp.manager_id else None

    dept_code = dept.code if dept else "ENG"
    work_city = CITY_MAP.get(dept_code, "Bengaluru, Karnataka")

    # Contracts
    contracts = db.query(Contract).filter(Contract.employee_id == emp.id).order_by(desc(Contract.start_date)).all()
    contract_list = [
        {
            "id": str(c.id),
            "contract_name": f"{emp.first_name} {emp.last_name} - Contract",
            "contract_reference": c.contract_number,
            "contract_number": c.contract_number,
            "wage": float(c.wage) if c.wage else 0.0,
            "currency": "INR",
            "status": c.status,
            "state": c.status,
            "start_date": c.start_date.isoformat() if c.start_date else None,
            "end_date": c.end_date.isoformat() if c.end_date else None,
            "date_start": c.start_date.isoformat() if c.start_date else None,
            "date_end": c.end_date.isoformat() if c.end_date else None,
        }
        for c in contracts
    ]

    # Bank accounts
    bank_accounts = db.query(EmployeeBankAccount).filter(EmployeeBankAccount.employee_id == emp.id).all()
    banks_list = [
        {
            "id": str(b.id),
            "bank_name": b.bank_name,
            "account_number": b.account_number,
            "ifsc_code": b.ifsc_code,
            "account_holder_name": b.account_holder_name,
            "is_primary": b.is_primary,
        }
        for b in bank_accounts
    ]

    # Attendance logs
    attendance_logs = db.query(Attendance).filter(Attendance.employee_id == emp.id).order_by(desc(Attendance.check_in)).limit(14).all()
    attendance_list = [
        {
            "id": str(a.id),
            "date": a.check_in.date().isoformat() if a.check_in else "",
            "check_in": a.check_in.strftime("%H:%M:%S") if a.check_in else "--:--",
            "check_out": a.check_out.strftime("%H:%M:%S") if a.check_out else "--:--",
            "worked_hours": float(a.worked_hours) if a.worked_hours else 0.0,
            "overtime_hours": 0.0,
            "status": a.status,
        }
        for a in attendance_logs
    ]

    # Leave balances / allocations
    allocations = db.query(TimeOffAllocation).filter(TimeOffAllocation.employee_id == emp.id).all()
    leaves_list = []
    for alloc in allocations:
        ttype = db.query(TimeOffType).filter(TimeOffType.id == alloc.time_off_type_id).first()
        tcode = ttype.code if ttype else "CL"
        color = LEAVE_COLOR_MAP.get(tcode, "#3B82F6")
        rem = float(alloc.allocated_amount) - float(alloc.taken_amount)
        leaves_list.append({
            "id": str(alloc.id),
            "type_name": ttype.name if ttype else "Leave",
            "type_code": tcode,
            "color_code": color,
            "year": alloc.start_date.year if alloc.start_date else 2026,
            "allocated_days": float(alloc.allocated_amount),
            "used_days": float(alloc.taken_amount),
            "remaining_days": round(rem, 1),
        })

    # Payslips
    payslips = db.query(Payslip).filter(Payslip.employee_id == emp.id).order_by(desc(Payslip.period_start)).all()
    payslips_list = [
        {
            "id": str(p.id),
            "payslip_number": f"PSL-2026-{p.id:04d}",
            "period": f"{p.period_start.strftime('%b %d')} - {p.period_end.strftime('%b %d, %Y')}" if p.period_start and p.period_end else "Monthly",
            "basic_wage": float(p.basic_amount or 0),
            "gross_wage": float(p.gross_amount or 0),
            "net_wage": float(p.net_amount or 0),
            "total_deductions": float(p.deduction_amount or 0),
            "status": p.status,
            "state": p.status,
            "currency": "INR",
        }
        for p in payslips
    ]

    return {
        "id": str(emp.id),
        "employee_code": emp.employee_code,
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "full_name": f"{emp.first_name} {emp.last_name}",
        "email": emp.email,
        "phone": emp.phone or "+91 98765 43210",
        "work_location": work_city,
        "location": work_city,
        "status": emp.status or "ACTIVE",
        "date_of_joining": emp.date_of_joining.isoformat() if emp.date_of_joining else None,
        "date_of_birth": emp.date_of_birth.isoformat() if emp.date_of_birth else None,
        "department": {"id": str(dept.id) if dept else None, "name": dept.name if dept else "Engineering", "code": dept.code if dept else "ENG"},
        "job": {"id": str(job.id) if job else None, "name": job.name if job else "Software Engineer", "code": job.code if job else "SWE"},
        "employee_type": {"id": str(emp_type.id) if emp_type else None, "name": emp_type.name if emp_type else "Full-Time Regular"},
        "manager": {"id": str(manager.id) if manager else None, "full_name": f"{manager.first_name} {manager.last_name}" if manager else None},
        "contracts": contract_list,
        "bank_accounts": banks_list,
        "attendance": attendance_list,
        "leave_allocations": leaves_list,
        "payslips": payslips_list,
    }
