from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.database import get_db
from app.models.payrun import Payrun
from app.models.payrun_employee import PayrunEmployee
from app.models.payslip import Payslip
from app.models.payslip_line import PayslipLine
from app.models.salary_structure import SalaryStructure
from app.models.salary_rule import SalaryRule
from app.models.salary_structure_rule import SalaryStructureRule
from app.models.employee import Employee
from app.models.department import Department
from app.models.job import Job
from app.models.contract import Contract
from app.models.employee_bank_account import EmployeeBankAccount
from app.payroll.payroll_engine import get_payrun_attendance_and_lop_reconciliation, compute_payrun_batch
from app.auth.rbac import get_current_user, normalize_role_name, require_role
from app.models.user import User
from typing import Optional, List
from datetime import date, datetime, timezone
from pydantic import BaseModel

router = APIRouter()

class CreatePayrunPayload(BaseModel):
    name: str
    salary_structure_id: Optional[int] = 1
    period_start: date
    period_end: date
    notes: Optional[str] = None
    auto_compute: Optional[bool] = True


CITY_MAP = {
    "ENG": "Bengaluru, Karnataka",
    "PROD": "Bengaluru, Karnataka",
    "FIN": "Mumbai, Maharashtra",
    "HR": "Bengaluru, Karnataka",
    "SALES": "Delhi NCR (Gurugram)",
    "OPS": "Hyderabad, Telangana",
}

@router.get("/payruns")
def list_payruns(db: Session = Depends(get_db)):
    payruns = db.query(Payrun).order_by(desc(Payrun.period_start)).all()
    results = []
    for p in payruns:
        totals = db.query(
            func.sum(Payslip.gross_amount).label("gross"),
            func.sum(Payslip.net_amount).label("net"),
            func.sum(Payslip.deduction_amount).label("deduction"),
            func.count(Payslip.id).label("slips_count")
        ).filter(Payslip.payrun_id == p.id).first()

        results.append({
            "id": str(p.id),
            "name": p.name,
            "batch_name": p.name,
            "date_start": p.period_start.isoformat(),
            "date_end": p.period_end.isoformat(),
            "period": f"{p.period_start.strftime('%b %d, %Y')} - {p.period_end.strftime('%b %d, %Y')}",
            "state": p.status,
            "status": p.status,
            "total_gross": float(totals.gross or 0) if totals else 0.0,
            "total_net": float(totals.net or 0) if totals else 0.0,
            "total_deduction": float(totals.deduction or 0) if totals else 0.0,
            "currency": "INR",
            "payslips_count": int(totals.slips_count or 0) if totals else 0,
        })
    return results

@router.get("/payruns/{id}")
def get_payrun_detail(id: int, db: Session = Depends(get_db)):
    p = db.query(Payrun).filter(Payrun.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payrun not found")

    payslips = db.query(Payslip).filter(Payslip.payrun_id == p.id).all()
    slips_list = []
    for ps in payslips:
        emp = db.query(Employee).filter(Employee.id == ps.employee_id).first()
        dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp and emp.department_id else None
        slips_list.append({
            "id": str(ps.id),
            "payslip_number": f"PSL-2026-{ps.id:04d}",
            "employee_id": str(emp.id) if emp else None,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "employee_code": emp.employee_code if emp else "",
            "department": dept.name if dept else "N/A",
            "basic_wage": float(ps.basic_amount or 0),
            "gross_wage": float(ps.gross_amount or 0),
            "net_wage": float(ps.net_amount or 0),
            "total_deductions": float(ps.deduction_amount or 0),
            "state": ps.status,
            "status": ps.status,
        })

    totals = db.query(
        func.sum(Payslip.gross_amount).label("gross"),
        func.sum(Payslip.net_amount).label("net"),
        func.sum(Payslip.deduction_amount).label("deduction"),
    ).filter(Payslip.payrun_id == p.id).first()

    return {
        "id": str(p.id),
        "name": p.name,
        "batch_name": p.name,
        "date_start": p.period_start.isoformat(),
        "date_end": p.period_end.isoformat(),
        "state": p.status,
        "status": p.status,
        "total_gross": float(totals.gross or 0) if totals else 0.0,
        "total_net": float(totals.net or 0) if totals else 0.0,
        "total_deduction": float(totals.deduction or 0) if totals else 0.0,
        "currency": "INR",
        "payslips": slips_list,
    }

@router.post("/payruns", dependencies=[Depends(require_role("PAYROLL", "ADMIN"))])
def create_payrun(
    payload: CreatePayrunPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.period_end < payload.period_start:
        raise HTTPException(status_code=400, detail="Period end date cannot precede period start date.")

    payrun = Payrun(
        name=payload.name.strip(),
        salary_structure_id=payload.salary_structure_id or 1,
        period_start=payload.period_start,
        period_end=payload.period_end,
        notes=payload.notes,
        status="DRAFT",
        created_by_user_id=current_user.id,
    )
    db.add(payrun)
    db.commit()
    db.refresh(payrun)

    if payload.auto_compute:
        compute_result = compute_payrun_batch(db, payrun.id, current_user.id)
        return {
            "status": "success",
            "message": f"Payrun '{payrun.name}' created and batch computed successfully.",
            "payrun_id": str(payrun.id),
            "id": str(payrun.id),
            "compute_summary": compute_result,
        }

    return {
        "status": "success",
        "message": f"Payrun '{payrun.name}' created in DRAFT status.",
        "payrun_id": str(payrun.id),
        "id": str(payrun.id),
    }

@router.post("/payruns/{id}/compute", dependencies=[Depends(require_role("PAYROLL", "ADMIN"))])
def compute_payrun_endpoint(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        result = compute_payrun_batch(db, id, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to compute payrun: {str(e)}")

@router.post("/payruns/{id}/validate", dependencies=[Depends(require_role("PAYROLL", "ADMIN"))])
def validate_payrun_endpoint(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payrun = db.query(Payrun).filter(Payrun.id == id).first()
    if not payrun:
        raise HTTPException(status_code=404, detail="Payrun not found")

    # If in DRAFT, compute first
    if payrun.status == "DRAFT":
        compute_payrun_batch(db, payrun.id, current_user.id)
        db.refresh(payrun)

    payrun.status = "VALIDATED"
    payrun.validated_at = datetime.now(timezone.utc)
    
    # Update child payslips to APPROVED
    db.query(Payslip).filter(Payslip.payrun_id == payrun.id).update({"status": "APPROVED"})
    db.commit()
    db.refresh(payrun)

    return {
        "status": "success",
        "message": f"Payrun '{payrun.name}' has been validated and approved for disbursement.",
        "payrun_id": str(payrun.id),
        "payrun_status": payrun.status,
    }

@router.post("/payruns/{id}/disburse", dependencies=[Depends(require_role("PAYROLL", "ADMIN"))])
def disburse_payrun_endpoint(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payrun = db.query(Payrun).filter(Payrun.id == id).first()
    if not payrun:
        raise HTTPException(status_code=404, detail="Payrun not found")

    payrun.status = "PAID"
    payrun.paid_at = datetime.now(timezone.utc)
    db.query(Payslip).filter(Payslip.payrun_id == payrun.id).update({"status": "PAID"})
    db.commit()
    db.refresh(payrun)

    return {
        "status": "success",
        "message": f"Payrun '{payrun.name}' has been marked as disbursed / PAID.",
        "payrun_id": str(payrun.id),
        "payrun_status": payrun.status,
    }

@router.post("/payruns/quick-batch", dependencies=[Depends(require_role("PAYROLL", "ADMIN"))])
def quick_batch_compute_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Find draft or open payruns
    draft_payrun = db.query(Payrun).filter(Payrun.status == "DRAFT").order_by(desc(Payrun.period_start)).first()
    if draft_payrun:
        result = compute_payrun_batch(db, draft_payrun.id, current_user.id)
        return result

    # If no draft exists, check for the latest payrun and create next month
    latest = db.query(Payrun).order_by(desc(Payrun.period_end)).first()
    if latest:
        # Next month
        next_month = latest.period_end.month + 1 if latest.period_end.month < 12 else 1
        next_year = latest.period_end.year if latest.period_end.month < 12 else latest.period_end.year + 1
        start_d = date(next_year, next_month, 1)
        import calendar
        _, last_day = calendar.monthrange(next_year, next_month)
        end_d = date(next_year, next_month, last_day)
        month_name = start_d.strftime("%B %Y")
        name = f"{month_name} Regular Monthly Payrun"
    else:
        start_d = date(2026, 9, 1)
        end_d = date(2026, 9, 30)
        name = "September 2026 Regular Monthly Payrun"

    new_payrun = Payrun(
        name=name,
        salary_structure_id=1,
        period_start=start_d,
        period_end=end_d,
        notes="Automated quick batch payroll computation.",
        status="DRAFT",
        created_by_user_id=current_user.id,
    )
    db.add(new_payrun)
    db.commit()
    db.refresh(new_payrun)

    result = compute_payrun_batch(db, new_payrun.id, current_user.id)
    return result

@router.delete("/payruns/{id}", dependencies=[Depends(require_role("PAYROLL", "ADMIN"))])
def delete_payrun_endpoint(
    id: int,
    db: Session = Depends(get_db),
):
    payrun = db.query(Payrun).filter(Payrun.id == id).first()
    if not payrun:
        raise HTTPException(status_code=404, detail="Payrun not found")

    payslips = db.query(Payslip).filter(Payslip.payrun_id == payrun.id).all()
    for ps in payslips:
        db.query(PayslipLine).filter(PayslipLine.payslip_id == ps.id).delete()
        db.delete(ps)
    db.query(PayrunEmployee).filter(PayrunEmployee.payrun_id == payrun.id).delete()
    db.delete(payrun)
    db.commit()

    return {"status": "success", "message": f"Payrun #{id} deleted successfully."}


@router.get("/payslips")
def list_payslips(
    payrun_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Payslip)
    user_role = getattr(current_user, "normalized_role", "EMPLOYEE")
    if user_role == "EMPLOYEE":
        emp_record = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp_record:
            return []
        if employee_id and employee_id != emp_record.id:
            raise HTTPException(status_code=403, detail="Employees can only view their own payslips.")
        query = query.filter(Payslip.employee_id == emp_record.id)
    elif employee_id:
        query = query.filter(Payslip.employee_id == employee_id)

    if payrun_id:
        query = query.filter(Payslip.payrun_id == payrun_id)
    if status:
        query = query.filter(Payslip.status == status)

    slips = query.order_by(desc(Payslip.period_start), Payslip.id).all()
    results = []
    for ps in slips:
        emp = db.query(Employee).filter(Employee.id == ps.employee_id).first()
        dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp and emp.department_id else None
        payrun = db.query(Payrun).filter(Payrun.id == ps.payrun_id).first() if ps.payrun_id else None

        results.append({
            "id": str(ps.id),
            "payslip_number": f"PSL-2026-{ps.id:04d}",
            "employee": {
                "id": str(emp.id) if emp else None,
                "name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
                "code": emp.employee_code if emp else "",
                "department": dept.name if dept else "N/A",
                "email": emp.email if emp else "",
            },
            "payrun_name": payrun.name if payrun else "Regular Payroll",
            "period": f"{ps.period_start.strftime('%b %d')} - {ps.period_end.strftime('%b %d, %Y')}" if ps.period_start and ps.period_end else "Monthly",
            "date_from": ps.period_start.isoformat() if ps.period_start else "",
            "date_to": ps.period_end.isoformat() if ps.period_end else "",
            "basic_wage": float(ps.basic_amount or 0),
            "gross_wage": float(ps.gross_amount or 0),
            "net_wage": float(ps.net_amount or 0),
            "total_deductions": float(ps.deduction_amount or 0),
            "state": ps.status,
            "status": ps.status,
            "currency": "INR",
        })
    return results

@router.get("/payslips/{id}")
def get_payslip_detail(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ps = None
    if id.isdigit():
        ps = db.query(Payslip).filter(Payslip.id == int(id)).first()
    if not ps:
        raise HTTPException(status_code=404, detail="Payslip not found")

    user_role = getattr(current_user, "normalized_role", "EMPLOYEE")
    if user_role == "EMPLOYEE":
        emp_record = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp_record or ps.employee_id != emp_record.id:
            raise HTTPException(status_code=403, detail="Employees can only view their own payslips.")

    emp = db.query(Employee).filter(Employee.id == ps.employee_id).first()
    dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp and emp.department_id else None
    job = db.query(Job).filter(Job.id == emp.job_id).first() if emp and emp.job_id else None
    contract = db.query(Contract).filter(Contract.id == ps.contract_id).first() if ps.contract_id else None
    payrun = db.query(Payrun).filter(Payrun.id == ps.payrun_id).first() if ps.payrun_id else None
    bank = db.query(EmployeeBankAccount).filter(EmployeeBankAccount.employee_id == emp.id, EmployeeBankAccount.is_primary == True).first() if emp else None

    dept_code = dept.code if dept else "ENG"
    work_city = CITY_MAP.get(dept_code, "Bengaluru, Karnataka")

    # Dynamic attendance & leave reconciliation
    period_start = ps.period_start or date(2026, 8, 1)
    period_end = ps.period_end or date(2026, 8, 31)
    recon = get_payrun_attendance_and_lop_reconciliation(
        db,
        emp.id if emp else 1,
        period_start,
        period_end,
    )

    # Line items
    lines = db.query(PayslipLine).filter(PayslipLine.payslip_id == ps.id).order_by(PayslipLine.sequence).all()
    earnings = []
    deductions = []
    totals = []
    has_lop_line = False

    for l in lines:
        item = {
            "id": str(l.id),
            "rule_code": l.code,
            "rule_name": l.name,
            "category": l.category,
            "amount": float(l.amount),
        }
        if l.code in ["LOP", "LOSS_OF_PAY"]:
            has_lop_line = True
        if l.category in ["BASIC", "ALW", "EARNINGS", "ALLOWANCE"]:
            earnings.append(item)
        elif l.category in ["DED", "DEDUCTION", "STATUTORY"]:
            deductions.append(item)
        else:
            totals.append(item)

    # If LOP days exist and no explicit LOP line exists, append dynamic LOP deduction
    lop_amount = 0.0
    if recon["lop_days"] > 0:
        basic_val = float(ps.basic_amount or 0)
        work_days_count = max(1.0, float(recon["working_days"]))
        lop_amount = round((basic_val / work_days_count) * float(recon["lop_days"]), 2)
        if not has_lop_line:
            deductions.append({
                "id": "lop-auto-calc",
                "rule_code": "LOP",
                "rule_name": f"Loss of Pay ({recon['lop_days']} days LOP)",
                "category": "DEDUCTION",
                "amount": lop_amount,
            })

    total_ded = float(ps.deduction_amount or 0) + (lop_amount if not has_lop_line else 0.0)
    net_val = float(ps.gross_amount or 0) - total_ded

    return {
        "id": str(ps.id),
        "payslip_number": f"PSL-2026-{ps.id:04d}",
        "period": f"{ps.period_start.strftime('%B %d, %Y')} to {ps.period_end.strftime('%B %d, %Y')}" if ps.period_start and ps.period_end else "August 2026",
        "date_start": ps.period_start.isoformat() if ps.period_start else "2026-08-01",
        "date_end": ps.period_end.isoformat() if ps.period_end else "2026-08-31",
        "date_from": ps.period_start.isoformat() if ps.period_start else "2026-08-01",
        "date_to": ps.period_end.isoformat() if ps.period_end else "2026-08-31",
        "basic_wage": float(ps.basic_amount or 0),
        "gross_wage": float(ps.gross_amount or 0),
        "net_wage": round(net_val, 2),
        "total_deductions": round(total_ded, 2),
        "state": ps.status,
        "status": ps.status,
        "currency": "INR",
        "employee": {
            "id": str(emp.id) if emp else "1",
            "name": f"{emp.first_name} {emp.last_name}" if emp else "Employee",
            "code": emp.employee_code if emp else "EMP-IND-001",
            "email": emp.email if emp else "employee@peoplepay360.internal",
            "designation": job.name if job else "Designation",
            "department": dept.name if dept else "Engineering",
            "location": work_city,
            "pan": f"ABCDE{emp.id:04d}F" if emp else "ABCDE1234F",
            "uan": f"100987654{emp.id:03d}" if emp else "100987654321",
            "pf_number": f"KN/BNG/0089123/000/{emp.id:03d}" if emp else "KN/BNG/0089123/000/001",
            "bank_name": bank.bank_name if bank else "HDFC Bank",
            "bank_account": bank.account_number if bank else "501004892182",
            "ifsc": bank.ifsc_code if bank else "HDFC0001234",
            "working_days": recon["working_days"],
            "worked_days": recon["worked_days"],
            "paid_leave_days": recon["paid_leave_days"],
            "lop_days": recon["lop_days"],
            "lop_deduction": lop_amount,
        },
        "attendance_reconciliation": {
            "working_days": recon["working_days"],
            "worked_days": recon["worked_days"],
            "paid_leave_days": recon["paid_leave_days"],
            "lop_days": recon["lop_days"],
            "lop_deduction": lop_amount,
        },
        "payrun": {
            "id": str(payrun.id) if payrun else None,
            "name": payrun.name if payrun else "Monthly Payrun",
        },
        "contract_ref": contract.contract_number if contract else "CNT-2026-001",
        "earnings": earnings,
        "deductions": deductions,
        "totals": totals,
        "all_lines": [
            {
                "id": str(l.id),
                "rule_code": l.code,
                "rule_name": l.name,
                "category": l.category,
                "amount": float(l.amount),
                "sequence": l.sequence,
            }
            for l in lines
        ],
    }

def serialize_salary_structure(s: SalaryStructure, db: Session):
    rule_mappings = (
        db.query(SalaryStructureRule)
        .filter(SalaryStructureRule.salary_structure_id == s.id)
        .order_by(SalaryStructureRule.sequence)
        .all()
    )
    rules = []
    rule_ids = []
    for rm in rule_mappings:
        r = db.query(SalaryRule).filter(SalaryRule.id == rm.salary_rule_id).first()
        if r:
            rule_ids.append(r.id)
            rules.append({
                "id": str(r.id),
                "code": r.code,
                "name": r.name,
                "category": r.category,
                "calculation_type": r.calculation_type if hasattr(r, 'calculation_type') and r.calculation_type else "PERCENTAGE",
                "percentage": float(r.percentage) if hasattr(r, 'percentage') and r.percentage is not None else None,
                "amount": float(r.amount) if hasattr(r, 'amount') and r.amount is not None else None,
                "formula": r.formula if hasattr(r, 'formula') else None,
                "sequence": rm.sequence,
                "is_active": r.is_active if hasattr(r, 'is_active') else True,
            })
    return {
        "id": str(s.id),
        "name": s.name,
        "code": s.code,
        "description": s.description if hasattr(s, "description") and s.description else "",
        "is_active": s.is_active if hasattr(s, "is_active") else True,
        "rules": rules,
        "rule_ids": rule_ids,
        "rules_count": len(rules),
    }

def serialize_salary_rule(r: SalaryRule):
    return {
        "id": str(r.id),
        "name": r.name,
        "code": r.code,
        "category": r.category,
        "sequence": r.sequence,
        "calculation_type": r.calculation_type if hasattr(r, 'calculation_type') and r.calculation_type else "PERCENTAGE",
        "amount": float(r.amount) if hasattr(r, 'amount') and r.amount is not None else None,
        "percentage": float(r.percentage) if hasattr(r, 'percentage') and r.percentage is not None else None,
        "formula": r.formula if hasattr(r, 'formula') else None,
        "description": r.description if hasattr(r, 'description') else None,
        "is_active": r.is_active if hasattr(r, 'is_active') else True,
    }

class SalaryRuleCreate(BaseModel):
    name: str
    code: str
    category: str
    sequence: Optional[int] = 100
    calculation_type: Optional[str] = "PERCENTAGE"
    amount: Optional[float] = None
    percentage: Optional[float] = None
    formula: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = True

class SalaryRuleUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    category: Optional[str] = None
    sequence: Optional[int] = None
    calculation_type: Optional[str] = None
    amount: Optional[float] = None
    percentage: Optional[float] = None
    formula: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class SalaryStructureCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    is_active: Optional[bool] = True
    rule_ids: Optional[List[int]] = []

class SalaryStructureUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    rule_ids: Optional[List[int]] = None

@router.get("/salary-structures")
def list_salary_structures(db: Session = Depends(get_db)):
    structs = db.query(SalaryStructure).order_by(SalaryStructure.id).all()
    return [serialize_salary_structure(s, db) for s in structs]

@router.get("/salary-structures/{structure_id}")
def get_salary_structure(structure_id: int, db: Session = Depends(get_db)):
    struct = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
    if not struct:
        raise HTTPException(status_code=404, detail="Salary structure not found")
    return serialize_salary_structure(struct, db)

@router.post("/salary-structures")
def create_salary_structure(
    payload: SalaryStructureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("PAYROLL", "ADMIN")),
):
    existing = db.query(SalaryStructure).filter(
        (SalaryStructure.code == payload.code.strip()) | (SalaryStructure.name == payload.name.strip())
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Salary structure with name '{payload.name}' or code '{payload.code}' already exists.")
    
    struct = SalaryStructure(
        name=payload.name.strip(),
        code=payload.code.strip(),
        description=payload.description.strip() if payload.description else None,
        is_active=payload.is_active if payload.is_active is not None else True,
    )
    db.add(struct)
    db.flush()

    if payload.rule_ids:
        for idx, r_id in enumerate(payload.rule_ids):
            r_obj = db.query(SalaryRule).filter(SalaryRule.id == r_id).first()
            if r_obj:
                db.add(SalaryStructureRule(
                    salary_structure_id=struct.id,
                    salary_rule_id=r_obj.id,
                    sequence=(idx + 1) * 10,
                    is_active=True,
                ))

    db.commit()
    db.refresh(struct)
    return serialize_salary_structure(struct, db)

@router.put("/salary-structures/{structure_id}")
def update_salary_structure(
    structure_id: int,
    payload: SalaryStructureUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("PAYROLL", "ADMIN")),
):
    struct = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
    if not struct:
        raise HTTPException(status_code=404, detail="Salary structure not found")
    
    if payload.name is not None:
        struct.name = payload.name.strip()
    if payload.code is not None:
        clean_code = payload.code.strip()
        existing = db.query(SalaryStructure).filter(SalaryStructure.code == clean_code, SalaryStructure.id != structure_id).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Salary structure code '{clean_code}' already exists.")
        struct.code = clean_code
    if payload.description is not None:
        struct.description = payload.description.strip() if payload.description else None
    if payload.is_active is not None:
        struct.is_active = payload.is_active

    if payload.rule_ids is not None:
        db.query(SalaryStructureRule).filter(SalaryStructureRule.salary_structure_id == structure_id).delete()
        for idx, r_id in enumerate(payload.rule_ids):
            r_obj = db.query(SalaryRule).filter(SalaryRule.id == r_id).first()
            if r_obj:
                db.add(SalaryStructureRule(
                    salary_structure_id=struct.id,
                    salary_rule_id=r_obj.id,
                    sequence=(idx + 1) * 10,
                    is_active=True,
                ))

    db.commit()
    db.refresh(struct)
    return serialize_salary_structure(struct, db)

@router.delete("/salary-structures/{structure_id}")
def delete_salary_structure(
    structure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("PAYROLL", "ADMIN")),
):
    struct = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
    if not struct:
        raise HTTPException(status_code=404, detail="Salary structure not found")
    
    contract_count = db.query(Contract).filter(Contract.salary_structure_id == structure_id).count()
    if contract_count > 0:
        struct.is_active = False
        db.commit()
        return {"success": True, "message": f"Salary structure '{struct.name}' deactivated (has {contract_count} active contracts)."}
    
    db.delete(struct)
    db.commit()
    return {"success": True, "message": f"Salary structure '{struct.name}' deleted."}

@router.get("/salary-rules")
def list_salary_rules(db: Session = Depends(get_db)):
    rules = db.query(SalaryRule).order_by(SalaryRule.sequence).all()
    return [serialize_salary_rule(r) for r in rules]

@router.get("/salary-rules/{rule_id}")
def get_salary_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(SalaryRule).filter(SalaryRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Salary rule not found")
    return serialize_salary_rule(rule)

@router.post("/salary-rules")
def create_salary_rule(
    payload: SalaryRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("PAYROLL", "ADMIN")),
):
    clean_code = payload.code.strip().upper()
    existing = db.query(SalaryRule).filter(SalaryRule.code == clean_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Salary rule with code '{clean_code}' already exists.")
    
    rule = SalaryRule(
        name=payload.name.strip(),
        code=clean_code,
        category=payload.category.strip().upper(),
        sequence=payload.sequence if payload.sequence is not None else 100,
        calculation_type=payload.calculation_type.strip().upper() if payload.calculation_type else "PERCENTAGE",
        amount=payload.amount,
        percentage=payload.percentage,
        formula=payload.formula.strip() if payload.formula else None,
        description=payload.description.strip() if payload.description else None,
        is_active=payload.is_active if payload.is_active is not None else True,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return serialize_salary_rule(rule)

@router.put("/salary-rules/{rule_id}")
def update_salary_rule(
    rule_id: int,
    payload: SalaryRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("PAYROLL", "ADMIN")),
):
    rule = db.query(SalaryRule).filter(SalaryRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Salary rule not found")
    
    if payload.name is not None:
        rule.name = payload.name.strip()
    if payload.code is not None:
        clean_code = payload.code.strip().upper()
        existing = db.query(SalaryRule).filter(SalaryRule.code == clean_code, SalaryRule.id != rule_id).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Salary rule code '{clean_code}' is already used by another rule.")
        rule.code = clean_code
    if payload.category is not None:
        rule.category = payload.category.strip().upper()
    if payload.sequence is not None:
        rule.sequence = payload.sequence
    if payload.calculation_type is not None:
        rule.calculation_type = payload.calculation_type.strip().upper()
    if payload.amount is not None:
        rule.amount = payload.amount
    if payload.percentage is not None:
        rule.percentage = payload.percentage
    if payload.formula is not None:
        rule.formula = payload.formula.strip() if payload.formula else None
    if payload.description is not None:
        rule.description = payload.description.strip() if payload.description else None
    if payload.is_active is not None:
        rule.is_active = payload.is_active

    db.commit()
    db.refresh(rule)
    return serialize_salary_rule(rule)

@router.delete("/salary-rules/{rule_id}")
def delete_salary_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("PAYROLL", "ADMIN")),
):
    rule = db.query(SalaryRule).filter(SalaryRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Salary rule not found")
    
    usage = db.query(SalaryStructureRule).filter(SalaryStructureRule.salary_rule_id == rule_id).count()
    if usage > 0:
        rule.is_active = False
        db.commit()
        return {"success": True, "message": f"Salary rule '{rule.name}' deactivated (used in {usage} salary structures)."}
    
    db.delete(rule)
    db.commit()
    return {"success": True, "message": f"Salary rule '{rule.name}' deleted."}

