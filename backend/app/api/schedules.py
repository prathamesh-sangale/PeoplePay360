from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.working_schedule import WorkingSchedule
from app.models.working_schedule_day import WorkingScheduleDay
from app.models.employee_schedule_assignment import EmployeeScheduleAssignment
from app.models.employee import Employee
from app.models.department import Department
from app.auth.rbac import require_role
from pydantic import BaseModel
from typing import Optional, List
from datetime import time, date

router = APIRouter()

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


class ScheduleDayInput(BaseModel):
    day_of_week: int  # 0 = Monday, 6 = Sunday
    start_time: Optional[str] = "09:00"
    end_time: Optional[str] = "18:00"
    is_working_day: bool = True


class ScheduleCreate(BaseModel):
    name: str
    code: str
    weekly_hours: float = 40.0
    days: Optional[List[ScheduleDayInput]] = None


class ScheduleUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    weekly_hours: Optional[float] = None
    days: Optional[List[ScheduleDayInput]] = None


class ScheduleAssignmentCreate(BaseModel):
    employee_id: int
    working_schedule_id: int
    start_date: date
    end_date: Optional[date] = None


@router.get("")
def list_schedules(db: Session = Depends(get_db)):
    """Returns all working schedules with daily shift configurations and assigned employee count."""
    schedules = db.query(WorkingSchedule).all()
    results = []
    for s in schedules:
        days = db.query(WorkingScheduleDay).filter(
            WorkingScheduleDay.working_schedule_id == s.id
        ).order_by(WorkingScheduleDay.day_of_week).all()
        
        assigned_count = db.query(func.count(EmployeeScheduleAssignment.id)).filter(
            EmployeeScheduleAssignment.working_schedule_id == s.id,
            EmployeeScheduleAssignment.is_active == True
        ).scalar() or 0

        day_list = [
            {
                "id": str(d.id),
                "day_name": DAY_NAMES[d.day_of_week] if 0 <= d.day_of_week < 7 else f"Day {d.day_of_week}",
                "day_of_week": d.day_of_week,
                "start_time": d.start_time.strftime("%H:%M") if d.start_time else None,
                "end_time": d.end_time.strftime("%H:%M") if d.end_time else None,
                "is_working_day": d.is_working_day,
            }
            for d in days
        ]
        results.append({
            "id": str(s.id),
            "name": s.name,
            "code": s.code,
            "hours_per_week": float(s.weekly_hours) if s.weekly_hours else 40.0,
            "weekly_hours": float(s.weekly_hours) if s.weekly_hours else 40.0,
            "assigned_employees": assigned_count,
            "days": day_list,
        })
    return results


@router.post("", dependencies=[Depends(require_role("HR", "ADMIN"))])
def create_schedule(payload: ScheduleCreate, db: Session = Depends(get_db)):
    """Creates a new working schedule with 7-day configuration. Requires HR or ADMIN role."""
    existing = db.query(WorkingSchedule).filter(
        (WorkingSchedule.name.ilike(payload.name.strip())) | (WorkingSchedule.code.ilike(payload.code.strip()))
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Schedule with name '{payload.name}' or code '{payload.code}' already exists.")

    sched = WorkingSchedule(
        name=payload.name.strip(),
        code=payload.code.strip().upper(),
        weekly_hours=payload.weekly_hours,
        is_active=True,
    )
    db.add(sched)
    db.flush()

    # Create 7 days
    day_inputs = {d.day_of_week: d for d in (payload.days or [])}
    for dow in range(7):
        inp = day_inputs.get(dow)
        is_work = inp.is_working_day if inp else (dow < 5)  # Mon-Fri default working
        st_str = inp.start_time if inp and inp.start_time else "09:00"
        et_str = inp.end_time if inp and inp.end_time else "18:00"

        st = time.fromisoformat(st_str) if st_str else time(9, 0)
        et = time.fromisoformat(et_str) if et_str else time(18, 0)

        s_day = WorkingScheduleDay(
            working_schedule_id=sched.id,
            day_of_week=dow,
            start_time=st,
            end_time=et,
            is_working_day=is_work,
        )
        db.add(s_day)

    db.commit()
    db.refresh(sched)

    return {
        "status": "success",
        "message": f"Working Schedule '{sched.name}' created successfully.",
        "id": str(sched.id),
    }


@router.put("/{id}", dependencies=[Depends(require_role("HR", "ADMIN"))])
def update_schedule(id: int, payload: ScheduleUpdate, db: Session = Depends(get_db)):
    """Updates working schedule details and timings."""
    sched = db.query(WorkingSchedule).filter(WorkingSchedule.id == id).first()
    if not sched:
        raise HTTPException(status_code=404, detail="Working schedule not found")

    if payload.name is not None:
        sched.name = payload.name.strip()
    if payload.code is not None:
        sched.code = payload.code.strip().upper()
    if payload.weekly_hours is not None:
        sched.weekly_hours = payload.weekly_hours

    if payload.days:
        for inp in payload.days:
            s_day = db.query(WorkingScheduleDay).filter(
                WorkingScheduleDay.working_schedule_id == sched.id,
                WorkingScheduleDay.day_of_week == inp.day_of_week,
            ).first()
            if s_day:
                s_day.is_working_day = inp.is_working_day
                if inp.start_time:
                    s_day.start_time = time.fromisoformat(inp.start_time)
                if inp.end_time:
                    s_day.end_time = time.fromisoformat(inp.end_time)

    db.commit()
    db.refresh(sched)

    return {
        "status": "success",
        "message": f"Working Schedule '{sched.name}' updated successfully.",
        "id": str(sched.id),
    }


@router.get("/assignments")
def list_schedule_assignments(db: Session = Depends(get_db)):
    """Returns active employee schedule assignments."""
    assignments = db.query(EmployeeScheduleAssignment).filter(
        EmployeeScheduleAssignment.is_active == True
    ).order_by(EmployeeScheduleAssignment.start_date.desc()).all()

    results = []
    for a in assignments:
        emp = db.query(Employee).filter(Employee.id == a.employee_id).first()
        sched = db.query(WorkingSchedule).filter(WorkingSchedule.id == a.working_schedule_id).first()
        dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp and emp.department_id else None

        results.append({
            "id": str(a.id),
            "employee_id": str(a.employee_id),
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "employee_code": emp.employee_code if emp else "",
            "department": dept.name if dept else "N/A",
            "schedule_id": str(a.working_schedule_id),
            "schedule_name": sched.name if sched else "Standard Shift",
            "weekly_hours": float(sched.weekly_hours) if sched else 40.0,
            "start_date": a.start_date.isoformat(),
            "end_date": a.end_date.isoformat() if a.end_date else None,
            "is_active": a.is_active,
        })
    return results


@router.post("/assign", dependencies=[Depends(require_role("HR", "ADMIN"))])
def assign_schedule(payload: ScheduleAssignmentCreate, db: Session = Depends(get_db)):
    """Assigns a working schedule to an employee. Requires HR or ADMIN role."""
    emp = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    sched = db.query(WorkingSchedule).filter(WorkingSchedule.id == payload.working_schedule_id).first()
    if not sched:
        raise HTTPException(status_code=404, detail="Working schedule not found")

    # Deactivate previous active assignment
    db.query(EmployeeScheduleAssignment).filter(
        EmployeeScheduleAssignment.employee_id == emp.id,
        EmployeeScheduleAssignment.is_active == True,
    ).update({"is_active": False})

    assignment = EmployeeScheduleAssignment(
        employee_id=emp.id,
        working_schedule_id=sched.id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        is_active=True,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "status": "success",
        "message": f"Assigned '{sched.name}' to {emp.first_name} {emp.last_name}.",
        "id": str(assignment.id),
    }
