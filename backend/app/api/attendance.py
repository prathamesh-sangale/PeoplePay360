from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, cast, Date
from app.database import get_db
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.department import Department
from typing import Optional
from datetime import date

router = APIRouter()

@router.get("")
def list_attendance(
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = 150,
    db: Session = Depends(get_db),
):
    query = db.query(Attendance)
    if employee_id:
        query = query.filter(Attendance.employee_id == employee_id)
    if status:
        query = query.filter(Attendance.status == status.upper())
    if date_from:
        query = query.filter(cast(Attendance.check_in, Date) >= date_from)
    if date_to:
        query = query.filter(cast(Attendance.check_in, Date) <= date_to)

    records = query.order_by(desc(Attendance.check_in)).limit(limit).all()
    results = []
    for a in records:
        emp = db.query(Employee).filter(Employee.id == a.employee_id).first()
        dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp and emp.department_id else None
        
        is_absent = a.status == "ABSENT"
        check_in_str = "--:--" if is_absent or not a.check_in else a.check_in.strftime("%H:%M:%S")
        check_out_str = "--:--" if is_absent or not a.check_out else a.check_out.strftime("%H:%M:%S")

        results.append({
            "id": str(a.id),
            "employee_id": str(a.employee_id),
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "employee_code": emp.employee_code if emp else "",
            "department": dept.name if dept else "N/A",
            "attendance_date": a.check_in.date().isoformat() if a.check_in else date.today().isoformat(),
            "check_in_time": check_in_str,
            "check_out_time": check_out_str,
            "worked_hours": float(a.worked_hours) if a.worked_hours else 0.0,
            "overtime_hours": float(max(0.0, float(a.worked_hours or 0) - 8.0)) if a.status == "OVERTIME" else 0.0,
            "status": a.status,
            "notes": a.notes,
        })
    return results

@router.get("/summary")
def get_attendance_summary(db: Session = Depends(get_db)):
    total_records = db.query(func.count(Attendance.id)).scalar() or 0
    present_count = db.query(func.count(Attendance.id)).filter(Attendance.status.in_(["PRESENT", "ON_TIME"])).scalar() or 0
    late_count = db.query(func.count(Attendance.id)).filter(Attendance.status == "LATE").scalar() or 0
    half_day_count = db.query(func.count(Attendance.id)).filter(Attendance.status == "HALF_DAY").scalar() or 0
    absent_count = db.query(func.count(Attendance.id)).filter(Attendance.status == "ABSENT").scalar() or 0
    overtime_count = db.query(func.count(Attendance.id)).filter(Attendance.status == "OVERTIME").scalar() or 0
    avg_hours = db.query(func.avg(Attendance.worked_hours)).filter(Attendance.worked_hours > 0).scalar() or 0.0

    return {
        "total_records": total_records,
        "present_count": present_count,
        "late_count": late_count,
        "half_day_count": half_day_count,
        "absent_count": absent_count,
        "overtime_count": overtime_count,
        "average_worked_hours": round(float(avg_hours), 2),
        "total_overtime_hours": round(float(overtime_count * 2.5), 1),
    }
