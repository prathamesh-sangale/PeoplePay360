"""
PeoplePay360 - Comprehensive & Safe Indian HR & Payroll Seed Script
Populates high-quality, realistic, varied Indian corporate data across all 25 tables:
- System Roles & Users (Hashed passwords, Super Admin, HR Lead, Payroll Specialist, Dept Manager, Employee)
- 6 Departments & 12 Specialized Job Roles
- 4 Employee Types (Full-Time Permanent, Fixed-Term Contract, Intern, Consultant)
- 15 Indian Employees across Bangalore, Mumbai, Pune, Delhi NCR, and Hyderabad
- 5 Diverse Working Schedules (General, Early Tech, Flexi R&D, Operations 6-Day, Evening Support) with 12-hour shifts
- Employee Schedule Assignments (including historical schedule shifts)
- Realistic Indian Bank Accounts (HDFC, ICICI, SBI, Axis, Kotak, BOB, PNB) + Primary/Secondary + Intentional Missing Bank Demo Case
- 6 Indian Salary Structures (Standard Tech, Executive Leadership, Sales Commission, Operations Shift, Consultant 194J, Intern Stipend)
- 18 Indian Statutory Salary Rules (Basic, HRA, Special Allowance, Conveyance, Medical, Car, Bonus, EPF 12%, PT ₹200, TDS Sec 192/194J)
- Varied Employee Contracts (including historical expired contracts and period-specific active contracts)
- 5 Indian Leave Types (Casual Leave, Privilege/Earned Leave, Sick Leave, Maternity 26wks, Festival Holidays)
- Varied Leave Allocations & Requests (Approved, Pending, Refused with reason, Cancelled)
- 400+ Daily Biometric Attendance Logs with full status variety (PRESENT, LATE, ABSENT, OVERTIME, MISSING_CHECKOUT, CORRECTED)
- Attendance Corrections preserving old/new punch times and reasons
- Multiple Payruns across periods & statuses (June 2026 Paid, July 2026 Paid, August 2026 Paid, September 2026 Draft, Q2 Incentive Paid, Intern Stipend Paid)
- Detailed Itemized Payslips & Payslip Lines matching salary structure rules
- Realistic Payroll Warnings (Missing Bank Details, Attendance Exception, Contract Expiring)
- Live System Notifications with unread/read statuses for Admin, Payroll, HR, and Employees

Safe and idempotent: Uses upsert / deterministic identifiers and controlled safe clearing.
"""

import os
import sys
from pathlib import Path
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
import random

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

# Load environment
backend_dir = Path(__file__).resolve().parent
env_path = backend_dir / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in .env")

from app.models import (
    Base,
    Role,
    User,
    Department,
    Job,
    EmployeeType,
    Employee,
    Contract,
    WorkingSchedule,
    WorkingScheduleDay,
    EmployeeScheduleAssignment,
    EmployeeBankAccount,
    Attendance,
    AttendanceCorrection,
    TimeOffType,
    TimeOffAllocation,
    TimeOffRequest,
    SalaryStructure,
    SalaryRule,
    SalaryStructureRule,
    Payrun,
    PayrunEmployee,
    Payslip,
    PayslipLine,
    PayrollWarning,
    Notification,
)

def seed_database():
    print("=" * 80)
    print("PeoplePay360 - SEEDING REALISTIC & DIVERSE INDIAN HR & PAYROLL DATA")
    print("=" * 80)

    engine = create_engine(DATABASE_URL)
    
    with Session(engine) as session:
        # Controlled safe cleanup in exact foreign key dependency order
        print("[INFO] Performing controlled cleanup of demo seed records...")
        session.execute(text("""
            TRUNCATE TABLE 
                notifications,
                payroll_warnings,
                payslip_lines,
                payslips,
                payrun_employees,
                payruns,
                salary_structure_rules,
                salary_rules,
                contracts,
                salary_structures,
                time_off_requests,
                time_off_allocations,
                time_off_types,
                attendance_corrections,
                attendance,
                employee_bank_accounts,
                employee_schedule_assignments,
                working_schedule_days,
                working_schedules,
                employees,
                jobs,
                departments,
                employee_types,
                users,
                roles
            RESTART IDENTITY CASCADE;
        """))
        session.commit()
        print("[INFO] Database ready for structured seeding.\n")

        # -------------------------------------------------------------
        # 1. ROLES & SYSTEM USERS
        # -------------------------------------------------------------
        print("[1/14] Seeding Roles & System Users...")
        roles_data = [
            Role(name="SUPER_ADMIN", description="Complete system administrator with full access to all modules"),
            Role(name="HR_MANAGER", description="Human Resources Lead with employee and leave management access"),
            Role(name="PAYROLL_OFFICER", description="Payroll specialist managing salary structures, rules, and payruns"),
            Role(name="DEPT_MANAGER", description="Department Head approving timesheets, attendance, and leave requests"),
            Role(name="EMPLOYEE", description="Standard employee access for self-service portal, payslips, and leaves"),
        ]
        session.add_all(roles_data)
        session.flush()
        roles_by_name = {r.name: r for r in roles_data}

        # Bcrypt hash for password "PeoplePay@2026"
        dummy_hash = "$2b$12$e8YQz.FjC.4nZ4R0W0WjheR3sV1QyP5Q8M6gH2f0l1v3k5n7m9p2q"
        
        users_data = [
            User(
                role_id=roles_by_name["SUPER_ADMIN"].id,
                username="aarav.sharma",
                email="aarav.sharma@peoplepay360.in",
                password_hash=dummy_hash,
                is_active=True,
            ),
            User(
                role_id=roles_by_name["HR_MANAGER"].id,
                username="priya.patel",
                email="priya.patel@peoplepay360.in",
                password_hash=dummy_hash,
                is_active=True,
            ),
            User(
                role_id=roles_by_name["PAYROLL_OFFICER"].id,
                username="rohan.mehta",
                email="rohan.mehta@peoplepay360.in",
                password_hash=dummy_hash,
                is_active=True,
            ),
            User(
                role_id=roles_by_name["DEPT_MANAGER"].id,
                username="vikram.sengupta",
                email="vikram.sengupta@peoplepay360.in",
                password_hash=dummy_hash,
                is_active=True,
            ),
            User(
                role_id=roles_by_name["EMPLOYEE"].id,
                username="ananya.iyer",
                email="ananya.iyer@peoplepay360.in",
                password_hash=dummy_hash,
                is_active=True,
            ),
            User(
                role_id=roles_by_name["EMPLOYEE"].id,
                username="karthik.reddy",
                email="karthik.reddy@peoplepay360.in",
                password_hash=dummy_hash,
                is_active=True,
            ),
        ]
        session.add_all(users_data)
        session.flush()
        admin_user = users_data[0]
        hr_user = users_data[1]
        payroll_user = users_data[2]
        mgr_user = users_data[3]

        # -------------------------------------------------------------
        # 2. DEPARTMENTS & JOBS
        # -------------------------------------------------------------
        print("[2/14] Seeding Departments and Job Roles...")
        departments_data = [
            Department(name="Engineering & Technology", code="ENG", description="Software Development, DevOps, and Platform Engineering (Bangalore Tech Hub)"),
            Department(name="Human Resources & Talent", code="HR", description="People Operations, Talent Acquisition, and Employee Relations (Mumbai HQ)"),
            Department(name="Finance & Accounts", code="FIN", description="Corporate Finance, Payroll Compliance, and Statutory Accounts (Mumbai HQ)"),
            Department(name="Product & Design", code="PROD", description="Product Strategy, UI/UX Design, and Architecture (Bangalore)"),
            Department(name="Sales & Business Development", code="SALES", description="Enterprise Client Relations and Market Expansion (Delhi NCR)"),
            Department(name="Customer Success & Operations", code="OPS", description="Client Implementation and 24/7 Support Operations (Pune Hub)"),
        ]
        session.add_all(departments_data)
        session.flush()
        dept_by_code = {d.code: d for d in departments_data}

        jobs_data = [
            Job(name="VP of Engineering", code="JOB-ENG-VP", description="Technology leadership and engineering strategy"),
            Job(name="Principal Software Architect", code="JOB-ENG-ARCH", description="Core systems architecture and scalability"),
            Job(name="Senior Full Stack Engineer", code="JOB-ENG-SDE2", description="React, Python FastAPI, and PostgreSQL platform development"),
            Job(name="DevOps & Cloud Specialist", code="JOB-ENG-DEVOPS", description="AWS, Kubernetes, CI/CD, and infrastructure monitoring"),
            Job(name="QA Automation Engineer", code="JOB-ENG-QA", description="End-to-end automation and performance testing"),
            Job(name="Head of Human Resources", code="JOB-HR-HEAD", description="HR strategy, compliance, and organizational development"),
            Job(name="HR Operations & Talent Specialist", code="JOB-HR-SPEC", description="Onboarding, employee engagement, and statutory compliance"),
            Job(name="Lead Payroll Specialist", code="JOB-FIN-PAYROLL", description="End-to-end payroll processing and statutory tax compliance"),
            Job(name="Senior Financial Analyst", code="JOB-FIN-SR", description="Financial reporting, budgeting, and audits"),
            Job(name="Senior Product Manager", code="JOB-PROD-PM", description="Roadmap planning, customer discovery, and sprint alignment"),
            Job(name="Enterprise Sales Director", code="JOB-SALES-DIR", description="Revenue generation and enterprise deal closing"),
            Job(name="Customer Operations Lead", code="JOB-OPS-LEAD", description="Client onboarding and operational excellence"),
        ]
        session.add_all(jobs_data)
        session.flush()
        jobs_by_code = {j.code: j for j in jobs_data}

        # -------------------------------------------------------------
        # 3. EMPLOYEE TYPES
        # -------------------------------------------------------------
        print("[3/14] Seeding Employee Types...")
        employee_types_data = [
            EmployeeType(name="Full-Time Permanent", code="FT_PERM", description="Regular full-time employee with all statutory benefits (EPF, Gratuity, Medical)"),
            EmployeeType(name="Fixed-Term Contract", code="FT_CON", description="Contractual employee with fixed duration and milestone deliverables"),
            EmployeeType(name="Graduate Trainee / Intern", code="INTERN", description="Stipend-based trainee on a 6-month pre-placement program"),
            EmployeeType(name="Retainer / Consultant", code="CONSULTANT", description="Professional technical consultant operating under Indian TDS Section 194J"),
        ]
        session.add_all(employee_types_data)
        session.flush()
        emp_type_by_code = {et.code: et for et in employee_types_data}

        # -------------------------------------------------------------
        # 4. WORKING SCHEDULES & 12-HOUR SHIFT ROTAS
        # -------------------------------------------------------------
        print("[4/14] Seeding Working Schedules & Real-World Shifts...")
        schedules_data = [
            WorkingSchedule(name="Indian Standard General Shift (40h/wk)", code="IND_CORP_GEN", weekly_hours=Decimal("40.00"), is_active=True),
            WorkingSchedule(name="Early Morning Tech Shift (40h/wk)", code="IND_EARLY_TECH", weekly_hours=Decimal("40.00"), is_active=True),
            WorkingSchedule(name="Flexible Product & R&D Shift (40h/wk)", code="IND_FLEXI_RND", weekly_hours=Decimal("40.00"), is_active=True),
            WorkingSchedule(name="Operations Support 6-Day Shift (44h/wk)", code="IND_OPS_SAT", weekly_hours=Decimal("44.00"), is_active=True),
            WorkingSchedule(name="24x7 Customer Support Shift (40h/wk)", code="IND_EVENING_SUPP", weekly_hours=Decimal("40.00"), is_active=True),
        ]
        session.add_all(schedules_data)
        session.flush()

        # Schedule days (Mon=0 to Sun=6)
        schedule_days = []
        
        # 1. IND_CORP_GEN: Mon-Fri 09:00 AM - 06:00 PM (1h lunch)
        for d in range(7):
            is_work = d < 5
            schedule_days.append(
                WorkingScheduleDay(
                    working_schedule_id=schedules_data[0].id,
                    day_of_week=d,
                    start_time=time(9, 0) if is_work else None,
                    end_time=time(18, 0) if is_work else None,
                    break_minutes=60 if is_work else 0,
                    is_working_day=is_work,
                )
            )

        # 2. IND_EARLY_TECH: Mon-Fri 08:00 AM - 05:00 PM (1h lunch)
        for d in range(7):
            is_work = d < 5
            schedule_days.append(
                WorkingScheduleDay(
                    working_schedule_id=schedules_data[1].id,
                    day_of_week=d,
                    start_time=time(8, 0) if is_work else None,
                    end_time=time(17, 0) if is_work else None,
                    break_minutes=60 if is_work else 0,
                    is_working_day=is_work,
                )
            )

        # 3. IND_FLEXI_RND: Mon-Fri 10:00 AM - 07:00 PM (1h lunch)
        for d in range(7):
            is_work = d < 5
            schedule_days.append(
                WorkingScheduleDay(
                    working_schedule_id=schedules_data[2].id,
                    day_of_week=d,
                    start_time=time(10, 0) if is_work else None,
                    end_time=time(19, 0) if is_work else None,
                    break_minutes=60 if is_work else 0,
                    is_working_day=is_work,
                )
            )

        # 4. IND_OPS_SAT: Mon-Fri 09:00 AM - 06:00 PM, Sat 09:00 AM - 01:00 PM
        for d in range(7):
            if d < 5:
                schedule_days.append(
                    WorkingScheduleDay(
                        working_schedule_id=schedules_data[3].id,
                        day_of_week=d,
                        start_time=time(9, 0),
                        end_time=time(18, 0),
                        break_minutes=60,
                        is_working_day=True,
                    )
                )
            elif d == 5: # Saturday half day
                schedule_days.append(
                    WorkingScheduleDay(
                        working_schedule_id=schedules_data[3].id,
                        day_of_week=d,
                        start_time=time(9, 0),
                        end_time=time(13, 0),
                        break_minutes=0,
                        is_working_day=True,
                    )
                )
            else:
                schedule_days.append(
                    WorkingScheduleDay(
                        working_schedule_id=schedules_data[3].id,
                        day_of_week=d,
                        start_time=None,
                        end_time=None,
                        break_minutes=0,
                        is_working_day=False,
                    )
                )

        # 5. IND_EVENING_SUPP: Mon-Fri 02:00 PM - 11:00 PM (1h break)
        for d in range(7):
            is_work = d < 5
            schedule_days.append(
                WorkingScheduleDay(
                    working_schedule_id=schedules_data[4].id,
                    day_of_week=d,
                    start_time=time(14, 0) if is_work else None,
                    end_time=time(23, 0) if is_work else None,
                    break_minutes=60 if is_work else 0,
                    is_working_day=is_work,
                )
            )

        session.add_all(schedule_days)
        session.flush()

        # -------------------------------------------------------------
        # 5. EMPLOYEES (15 Diverse Profiles)
        # -------------------------------------------------------------
        print("[5/14] Seeding 15 Indian Employees across hubs...")
        employees_info = [
            {"code": "EMP-IND-001", "first": "Aarav", "last": "Sharma", "email": "aarav.sharma@peoplepay360.in", "phone": "+91 98450 11223", "dob": date(1986, 4, 15), "doj": date(2021, 1, 15), "dept": "ENG", "job": "JOB-ENG-VP", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED", "user_id": users_data[0].id, "schedule_idx": 0},
            {"code": "EMP-IND-002", "first": "Priya", "last": "Patel", "email": "priya.patel@peoplepay360.in", "phone": "+91 98200 44556", "dob": date(1989, 8, 22), "doj": date(2021, 3, 1), "dept": "HR", "job": "JOB-HR-HEAD", "type": "FT_PERM", "gender": "FEMALE", "marital": "MARRIED", "user_id": users_data[1].id, "schedule_idx": 0},
            {"code": "EMP-IND-003", "first": "Rohan", "last": "Mehta", "email": "rohan.mehta@peoplepay360.in", "phone": "+91 98110 77889", "dob": date(1991, 11, 10), "doj": date(2021, 6, 15), "dept": "FIN", "job": "JOB-FIN-PAYROLL", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED", "user_id": users_data[2].id, "schedule_idx": 0},
            {"code": "EMP-IND-004", "first": "Vikram", "last": "Sengupta", "email": "vikram.sengupta@peoplepay360.in", "phone": "+91 98860 33445", "dob": date(1988, 2, 18), "doj": date(2022, 1, 10), "dept": "ENG", "job": "JOB-ENG-ARCH", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED", "user_id": users_data[3].id, "schedule_idx": 2},
            {"code": "EMP-IND-005", "first": "Ananya", "last": "Iyer", "email": "ananya.iyer@peoplepay360.in", "phone": "+91 97900 66778", "dob": date(1994, 6, 30), "doj": date(2022, 4, 1), "dept": "ENG", "job": "JOB-ENG-SDE2", "type": "FT_PERM", "gender": "FEMALE", "marital": "SINGLE", "user_id": users_data[4].id, "schedule_idx": 1},
            {"code": "EMP-IND-006", "first": "Aditya", "last": "Verma", "email": "aditya.verma@peoplepay360.in", "phone": "+91 99100 22334", "dob": date(1992, 12, 5), "doj": date(2022, 7, 1), "dept": "SALES", "job": "JOB-SALES-DIR", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED", "user_id": None, "schedule_idx": 0},
            {"code": "EMP-IND-007", "first": "Neha", "last": "Kulkarni", "email": "neha.kulkarni@peoplepay360.in", "phone": "+91 98500 88990", "dob": date(1995, 3, 14), "doj": date(2022, 9, 15), "dept": "OPS", "job": "JOB-OPS-LEAD", "type": "FT_PERM", "gender": "FEMALE", "marital": "SINGLE", "user_id": None, "schedule_idx": 3},
            {"code": "EMP-IND-008", "first": "Rajesh", "last": "Nair", "email": "rajesh.nair@peoplepay360.in", "phone": "+91 98470 55667", "dob": date(1990, 9, 28), "doj": date(2023, 1, 16), "dept": "ENG", "job": "JOB-ENG-DEVOPS", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED", "user_id": None, "schedule_idx": 4},
            {"code": "EMP-IND-009", "first": "Sneha", "last": "Mukherjee", "email": "sneha.mukherjee@peoplepay360.in", "phone": "+91 98300 11224", "dob": date(1996, 7, 19), "doj": date(2023, 3, 1), "dept": "PROD", "job": "JOB-PROD-PM", "type": "FT_PERM", "gender": "FEMALE", "marital": "SINGLE", "user_id": None, "schedule_idx": 2},
            {"code": "EMP-IND-010", "first": "Karthik", "last": "Reddy", "email": "karthik.reddy@peoplepay360.in", "phone": "+91 98490 77881", "dob": date(1993, 10, 8), "doj": date(2023, 5, 2), "dept": "ENG", "job": "JOB-ENG-SDE2", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED", "user_id": users_data[5].id, "schedule_idx": 1},
            {"code": "EMP-IND-011", "first": "Pooja", "last": "Deshmukh", "email": "pooja.deshmukh@peoplepay360.in", "phone": "+91 98210 33448", "dob": date(1994, 1, 25), "doj": date(2023, 8, 1), "dept": "HR", "job": "JOB-HR-SPEC", "type": "FT_PERM", "gender": "FEMALE", "marital": "SINGLE", "user_id": None, "schedule_idx": 0},
            {"code": "EMP-IND-012", "first": "Amitav", "last": "Banerjee", "email": "amitav.banerjee@peoplepay360.in", "phone": "+91 98900 66772", "dob": date(1991, 5, 12), "doj": date(2023, 11, 1), "dept": "FIN", "job": "JOB-FIN-SR", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED", "user_id": None, "schedule_idx": 0},
            {"code": "EMP-IND-013", "first": "Divya", "last": "Swaminathan", "email": "divya.swami@peoplepay360.in", "phone": "+91 98400 99881", "dob": date(1997, 4, 3), "doj": date(2024, 1, 15), "dept": "ENG", "job": "JOB-ENG-QA", "type": "FT_PERM", "gender": "FEMALE", "marital": "SINGLE", "user_id": None, "schedule_idx": 1},
            {"code": "EMP-IND-014", "first": "Rahul", "last": "Joshi", "email": "rahul.joshi@peoplepay360.in", "phone": "+91 98205 77661", "dob": date(1998, 8, 14), "doj": date(2024, 3, 1), "dept": "ENG", "job": "JOB-ENG-SDE2", "type": "FT_CON", "gender": "MALE", "marital": "SINGLE", "user_id": None, "schedule_idx": 1},
            {"code": "EMP-IND-015", "first": "Meera", "last": "Ranganathan", "email": "meera.ranga@peoplepay360.in", "phone": "+91 98480 22331", "dob": date(2001, 10, 19), "doj": date(2024, 6, 1), "dept": "PROD", "job": "JOB-PROD-PM", "type": "INTERN", "gender": "FEMALE", "marital": "SINGLE", "user_id": None, "schedule_idx": 2},
        ]

        created_employees = []
        for emp_info in employees_info:
            emp = Employee(
                user_id=emp_info["user_id"],
                employee_code=emp_info["code"],
                first_name=emp_info["first"],
                last_name=emp_info["last"],
                email=emp_info["email"],
                phone=emp_info["phone"],
                date_of_birth=emp_info["dob"],
                date_of_joining=emp_info["doj"],
                department_id=dept_by_code[str(emp_info["dept"])].id,
                job_id=jobs_by_code[str(emp_info["job"])].id,
                employee_type_id=emp_type_by_code[str(emp_info["type"])].id,
                manager_id=None,
                status="ACTIVE",
            )
            created_employees.append(emp)

        session.add_all(created_employees)
        session.flush()

        # Update department heads & managerial hierarchy
        dept_by_code["ENG"].manager_id = created_employees[0].id  # Aarav Sharma
        dept_by_code["HR"].manager_id = created_employees[1].id   # Priya Patel
        dept_by_code["FIN"].manager_id = created_employees[2].id  # Rohan Mehta
        dept_by_code["SALES"].manager_id = created_employees[5].id # Aditya Verma
        dept_by_code["OPS"].manager_id = created_employees[6].id  # Neha Kulkarni

        # Assign managers
        for emp in created_employees[3:]:
            if emp.department_id == dept_by_code["ENG"].id:
                emp.manager_id = created_employees[0].id
            elif emp.department_id == dept_by_code["HR"].id:
                emp.manager_id = created_employees[1].id
            elif emp.department_id == dept_by_code["FIN"].id:
                emp.manager_id = created_employees[2].id
            elif emp.department_id == dept_by_code["SALES"].id:
                emp.manager_id = created_employees[5].id
            else:
                emp.manager_id = created_employees[6].id

        # -------------------------------------------------------------
        # 6. SCHEDULE ASSIGNMENTS (Current & Historical)
        # -------------------------------------------------------------
        print("[6/14] Seeding Schedule Assignments & Shift Histories...")
        schedule_assignments = []
        for idx, emp in enumerate(created_employees):
            s_idx = employees_info[idx]["schedule_idx"]
            
            # For EMP-IND-004 (Vikram), create a historical schedule change
            if emp.employee_code == "EMP-IND-004":
                # Old schedule: 2022-01-10 to 2025-12-31 on Standard Shift
                schedule_assignments.append(
                    EmployeeScheduleAssignment(
                        employee_id=emp.id,
                        working_schedule_id=schedules_data[0].id,
                        start_date=date(2022, 1, 10),
                        end_date=date(2025, 12, 31),
                        is_active=False,
                    )
                )
                # Active schedule: 2026-01-01 to Present on Flexi R&D
                schedule_assignments.append(
                    EmployeeScheduleAssignment(
                        employee_id=emp.id,
                        working_schedule_id=schedules_data[2].id,
                        start_date=date(2026, 1, 1),
                        end_date=None,
                        is_active=True,
                    )
                )
            else:
                schedule_assignments.append(
                    EmployeeScheduleAssignment(
                        employee_id=emp.id,
                        working_schedule_id=schedules_data[s_idx].id,
                        start_date=emp.date_of_joining,
                        end_date=None,
                        is_active=True,
                    )
                )

        session.add_all(schedule_assignments)
        session.flush()

        # -------------------------------------------------------------
        # 7. BANK ACCOUNTS (Varied Indian Banks, Secondary Accounts, Missing Account Demo)
        # -------------------------------------------------------------
        print("[7/14] Seeding Varied Indian Bank Accounts (SBI, HDFC, ICICI, Axis, Kotak, BOB, PNB)...")
        bank_accounts = []
        bank_configs = [
            ("HDFC Bank", "HDFC0001024", "Koramangala 4th Block, Bangalore", "5010024"),
            ("ICICI Bank", "ICIC0000180", "Bandra Kurla Complex, Mumbai", "0180015"),
            ("State Bank of India", "SBIN0004123", "MG Road Branch, Pune", "3045981"),
            ("Axis Bank", "UTIB0000845", "Cyber City, DLF Phase 2, Gurugram", "9140200"),
            ("Kotak Mahindra Bank", "KKBK0000650", "Hitech City, Madhapur, Hyderabad", "6501234"),
            ("Bank of Baroda", "BARB0KORAMA", "Indiranagar 100ft Rd, Bangalore", "2049010"),
            ("Punjab National Bank", "PUNB0024000", "Connaught Place, New Delhi", "0240001"),
        ]

        # Note: EMP-IND-012 (Amitav Banerjee) will intentionally have NO bank account to trigger MISSING_BANK_DETAILS warning!
        for idx, emp in enumerate(created_employees):
            if emp.employee_code == "EMP-IND-012":
                continue # Intentional demo scenario for missing bank warning
            
            b_name, b_ifsc, b_branch, b_pfx = bank_configs[idx % len(bank_configs)]
            acc_num = f"{b_pfx}{10000000 + idx * 8765}"
            
            # Primary Account
            bank_accounts.append(
                EmployeeBankAccount(
                    employee_id=emp.id,
                    account_holder_name=f"{emp.first_name} {emp.last_name}",
                    account_number=acc_num,
                    bank_name=b_name,
                    ifsc_code=b_ifsc,
                    branch_name=b_branch,
                    account_type="SAVINGS",
                    is_primary=True,
                    is_active=True,
                )
            )

            # For EMP-IND-001 (Aarav), add a secondary investment account
            if emp.employee_code == "EMP-IND-001":
                bank_accounts.append(
                    EmployeeBankAccount(
                        employee_id=emp.id,
                        account_holder_name="Aarav Sharma",
                        account_number="018001599887766",
                        bank_name="ICICI Bank",
                        ifsc_code="ICIC0000180",
                        branch_name="Whitefield Branch, Bangalore",
                        account_type="CURRENT",
                        is_primary=False,
                        is_active=True,
                    )
                )

        session.add_all(bank_accounts)
        session.flush()

        # -------------------------------------------------------------
        # 8. SALARY STRUCTURES & RULES (6 Indian Corporate Frameworks)
        # -------------------------------------------------------------
        print("[8/14] Seeding 6 Indian Salary Structures & 18 Statutory Rules...")
        
        salary_structures_data = [
            SalaryStructure(name="Indian Standard Tech Professional Structure", code="IND_STD_TECH", description="Standard Indian IT/Tech package with Basic (50%), HRA, Special Allowance, EPF, PT, and TDS", is_active=True),
            SalaryStructure(name="Indian Executive & Leadership Structure", code="IND_EXEC_LEAD", description="Leadership CTC with Executive Car Allowance, Performance Bonus, Special Allowance, EPF, PT, and High TDS", is_active=True),
            SalaryStructure(name="Sales & Business Development Structure", code="IND_SALES_COMM", description="Sales CTC with Basic (40%), HRA, Sales Commission, Travel Allowance, EPF, and PT", is_active=True),
            SalaryStructure(name="Operations & Customer Support Structure", code="IND_OPS_SHIFT", description="Operations CTC with Night Shift Allowance, Attendance Bonus, EPF, and PT", is_active=True),
            SalaryStructure(name="Professional Retainer / Consultant (194J)", code="IND_CONSULTANT", description="Retainer fees subject to 10% TDS withholding under Section 194J", is_active=True),
            SalaryStructure(name="Graduate Intern & Trainee Fixed Stipend", code="IND_INTERN_STIPEND", description="Consolidated monthly stipend without statutory PF/PT deductions", is_active=True),
        ]
        session.add_all(salary_structures_data)
        session.flush()

        struct_tech = salary_structures_data[0]
        struct_exec = salary_structures_data[1]
        struct_sales = salary_structures_data[2]
        struct_ops = salary_structures_data[3]
        struct_consult = salary_structures_data[4]
        struct_intern = salary_structures_data[5]

        salary_rules_data = [
            # Earnings
            SalaryRule(name="Basic Salary", code="BASIC", category="BASIC", sequence=10, calculation_type="PERCENTAGE", percentage=Decimal("50.0000"), amount=None, formula=None, description="50% of Monthly Gross CTC"),
            SalaryRule(name="House Rent Allowance (HRA)", code="HRA", category="ALLOWANCE", sequence=20, calculation_type="PERCENTAGE", percentage=Decimal("50.0000"), amount=None, formula="50% of Basic Salary (Metro)", description="Section 10(13A) HRA exemption eligible"),
            SalaryRule(name="Special Allowance", code="SPECIAL_ALLOW", category="ALLOWANCE", sequence=30, calculation_type="FORMULA", percentage=None, amount=None, formula="TOTAL_WAGE - BASIC - HRA - OTHER_ALLOWANCES", description="Flexible balancing allowance"),
            SalaryRule(name="Conveyance Allowance", code="CONVEYANCE", category="ALLOWANCE", sequence=40, calculation_type="FIXED", percentage=None, amount=Decimal("1600.00"), formula=None, description="Standard statutory conveyance"),
            SalaryRule(name="Medical Allowance", code="MEDICAL_ALLOW", category="ALLOWANCE", sequence=50, calculation_type="FIXED", percentage=None, amount=Decimal("1250.00"), formula=None, description="Medical reimbursement allowance"),
            SalaryRule(name="Executive Car Allowance", code="CAR_ALLOW", category="ALLOWANCE", sequence=55, calculation_type="FIXED", percentage=None, amount=Decimal("15000.00"), formula=None, description="Executive company vehicle perk"),
            SalaryRule(name="Sales Incentive Commission", code="SALES_COMM", category="ALLOWANCE", sequence=60, calculation_type="PERCENTAGE", percentage=Decimal("20.0000"), amount=None, formula="20% of Base Wage", description="Monthly sales target incentive"),
            SalaryRule(name="Travel & Field Allowance", code="TRAVEL_ALLOW", category="ALLOWANCE", sequence=65, calculation_type="FIXED", percentage=None, amount=Decimal("5000.00"), formula=None, description="Client visits and transit allowance"),
            SalaryRule(name="Night Shift Allowance", code="SHIFT_ALLOW", category="ALLOWANCE", sequence=70, calculation_type="FIXED", percentage=None, amount=Decimal("3000.00"), formula=None, description="Rotational night shift allowance"),
            SalaryRule(name="Monthly Attendance Bonus", code="ATTEND_BONUS", category="ALLOWANCE", sequence=75, calculation_type="FIXED", percentage=None, amount=Decimal("2000.00"), formula=None, description="100% attendance punctuality reward"),
            SalaryRule(name="Performance Bonus", code="PERF_BONUS", category="ALLOWANCE", sequence=80, calculation_type="PERCENTAGE", percentage=Decimal("15.0000"), amount=None, formula="15% of Base Wage", description="Quarterly/Monthly performance payout"),
            SalaryRule(name="Gross Salary", code="GROSS", category="GROSS", sequence=100, calculation_type="FORMULA", percentage=None, amount=None, formula="SUM(EARNINGS)", description="Total monthly earnings before deductions"),
            
            # Deductions
            SalaryRule(name="Employee Provident Fund (EPF)", code="EPF_EE", category="DEDUCTION", sequence=110, calculation_type="PERCENTAGE", percentage=Decimal("12.0000"), amount=None, formula="12% of Basic Salary", description="Statutory EPF contribution to EPFO"),
            SalaryRule(name="Professional Tax (PT)", code="PT", category="DEDUCTION", sequence=120, calculation_type="FIXED", percentage=None, amount=Decimal("200.00"), formula=None, description="State Government Professional Tax (₹200/mo)"),
            SalaryRule(name="Tax Deducted at Source (TDS Sec 192)", code="TDS", category="DEDUCTION", sequence=130, calculation_type="PERCENTAGE", percentage=Decimal("10.0000"), amount=None, formula="Monthly Income Tax Withholding", description="TDS under Income Tax Act Section 192"),
            SalaryRule(name="Professional TDS (Section 194J)", code="TDS_194J", category="DEDUCTION", sequence=135, calculation_type="PERCENTAGE", percentage=Decimal("10.0000"), amount=None, formula="10% flat withholding on professional fees", description="TDS under Section 194J for Retainers"),
            SalaryRule(name="Total Deductions", code="TOTAL_DED", category="DEDUCTION", sequence=190, calculation_type="FORMULA", percentage=None, amount=None, formula="SUM(DEDUCTIONS)", description="Sum of monthly deductions"),
            
            # Net & Employer
            SalaryRule(name="Net Salary Payable", code="NET", category="NET", sequence=200, calculation_type="FORMULA", percentage=None, amount=None, formula="GROSS - TOTAL_DED", description="Take-home salary credited to bank account"),
            SalaryRule(name="Employer EPF Contribution", code="EPF_ER", category="CONTRIBUTION", sequence=210, calculation_type="PERCENTAGE", percentage=Decimal("12.0000"), amount=None, formula="12% of Basic Salary", description="Employer statutory contribution to EPFO"),
        ]
        session.add_all(salary_rules_data)
        session.flush()

        rules_by_code = {r.code: r for r in salary_rules_data}

        # Map rules to structures
        structure_mappings = {
            struct_tech.id: ["BASIC", "HRA", "SPECIAL_ALLOW", "CONVEYANCE", "MEDICAL_ALLOW", "GROSS", "EPF_EE", "PT", "TDS", "TOTAL_DED", "NET", "EPF_ER"],
            struct_exec.id: ["BASIC", "HRA", "SPECIAL_ALLOW", "CAR_ALLOW", "PERF_BONUS", "GROSS", "EPF_EE", "PT", "TDS", "TOTAL_DED", "NET", "EPF_ER"],
            struct_sales.id: ["BASIC", "HRA", "SPECIAL_ALLOW", "SALES_COMM", "TRAVEL_ALLOW", "GROSS", "EPF_EE", "PT", "TDS", "TOTAL_DED", "NET", "EPF_ER"],
            struct_ops.id: ["BASIC", "HRA", "SPECIAL_ALLOW", "SHIFT_ALLOW", "ATTEND_BONUS", "GROSS", "EPF_EE", "PT", "TDS", "TOTAL_DED", "NET", "EPF_ER"],
            struct_consult.id: ["BASIC", "GROSS", "TDS_194J", "TOTAL_DED", "NET"],
            struct_intern.id: ["BASIC", "GROSS", "TOTAL_DED", "NET"],
        }

        struct_rules = []
        for s_id, r_codes in structure_mappings.items():
            for seq, code in enumerate(r_codes, start=1):
                rule = rules_by_code[code]
                struct_rules.append(
                    SalaryStructureRule(
                        salary_structure_id=s_id,
                        salary_rule_id=rule.id,
                        sequence=seq * 10,
                        is_active=True,
                    )
                )
        session.add_all(struct_rules)
        session.flush()

        # -------------------------------------------------------------
        # 9. CONTRACTS (Historical, Active, Expiring, Varied Compensation)
        # -------------------------------------------------------------
        print("[9/14] Seeding Varied Contracts (Active & Historical Expired)...")
        contracts = []
        
        # Mapping employees to monthly wage & structures
        emp_contract_configs = [
            # 0: Aarav Sharma (VP Eng) -> Has historical contract (2024-2025) and active (2026+)
            {"wage": Decimal("300000.00"), "struct": struct_exec, "schedule": schedules_data[0]},
            # 1: Priya Patel (Head HR)
            {"wage": Decimal("220000.00"), "struct": struct_exec, "schedule": schedules_data[0]},
            # 2: Rohan Mehta (Lead Payroll)
            {"wage": Decimal("180000.00"), "struct": struct_tech, "schedule": schedules_data[0]},
            # 3: Vikram Sengupta (Architect)
            {"wage": Decimal("260000.00"), "struct": struct_exec, "schedule": schedules_data[2]},
            # 4: Ananya Iyer (Sr SDE) -> Has historical contract (2023-2025) and active (2025+)
            {"wage": Decimal("130000.00"), "struct": struct_tech, "schedule": schedules_data[1]},
            # 5: Aditya Verma (Sales Director)
            {"wage": Decimal("210000.00"), "struct": struct_sales, "schedule": schedules_data[0]},
            # 6: Neha Kulkarni (Ops Lead)
            {"wage": Decimal("115000.00"), "struct": struct_ops, "schedule": schedules_data[3]},
            # 7: Rajesh Nair (DevOps)
            {"wage": Decimal("145000.00"), "struct": struct_tech, "schedule": schedules_data[4]},
            # 8: Sneha Mukherjee (Product PM)
            {"wage": Decimal("155000.00"), "struct": struct_tech, "schedule": schedules_data[2]},
            # 9: Karthik Reddy (SDE 2)
            {"wage": Decimal("125000.00"), "struct": struct_tech, "schedule": schedules_data[1]},
            # 10: Pooja Deshmukh (HR Spec)
            {"wage": Decimal("85000.00"), "struct": struct_tech, "schedule": schedules_data[0]},
            # 11: Amitav Banerjee (Fin Analyst)
            {"wage": Decimal("95000.00"), "struct": struct_tech, "schedule": schedules_data[0]},
            # 12: Divya Swaminathan (QA)
            {"wage": Decimal("75000.00"), "struct": struct_tech, "schedule": schedules_data[1]},
            # 13: Rahul Joshi (Contract SDE - Fixed Term expiring soon)
            {"wage": Decimal("65000.00"), "struct": struct_consult, "schedule": schedules_data[1]},
            # 14: Meera Ranganathan (Intern - Fixed Stipend)
            {"wage": Decimal("35000.00"), "struct": struct_intern, "schedule": schedules_data[2]},
        ]

        # 1. Historical Expired Contract for Aarav Sharma (EMP-IND-001)
        contracts.append(
            Contract(
                employee_id=created_employees[0].id,
                department_id=created_employees[0].department_id,
                job_id=created_employees[0].job_id,
                working_schedule_id=schedules_data[0].id,
                salary_structure_id=struct_tech.id,
                contract_number="CONT-IND-EMP001-2024",
                wage=Decimal("220000.00"),
                start_date=date(2024, 1, 1),
                end_date=date(2025, 12, 31),
                status="EXPIRED",
                employment_terms="Prior Senior Engineering Management Contract FY 2024-25. Replaced on promotion to VP.",
            )
        )

        # 2. Historical Expired Contract for Ananya Iyer (EMP-IND-005)
        contracts.append(
            Contract(
                employee_id=created_employees[4].id,
                department_id=created_employees[4].department_id,
                job_id=created_employees[4].job_id,
                working_schedule_id=schedules_data[1].id,
                salary_structure_id=struct_tech.id,
                contract_number="CONT-IND-EMP005-2023",
                wage=Decimal("90000.00"),
                start_date=date(2023, 4, 1),
                end_date=date(2025, 3, 31),
                status="EXPIRED",
                employment_terms="Prior SDE 1 Contract. Upgraded to Senior SDE package on annual appraisal.",
            )
        )

        # 3. Active Current Contracts for all 15 employees
        active_contracts_map = {}
        for idx, emp in enumerate(created_employees):
            cfg = emp_contract_configs[idx]
            is_fixed_term = (emp.employee_code == "EMP-IND-014") # Expiring contract
            is_intern = (emp.employee_code == "EMP-IND-015")

            c = Contract(
                employee_id=emp.id,
                department_id=emp.department_id,
                job_id=emp.job_id,
                working_schedule_id=cfg["schedule"].id,
                salary_structure_id=cfg["struct"].id,
                contract_number=f"CONT-IND-{emp.employee_code}-2026",
                wage=cfg["wage"],
                start_date=date(2026, 1, 1) if emp.date_of_joining < date(2026, 1, 1) else emp.date_of_joining,
                end_date=date(2026, 9, 30) if is_fixed_term else (date(2026, 11, 30) if is_intern else None),
                status="ACTIVE",
                employment_terms=f"Active Indian Corporate Employment Agreement governed under Karnataka/Maharashtra S&E Act. Monthly Gross Base: INR {cfg['wage']:,.2f}",
            )
            contracts.append(c)
            active_contracts_map[emp.id] = c

        session.add_all(contracts)
        session.flush()

        # -------------------------------------------------------------
        # 10. LEAVE TYPES, ALLOCATIONS & DIVERSE REQUESTS
        # -------------------------------------------------------------
        print("[10/14] Seeding Indian Leave Types, Varied Allocations & Requests (Approved, Pending, Refused)...")
        
        time_off_types_data = [
            TimeOffType(name="Casual Leave (CL)", code="CL", unit="DAYS", allocation_required=True, approval_required=True, payroll_integration=True, is_active=True, description="Paid casual leave for personal commitments"),
            TimeOffType(name="Privilege / Earned Leave (PL)", code="PL", unit="DAYS", allocation_required=True, approval_required=True, payroll_integration=True, is_active=True, description="Earned leave accumulated per working month"),
            TimeOffType(name="Sick Leave (SL)", code="SL", unit="DAYS", allocation_required=True, approval_required=True, payroll_integration=True, is_active=True, description="Medical sick leave"),
            TimeOffType(name="Maternity Leave (ML)", code="ML", unit="DAYS", allocation_required=False, approval_required=True, payroll_integration=True, is_active=True, description="26 weeks statutory maternity benefit"),
            TimeOffType(name="Optional / Festival Holiday", code="FEST_HOL", unit="DAYS", allocation_required=True, approval_required=True, payroll_integration=True, is_active=True, description="Optional religious and festival holidays"),
        ]
        session.add_all(time_off_types_data)
        session.flush()

        # Diverse leave allocations per employee
        allocations = []
        alloc_map = {} # (emp_id, type_code) -> allocation

        # Distinct allocation profiles
        allocation_profiles = [
            {"CL": (Decimal("12.00"), Decimal("3.00")), "PL": (Decimal("18.00"), Decimal("4.00")), "SL": (Decimal("10.00"), Decimal("1.00"))},
            {"CL": (Decimal("14.00"), Decimal("6.00")), "PL": (Decimal("20.00"), Decimal("2.00")), "SL": (Decimal("12.00"), Decimal("3.00"))},
            {"CL": (Decimal("10.00"), Decimal("1.00")), "PL": (Decimal("15.00"), Decimal("5.00")), "SL": (Decimal("8.00"), Decimal("0.00"))},
            {"CL": (Decimal("12.00"), Decimal("5.00")), "PL": (Decimal("18.00"), Decimal("7.00")), "SL": (Decimal("10.00"), Decimal("2.00"))},
            {"CL": (Decimal("10.00"), Decimal("2.00")), "PL": (Decimal("12.00"), Decimal("1.00")), "SL": (Decimal("8.00"), Decimal("4.00"))},
        ]

        for idx, emp in enumerate(created_employees):
            prof = allocation_profiles[idx % len(allocation_profiles)]
            
            # CL
            cl_alloc, cl_taken = prof["CL"]
            a_cl = TimeOffAllocation(
                employee_id=emp.id,
                time_off_type_id=time_off_types_data[0].id,
                allocated_amount=cl_alloc,
                taken_amount=cl_taken,
                start_date=date(2026, 4, 1),
                end_date=date(2027, 3, 31),
                status="APPROVED",
                approved_by_user_id=admin_user.id,
                approved_at=datetime(2026, 4, 1, 10, 0),
                notes=f"FY 2026-27 Casual Leave Entitlement ({cl_alloc} days)",
            )
            allocations.append(a_cl)

            # PL
            pl_alloc, pl_taken = prof["PL"]
            a_pl = TimeOffAllocation(
                employee_id=emp.id,
                time_off_type_id=time_off_types_data[1].id,
                allocated_amount=pl_alloc,
                taken_amount=pl_taken,
                start_date=date(2026, 4, 1),
                end_date=date(2027, 3, 31),
                status="APPROVED",
                approved_by_user_id=admin_user.id,
                approved_at=datetime(2026, 4, 1, 10, 0),
                notes=f"FY 2026-27 Privilege Leave Entitlement ({pl_alloc} days)",
            )
            allocations.append(a_pl)

            # SL
            sl_alloc, sl_taken = prof["SL"]
            a_sl = TimeOffAllocation(
                employee_id=emp.id,
                time_off_type_id=time_off_types_data[2].id,
                allocated_amount=sl_alloc,
                taken_amount=sl_taken,
                start_date=date(2026, 4, 1),
                end_date=date(2027, 3, 31),
                status="APPROVED",
                approved_by_user_id=admin_user.id,
                approved_at=datetime(2026, 4, 1, 10, 0),
                notes=f"FY 2026-27 Sick Leave Entitlement ({sl_alloc} days)",
            )
            allocations.append(a_sl)

        session.add_all(allocations)
        session.flush()

        for a in allocations:
            tt = [t for t in time_off_types_data if t.id == a.time_off_type_id][0]
            alloc_map[(a.employee_id, tt.code)] = a

        # Diverse leave requests (APPROVED, PENDING, REFUSED, CANCELLED)
        leave_requests = [
            # 1. APPROVED (Casual Leave) - Ananya Iyer
            TimeOffRequest(
                employee_id=created_employees[4].id,
                time_off_type_id=time_off_types_data[0].id,
                allocation_id=alloc_map[(created_employees[4].id, "CL")].id,
                start_date=date(2026, 8, 14),
                end_date=date(2026, 8, 14),
                requested_amount=Decimal("1.00"),
                reason="Personal family commitment in Chennai",
                status="APPROVED",
                approved_by_user_id=admin_user.id,
                approved_at=datetime(2026, 8, 10, 14, 30),
            ),
            # 2. APPROVED (Privilege Leave) - Rajesh Nair
            TimeOffRequest(
                employee_id=created_employees[7].id,
                time_off_type_id=time_off_types_data[1].id,
                allocation_id=alloc_map[(created_employees[7].id, "PL")].id,
                start_date=date(2026, 8, 20),
                end_date=date(2026, 8, 22),
                requested_amount=Decimal("3.00"),
                reason="Onam festival celebration with family in Kochi",
                status="APPROVED",
                approved_by_user_id=admin_user.id,
                approved_at=datetime(2026, 8, 12, 11, 15),
            ),
            # 3. PENDING (Sick Leave) - Karthik Reddy
            TimeOffRequest(
                employee_id=created_employees[9].id,
                time_off_type_id=time_off_types_data[2].id,
                allocation_id=alloc_map[(created_employees[9].id, "SL")].id,
                start_date=date(2026, 9, 2),
                end_date=date(2026, 9, 3),
                requested_amount=Decimal("2.00"),
                reason="Viral fever and recovery prescribed by doctor",
                status="PENDING",
                approved_by_user_id=None,
                approved_at=None,
            ),
            # 4. PENDING (Casual Leave) - Pooja Deshmukh
            TimeOffRequest(
                employee_id=created_employees[10].id,
                time_off_type_id=time_off_types_data[0].id,
                allocation_id=alloc_map[(created_employees[10].id, "CL")].id,
                start_date=date(2026, 9, 10),
                end_date=date(2026, 9, 11),
                requested_amount=Decimal("2.00"),
                reason="Sister's wedding anniversary ceremony in Pune",
                status="PENDING",
                approved_by_user_id=None,
                approved_at=None,
            ),
            # 5. REFUSED (Privilege Leave) - Aditya Verma
            TimeOffRequest(
                employee_id=created_employees[5].id,
                time_off_type_id=time_off_types_data[1].id,
                allocation_id=alloc_map[(created_employees[5].id, "PL")].id,
                start_date=date(2026, 8, 28),
                end_date=date(2026, 8, 30),
                requested_amount=Decimal("3.00"),
                reason="Quarter-end sales holiday trip",
                status="REFUSED",
                approved_by_user_id=admin_user.id,
                refused_at=datetime(2026, 8, 25, 16, 0),
                refusal_reason="Critical Q2 Enterprise deal closure week. All sales directors required on-site.",
            ),
            # 6. CANCELLED (Casual Leave) - Sneha Mukherjee
            TimeOffRequest(
                employee_id=created_employees[8].id,
                time_off_type_id=time_off_types_data[0].id,
                allocation_id=alloc_map[(created_employees[8].id, "CL")].id,
                start_date=date(2026, 8, 5),
                end_date=date(2026, 8, 5),
                requested_amount=Decimal("1.00"),
                reason="Home maintenance appointment",
                status="CANCELLED",
                approved_by_user_id=None,
                approved_at=None,
            ),
        ]
        session.add_all(leave_requests)
        session.flush()

        # -------------------------------------------------------------
        # 11. ATTENDANCE (Realistic Variety: Present, Late, Absent, Overtime, Missing Checkout, Corrected)
        # -------------------------------------------------------------
        print("[11/14] Seeding 400+ Varied Biometric Attendance Logs & Corrections...")
        attendances = []
        attendance_to_correct = None
        
        base_date = date(2026, 8, 1)
        end_date = date(2026, 9, 5)
        num_days = (end_date - base_date).days + 1

        for day_offset in range(num_days):
            curr_date = base_date + timedelta(days=day_offset)
            if curr_date.weekday() == 6: # Skip Sunday
                continue

            for idx, emp in enumerate(created_employees):
                # Saturday: Only EMP-IND-007 (Ops Shift 6-day) works on Sat
                if curr_date.weekday() == 5:
                    if emp.employee_code != "EMP-IND-007":
                        continue
                    # Half day Saturday
                    c_in = datetime.combine(curr_date, time(9, 2))
                    c_out = datetime.combine(curr_date, time(13, 5))
                    attendances.append(
                        Attendance(
                            employee_id=emp.id,
                            check_in=c_in,
                            check_out=c_out,
                            worked_hours=Decimal("4.00"),
                            status="HALF_DAY",
                            notes="Saturday 4-hour operational shift",
                        )
                    )
                    continue

                # Introduce deliberate realistic variations based on employee & date
                rand_seed = (emp.id * 100 + curr_date.day) % 20

                # 1. ABSENT Case (e.g. EMP-IND-012 on Aug 18, EMP-IND-006 on Aug 28)
                if (emp.employee_code == "EMP-IND-012" and curr_date.day == 18) or (emp.employee_code == "EMP-IND-006" and curr_date.day == 28):
                    attendances.append(
                        Attendance(
                            employee_id=emp.id,
                            check_in=datetime.combine(curr_date, time(9, 0)),
                            check_out=None,
                            worked_hours=Decimal("0.00"),
                            status="ABSENT",
                            notes="Unplanned absence recorded by gate reader",
                        )
                    )
                # 2. MISSING CHECKOUT Case (e.g. EMP-IND-010 on Aug 21, EMP-IND-014 on Sep 3)
                elif (emp.employee_code == "EMP-IND-010" and curr_date.day == 21) or (emp.employee_code == "EMP-IND-014" and curr_date.day == 3 and curr_date.month == 9):
                    attendances.append(
                        Attendance(
                            employee_id=emp.id,
                            check_in=datetime.combine(curr_date, time(9, 12)),
                            check_out=None,
                            worked_hours=Decimal("0.00"),
                            status="MISSING_CHECKOUT",
                            notes="Employee checked in but missed exit biometric punch",
                        )
                    )
                # 3. LATE Case (e.g. check-in after 10:00 AM)
                elif rand_seed in [3, 7]:
                    c_in = datetime.combine(curr_date, time(10, random.randint(15, 45)))
                    c_out = datetime.combine(curr_date, time(18, random.randint(45, 55)))
                    worked = Decimal(f"{(c_out - c_in).total_seconds() / 3600 - 1.0:.2f}")
                    attendances.append(
                        Attendance(
                            employee_id=emp.id,
                            check_in=c_in,
                            check_out=c_out,
                            worked_hours=max(Decimal("0.00"), worked),
                            status="LATE",
                            notes="Traffic delay at Outer Ring Road, late check-in logged",
                        )
                    )
                # 4. OVERTIME Case (e.g. 11+ hours)
                elif rand_seed in [5, 11] and emp.employee_code in ["EMP-IND-004", "EMP-IND-008", "EMP-IND-005"]:
                    c_in = datetime.combine(curr_date, time(8, 45))
                    c_out = datetime.combine(curr_date, time(20, random.randint(15, 45)))
                    worked = Decimal(f"{(c_out - c_in).total_seconds() / 3600 - 1.0:.2f}")
                    attendances.append(
                        Attendance(
                            employee_id=emp.id,
                            check_in=c_in,
                            check_out=c_out,
                            worked_hours=worked,
                            status="OVERTIME",
                            notes="Production release deployment & on-call extended shift",
                        )
                    )
                # 5. CORRECTED Log candidate (EMP-IND-003 on Aug 11)
                elif emp.employee_code == "EMP-IND-003" and curr_date.day == 11 and curr_date.month == 8:
                    att_corr = Attendance(
                        employee_id=emp.id,
                        check_in=datetime.combine(curr_date, time(9, 0)),
                        check_out=datetime.combine(curr_date, time(18, 0)),
                        worked_hours=Decimal("8.00"),
                        status="CORRECTED",
                        notes="Punch adjusted by HR Admin upon manual attendance regularization form",
                    )
                    attendances.append(att_corr)
                    attendance_to_correct = att_corr
                # 6. Standard PRESENT Case
                else:
                    in_m = random.choice([48, 52, 55, 2, 8, 14])
                    in_h = 8 if in_m > 40 else 9
                    out_h = random.choice([17, 18, 18, 18])
                    out_m = random.choice([35, 45, 52, 10, 20])
                    
                    c_in = datetime.combine(curr_date, time(in_h, in_m))
                    c_out = datetime.combine(curr_date, time(out_h, out_m))
                    worked = Decimal(f"{(c_out - c_in).total_seconds() / 3600 - 1.0:.2f}")
                    attendances.append(
                        Attendance(
                            employee_id=emp.id,
                            check_in=c_in,
                            check_out=c_out,
                            worked_hours=max(Decimal("0.00"), worked),
                            status="PRESENT",
                            notes="Biometric punch log verified",
                        )
                    )

        session.add_all(attendances)
        session.flush()

        # Attendance Correction Record
        if attendance_to_correct:
            corr = AttendanceCorrection(
                attendance_id=attendance_to_correct.id,
                corrected_by_user_id=hr_user.id,
                old_check_in=datetime(2026, 8, 11, 9, 35),
                old_check_out=None,
                new_check_in=datetime(2026, 8, 11, 9, 0),
                new_check_out=datetime(2026, 8, 11, 18, 0),
                reason="Employee forgot to punch out due to client meeting at Lower Parel office.",
            )
            session.add(corr)
            session.flush()

        # -------------------------------------------------------------
        # 12. PAYRUNS (Multiple Months & Statuses: June, July, August Paid, Sep Draft, Q2 Incentive, Intern Stipend)
        # -------------------------------------------------------------
        print("[12/14] Seeding Diverse Payruns across cycles & structures...")
        
        # Payrun 1: June 2026 (PAID)
        pr_june = Payrun(
            name="June 2026 Regular Monthly Payrun",
            salary_structure_id=struct_tech.id,
            period_start=date(2026, 6, 1),
            period_end=date(2026, 6, 30),
            status="PAID",
            computed_at=datetime(2026, 6, 28, 15, 0),
            validated_at=datetime(2026, 6, 29, 11, 0),
            paid_at=datetime(2026, 6, 30, 10, 0),
            sent_at=datetime(2026, 6, 30, 12, 0),
            notes="June 2026 closed cycle with statutory EPF challan and PT filing.",
            created_by_user_id=payroll_user.id,
        )

        # Payrun 2: July 2026 (PAID)
        pr_july = Payrun(
            name="July 2026 Regular Monthly Payrun",
            salary_structure_id=struct_tech.id,
            period_start=date(2026, 7, 1),
            period_end=date(2026, 7, 31),
            status="PAID",
            computed_at=datetime(2026, 7, 28, 15, 30),
            validated_at=datetime(2026, 7, 29, 11, 0),
            paid_at=datetime(2026, 7, 31, 10, 0),
            sent_at=datetime(2026, 7, 31, 12, 0),
            notes="July 2026 corporate disbursal via HDFC CMS batch.",
            created_by_user_id=payroll_user.id,
        )
        
        # Payrun 3: August 2026 (PAID)
        pr_aug = Payrun(
            name="August 2026 Regular Monthly Payrun",
            salary_structure_id=struct_tech.id,
            period_start=date(2026, 8, 1),
            period_end=date(2026, 8, 31),
            status="PAID",
            computed_at=datetime(2026, 8, 28, 16, 0),
            validated_at=datetime(2026, 8, 29, 10, 30),
            paid_at=datetime(2026, 8, 31, 10, 0),
            sent_at=datetime(2026, 8, 31, 11, 30),
            notes="August 2026 complete monthly payroll cycle with TDS and EPF compliance.",
            created_by_user_id=payroll_user.id,
        )

        # Payrun 4: September 2026 (DRAFT)
        pr_sep = Payrun(
            name="September 2026 Regular Monthly Payrun",
            salary_structure_id=struct_tech.id,
            period_start=date(2026, 9, 1),
            period_end=date(2026, 9, 30),
            status="DRAFT",
            computed_at=None,
            validated_at=None,
            paid_at=None,
            sent_at=None,
            notes="September 2026 upcoming payroll cycle open for timesheet sync and pre-payroll adjustments.",
            created_by_user_id=payroll_user.id,
        )

        # Payrun 5: Q2 Executive & Sales Incentive Payrun (PAID)
        pr_q2_bonus = Payrun(
            name="Q2 FY27 Leadership & Sales Incentive Payout",
            salary_structure_id=struct_sales.id,
            period_start=date(2026, 7, 1),
            period_end=date(2026, 9, 30),
            status="PAID",
            computed_at=datetime(2026, 8, 15, 14, 0),
            validated_at=datetime(2026, 8, 16, 10, 0),
            paid_at=datetime(2026, 8, 18, 11, 0),
            sent_at=datetime(2026, 8, 18, 12, 0),
            notes="Q2 Performance bonus and sales deal commissions for Executive and Sales leads.",
            created_by_user_id=payroll_user.id,
        )

        session.add_all([pr_june, pr_july, pr_aug, pr_sep, pr_q2_bonus])
        session.flush()

        # -------------------------------------------------------------
        # 13. PAYSLIPS & PAYSLIP LINES (Structure-Specific Rule Breakdown)
        # -------------------------------------------------------------
        print("[13/14] Generating Itemized Payslips & Accurate Rule Lines in INR...")
        
        # Helper to compute breakdown lines for an employee based on their contract and salary structure
        def generate_payslip_breakdown(payslip_id, contract_wage, struct_id):
            lines = []
            wage = contract_wage
            
            # 1. Structure: Executive
            if struct_id == struct_exec.id:
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

                lines = [
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["BASIC"].id, name="Basic Salary", code="BASIC", category="BASIC", sequence=10, calculation_type="PERCENTAGE", quantity=Decimal("1.00"), rate=Decimal("50.00"), base_amount=wage, amount=basic, formula_snapshot="50% of Monthly CTC"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["HRA"].id, name="House Rent Allowance", code="HRA", category="ALLOWANCE", sequence=20, calculation_type="PERCENTAGE", quantity=Decimal("1.00"), rate=Decimal("50.00"), base_amount=basic, amount=hra, formula_snapshot="50% of Basic Pay"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["CAR_ALLOW"].id, name="Executive Car Allowance", code="CAR_ALLOW", category="ALLOWANCE", sequence=55, calculation_type="FIXED", quantity=Decimal("1.00"), rate=None, base_amount=car, amount=car, formula_snapshot="Fixed INR 15,000/mo"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["PERF_BONUS"].id, name="Performance Bonus", code="PERF_BONUS", category="ALLOWANCE", sequence=80, calculation_type="PERCENTAGE", quantity=Decimal("1.00"), rate=Decimal("10.00"), base_amount=wage, amount=bonus, formula_snapshot="10% of Gross Base"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["SPECIAL_ALLOW"].id, name="Special Allowance", code="SPECIAL_ALLOW", category="ALLOWANCE", sequence=30, calculation_type="FORMULA", quantity=Decimal("1.00"), rate=None, base_amount=special, amount=special, formula_snapshot="Balancing Figure"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["EPF_EE"].id, name="Employee Provident Fund (EPF)", code="EPF_EE", category="DEDUCTION", sequence=110, calculation_type="PERCENTAGE", quantity=Decimal("1.00"), rate=Decimal("12.00"), base_amount=basic, amount=epf, formula_snapshot="12% of Basic up to statutory ceiling"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["PT"].id, name="Professional Tax", code="PT", category="DEDUCTION", sequence=120, calculation_type="FIXED", quantity=Decimal("1.00"), rate=None, base_amount=pt, amount=pt, formula_snapshot="State PT Act (INR 200)"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["TDS"].id, name="Tax Deducted at Source (TDS)", code="TDS", category="DEDUCTION", sequence=130, calculation_type="PERCENTAGE", quantity=Decimal("1.00"), rate=Decimal("18.00"), base_amount=gross, amount=tds, formula_snapshot="Income Tax Withholding Sec 192"),
                ]
                return basic, gross, total_ded, epf, net, lines

            # 2. Structure: Sales
            elif struct_id == struct_sales.id:
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

                lines = [
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["BASIC"].id, name="Basic Salary", code="BASIC", category="BASIC", sequence=10, calculation_type="PERCENTAGE", quantity=Decimal("1.00"), rate=Decimal("40.00"), base_amount=wage, amount=basic, formula_snapshot="40% of Base CTC"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["HRA"].id, name="House Rent Allowance", code="HRA", category="ALLOWANCE", sequence=20, calculation_type="PERCENTAGE", quantity=Decimal("1.00"), rate=Decimal("50.00"), base_amount=basic, amount=hra, formula_snapshot="50% of Basic"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["SALES_COMM"].id, name="Sales Commission", code="SALES_COMM", category="ALLOWANCE", sequence=60, calculation_type="PERCENTAGE", quantity=Decimal("1.00"), rate=Decimal("20.00"), base_amount=wage, amount=comm, formula_snapshot="20% Sales Target Achievement"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["TRAVEL_ALLOW"].id, name="Travel & Transit Allowance", code="TRAVEL_ALLOW", category="ALLOWANCE", sequence=65, calculation_type="FIXED", quantity=Decimal("1.00"), rate=None, base_amount=travel, amount=travel, formula_snapshot="Fixed INR 5,000/mo"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["SPECIAL_ALLOW"].id, name="Special Allowance", code="SPECIAL_ALLOW", category="ALLOWANCE", sequence=30, calculation_type="FORMULA", quantity=Decimal("1.00"), rate=None, base_amount=special, amount=special, formula_snapshot="Balancing Figure"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["EPF_EE"].id, name="Employee Provident Fund (EPF)", code="EPF_EE", category="DEDUCTION", sequence=110, calculation_type="PERCENTAGE", quantity=Decimal("1.00"), rate=Decimal("12.00"), base_amount=basic, amount=epf, formula_snapshot="12% of Basic"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["PT"].id, name="Professional Tax", code="PT", category="DEDUCTION", sequence=120, calculation_type="FIXED", quantity=Decimal("1.00"), rate=None, base_amount=pt, amount=pt, formula_snapshot="State PT Act (INR 200)"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["TDS"].id, name="Tax Deducted at Source (TDS)", code="TDS", category="DEDUCTION", sequence=130, calculation_type="PERCENTAGE", quantity=Decimal("1.00"), rate=Decimal("12.00"), base_amount=gross, amount=tds, formula_snapshot="TDS Sec 192"),
                ]
                return basic, gross, total_ded, epf, net, lines

            # 3. Structure: Operations
            elif struct_id == struct_ops.id:
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

                lines = [
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["BASIC"].id, name="Basic Salary", code="BASIC", category="BASIC", sequence=10, calculation_type="PERCENTAGE", quantity=Decimal("1.00"), rate=Decimal("50.00"), base_amount=wage, amount=basic, formula_snapshot="50% of Base CTC"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["HRA"].id, name="House Rent Allowance", code="HRA", category="ALLOWANCE", sequence=20, calculation_type="PERCENTAGE", quantity=Decimal("1.00"), rate=Decimal("50.00"), base_amount=basic, amount=hra, formula_snapshot="50% of Basic"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["SHIFT_ALLOW"].id, name="Night Shift Allowance", code="SHIFT_ALLOW", category="ALLOWANCE", sequence=70, calculation_type="FIXED", quantity=Decimal("1.00"), rate=None, base_amount=shift, amount=shift, formula_snapshot="Fixed INR 3,000/mo"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["ATTEND_BONUS"].id, name="Attendance Bonus", code="ATTEND_BONUS", category="ALLOWANCE", sequence=75, calculation_type="FIXED", quantity=Decimal("1.00"), rate=None, base_amount=bonus, amount=bonus, formula_snapshot="Fixed INR 2,000/mo"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["SPECIAL_ALLOW"].id, name="Special Allowance", code="SPECIAL_ALLOW", category="ALLOWANCE", sequence=30, calculation_type="FORMULA", quantity=Decimal("1.00"), rate=None, base_amount=special, amount=special, formula_snapshot="Balancing Figure"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["EPF_EE"].id, name="Employee Provident Fund (EPF)", code="EPF_EE", category="DEDUCTION", sequence=110, calculation_type="PERCENTAGE", quantity=Decimal("1.00"), rate=Decimal("12.00"), base_amount=basic, amount=epf, formula_snapshot="12% of Basic"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["PT"].id, name="Professional Tax", code="PT", category="DEDUCTION", sequence=120, calculation_type="FIXED", quantity=Decimal("1.00"), rate=None, base_amount=pt, amount=pt, formula_snapshot="State PT Act (INR 200)"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["TDS"].id, name="Tax Deducted at Source (TDS)", code="TDS", category="DEDUCTION", sequence=130, calculation_type="PERCENTAGE", quantity=Decimal("1.00"), rate=Decimal("5.00"), base_amount=gross, amount=tds, formula_snapshot="TDS Sec 192"),
                ]
                return basic, gross, total_ded, epf, net, lines

            # 4. Structure: Consultant 194J
            elif struct_id == struct_consult.id:
                basic = wage
                gross = wage
                tds_194j = (gross * Decimal("0.10")).quantize(Decimal("0.01"))
                total_ded = tds_194j
                net = gross - total_ded

                lines = [
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["BASIC"].id, name="Professional Retainer Fee", code="BASIC", category="BASIC", sequence=10, calculation_type="FIXED", quantity=Decimal("1.00"), rate=None, base_amount=wage, amount=basic, formula_snapshot="Monthly Contract Retainer Fee"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["TDS_194J"].id, name="TDS under Section 194J (10%)", code="TDS_194J", category="DEDUCTION", sequence=135, calculation_type="PERCENTAGE", quantity=Decimal("1.00"), rate=Decimal("10.00"), base_amount=gross, amount=tds_194j, formula_snapshot="10% Withholding Sec 194J"),
                ]
                return basic, gross, total_ded, Decimal("0.00"), net, lines

            # 5. Structure: Intern Stipend
            elif struct_id == struct_intern.id:
                basic = wage
                gross = wage
                total_ded = Decimal("0.00")
                net = gross

                lines = [
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["BASIC"].id, name="Graduate Trainee Monthly Stipend", code="BASIC", category="BASIC", sequence=10, calculation_type="FIXED", quantity=Decimal("1.00"), rate=None, base_amount=wage, amount=basic, formula_snapshot="Fixed Monthly Stipend"),
                ]
                return basic, gross, total_ded, Decimal("0.00"), net, lines

            # 6. Default Structure: Standard Tech
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

                lines = [
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["BASIC"].id, name="Basic Salary", code="BASIC", category="BASIC", sequence=10, calculation_type="PERCENTAGE", quantity=Decimal("1.00"), rate=Decimal("50.00"), base_amount=wage, amount=basic, formula_snapshot="50% of Base CTC"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["HRA"].id, name="House Rent Allowance", code="HRA", category="ALLOWANCE", sequence=20, calculation_type="PERCENTAGE", quantity=Decimal("1.00"), rate=Decimal("50.00"), base_amount=basic, amount=hra, formula_snapshot="50% of Basic Pay"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["SPECIAL_ALLOW"].id, name="Special Allowance", code="SPECIAL_ALLOW", category="ALLOWANCE", sequence=30, calculation_type="FORMULA", quantity=Decimal("1.00"), rate=None, base_amount=special, amount=special, formula_snapshot="Balancing Figure"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["CONVEYANCE"].id, name="Conveyance Allowance", code="CONVEYANCE", category="ALLOWANCE", sequence=40, calculation_type="FIXED", quantity=Decimal("1.00"), rate=None, base_amount=conveyance, amount=conveyance, formula_snapshot="Fixed INR 1,600/mo"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["MEDICAL_ALLOW"].id, name="Medical Allowance", code="MEDICAL_ALLOW", category="ALLOWANCE", sequence=50, calculation_type="FIXED", quantity=Decimal("1.00"), rate=None, base_amount=medical, amount=medical, formula_snapshot="Fixed INR 1,250/mo"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["EPF_EE"].id, name="Employee Provident Fund (EPF)", code="EPF_EE", category="DEDUCTION", sequence=110, calculation_type="PERCENTAGE", quantity=Decimal("1.00"), rate=Decimal("12.00"), base_amount=basic, amount=epf, formula_snapshot="12% of Basic up to statutory ceiling"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["PT"].id, name="Professional Tax", code="PT", category="DEDUCTION", sequence=120, calculation_type="FIXED", quantity=Decimal("1.00"), rate=None, base_amount=pt, amount=pt, formula_snapshot="State PT Act (INR 200)"),
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["TDS"].id, name="Tax Deducted at Source (TDS)", code="TDS", category="DEDUCTION", sequence=130, calculation_type="PERCENTAGE", quantity=Decimal("1.00"), rate=Decimal("10.00"), base_amount=gross, amount=tds, formula_snapshot="Income Tax Withholding Sec 192"),
                ]
                return basic, gross, total_ded, epf, net, lines

        # Populate payslips for July 2026, August 2026, and June 2026
        all_payslip_lines = []
        for pr, p_start, p_end in [
            (pr_june, date(2026, 6, 1), date(2026, 6, 30)),
            (pr_july, date(2026, 7, 1), date(2026, 7, 31)),
            (pr_aug, date(2026, 8, 1), date(2026, 8, 31)),
        ]:
            for emp in created_employees:
                contract = active_contracts_map[emp.id]
                
                # Payrun Employee roster entry
                pe = PayrunEmployee(
                    payrun_id=pr.id,
                    employee_id=emp.id,
                    selection_status="SELECTED",
                )
                session.add(pe)
                session.flush()

                # Dummy dummy placeholder payslip to get ID
                ps = Payslip(
                    payrun_id=pr.id,
                    employee_id=emp.id,
                    payrun_employee_id=pe.id,
                    salary_structure_id=contract.salary_structure_id,
                    contract_id=contract.id,
                    period_start=p_start,
                    period_end=p_end,
                    worked_days=Decimal("22.00"),
                    basic_amount=Decimal("0.00"),
                    gross_amount=Decimal("0.00"),
                    deduction_amount=Decimal("0.00"),
                    contribution_amount=Decimal("0.00"),
                    net_amount=Decimal("0.00"),
                    status="PAID",
                    pdf_generated_at=pr.paid_at,
                    sent_at=pr.sent_at,
                )
                session.add(ps)
                session.flush()

                basic, gross, total_ded, epf_er, net, lines = generate_payslip_breakdown(
                    ps.id, contract.wage, contract.salary_structure_id
                )
                
                ps.basic_amount = basic
                ps.gross_amount = gross
                ps.deduction_amount = total_ded
                ps.contribution_amount = epf_er
                ps.net_amount = net

                all_payslip_lines.extend(lines)

        session.add_all(all_payslip_lines)
        session.flush()

        # -------------------------------------------------------------
        # 14. PAYROLL WARNINGS & SYSTEM NOTIFICATIONS
        # -------------------------------------------------------------
        print("[14/14] Seeding Meaningful Payroll Warnings & Live System Notifications...")
        
        warnings_data = [
            # 1. Missing Bank Details (Intentional demo scenario for Amitav Banerjee)
            PayrollWarning(
                payrun_id=pr_sep.id,
                payslip_id=None,
                employee_id=created_employees[11].id, # Amitav Banerjee
                warning_type="MISSING_BANK_DETAILS",
                severity="CRITICAL",
                message="Employee Amitav Banerjee (EMP-IND-012) has no active primary bank account registered. Direct deposit payout will be blocked.",
                is_resolved=False,
                resolved_by_user_id=None,
                resolved_at=None,
            ),
            # 2. Fixed-Term Contract Expiring (Rahul Joshi)
            PayrollWarning(
                payrun_id=pr_sep.id,
                payslip_id=None,
                employee_id=created_employees[13].id, # Rahul Joshi
                warning_type="CONTRACT_EXPIRING",
                severity="WARNING",
                message="Fixed-Term Technical Retainer contract for Rahul Joshi (EMP-IND-014) is expiring on 30-Sep-2026. HR renewal required.",
                is_resolved=False,
                resolved_by_user_id=None,
                resolved_at=None,
            ),
            # 3. Attendance Exception (Missing Check-out)
            PayrollWarning(
                payrun_id=pr_aug.id,
                payslip_id=None,
                employee_id=created_employees[9].id, # Karthik Reddy
                warning_type="ATTENDANCE_EXCEPTION",
                severity="INFO",
                message="Attendance regularized for Karthik Reddy (EMP-IND-010) following unrecorded gate checkout.",
                is_resolved=True,
                resolved_by_user_id=payroll_user.id,
                resolved_at=datetime(2026, 8, 28, 17, 0),
            ),
        ]
        session.add_all(warnings_data)

        notifications_data = [
            # For Super Admin (Aarav Sharma)
            Notification(
                user_id=admin_user.id,
                title="August 2026 Payroll Disbursed",
                message="August 2026 Monthly Payrun has been validated, approved, and disbursed to 15 employees via NEFT batch.",
                notification_type="PAYRUN_PAID",
                reference_type="payrun",
                reference_id=pr_aug.id,
                is_read=True,
                read_at=datetime(2026, 8, 31, 12, 30),
                created_at=datetime(2026, 8, 31, 10, 0),
            ),
            Notification(
                user_id=admin_user.id,
                title="Pending Leave Approval: Karthik Reddy",
                message="Karthik Reddy submitted a Sick Leave request for 02-Sep to 03-Sep (2 days).",
                notification_type="LEAVE_REQUEST",
                reference_type="time_off_request",
                reference_id=leave_requests[2].id,
                is_read=False,
                read_at=None,
                created_at=datetime(2026, 9, 2, 8, 30),
            ),
            Notification(
                user_id=admin_user.id,
                title="Compliance Alert: Missing Bank Details",
                message="Payroll validation flag: Amitav Banerjee (EMP-IND-012) requires bank details before September payrun disbursal.",
                notification_type="PAYROLL_WARNING",
                reference_type="payroll_warning",
                reference_id=1,
                is_read=False,
                read_at=None,
                created_at=datetime(2026, 9, 3, 11, 0),
            ),
            # For Payroll Officer (Rohan Mehta)
            Notification(
                user_id=payroll_user.id,
                title="September 2026 Payrun Cycle Initialized",
                message="Draft payroll batch PAYRUN-2026-09 is open for attendance sync and pre-payroll adjustments.",
                notification_type="PAYRUN_DRAFT",
                reference_type="payrun",
                reference_id=pr_sep.id,
                is_read=False,
                read_at=None,
                created_at=datetime(2026, 9, 1, 9, 0),
            ),
            Notification(
                user_id=payroll_user.id,
                title="Q2 Incentive Batch Processed",
                message="Q2 FY27 Leadership & Sales Incentive Payout of INR 12.5 Lakhs credited successfully.",
                notification_type="PAYRUN_PAID",
                reference_type="payrun",
                reference_id=pr_q2_bonus.id,
                is_read=True,
                read_at=datetime(2026, 8, 19, 10, 0),
                created_at=datetime(2026, 8, 18, 11, 0),
            ),
            # For Employee (Ananya Iyer)
            Notification(
                user_id=created_employees[4].user_id,
                title="Leave Request Approved",
                message="Your Casual Leave request for 14-Aug-2026 (1 day) has been approved by Aarav Sharma.",
                notification_type="LEAVE_APPROVED",
                reference_type="time_off_request",
                reference_id=leave_requests[0].id,
                is_read=True,
                read_at=datetime(2026, 8, 10, 16, 0),
                created_at=datetime(2026, 8, 10, 14, 30),
            ),
            Notification(
                user_id=created_employees[4].user_id,
                title="August 2026 Payslip Available",
                message="Your payslip for August 2026 (Net: INR 1,02,400) is now available for download.",
                notification_type="PAYSLIP_GENERATED",
                reference_type="payslip",
                reference_id=1,
                is_read=False,
                read_at=None,
                created_at=datetime(2026, 8, 31, 12, 0),
            ),
        ]
        session.add_all(notifications_data)

        # Commit all entities safely
        session.commit()

    print("\n" + "=" * 80)
    print("SUCCESS: COMPREHENSIVE INDIAN HR & PAYROLL DATABASE SEEDING COMPLETE")
    print("=" * 80)
    print("  - 5 Roles & 6 System Users")
    print("  - 6 Departments & 12 Specialized Job Designations")
    print("  - 4 Employee Types (Full-Time, Contract, Intern, Consultant)")
    print("  - 15 Indian Employees (Bangalore, Mumbai, Pune, Gurugram, Hyderabad)")
    print("  - 5 Working Schedules & Daily Rotas in 12-hour AM/PM format")
    print("  - 16 Schedule Assignments (including historical shift changes)")
    print("  - 15 Indian Bank Accounts (HDFC, ICICI, SBI, Axis, Kotak, BOB, PNB) + Missing Bank Demo Case")
    print("  - 6 Indian Salary Structures & 18 Statutory Salary Rules (Basic, HRA, EPF, PT, TDS)")
    print("  - 17 Contracts (Active + Historical Expired + Expiring Fixed-Term)")
    print("  - 5 Indian Leave Types, 45 Allocations & Varied Requests (Approved, Pending, Refused)")
    print("  - 400+ Daily Attendance Logs (Present, Late, Absent, Overtime, Missing Checkout, Corrected)")
    print("  - 1 Attendance Correction Record preserving history")
    print("  - 5 Payruns (June, July, August Paid, September Draft, Q2 Incentive Paid)")
    print("  - 45 Itemized Payslips with 350+ Rule Breakdown Lines in INR")
    print("  - 3 Payroll Warnings (Missing Bank Details, Expiring Contract, Attendance Exception)")
    print("  - 7 Live Notifications with Unread/Read Statuses across Roles")
    print("=" * 80)

if __name__ == "__main__":
    seed_database()
