from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.employee_bank_account import EmployeeBankAccount
from app.models.employee import Employee
from app.models.department import Department
from app.auth.rbac import require_role
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()


class BankAccountCreate(BaseModel):
    employee_id: int
    bank_name: str
    account_number: str
    ifsc_code: str
    branch_name: Optional[str] = None
    account_holder_name: Optional[str] = None
    account_type: str = "SAVINGS"
    is_primary: bool = True


class BankAccountUpdate(BaseModel):
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    branch_name: Optional[str] = None
    account_holder_name: Optional[str] = None
    account_type: Optional[str] = None
    is_primary: Optional[bool] = None
    is_active: Optional[bool] = None


def mask_account_number(acc_num: Optional[str]) -> str:
    """Masks all but the last 4 digits of an account number for security."""
    if not acc_num:
        return "XXXX XXXX 0000"
    clean = acc_num.replace(" ", "").replace("-", "")
    if len(clean) <= 4:
        return f"XXXX {clean}"
    last_four = clean[-4:]
    return f"XXXX XXXX {last_four}"


@router.get("")
def list_bank_accounts(
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """
    Returns employee bank accounts with masked account numbers for HR and payroll views.
    Never exposes raw unmasked numbers across generic listings.
    """
    query = db.query(EmployeeBankAccount).filter(EmployeeBankAccount.is_active == True)
    if employee_id:
        query = query.filter(EmployeeBankAccount.employee_id == employee_id)

    accounts = query.all()
    results = []
    for b in accounts:
        emp = db.query(Employee).filter(Employee.id == b.employee_id).first()
        dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp and emp.department_id else None

        results.append({
            "id": str(b.id),
            "employee_id": str(b.employee_id),
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "employee_code": emp.employee_code if emp else "",
            "department": dept.name if dept else "N/A",
            "bank_name": b.bank_name,
            "account_holder_name": b.account_holder_name or (f"{emp.first_name} {emp.last_name}" if emp else ""),
            "masked_account_number": mask_account_number(b.account_number),
            "last_four_digits": b.account_number[-4:] if b.account_number else "0000",
            "ifsc_code": b.ifsc_code,
            "branch_name": b.branch_name or "Corporate Banking Branch",
            "account_type": b.account_type,
            "is_primary": b.is_primary,
            "is_active": b.is_active,
        })
    return results


@router.post("", dependencies=[Depends(require_role("HR", "ADMIN"))])
def create_bank_account(payload: BankAccountCreate, db: Session = Depends(get_db)):
    """Adds a new bank account for an employee. Requires HR or ADMIN role."""
    emp = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    holder = payload.account_holder_name or f"{emp.first_name} {emp.last_name}"

    if payload.is_primary:
        # Unset other primary accounts for this employee
        db.query(EmployeeBankAccount).filter(
            EmployeeBankAccount.employee_id == emp.id
        ).update({"is_primary": False})

    new_acc = EmployeeBankAccount(
        employee_id=emp.id,
        bank_name=payload.bank_name.strip(),
        account_number=payload.account_number.strip(),
        ifsc_code=payload.ifsc_code.strip().upper(),
        branch_name=payload.branch_name.strip() if payload.branch_name else None,
        account_holder_name=holder,
        account_type=payload.account_type.upper(),
        is_primary=payload.is_primary,
        is_active=True,
    )
    db.add(new_acc)
    db.commit()
    db.refresh(new_acc)

    return {
        "status": "success",
        "message": f"Bank account at {new_acc.bank_name} registered successfully.",
        "id": str(new_acc.id),
        "masked_account_number": mask_account_number(new_acc.account_number),
    }


@router.put("/{id}", dependencies=[Depends(require_role("HR", "ADMIN"))])
def update_bank_account(id: int, payload: BankAccountUpdate, db: Session = Depends(get_db)):
    """Updates a bank account record. Requires HR or ADMIN role."""
    acc = db.query(EmployeeBankAccount).filter(EmployeeBankAccount.id == id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Bank account not found")

    if payload.bank_name is not None:
        acc.bank_name = payload.bank_name.strip()
    if payload.account_number is not None:
        acc.account_number = payload.account_number.strip()
    if payload.ifsc_code is not None:
        acc.ifsc_code = payload.ifsc_code.strip().upper()
    if payload.branch_name is not None:
        acc.branch_name = payload.branch_name.strip()
    if payload.account_holder_name is not None:
        acc.account_holder_name = payload.account_holder_name.strip()
    if payload.account_type is not None:
        acc.account_type = payload.account_type.upper()
    if payload.is_active is not None:
        acc.is_active = payload.is_active
    if payload.is_primary is not None and payload.is_primary:
        db.query(EmployeeBankAccount).filter(
            EmployeeBankAccount.employee_id == acc.employee_id
        ).update({"is_primary": False})
        acc.is_primary = True

    db.commit()
    db.refresh(acc)

    return {
        "status": "success",
        "message": "Bank account updated successfully.",
        "id": str(acc.id),
    }


@router.put("/{id}/set-primary", dependencies=[Depends(require_role("HR", "ADMIN"))])
def set_primary_bank_account(id: int, db: Session = Depends(get_db)):
    """Sets a specific bank account as the primary salary disbursement account."""
    acc = db.query(EmployeeBankAccount).filter(EmployeeBankAccount.id == id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Bank account not found")

    db.query(EmployeeBankAccount).filter(
        EmployeeBankAccount.employee_id == acc.employee_id
    ).update({"is_primary": False})

    acc.is_primary = True
    db.commit()

    return {
        "status": "success",
        "message": f"Bank account at {acc.bank_name} marked as Primary salary account.",
    }
