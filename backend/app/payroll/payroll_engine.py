from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.time_off_type import TimeOffType
from app.models.time_off_allocation import TimeOffAllocation
from app.models.time_off_request import TimeOffRequest
from app.models.employee import Employee
from app.models.contract import Contract
from app.models.working_schedule import WorkingSchedule
from app.models.working_schedule_day import WorkingScheduleDay
from app.models.employee_schedule_assignment import EmployeeScheduleAssignment
from app.models.attendance import Attendance

# Mapping for Leave Categories and UI colors
LEAVE_METADATA_MAP = {
    "PL": {
        "category": "PAID",
        "category_name": "Paid / Privilege Leave",
        "is_paid": True,
        "color_code": "#3B82F6",  # Blue
        "allocation_required": True,
        "payroll_integration": False,
    },
    "CL": {
        "category": "CASUAL",
        "category_name": "Casual Leave",
        "is_paid": True,
        "color_code": "#10B981",  # Emerald Green
        "allocation_required": True,
        "payroll_integration": False,
    },
    "SL": {
        "category": "SICK",
        "category_name": "Sick Leave",
        "is_paid": True,
        "color_code": "#F59E0B",  # Amber
        "allocation_required": True,
        "payroll_integration": False,
    },
    "UNPAID": {
        "category": "UNPAID",
        "category_name": "Unpaid Leave / Loss of Pay",
        "is_paid": False,
        "color_code": "#EF4444",  # Rose Red
        "allocation_required": False,
        "payroll_integration": True,
    },
    "LOP": {
        "category": "UNPAID",
        "category_name": "Unpaid Leave / Loss of Pay",
        "is_paid": False,
        "color_code": "#EF4444",  # Rose Red
        "allocation_required": False,
        "payroll_integration": True,
    },
    "ML": {
        "category": "PAID",
        "category_name": "Maternity Leave",
        "is_paid": True,
        "color_code": "#8B5CF6",  # Purple
        "allocation_required": False,
        "payroll_integration": True,
    },
    "FEST_HOL": {
        "category": "PAID",
        "category_name": "Optional / Festival Holiday",
        "is_paid": True,
        "color_code": "#06B6D4",  # Cyan
        "allocation_required": True,
        "payroll_integration": False,
    },
}

def get_leave_type_metadata(code: str) -> dict:
    return LEAVE_METADATA_MAP.get(code.upper(), {
        "category": "PAID",
        "category_name": "General Leave",
        "is_paid": True,
        "color_code": "#64748B",
        "allocation_required": True,
        "payroll_integration": False,
    })


def get_employee_schedule_days(db: Session, employee_id: int) -> Dict[int, bool]:
    """
    Returns a dict mapping day_of_week (0=Mon, ..., 6=Sun) to boolean (True if working day).
    Checks:
    1. Employee schedule assignment
    2. Active contract working schedule
    3. Default standard 5-day workweek (Mon-Fri working, Sat-Sun off)
    """
    # 1. Check direct schedule assignment
    assignment = (
        db.query(EmployeeScheduleAssignment)
        .filter(EmployeeScheduleAssignment.employee_id == employee_id)
        .first()
    )
    schedule_id = assignment.working_schedule_id if assignment else None

    # 2. Check active contract schedule
    if not schedule_id:
        contract = (
            db.query(Contract)
            .filter(Contract.employee_id == employee_id, Contract.status == "ACTIVE")
            .first()
        )
        if contract and contract.working_schedule_id:
            schedule_id = contract.working_schedule_id

    # 3. If schedule found, fetch day configurations
    if schedule_id:
        days = (
            db.query(WorkingScheduleDay)
            .filter(WorkingScheduleDay.working_schedule_id == schedule_id)
            .all()
        )
        if days:
            return {d.day_of_week: d.is_working_day for d in days}

    # Default 5-day week: Mon(0) to Fri(4) working, Sat(5), Sun(6) non-working
    return {0: True, 1: True, 2: True, 3: True, 4: True, 5: False, 6: False}


def calculate_working_days_between(
    db: Session,
    employee_id: int,
    start_date: date,
    end_date: date,
) -> Decimal:
    """
    Calculates number of scheduled working days between start_date and end_date (inclusive).
    Respects employee working schedule (skips weekends/non-working days).
    """
    if start_date > end_date:
        return Decimal("0.00")

    working_map = get_employee_schedule_days(db, employee_id)
    total_days = Decimal("0.00")
    curr = start_date

    while curr <= end_date:
        # Python weekday: Mon=0, Sun=6
        weekday = curr.weekday()
        if working_map.get(weekday, True):
            total_days += Decimal("1.00")
        curr += timedelta(days=1)

    return total_days


def get_employee_leave_balances(db: Session, employee_id: int) -> dict:
    """
    Single source of truth for an employee's leave balances.
    Returns structured stats for:
    - PL (Privilege / Paid Leave)
    - CL (Casual Leave)
    - SL (Sick Leave)
    - UNPAID / LOP (Loss of Pay)
    """
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        return {}

    all_types = db.query(TimeOffType).all()
    types_by_code = {t.code.upper(): t for t in all_types}

    # Allocations
    allocations = (
        db.query(TimeOffAllocation)
        .filter(TimeOffAllocation.employee_id == employee_id)
        .all()
    )
    alloc_by_type_id = {a.time_off_type_id: a for a in allocations}

    # All requests for this employee
    requests = (
        db.query(TimeOffRequest)
        .filter(TimeOffRequest.employee_id == employee_id)
        .all()
    )

    def get_type_stats(code: str, fallback_name: str, fallback_allocated: Decimal = Decimal("0.00")):
        tt = types_by_code.get(code)
        tt_id = tt.id if tt else None
        meta = get_leave_type_metadata(code)

        if meta["allocation_required"] and tt_id:
            alloc = alloc_by_type_id.get(tt_id)
            allocated = float(alloc.allocated_amount) if alloc else float(fallback_allocated)
            taken = float(alloc.taken_amount) if alloc else 0.0
            remaining = max(0.0, round(allocated - taken, 2))
        else:
            # Non-allocation types (e.g., LOP / UNPAID)
            allocated = None
            approved_reqs = [
                r for r in requests
                if r.time_off_type_id == tt_id and r.status == "APPROVED"
            ]
            taken = sum(float(r.requested_amount) for r in approved_reqs)
            remaining = None

        pending_reqs = [
            r for r in requests
            if r.time_off_type_id == tt_id and r.status == "PENDING"
        ]
        pending = sum(float(r.requested_amount) for r in pending_reqs)

        return {
            "type_id": str(tt_id) if tt_id else None,
            "type_name": tt.name if tt else fallback_name,
            "code": code,
            "category": meta["category"],
            "is_paid": meta["is_paid"],
            "color_code": meta["color_code"],
            "allocation_required": meta["allocation_required"],
            "payroll_integration": meta["payroll_integration"],
            "allocated_days": allocated,
            "used_days": round(taken, 2),
            "taken_days": round(taken, 2),
            "remaining_days": remaining,
            "pending_days": round(pending, 2),
        }

    pl_stats = get_type_stats("PL", "Privilege / Paid Leave (PL)", Decimal("18.00"))
    cl_stats = get_type_stats("CL", "Casual Leave (CL)", Decimal("12.00"))
    sl_stats = get_type_stats("SL", "Sick Leave (SL)", Decimal("10.00"))
    lop_stats = get_type_stats("UNPAID", "Unpaid Leave / Loss of Pay (LOP)", Decimal("0.00"))

    total_paid_taken = pl_stats["taken_days"] + cl_stats["taken_days"] + sl_stats["taken_days"]
    total_paid_allocated = (pl_stats["allocated_days"] or 0) + (cl_stats["allocated_days"] or 0) + (sl_stats["allocated_days"] or 0)
    total_paid_remaining = (pl_stats["remaining_days"] or 0) + (cl_stats["remaining_days"] or 0) + (sl_stats["remaining_days"] or 0)
    total_lop_days = lop_stats["taken_days"]
    total_pending_days = pl_stats["pending_days"] + cl_stats["pending_days"] + sl_stats["pending_days"] + lop_stats["pending_days"]

    return {
        "employee_id": str(employee_id),
        "employee_name": f"{emp.first_name} {emp.last_name}",
        "employee_code": emp.employee_code,
        "paid_leave": pl_stats,
        "casual_leave": cl_stats,
        "sick_leave": sl_stats,
        "unpaid_leave": lop_stats,
        "summary": {
            "total_paid_allocated": round(total_paid_allocated, 2),
            "total_paid_taken": round(total_paid_taken, 2),
            "total_paid_remaining": round(total_paid_remaining, 2),
            "total_lop_days": round(total_lop_days, 2),
            "total_pending_days": round(total_pending_days, 2),
        },
    }


def get_payrun_attendance_and_lop_reconciliation(
    db: Session,
    employee_id: int,
    period_start: date,
    period_end: date,
) -> dict:
    """
    Computes exact attendance, working days, approved paid leave, and approved LOP overlap
    for a specific employee in a payrun period.
    Strictly handles period boundaries (e.g. Mar 29 -> Apr 2).
    """
    # 1. Total scheduled working days in the month/period
    total_working_days = calculate_working_days_between(db, employee_id, period_start, period_end)
    calendar_days = (period_end - period_start).days + 1

    # 2. Query all APPROVED leave requests for this employee
    approved_requests = (
        db.query(TimeOffRequest)
        .filter(
            TimeOffRequest.employee_id == employee_id,
            TimeOffRequest.status == "APPROVED",
            TimeOffRequest.start_date <= period_end,
            TimeOffRequest.end_date >= period_start,
        )
        .all()
    )

    lop_days = Decimal("0.00")
    paid_leave_days = Decimal("0.00")
    unpaid_leave_types = db.query(TimeOffType).filter(TimeOffType.code.in_(["UNPAID", "LOP"])).all()
    unpaid_type_ids = {t.id for t in unpaid_leave_types}

    for req in approved_requests:
        # Overlap boundary calculation
        overlap_start = max(req.start_date, period_start)
        overlap_end = min(req.end_date, period_end)

        if overlap_start <= overlap_end:
            overlap_working_days = calculate_working_days_between(
                db, employee_id, overlap_start, overlap_end
            )
            if req.time_off_type_id in unpaid_type_ids:
                lop_days += overlap_working_days
            else:
                paid_leave_days += overlap_working_days

    # 3. Present worked days from biometric attendance in period
    present_attendances = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee_id,
            func.date(Attendance.check_in) >= period_start,
            func.date(Attendance.check_in) <= period_end,
            Attendance.status.in_(["PRESENT", "LATE", "OVERTIME", "CORRECTED"]),
        )
        .count()
    )

    # Worked days calculation (cannot exceed working_days - lop_days)
    max_payable_working_days = max(Decimal("0.00"), total_working_days - lop_days)
    if present_attendances > 0:
        worked_days = min(Decimal(str(present_attendances)), max_payable_working_days)
    else:
        worked_days = max_payable_working_days

    return {
        "calendar_days": calendar_days,
        "working_days": int(total_working_days) if total_working_days == int(total_working_days) else float(total_working_days),
        "total_working_days": float(total_working_days),
        "worked_days": float(worked_days),
        "paid_leave_days": float(paid_leave_days),
        "lop_days": float(lop_days),
        "has_lop": lop_days > Decimal("0.00"),
    }
