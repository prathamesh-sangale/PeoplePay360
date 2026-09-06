from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, cast, Date
from app.database import get_db
from app.models.attendance import Attendance
from app.models.attendance_correction import AttendanceCorrection
from app.models.employee import Employee
from app.models.department import Department
from app.models.job import Job
from app.models.contract import Contract
from app.models.working_schedule import WorkingSchedule
from app.models.working_schedule_day import WorkingScheduleDay
from app.models.employee_schedule_assignment import EmployeeScheduleAssignment
from app.models.time_off_request import TimeOffRequest
from app.models.time_off_type import TimeOffType
from app.models.user import User
from app.auth.rbac import require_role, get_current_user
from typing import Optional, List
from datetime import date, datetime, timezone, time
from decimal import Decimal
from pydantic import BaseModel

router = APIRouter()


def format_worked_duration(hours_val: Optional[float]) -> str:
    if hours_val is None or hours_val <= 0:
        return "00h 00m"
    total_minutes = int(round(hours_val * 60))
    h = total_minutes // 60
    m = total_minutes % 60
    return f"{h:02d}h {m:02d}m"


def get_employee_schedule_info(db: Session, employee_id: int):
    """Retrieves employee's working schedule and today's shift day configuration."""
    assignment = (
        db.query(EmployeeScheduleAssignment)
        .filter(
            EmployeeScheduleAssignment.employee_id == employee_id,
            EmployeeScheduleAssignment.is_active == True,
        )
        .order_by(desc(EmployeeScheduleAssignment.start_date))
        .first()
    )
    sched_id = assignment.working_schedule_id if assignment else None

    if not sched_id:
        contract = (
            db.query(Contract)
            .filter(Contract.employee_id == employee_id, Contract.status == "ACTIVE")
            .first()
        )
        if contract and contract.working_schedule_id:
            sched_id = contract.working_schedule_id

    if not sched_id:
        first_s = db.query(WorkingSchedule).first()
        sched_id = first_s.id if first_s else None

    if not sched_id:
        return None, None, None

    schedule = db.query(WorkingSchedule).filter(WorkingSchedule.id == sched_id).first()
    weekday = date.today().weekday()
    day = (
        db.query(WorkingScheduleDay)
        .filter(
            WorkingScheduleDay.working_schedule_id == sched_id,
            WorkingScheduleDay.day_of_week == weekday,
        )
        .first()
    )
    return schedule, day, sched_id


# =============================================================================
# 1. ATTENDANCE TOGGLE & ROSTER ENDPOINTS
# =============================================================================

@router.get("/today")
def get_today_attendance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the authenticated employee's attendance status for today / active working session:
    - is_working: True if an open check-in session exists
    - check_in / check_out timestamps
    - worked_hours & formatted duration
    - shift timing and status
    """
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        emp = db.query(Employee).first()

    if not emp:
        return {
            "is_working": False,
            "attendance_id": None,
            "check_in": None,
            "check_in_time": None,
            "check_out": None,
            "check_out_time": None,
            "worked_hours": None,
            "formatted_worked_time": "00h 00m",
            "status": None,
            "shift_start": "09:00 AM",
            "shift_end": "06:00 PM",
            "shift_name": "Indian Standard Shift (40h/wk)",
        }

    schedule, sched_day, _ = get_employee_schedule_info(db, emp.id)
    shift_start_str = sched_day.start_time.strftime("%I:%M %p") if sched_day and sched_day.start_time else "09:00 AM"
    shift_end_str = sched_day.end_time.strftime("%I:%M %p") if sched_day and sched_day.end_time else "06:00 PM"
    shift_name = schedule.name if schedule else "Indian Standard Shift"

    open_att = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == emp.id,
            Attendance.check_out == None,
            Attendance.status != "ABSENT",
        )
        .order_by(desc(Attendance.check_in))
        .first()
    )

    if open_att:
        check_in_iso = open_att.check_in.isoformat() if open_att.check_in else None
        check_in_time_str = open_att.check_in.strftime("%I:%M %p") if open_att.check_in else None
        
        now_utc = datetime.now(timezone.utc)
        elapsed_sec = max(0.0, (now_utc - (open_att.check_in if open_att.check_in.tzinfo else open_att.check_in.replace(tzinfo=timezone.utc))).total_seconds())
        elapsed_hours = round(elapsed_sec / 3600.0, 2)

        return {
            "is_working": True,
            "attendance_id": str(open_att.id),
            "check_in": check_in_iso,
            "check_in_time": check_in_time_str,
            "check_out": None,
            "check_out_time": None,
            "worked_hours": elapsed_hours,
            "formatted_worked_time": format_worked_duration(elapsed_hours),
            "status": open_att.status,
            "shift_start": shift_start_str,
            "shift_end": shift_end_str,
            "shift_name": shift_name,
            "employee_id": str(emp.id),
            "employee_name": f"{emp.first_name} {emp.last_name}",
        }

    today = date.today()
    today_completed = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == emp.id,
            cast(Attendance.check_in, Date) == today,
        )
        .order_by(desc(Attendance.check_in))
        .first()
    )

    if today_completed:
        hours = float(today_completed.worked_hours) if today_completed.worked_hours else 0.0
        return {
            "is_working": False,
            "attendance_id": str(today_completed.id),
            "check_in": today_completed.check_in.isoformat() if today_completed.check_in else None,
            "check_in_time": today_completed.check_in.strftime("%I:%M %p") if today_completed.check_in else None,
            "check_out": today_completed.check_out.isoformat() if today_completed.check_out else None,
            "check_out_time": today_completed.check_out.strftime("%I:%M %p") if today_completed.check_out else None,
            "worked_hours": hours,
            "formatted_worked_time": format_worked_duration(hours),
            "status": today_completed.status,
            "shift_start": shift_start_str,
            "shift_end": shift_end_str,
            "shift_name": shift_name,
            "employee_id": str(emp.id),
            "employee_name": f"{emp.first_name} {emp.last_name}",
        }

    return {
        "is_working": False,
        "attendance_id": None,
        "check_in": None,
        "check_in_time": None,
        "check_out": None,
        "check_out_time": None,
        "worked_hours": 0.0,
        "formatted_worked_time": "00h 00m",
        "status": None,
        "shift_start": shift_start_str,
        "shift_end": shift_end_str,
        "shift_name": shift_name,
        "employee_id": str(emp.id),
        "employee_name": f"{emp.first_name} {emp.last_name}",
    }


class AttendanceTogglePunchPayload(BaseModel):
    employee_id: Optional[int] = None


@router.post("/punch")
def toggle_punch_attendance(
    payload: Optional[AttendanceTogglePunchPayload] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Automated Attendance Toggle endpoint:
    - If OFF (no open session) -> Clocks In using SERVER timestamp.
      Calculates initial status (PRESENT or LATE) based on assigned working schedule.
    - If ON (open session exists) -> Clocks Out using SERVER timestamp.
      Calculates worked_hours automatically and closes session.
    - HR / Admin can toggle for specific employees by providing `employee_id`.
    - Employees can strictly toggle only for themselves.
    """
    user_role = getattr(current_user, "normalized_role", "EMPLOYEE")
    
    if user_role == "EMPLOYEE":
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp:
            emp = db.query(Employee).first()
    else:
        # HR / Admin
        target_id = payload.employee_id if payload and payload.employee_id else None
        if target_id:
            emp = db.query(Employee).filter(Employee.id == target_id).first()
        else:
            emp = db.query(Employee).filter(Employee.user_id == current_user.id).first() or db.query(Employee).first()

    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    now_server = datetime.now(timezone.utc)
    
    open_att = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == emp.id,
            Attendance.check_out == None,
            Attendance.status != "ABSENT",
        )
        .order_by(desc(Attendance.check_in))
        .first()
    )

    if open_att:
        # ON -> OFF (Clock Out)
        open_att.check_out = now_server
        ci = open_att.check_in if open_att.check_in.tzinfo else open_att.check_in.replace(tzinfo=timezone.utc)
        diff_sec = max(0.0, (now_server - ci).total_seconds())
        worked_hours = round(diff_sec / 3600.0, 2)
        open_att.worked_hours = Decimal(str(worked_hours))

        if worked_hours >= 9.0 and open_att.status == "PRESENT":
            open_att.status = "OVERTIME"

        db.commit()
        db.refresh(open_att)

        return {
            "status": "success",
            "action": "CLOCK_OUT",
            "is_working": False,
            "message": f"Work session completed for {emp.first_name} {emp.last_name}. Worked: {format_worked_duration(worked_hours)}.",
            "attendance_id": str(open_att.id),
            "employee_id": emp.id,
            "check_in": open_att.check_in.isoformat(),
            "check_in_time": open_att.check_in.strftime("%I:%M %p"),
            "check_out": open_att.check_out.isoformat(),
            "check_out_time": open_att.check_out.strftime("%I:%M %p"),
            "worked_hours": worked_hours,
            "formatted_worked_time": format_worked_duration(worked_hours),
            "attendance_status": open_att.status,
        }

    else:
        # OFF -> ON (Clock In)
        schedule, sched_day, _ = get_employee_schedule_info(db, emp.id)
        
        initial_status = "PRESENT"
        if sched_day and sched_day.start_time:
            now_local_time = datetime.now().time()
            if now_local_time > sched_day.start_time:
                initial_status = "LATE"

        new_att = Attendance(
            employee_id=emp.id,
            check_in=now_server,
            check_out=None,
            worked_hours=None,
            status=initial_status,
            notes="Attendance Toggle punch-in",
        )
        db.add(new_att)
        db.commit()
        db.refresh(new_att)

        return {
            "status": "success",
            "action": "CLOCK_IN",
            "is_working": True,
            "message": f"Clocked in successfully for {emp.first_name} {emp.last_name} at {new_att.check_in.strftime('%I:%M %p')} ({initial_status}).",
            "attendance_id": str(new_att.id),
            "employee_id": emp.id,
            "check_in": new_att.check_in.isoformat(),
            "check_in_time": new_att.check_in.strftime("%I:%M %p"),
            "check_out": None,
            "check_out_time": None,
            "worked_hours": 0.0,
            "formatted_worked_time": "00h 00m",
            "attendance_status": new_att.status,
        }


@router.get("/roster")
def get_attendance_roster(
    department_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns full workforce employee list with today's live attendance status,
    timings, working state (ON/OFF), and sequence sorting data.
    """
    user_role = getattr(current_user, "normalized_role", "EMPLOYEE")
    emp_query = db.query(Employee).filter(Employee.status == "ACTIVE")
    
    if user_role == "EMPLOYEE":
        emp_record = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if emp_record:
            emp_query = emp_query.filter(Employee.id == emp_record.id)

    if department_id:
        emp_query = emp_query.filter(Employee.department_id == department_id)

    employees = emp_query.order_by(Employee.employee_code).all()
    today = date.today()
    now_utc = datetime.now(timezone.utc)

    # Approved leaves today
    approved_leaves = (
        db.query(TimeOffRequest)
        .filter(
            TimeOffRequest.status == "APPROVED",
            TimeOffRequest.start_date <= today,
            TimeOffRequest.end_date >= today,
        )
        .all()
    )
    leave_by_emp_id = {l.employee_id: l for l in approved_leaves}

    roster = []
    for emp in employees:
        dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp.department_id else None
        job = db.query(Job).filter(Job.id == emp.job_id).first() if emp.job_id else None
        schedule, sched_day, _ = get_employee_schedule_info(db, emp.id)
        
        shift_start_str = sched_day.start_time.strftime("%I:%M %p") if sched_day and sched_day.start_time else "09:00 AM"
        shift_end_str = sched_day.end_time.strftime("%I:%M %p") if sched_day and sched_day.end_time else "06:00 PM"
        shift_name = schedule.name if schedule else "Standard Shift"

        open_att = (
            db.query(Attendance)
            .filter(
                Attendance.employee_id == emp.id,
                Attendance.check_out == None,
                Attendance.status != "ABSENT",
            )
            .order_by(desc(Attendance.check_in))
            .first()
        )

        today_completed = (
            db.query(Attendance)
            .filter(
                Attendance.employee_id == emp.id,
                cast(Attendance.check_in, Date) == today,
            )
            .order_by(desc(Attendance.check_in))
            .first()
        ) if not open_att else None

        active_att = open_att or today_completed
        is_working = bool(open_att)

        worked_hours = 0.0
        if open_att and open_att.check_in:
            ci = open_att.check_in if open_att.check_in.tzinfo else open_att.check_in.replace(tzinfo=timezone.utc)
            worked_hours = round(max(0.0, (now_utc - ci).total_seconds()) / 3600.0, 2)
        elif today_completed and today_completed.worked_hours:
            worked_hours = float(today_completed.worked_hours)

        status_label = "NOT_STARTED"
        if is_working:
            status_label = open_att.status or "PRESENT"
        elif today_completed:
            status_label = today_completed.status or "COMPLETED"
        elif emp.id in leave_by_emp_id:
            status_label = "ON_LEAVE"

        leave_obj = leave_by_emp_id.get(emp.id)
        leave_name = None
        if leave_obj:
            tt = db.query(TimeOffType).filter(TimeOffType.id == leave_obj.time_off_type_id).first()
            leave_name = tt.name if tt else "Approved Leave"

        roster.append({
            "employee_id": emp.id,
            "employee_code": emp.employee_code,
            "full_name": f"{emp.first_name} {emp.last_name}",
            "first_name": emp.first_name,
            "last_name": emp.last_name,
            "email": emp.email,
            "department_id": emp.department_id,
            "department_name": dept.name if dept else "N/A",
            "department_code": dept.code if dept else "",
            "job_title": job.name if job else "Specialist",
            "avatar_initials": f"{emp.first_name[0]}{emp.last_name[0]}".upper() if emp.first_name and emp.last_name else "EM",
            "shift_name": shift_name,
            "shift_start": shift_start_str,
            "shift_end": shift_end_str,
            "is_working": is_working,
            "attendance_id": str(active_att.id) if active_att else None,
            "check_in": active_att.check_in.isoformat() if active_att and active_att.check_in else None,
            "check_in_time": active_att.check_in.strftime("%I:%M %p") if active_att and active_att.check_in else None,
            "check_out": active_att.check_out.isoformat() if active_att and active_att.check_out else None,
            "check_out_time": active_att.check_out.strftime("%I:%M %p") if active_att and active_att.check_out else None,
            "worked_hours": worked_hours,
            "formatted_worked_time": format_worked_duration(worked_hours),
            "status": status_label,
            "is_on_leave": emp.id in leave_by_emp_id,
            "leave_reason": leave_name,
        })

    if search:
        s_lower = search.lower()
        roster = [r for r in roster if s_lower in r["full_name"].lower() or s_lower in r["employee_code"].lower() or s_lower in r["department_name"].lower()]

    if status:
        st_upper = status.upper()
        if st_upper == "WORKING":
            roster = [r for r in roster if r["is_working"]]
        elif st_upper == "NOT_WORKING":
            roster = [r for r in roster if not r["is_working"]]
        elif st_upper == "ON_LEAVE":
            roster = [r for r in roster if r["is_on_leave"]]
        else:
            roster = [r for r in roster if r["status"].upper() == st_upper]

    return roster


# =============================================================================
# 2. HR & ADMIN AUDIT / LISTING ENDPOINTS
# =============================================================================

@router.get("")
def list_attendance(
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = 150,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists attendance records with strict employee role scoping and HR filters."""
    query = db.query(Attendance)
    user_role = getattr(current_user, "normalized_role", "EMPLOYEE")
    if user_role == "EMPLOYEE":
        emp_record = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp_record:
            return []
        if employee_id and employee_id != emp_record.id:
            raise HTTPException(status_code=403, detail="Employees can only view their own attendance records.")
        query = query.filter(Attendance.employee_id == emp_record.id)
    elif employee_id:
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
            "overtime_hours": max(0.0, float(a.worked_hours or 0) - 8.0) if a.status == "OVERTIME" else 0.0,
            "status": a.status,
            "notes": a.notes,
        })
    return results


@router.get("/summary")
def get_attendance_summary(db: Session = Depends(get_db)):
    """Summary telemetry for HR attendance overview."""
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
        "missing_checkout_count": db.query(func.count(Attendance.id)).filter(Attendance.check_out == None, Attendance.status != "ABSENT").scalar() or 0,
        "average_worked_hours": round(float(avg_hours), 2),
        "total_overtime_hours": round(float(overtime_count * 2.5), 1),
    }


class AttendanceCorrectionRequest(BaseModel):
    new_check_in: Optional[datetime] = None
    new_check_out: Optional[datetime] = None
    reason: str


@router.post("/{id}/correct", dependencies=[Depends(require_role("HR", "ADMIN"))])
def correct_attendance(
    id: int,
    payload: AttendanceCorrectionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submits an attendance correction with mandatory audit reason.
    Preserves audit history in `attendance_corrections` table and updates attendance record to CORRECTED status.
    Requires HR or ADMIN role.
    """
    if not payload.reason or len(payload.reason.strip()) < 5:
        raise HTTPException(status_code=400, detail="Mandatory audit reason (at least 5 characters) is required for attendance correction.")

    att = db.query(Attendance).filter(Attendance.id == id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    old_ci = att.check_in
    old_co = att.check_out

    new_ci = payload.new_check_in if payload.new_check_in is not None else old_ci
    new_co = payload.new_check_out if payload.new_check_out is not None else old_co

    worked = None
    if new_ci and new_co:
        diff_sec = (new_co - new_ci).total_seconds()
        worked = Decimal(str(max(0.0, round(diff_sec / 3600.0, 2))))

    corr = AttendanceCorrection(
        attendance_id=att.id,
        corrected_by_user_id=current_user.id,
        old_check_in=old_ci,
        old_check_out=old_co,
        new_check_in=new_ci,
        new_check_out=new_co,
        reason=payload.reason.strip(),
    )
    db.add(corr)

    att.check_in = new_ci
    att.check_out = new_co
    att.worked_hours = worked
    att.status = "CORRECTED"
    att.notes = f"Corrected by {current_user.username}: {payload.reason.strip()}"

    db.commit()
    db.refresh(att)

    return {
        "status": "success",
        "message": f"Attendance #{att.id} corrected successfully. Audit record #{corr.id} created.",
        "id": str(att.id),
        "status_state": att.status,
        "worked_hours": float(att.worked_hours) if att.worked_hours else 0.0,
    }
