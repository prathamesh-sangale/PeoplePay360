from datetime import date, datetime, timedelta, timezone
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


def compute_payrun_batch(db: Session, payrun_id: int, current_user_id: Optional[int] = None) -> dict:
    """
    Computes/Generates batch payroll for a Payrun.
    Iterates over all active employees with contracts, computes earnings, allowances,
    statutory deductions (EPF, PT, TDS), LOP attendance reconciliation,
    and generates/updates Payslip and PayslipLine records.
    Transitions payrun state to COMPUTED.
    """
    from app.models.payrun import Payrun
    from app.models.payrun_employee import PayrunEmployee
    from app.models.payslip import Payslip
    from app.models.payslip_line import PayslipLine
    from app.models.salary_structure import SalaryStructure
    from app.models.salary_rule import SalaryRule

    payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
    if not payrun:
        raise ValueError(f"Payrun with ID {payrun_id} not found.")

    # All active employees
    employees = db.query(Employee).filter(Employee.status == "ACTIVE").order_by(Employee.id).all()
    if not employees:
        employees = db.query(Employee).order_by(Employee.id).all()

    # Pre-fetch salary structures & rules
    all_rules = db.query(SalaryRule).all()
    rules_by_code = {r.code: r for r in all_rules}
    all_structs = db.query(SalaryStructure).all()
    structs_by_id = {s.id: s for s in all_structs}
    structs_by_code = {s.code: s for s in all_structs}

    total_gross = Decimal("0.00")
    total_net = Decimal("0.00")
    total_deductions = Decimal("0.00")
    slips_computed = 0

    for emp in employees:
        # Find active contract
        contract = (
            db.query(Contract)
            .filter(Contract.employee_id == emp.id, Contract.status == "ACTIVE")
            .order_by(desc(Contract.start_date))
            .first()
        )
        if not contract:
            contract = (
                db.query(Contract)
                .filter(Contract.employee_id == emp.id)
                .order_by(desc(Contract.start_date))
                .first()
            )

        if not contract:
            # Skip employee without contract
            continue

        wage = Decimal(str(contract.wage or 50000.00))
        struct_id = contract.salary_structure_id or payrun.salary_structure_id or 1
        struct_obj = structs_by_id.get(struct_id)
        struct_code = struct_obj.code if struct_obj else "IND_STD_TECH"

        # Attendance & LOP Reconciliation
        recon = get_payrun_attendance_and_lop_reconciliation(
            db, emp.id, payrun.period_start, payrun.period_end
        )
        lop_days = Decimal(str(recon.get("lop_days", 0.0)))
        working_days = recon.get("working_days", 22)
        worked_days = Decimal(str(recon.get("worked_days", working_days)))

        # -------------------------------------------------------------
        # Compute Structure Breakdown
        # -------------------------------------------------------------
        lines_data = []

        # 1. Executive Leadership
        if struct_code == "IND_EXEC_LEAD":
            basic = (wage * Decimal("0.50")).quantize(Decimal("0.01"))
            hra = (basic * Decimal("0.50")).quantize(Decimal("0.01"))
            car = Decimal("15000.00")
            bonus = (wage * Decimal("0.10")).quantize(Decimal("0.01"))
            special = max(Decimal("0.00"), wage - basic - hra - car - bonus)
            gross = basic + hra + car + bonus + special
            epf = min(Decimal("1800.00"), (basic * Decimal("0.12")).quantize(Decimal("0.01")))
            pt = Decimal("200.00")
            tds = (gross * Decimal("0.18")).quantize(Decimal("0.01"))
            total_ded = epf + pt + tds
            net = gross - total_ded

            lines_data = [
                ("BASIC", "Basic Salary", "BASIC", 10, "PERCENTAGE", Decimal("1.00"), Decimal("50.00"), wage, basic, "50% of Monthly CTC"),
                ("HRA", "House Rent Allowance", "ALLOWANCE", 20, "PERCENTAGE", Decimal("1.00"), Decimal("50.00"), basic, hra, "50% of Basic Pay"),
                ("CAR_ALLOW", "Executive Car Allowance", "ALLOWANCE", 55, "FIXED", Decimal("1.00"), None, car, car, "Fixed INR 15,000/mo"),
                ("PERF_BONUS", "Performance Bonus", "ALLOWANCE", 80, "PERCENTAGE", Decimal("1.00"), Decimal("10.00"), wage, bonus, "10% of Gross Base"),
                ("SPECIAL_ALLOW", "Special Allowance", "ALLOWANCE", 30, "FORMULA", Decimal("1.00"), None, special, special, "Balancing Figure"),
                ("EPF_EE", "Employee Provident Fund (EPF)", "DEDUCTION", 110, "PERCENTAGE", Decimal("1.00"), Decimal("12.00"), basic, epf, "12% of Basic up to statutory ceiling"),
                ("PT", "Professional Tax", "DEDUCTION", 120, "FIXED", Decimal("1.00"), None, pt, pt, "State PT Act (INR 200)"),
                ("TDS", "Tax Deducted at Source (TDS)", "DEDUCTION", 130, "PERCENTAGE", Decimal("1.00"), Decimal("18.00"), gross, tds, "Income Tax Withholding Sec 192"),
            ]

        # 2. Sales & Business Dev
        elif struct_code == "IND_SALES_COMM":
            basic = (wage * Decimal("0.40")).quantize(Decimal("0.01"))
            hra = (basic * Decimal("0.50")).quantize(Decimal("0.01"))
            comm = (wage * Decimal("0.20")).quantize(Decimal("0.01"))
            travel = Decimal("5000.00")
            special = max(Decimal("0.00"), wage - basic - hra - comm - travel)
            gross = basic + hra + comm + travel + special
            epf = min(Decimal("1800.00"), (basic * Decimal("0.12")).quantize(Decimal("0.01")))
            pt = Decimal("200.00")
            tds = (gross * Decimal("0.12")).quantize(Decimal("0.01"))
            total_ded = epf + pt + tds
            net = gross - total_ded

            lines_data = [
                ("BASIC", "Basic Salary", "BASIC", 10, "PERCENTAGE", Decimal("1.00"), Decimal("40.00"), wage, basic, "40% of Base CTC"),
                ("HRA", "House Rent Allowance", "ALLOWANCE", 20, "PERCENTAGE", Decimal("1.00"), Decimal("50.00"), basic, hra, "50% of Basic"),
                ("SALES_COMM", "Sales Commission", "ALLOWANCE", 60, "PERCENTAGE", Decimal("1.00"), Decimal("20.00"), wage, comm, "20% Sales Target Achievement"),
                ("TRAVEL_ALLOW", "Travel & Transit Allowance", "ALLOWANCE", 65, "FIXED", Decimal("1.00"), None, travel, travel, "Fixed INR 5,000/mo"),
                ("SPECIAL_ALLOW", "Special Allowance", "ALLOWANCE", 30, "FORMULA", Decimal("1.00"), None, special, special, "Balancing Figure"),
                ("EPF_EE", "Employee Provident Fund (EPF)", "DEDUCTION", 110, "PERCENTAGE", Decimal("1.00"), Decimal("12.00"), basic, epf, "12% of Basic"),
                ("PT", "Professional Tax", "DEDUCTION", 120, "FIXED", Decimal("1.00"), None, pt, pt, "State PT Act (INR 200)"),
                ("TDS", "Tax Deducted at Source (TDS)", "DEDUCTION", 130, "PERCENTAGE", Decimal("1.00"), Decimal("12.00"), gross, tds, "TDS Sec 192"),
            ]

        # 3. Operations & Shift
        elif struct_code == "IND_OPS_SHIFT":
            basic = (wage * Decimal("0.50")).quantize(Decimal("0.01"))
            hra = (basic * Decimal("0.50")).quantize(Decimal("0.01"))
            shift = Decimal("3000.00")
            bonus = Decimal("2000.00")
            special = max(Decimal("0.00"), wage - basic - hra - shift - bonus)
            gross = basic + hra + shift + bonus + special
            epf = min(Decimal("1800.00"), (basic * Decimal("0.12")).quantize(Decimal("0.01")))
            pt = Decimal("200.00")
            tds = (gross * Decimal("0.05")).quantize(Decimal("0.01")) if gross >= Decimal("80000.00") else Decimal("0.00")
            total_ded = epf + pt + tds
            net = gross - total_ded

            lines_data = [
                ("BASIC", "Basic Salary", "BASIC", 10, "PERCENTAGE", Decimal("1.00"), Decimal("50.00"), wage, basic, "50% of Base CTC"),
                ("HRA", "House Rent Allowance", "ALLOWANCE", 20, "PERCENTAGE", Decimal("1.00"), Decimal("50.00"), basic, hra, "50% of Basic"),
                ("SHIFT_ALLOW", "Night Shift Allowance", "ALLOWANCE", 70, "FIXED", Decimal("1.00"), None, shift, shift, "Fixed INR 3,000/mo"),
                ("ATTEND_BONUS", "Attendance Bonus", "ALLOWANCE", 75, "FIXED", Decimal("1.00"), None, bonus, bonus, "Fixed INR 2,000/mo"),
                ("SPECIAL_ALLOW", "Special Allowance", "ALLOWANCE", 30, "FORMULA", Decimal("1.00"), None, special, special, "Balancing Figure"),
                ("EPF_EE", "Employee Provident Fund (EPF)", "DEDUCTION", 110, "PERCENTAGE", Decimal("1.00"), Decimal("12.00"), basic, epf, "12% of Basic"),
                ("PT", "Professional Tax", "DEDUCTION", 120, "FIXED", Decimal("1.00"), None, pt, pt, "State PT Act (INR 200)"),
                ("TDS", "Tax Deducted at Source (TDS)", "DEDUCTION", 130, "PERCENTAGE", Decimal("1.00"), Decimal("5.00"), gross, tds, "TDS Sec 192"),
            ]

        # 4. Consultant 194J
        elif struct_code == "IND_CONSULTANT":
            basic = wage
            gross = wage
            tds_194j = (gross * Decimal("0.10")).quantize(Decimal("0.01"))
            total_ded = tds_194j
            net = gross - total_ded

            lines_data = [
                ("BASIC", "Professional Retainer Fee", "BASIC", 10, "FIXED", Decimal("1.00"), None, wage, basic, "Monthly Contract Retainer Fee"),
                ("TDS_194J", "TDS under Section 194J (10%)", "DEDUCTION", 135, "PERCENTAGE", Decimal("1.00"), Decimal("10.00"), gross, tds_194j, "10% Withholding Sec 194J"),
            ]

        # 5. Intern Stipend
        elif struct_code == "IND_INTERN_STIPEND":
            basic = wage
            gross = wage
            total_ded = Decimal("0.00")
            net = gross

            lines_data = [
                ("BASIC", "Graduate Trainee Monthly Stipend", "BASIC", 10, "FIXED", Decimal("1.00"), None, wage, basic, "Fixed Monthly Stipend"),
            ]

        # 6. Default: Standard Tech
        else:
            basic = (wage * Decimal("0.50")).quantize(Decimal("0.01"))
            hra = (basic * Decimal("0.50")).quantize(Decimal("0.01"))
            conveyance = Decimal("1600.00")
            medical = Decimal("1250.00")
            special = max(Decimal("0.00"), wage - basic - hra - conveyance - medical)
            gross = basic + hra + special + conveyance + medical
            epf = min(Decimal("1800.00"), (basic * Decimal("0.12")).quantize(Decimal("0.01")))
            pt = Decimal("200.00")
            tds = (gross * Decimal("0.10")).quantize(Decimal("0.01")) if wage >= Decimal("100000.00") else (gross * Decimal("0.05")).quantize(Decimal("0.01"))
            total_ded = epf + pt + tds
            net = gross - total_ded

            lines_data = [
                ("BASIC", "Basic Salary", "BASIC", 10, "PERCENTAGE", Decimal("1.00"), Decimal("50.00"), wage, basic, "50% of Base CTC"),
                ("HRA", "House Rent Allowance", "ALLOWANCE", 20, "PERCENTAGE", Decimal("1.00"), Decimal("50.00"), basic, hra, "50% of Basic Pay"),
                ("SPECIAL_ALLOW", "Special Allowance", "ALLOWANCE", 30, "FORMULA", Decimal("1.00"), None, special, special, "Balancing Figure"),
                ("CONVEYANCE", "Conveyance Allowance", "ALLOWANCE", 40, "FIXED", Decimal("1.00"), None, conveyance, conveyance, "Fixed INR 1,600/mo"),
                ("MEDICAL_ALLOW", "Medical Allowance", "ALLOWANCE", 50, "FIXED", Decimal("1.00"), None, medical, medical, "Fixed INR 1,250/mo"),
                ("EPF_EE", "Employee Provident Fund (EPF)", "DEDUCTION", 110, "PERCENTAGE", Decimal("1.00"), Decimal("12.00"), basic, epf, "12% of Basic up to statutory ceiling"),
                ("PT", "Professional Tax", "DEDUCTION", 120, "FIXED", Decimal("1.00"), None, pt, pt, "State PT Act (INR 200)"),
                ("TDS", "Tax Deducted at Source (TDS)", "DEDUCTION", 130, "PERCENTAGE", Decimal("1.00"), Decimal("10.00"), gross, tds, "Income Tax Withholding Sec 192"),
            ]

        # Apply LOP if exists
        if lop_days > Decimal("0.00"):
            work_days_dec = max(Decimal("1.00"), Decimal(str(working_days)))
            lop_amt = ((basic / work_days_dec) * lop_days).quantize(Decimal("0.01"))
            lines_data.append(
                ("LOP", f"Loss of Pay ({lop_days} days LOP)", "DEDUCTION", 140, "FORMULA", lop_days, None, basic, lop_amt, f"(Basic / {work_days_dec}) * {lop_days} LOP days")
            )
            total_ded += lop_amt
            net -= lop_amt

        # -------------------------------------------------------------
        # Persist PayrunEmployee & Payslip
        # -------------------------------------------------------------
        payrun_emp = (
            db.query(PayrunEmployee)
            .filter(PayrunEmployee.payrun_id == payrun.id, PayrunEmployee.employee_id == emp.id)
            .first()
        )
        if not payrun_emp:
            payrun_emp = PayrunEmployee(
                payrun_id=payrun.id,
                employee_id=emp.id,
                selection_status="SELECTED",
            )
            db.add(payrun_emp)
            db.flush()

        payslip = (
            db.query(Payslip)
            .filter(Payslip.payrun_id == payrun.id, Payslip.employee_id == emp.id)
            .first()
        )
        if not payslip:
            payslip = Payslip(
                payrun_id=payrun.id,
                employee_id=emp.id,
                payrun_employee_id=payrun_emp.id,
                salary_structure_id=struct_id,
                contract_id=contract.id,
                period_start=payrun.period_start,
                period_end=payrun.period_end,
                worked_days=worked_days,
                basic_amount=basic,
                gross_amount=gross,
                deduction_amount=total_ded,
                contribution_amount=epf if "epf" in locals() else Decimal("0.00"),
                net_amount=net,
                status="COMPUTED",
            )
            db.add(payslip)
            db.flush()
        else:
            payslip.contract_id = contract.id
            payslip.salary_structure_id = struct_id
            payslip.worked_days = worked_days
            payslip.basic_amount = basic
            payslip.gross_amount = gross
            payslip.deduction_amount = total_ded
            payslip.contribution_amount = epf if "epf" in locals() else Decimal("0.00")
            payslip.net_amount = net
            payslip.status = "COMPUTED"
            # Delete old lines for recomputation
            db.query(PayslipLine).filter(PayslipLine.payslip_id == payslip.id).delete()
            db.flush()

        # Add itemized PayslipLine records
        for code, name, category, seq, calc_type, qty, rate_val, base_amt, amt, formula_desc in lines_data:
            s_rule = rules_by_code.get(code)
            p_line = PayslipLine(
                payslip_id=payslip.id,
                salary_rule_id=s_rule.id if s_rule else None,
                name=name,
                code=code,
                category=category,
                sequence=seq,
                calculation_type=calc_type,
                quantity=qty,
                rate=rate_val,
                base_amount=base_amt,
                amount=amt,
                formula_snapshot=formula_desc,
            )
            db.add(p_line)

        total_gross += gross
        total_net += net
        total_deductions += total_ded
        slips_computed += 1

    # Transition Payrun to COMPUTED
    payrun.computed_at = datetime.now(timezone.utc)
    if payrun.status == "DRAFT":
        payrun.status = "COMPUTED"
    db.commit()
    db.refresh(payrun)

    return {
        "status": "success",
        "message": f"Successfully computed batch payrun '{payrun.name}'. Generated {slips_computed} employee payslips.",
        "payrun_id": payrun.id,
        "payrun_name": payrun.name,
        "payrun_status": payrun.status,
        "slips_count": slips_computed,
        "total_gross": float(total_gross),
        "total_net": float(total_net),
        "total_deductions": float(total_deductions),
        "computed_at": payrun.computed_at.isoformat() if payrun.computed_at else None,
    }

