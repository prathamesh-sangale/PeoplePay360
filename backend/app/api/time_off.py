from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.time_off_request import TimeOffRequest
from app.models.time_off_allocation import TimeOffAllocation
from app.models.time_off_type import TimeOffType
from app.models.employee import Employee
from app.models.department import Department
from typing import Optional
from pydantic import BaseModel

router = APIRouter()

class StatusUpdateRequest(BaseModel):
    status: str

@router.get("/requests")
def list_time_off_requests(
    status: Optional[str] = None,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(TimeOffRequest)
    if status:
        query = query.filter(TimeOffRequest.status == status)
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
            "status": r.status,
            "state": r.status,
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
            "remaining_days": round(rem, 1),
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
        }
        for t in types
    ]

@router.patch("/requests/{id}/status")
def update_request_status(id: int, payload: StatusUpdateRequest, db: Session = Depends(get_db)):
    req = db.query(TimeOffRequest).filter(TimeOffRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    req.status = payload.status
    db.commit()
    db.refresh(req)
    return {"status": "success", "id": str(req.id), "new_state": req.status}
