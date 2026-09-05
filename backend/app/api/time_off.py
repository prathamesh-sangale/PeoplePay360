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
from app.api.notifications import create_system_notification
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timezone
from decimal import Decimal

router = APIRouter()

class StatusUpdateRequest(BaseModel):
    status: str
    reason: Optional[str] = None

class LeaveDecisionRequest(BaseModel):
    reason: Optional[str] = None

@router.get("/requests")
def list_time_off_requests(
    status: Optional[str] = None,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(TimeOffRequest)
    if status:
        if status.upper() in ["REJECTED", "REFUSED"]:
            query = query.filter(TimeOffRequest.status.in_(["REJECTED", "REFUSED"]))
        else:
            query = query.filter(TimeOffRequest.status == status.upper())
    if employee_id:
        query = query.filter(TimeOffRequest.employee_id == employee_id)

    requests = query.order_by(desc(TimeOffRequest.start_date)).all()
    results = []
    for r in requests:
        emp = db.query(Employee).filter(Employee.id == r.employee_id).first()
        dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp and emp.department_id else None
        ttype = db.query(TimeOffType).filter(TimeOffType.id == r.time_off_type_id).first()

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
                "color_code": ttype.color if hasattr(ttype, "color") and ttype.color else "#3B82F6",
                "is_paid": ttype.is_paid if hasattr(ttype, "is_paid") else True,
            },
            "start_date": r.start_date.isoformat() if r.start_date else None,
            "end_date": r.end_date.isoformat() if r.end_date else None,
            "date_from": r.start_date.isoformat() if r.start_date else None,
            "date_to": r.end_date.isoformat() if r.end_date else None,
            "number_of_days": float(r.requested_amount) if r.requested_amount else 1.0,
            "requested_amount": float(r.requested_amount) if r.requested_amount else 1.0,
            "reason": r.reason,
            "refusal_reason": r.refusal_reason,
            "status": r.status,
            "state": r.status,
            "approved_at": r.approved_at.isoformat() if r.approved_at else None,
            "refused_at": r.refused_at.isoformat() if r.refused_at else None,
        })
    return results

@router.get("/allocations")
def list_time_off_allocations(
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(TimeOffAllocation)
    if employee_id:
        query = query.filter(TimeOffAllocation.employee_id == employee_id)

    allocs = query.all()
    results = []
    for a in allocs:
        emp = db.query(Employee).filter(Employee.id == a.employee_id).first()
        ttype = db.query(TimeOffType).filter(TimeOffType.id == a.time_off_type_id).first()
        rem = float(a.allocated_amount) - float(a.taken_amount)
        results.append({
            "id": str(a.id),
            "employee_id": str(a.employee_id),
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "employee_code": emp.employee_code if emp else "",
            "leave_type": ttype.name if ttype else "Leave",
            "leave_code": ttype.code if ttype else "",
            "color_code": ttype.color if hasattr(ttype, "color") and ttype.color else "#3B82F6",
            "year": a.start_date.year if a.start_date else 2026,
            "allocated_days": float(a.allocated_amount),
            "used_days": float(a.taken_amount),
            "remaining_days": max(0.0, round(rem, 1)),
        })
    return results

@router.get("/types")
def list_time_off_types(db: Session = Depends(get_db)):
    types = db.query(TimeOffType).all()
    return [
        {
            "id": str(t.id),
            "name": t.name,
            "code": t.code,
            "is_paid": t.is_paid if hasattr(t, "is_paid") else True,
            "color_code": t.color if hasattr(t, "color") and t.color else "#3B82F6",
            "description": t.description,
        }
        for t in types
    ]

@router.post("/requests/{id}/approve")
def approve_time_off_request(id: int, db: Session = Depends(get_db)):
    req = db.query(TimeOffRequest).filter(TimeOffRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    if req.status == "APPROVED":
        return {"status": "success", "id": str(req.id), "new_state": req.status, "message": "Already approved"}

    # Validate allocation & balance
    alloc = None
    if req.allocation_id:
        alloc = db.query(TimeOffAllocation).filter(TimeOffAllocation.id == req.allocation_id).first()
    if not alloc:
        alloc = db.query(TimeOffAllocation).filter(
            TimeOffAllocation.employee_id == req.employee_id,
            TimeOffAllocation.time_off_type_id == req.time_off_type_id,
        ).first()

    now = datetime.now(timezone.utc)
    admin_user = db.query(User).first()
    admin_id = admin_user.id if admin_user else None

    # Consume allocation balance
    if alloc:
        new_taken = alloc.taken_amount + req.requested_amount
        if new_taken > alloc.allocated_amount:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient leave balance. Available: {alloc.allocated_amount - alloc.taken_amount} days, Requested: {req.requested_amount} days"
            )
        alloc.taken_amount = new_taken
        req.allocation_id = alloc.id

    req.status = "APPROVED"
    req.approved_at = now
    req.approved_by_user_id = admin_id
    req.refused_at = None
    req.refusal_reason = None

    # Trigger notification
    emp = db.query(Employee).filter(Employee.id == req.employee_id).first()
    ttype = db.query(TimeOffType).filter(TimeOffType.id == req.time_off_type_id).first()
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
    if admin_id:
        create_system_notification(
            db,
            user_id=admin_id,
            title=f"Leave Approved: {emp_name}",
            message=f"{type_name} for {emp_name} ({req.requested_amount} days) approved successfully.",
            notification_type="LEAVE_APPROVED",
            reference_type="time_off_request",
            reference_id=req.id,
        )

    db.commit()
    db.refresh(req)
    return {"status": "success", "id": str(req.id), "new_state": "APPROVED"}

@router.post("/requests/{id}/reject")
@router.post("/requests/{id}/refuse")
def reject_time_off_request(id: int, payload: LeaveDecisionRequest = None, db: Session = Depends(get_db)):
    req = db.query(TimeOffRequest).filter(TimeOffRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    # If previously approved, reverse the allocation taken amount
    if req.status == "APPROVED" and req.allocation_id:
        alloc = db.query(TimeOffAllocation).filter(TimeOffAllocation.id == req.allocation_id).first()
        if alloc and alloc.taken_amount >= req.requested_amount:
            alloc.taken_amount -= req.requested_amount

    now = datetime.now(timezone.utc)
    admin_user = db.query(User).first()
    admin_id = admin_user.id if admin_user else None
    refusal_msg = (payload.reason if payload and payload.reason else "Request declined by manager / business operational constraints.")

    req.status = "REFUSED"
    req.refused_at = now
    req.refusal_reason = refusal_msg
    req.approved_at = None
    req.approved_by_user_id = admin_id

    # Trigger notification
    emp = db.query(Employee).filter(Employee.id == req.employee_id).first()
    ttype = db.query(TimeOffType).filter(TimeOffType.id == req.time_off_type_id).first()
    emp_name = f"{emp.first_name} {emp.last_name}" if emp else "Employee"
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
    else:
        req = db.query(TimeOffRequest).filter(TimeOffRequest.id == id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Leave request not found")
        req.status = status_upper
        db.commit()
        db.refresh(req)
        return {"status": "success", "id": str(req.id), "new_state": req.status}
