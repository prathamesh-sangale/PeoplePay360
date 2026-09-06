from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.time_off_request import TimeOffRequest
from app.models.time_off_allocation import TimeOffAllocation
from app.models.time_off_type import TimeOffType
from app.models.employee import Employee
from app.models.department import Department
from app.models.user import User
from app.models.role import Role
from app.auth.rbac import get_current_user, normalize_role_name
from app.api.notifications import create_system_notification
from app.payroll.payroll_engine import (
    get_leave_type_metadata,
    calculate_working_days_between,
    get_employee_leave_balances,
)
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import date, datetime, timezone
from decimal import Decimal

router = APIRouter()

class StatusUpdateRequest(BaseModel):
    status: str
    reason: Optional[str] = None

class LeaveDecisionRequest(BaseModel):
    reason: Optional[str] = None

class LeaveRequestCreate(BaseModel):
    employee_id: int
    time_off_type_id: int
    start_date: date
    end_date: date
    reason: Optional[str] = None

class LeaveAllocationCreate(BaseModel):
    employee_id: int
    time_off_type_id: int
    allocated_amount: float = Field(gt=0, description="Allocated leave days")
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None


@router.get("/types")
def list_time_off_types(db: Session = Depends(get_db)):
    """
    Returns all supported leave types with metadata (category, is_paid, color_code, allocation_required).
    """
    types = db.query(TimeOffType).filter(TimeOffType.is_active == True).all()
    results = []
    for t in types:
        meta = get_leave_type_metadata(t.code)
        results.append({
            "id": str(t.id),
            "name": t.name,
            "code": t.code,
            "category": meta["category"],
            "category_name": meta["category_name"],
            "is_paid": meta["is_paid"],
            "color_code": meta["color_code"],
            "allocation_required": t.allocation_required if hasattr(t, "allocation_required") else meta["allocation_required"],
            "payroll_integration": t.payroll_integration if hasattr(t, "payroll_integration") else meta["payroll_integration"],
            "unit": t.unit or "DAYS",
            "description": t.description or meta["category_name"],
        })
    return results


@router.get("/balances/{employee_id}")
def get_employee_balances(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns unified leave balances for an employee across PL, CL, SL, and UNPAID/LOP.
    Strictly isolated for EMPLOYEE role.
    """
    user_role = getattr(current_user, "normalized_role", "EMPLOYEE")
    if user_role == "EMPLOYEE":
        emp_record = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp_record or emp_record.id != employee_id:
            raise HTTPException(status_code=403, detail="Employees can only view their own leave balances.")

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    return get_employee_leave_balances(db, employee_id)


@router.get("/requests")
def list_time_off_requests(
    status: Optional[str] = None,
    employee_id: Optional[int] = None,
    category: Optional[str] = None,
    leave_type_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lists time off requests. Strictly isolates records for EMPLOYEE role to authenticated employee ID.
    """
    query = db.query(TimeOffRequest)
    user_role = getattr(current_user, "normalized_role", "EMPLOYEE")
    if user_role == "EMPLOYEE":
        emp_record = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp_record:
            return []
        if employee_id and employee_id != emp_record.id:
            raise HTTPException(status_code=403, detail="Employees can only view their own leave requests.")
        query = query.filter(TimeOffRequest.employee_id == emp_record.id)
    elif employee_id:
        query = query.filter(TimeOffRequest.employee_id == employee_id)

    if status:
        if status.upper() in ["REJECTED", "REFUSED"]:
            query = query.filter(TimeOffRequest.status.in_(["REJECTED", "REFUSED"]))
        else:
            query = query.filter(TimeOffRequest.status == status.upper())
    if leave_type_id:
        query = query.filter(TimeOffRequest.time_off_type_id == leave_type_id)

    requests = query.order_by(desc(TimeOffRequest.id)).all()
    results = []

    for r in requests:
        emp = db.query(Employee).filter(Employee.id == r.employee_id).first()
        dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp and emp.department_id else None
        ttype = db.query(TimeOffType).filter(TimeOffType.id == r.time_off_type_id).first()
        meta = get_leave_type_metadata(ttype.code if ttype else "CL")

        if category and category.upper() != "ALL" and meta["category"] != category.upper():
            continue

        results.append({
            "id": str(r.id),
            "employee": {
                "id": str(emp.id) if emp else None,
                "name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
                "code": emp.employee_code if emp else "",
                "department": dept.name if dept else "N/A",
            },
            "leave_type": {
                "id": str(ttype.id) if ttype else None,
                "name": ttype.name if ttype else "Leave",
                "code": ttype.code if ttype else "",
                "category": meta["category"],
                "category_name": meta["category_name"],
                "color_code": meta["color_code"],
                "is_paid": meta["is_paid"],
                "allocation_required": ttype.allocation_required if ttype else meta["allocation_required"],
            },
            "category": meta["category"],
            "start_date": r.start_date.isoformat() if r.start_date else None,
            "end_date": r.end_date.isoformat() if r.end_date else None,
            "date_from": r.start_date.isoformat() if r.start_date else None,
            "date_to": r.end_date.isoformat() if r.end_date else None,
            "number_of_days": float(r.requested_amount) if r.requested_amount else 1.0,
            "requested_amount": float(r.requested_amount) if r.requested_amount else 1.0,
            "duration": float(r.requested_amount) if r.requested_amount else 1.0,
            "reason": r.reason,
            "refusal_reason": r.refusal_reason,
            "status": r.status,
            "state": r.status,
            "approved_at": r.approved_at.isoformat() if r.approved_at else None,
            "refused_at": r.refused_at.isoformat() if r.refused_at else None,
        })
    return results


@router.post("/requests")
def create_time_off_request(
    payload: LeaveRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submits a new leave request.
    - Working-day aware duration calculation.
    - Validates available balance for PL/CL/SL.
    - Allows UNPAID/LOP without allocation constraint.
    - Strictly restricts EMPLOYEE role to submitting for themselves.
    - Triggers notifications to HR and Admin personas.
    """
    user_role = getattr(current_user, "normalized_role", "EMPLOYEE")
    if user_role == "EMPLOYEE":
        emp_record = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp_record or emp_record.id != payload.employee_id:
            raise HTTPException(status_code=403, detail="Employees can only submit leave requests for themselves.")

    emp = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    ttype = db.query(TimeOffType).filter(TimeOffType.id == payload.time_off_type_id).first()
    if not ttype:
        raise HTTPException(status_code=404, detail="Leave type not found")

    if payload.start_date > payload.end_date:
        raise HTTPException(status_code=400, detail="Start date must be before or equal to end date")

    # Calculate scheduled working days duration (or calendar days for Maternity Leave)
    if ttype.code == "ML":
        duration = Decimal(str((payload.end_date - payload.start_date).days + 1))
    else:
        duration = calculate_working_days_between(db, emp.id, payload.start_date, payload.end_date)

    if duration <= Decimal("0.00"):
        raise HTTPException(
            status_code=400,
            detail="The requested date range contains 0 scheduled working days (e.g. falls entirely on non-working weekend days). Please select dates that include working days."
        )

    # Check for overlapping active requests
    overlap = (
        db.query(TimeOffRequest)
        .filter(
            TimeOffRequest.employee_id == emp.id,
            TimeOffRequest.status.in_(["PENDING", "APPROVED"]),
            TimeOffRequest.start_date <= payload.end_date,
            TimeOffRequest.end_date >= payload.start_date,
        )
        .first()
    )
    if overlap:
        raise HTTPException(
            status_code=400,
            detail=f"An active leave request ({overlap.status}) already exists for the overlapping period {overlap.start_date} to {overlap.end_date}."
        )

    meta = get_leave_type_metadata(ttype.code)
    allocation = None

    # For allocation-based leaves (PL, CL, SL), check available balance
    if ttype.allocation_required or meta["allocation_required"]:
        allocation = (
            db.query(TimeOffAllocation)
            .filter(
                TimeOffAllocation.employee_id == emp.id,
                TimeOffAllocation.time_off_type_id == ttype.id,
                TimeOffAllocation.status == "APPROVED",
            )
            .first()
        )
        available = (allocation.allocated_amount - allocation.taken_amount) if allocation else Decimal("0.00")
        if available < duration:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient {ttype.name} balance. Available: {available} days, Requested: {duration} days."
            )

    new_req = TimeOffRequest(
        employee_id=emp.id,
        time_off_type_id=ttype.id,
        allocation_id=allocation.id if allocation else None,
        start_date=payload.start_date,
        end_date=payload.end_date,
        requested_amount=duration,
        reason=payload.reason or f"{ttype.name} application",
        status="PENDING",
    )
    db.add(new_req)
    db.flush()

    # Notify HR & Admin users
    all_users = db.query(User).all()
    for u in all_users:
        r = db.query(Role).filter(Role.id == u.role_id).first() if u.role_id else None
        r_name = normalize_role_name(r.name if r else "ADMIN")
        if r_name in ["ADMIN", "HR"]:
            create_system_notification(
                db,
                user_id=u.id,
                title=f"New Leave Request: {emp.first_name} {emp.last_name}",
                message=f"{emp.first_name} requested {duration} days of {ttype.name} ({payload.start_date} to {payload.end_date}).",
                notification_type="LEAVE_REQUEST_SUBMITTED",
                reference_type="time_off_request",
                reference_id=new_req.id,
            )

    db.commit()
    db.refresh(new_req)

    return {
        "status": "success",
        "message": "Leave request submitted successfully",
        "id": str(new_req.id),
        "requested_days": float(duration),
        "state": "PENDING",
    }


@router.get("/allocations")
def list_time_off_allocations(
    employee_id: Optional[int] = None,
    leave_type_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(TimeOffAllocation)
    user_role = getattr(current_user, "normalized_role", "EMPLOYEE")
    if user_role == "EMPLOYEE":
        emp_record = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp_record:
            return []
        if employee_id and employee_id != emp_record.id:
            raise HTTPException(status_code=403, detail="Employees can only view their own leave allocations.")
        query = query.filter(TimeOffAllocation.employee_id == emp_record.id)
    elif employee_id:
        query = query.filter(TimeOffAllocation.employee_id == employee_id)

    if leave_type_id:
        query = query.filter(TimeOffAllocation.time_off_type_id == leave_type_id)

    allocs = query.order_by(desc(TimeOffAllocation.id)).all()
    results = []
    for a in allocs:
        emp = db.query(Employee).filter(Employee.id == a.employee_id).first()
        ttype = db.query(TimeOffType).filter(TimeOffType.id == a.time_off_type_id).first()
        meta = get_leave_type_metadata(ttype.code if ttype else "CL")
        rem = float(a.allocated_amount) - float(a.taken_amount)

        results.append({
            "id": str(a.id),
            "employee_id": str(a.employee_id),
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "employee_code": emp.employee_code if emp else "",
            "leave_type": ttype.name if ttype else "Leave",
            "leave_code": ttype.code if ttype else "",
            "category": meta["category"],
            "color_code": meta["color_code"],
            "year": a.start_date.year if a.start_date else 2026,
            "allocated_days": float(a.allocated_amount),
            "used_days": float(a.taken_amount),
            "remaining_days": max(0.0, round(rem, 1)),
            "status": a.status,
            "notes": a.notes,
        })
    return results


@router.post("/allocations")
def create_time_off_allocation(payload: LeaveAllocationCreate, db: Session = Depends(get_db)):
    """
    Creates or updates an annual leave allocation for PL, CL, or SL.
    Disallows allocations for UNPAID/LOP.
    """
    emp = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    ttype = db.query(TimeOffType).filter(TimeOffType.id == payload.time_off_type_id).first()
    if not ttype:
        raise HTTPException(status_code=404, detail="Leave type not found")

    meta = get_leave_type_metadata(ttype.code)
    if not ttype.allocation_required and not meta["allocation_required"]:
        raise HTTPException(
            status_code=400,
            detail=f"{ttype.name} is a non-allocation leave type (e.g. Unpaid Leave / LOP) and does not have an annual quota allocation."
        )

    start_d = payload.start_date or date(2026, 4, 1)
    end_d = payload.end_date or date(2027, 3, 31)
    admin_user = db.query(User).first()
    now = datetime.now(timezone.utc)

    # Check if an existing allocation exists for this employee and type in this fiscal period
    existing = (
        db.query(TimeOffAllocation)
        .filter(
            TimeOffAllocation.employee_id == emp.id,
            TimeOffAllocation.time_off_type_id == ttype.id,
        )
        .first()
    )

    if existing:
        existing.allocated_amount = Decimal(str(payload.allocated_amount))
        existing.notes = payload.notes or f"Updated {ttype.name} entitlement ({payload.allocated_amount} days)"
        existing.updated_at = now
        alloc = existing
    else:
        alloc = TimeOffAllocation(
            employee_id=emp.id,
            time_off_type_id=ttype.id,
            allocated_amount=Decimal(str(payload.allocated_amount)),
            taken_amount=Decimal("0.00"),
            start_date=start_d,
            end_date=end_d,
            status="APPROVED",
            approved_by_user_id=admin_user.id if admin_user else None,
            approved_at=now,
            notes=payload.notes or f"FY 2026-27 {ttype.name} Entitlement ({payload.allocated_amount} days)",
        )
        db.add(alloc)

    # Notify employee
    if emp.user_id:
        create_system_notification(
            db,
            user_id=emp.user_id,
            title="Leave Entitlement Updated",
            message=f"You have been granted {payload.allocated_amount} days of {ttype.name} for FY 2026-27.",
            notification_type="LEAVE_ALLOCATED",
            reference_type="time_off_allocation",
            reference_id=alloc.id if hasattr(alloc, "id") and alloc.id else None,
        )

    db.commit()
    db.refresh(alloc)

    return {
        "status": "success",
        "message": f"{ttype.name} allocation granted successfully",
        "id": str(alloc.id),
        "allocated_days": float(alloc.allocated_amount),
    }


@router.post("/requests/{id}/approve")
def approve_time_off_request(id: int, db: Session = Depends(get_db)):
    """
    Approves a leave request with strict idempotency:
    - If already APPROVED, returns immediately with no duplicate consumption.
    - If PL/CL/SL: consumes allocation quota taken_amount.
    - If UNPAID: marks approved, does not touch paid allocations, feeds into payroll LOP engine.
    - Sends notifications.
    """
    req = db.query(TimeOffRequest).filter(TimeOffRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")

    # Idempotent check
    if req.status == "APPROVED":
        return {"status": "success", "id": str(req.id), "new_state": "APPROVED", "message": "Already approved"}

    ttype = db.query(TimeOffType).filter(TimeOffType.id == req.time_off_type_id).first()
    meta = get_leave_type_metadata(ttype.code if ttype else "CL")

    # If allocation-required (PL, CL, SL), validate and consume quota
    if (ttype and ttype.allocation_required) or meta["allocation_required"]:
        alloc = None
        if req.allocation_id:
            alloc = db.query(TimeOffAllocation).filter(TimeOffAllocation.id == req.allocation_id).first()
        if not alloc:
            alloc = db.query(TimeOffAllocation).filter(
                TimeOffAllocation.employee_id == req.employee_id,
                TimeOffAllocation.time_off_type_id == req.time_off_type_id,
            ).first()

        if not alloc:
            raise HTTPException(
                status_code=400,
                detail=f"No leave allocation found for {ttype.name if ttype else 'this leave type'}. Please allocate leaves first."
            )

        new_taken = alloc.taken_amount + req.requested_amount
        if new_taken > alloc.allocated_amount:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient leave balance. Available: {alloc.allocated_amount - alloc.taken_amount} days, Requested: {req.requested_amount} days"
            )

        alloc.taken_amount = new_taken
        req.allocation_id = alloc.id

    now = datetime.now(timezone.utc)
    admin_user = db.query(User).first()
    admin_id = admin_user.id if admin_user else None

    req.status = "APPROVED"
    req.approved_at = now
    req.approved_by_user_id = admin_id
    req.refused_at = None
    req.refusal_reason = None

    # Notifications
    emp = db.query(Employee).filter(Employee.id == req.employee_id).first()
    emp_name = f"{emp.first_name} {emp.last_name}" if emp else "Employee"
    type_name = ttype.name if ttype else "Leave"

    if emp and emp.user_id:
        create_system_notification(
            db,
            user_id=emp.user_id,
            title="Leave Request Approved",
            message=f"Your {type_name} request for {req.requested_amount} days ({req.start_date} to {req.end_date}) has been approved.",
            notification_type="LEAVE_APPROVED",
            reference_type="time_off_request",
            reference_id=req.id,
        )

    # If LOP approved, notify payroll manager
    if meta["category"] == "UNPAID" and admin_id:
        create_system_notification(
            db,
            user_id=admin_id,
            title="Payroll Impact: Approved Unpaid Leave (LOP)",
            message=f"{emp_name} has {req.requested_amount} days of approved Unpaid Leave ({req.start_date} to {req.end_date}). Salary worked days will reflect LOP deduction.",
            notification_type="PAYROLL_WARNING",
            reference_type="time_off_request",
            reference_id=req.id,
        )

    db.commit()
    db.refresh(req)
    return {"status": "success", "id": str(req.id), "new_state": "APPROVED"}


@router.post("/requests/{id}/reject")
@router.post("/requests/{id}/refuse")
def reject_time_off_request(id: int, payload: Optional[LeaveDecisionRequest] = None, db: Session = Depends(get_db)):
    """
    Refuses/Rejects a leave request.
    - If previously APPROVED and had an allocation, restores the taken quota exactly once.
    - Sets refusal reasoning and sends notification.
    """
    req = db.query(TimeOffRequest).filter(TimeOffRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")

    # If previously approved, reverse the allocation taken amount exactly once
    if req.status == "APPROVED" and req.allocation_id:
        alloc = db.query(TimeOffAllocation).filter(TimeOffAllocation.id == req.allocation_id).first()
        if alloc and alloc.taken_amount >= req.requested_amount:
            alloc.taken_amount -= req.requested_amount

    now = datetime.now(timezone.utc)
    admin_user = db.query(User).first()
    admin_id = admin_user.id if admin_user else None
    refusal_msg = (payload.reason if payload and payload.reason else "Request declined by manager / operational requirements.")

    req.status = "REFUSED"
    req.refused_at = now
    req.refusal_reason = refusal_msg
    req.approved_at = None
    req.approved_by_user_id = admin_id

    # Notification
    emp = db.query(Employee).filter(Employee.id == req.employee_id).first()
    ttype = db.query(TimeOffType).filter(TimeOffType.id == req.time_off_type_id).first()
    type_name = ttype.name if ttype else "Leave"

    if emp and emp.user_id:
        create_system_notification(
            db,
            user_id=emp.user_id,
            title="Leave Request Refused",
            message=f"Your {type_name} request for {req.requested_amount} days was refused. Reason: {refusal_msg}",
            notification_type="LEAVE_REFUSED",
            reference_type="time_off_request",
            reference_id=req.id,
        )

    db.commit()
    db.refresh(req)
    return {"status": "success", "id": str(req.id), "new_state": "REFUSED", "reason": refusal_msg}


@router.patch("/requests/{id}/status")
def update_request_status(id: int, payload: StatusUpdateRequest, db: Session = Depends(get_db)):
    status_upper = payload.status.upper()
    if status_upper in ["APPROVED", "APPROVE"]:
        return approve_time_off_request(id, db=db)
    elif status_upper in ["REJECTED", "REJECT", "REFUSED", "REFUSE"]:
        return reject_time_off_request(id, payload=LeaveDecisionRequest(reason=payload.reason), db=db)
    elif status_upper in ["CANCELLED", "CANCEL"]:
        req = db.query(TimeOffRequest).filter(TimeOffRequest.id == id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Leave request not found")
        if req.status == "APPROVED" and req.allocation_id:
            alloc = db.query(TimeOffAllocation).filter(TimeOffAllocation.id == req.allocation_id).first()
            if alloc and alloc.taken_amount >= req.requested_amount:
                alloc.taken_amount -= req.requested_amount
        req.status = "CANCELLED"
        db.commit()
        db.refresh(req)
        return {"status": "success", "id": str(req.id), "new_state": "CANCELLED"}
    else:
        req = db.query(TimeOffRequest).filter(TimeOffRequest.id == id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Leave request not found")
        req.status = status_upper
        db.commit()
        db.refresh(req)
        return {"status": "success", "id": str(req.id), "new_state": req.status}
