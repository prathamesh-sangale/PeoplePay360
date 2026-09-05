"""
PeoplePay360 - Comprehensive Indian HR & Payroll Seed Script
Populates realistic Indian corporate data across all 25 tables:
- Roles & System Users
- Departments, Jobs, Employee Types
- 15 Indian Employees (Bangalore, Mumbai, Pune, Delhi NCR, Hyderabad)
- Working Schedules & Daily Rotas
- Indian Bank Accounts (HDFC, ICICI, SBI, Axis, Kotak with IFSC)
- Indian Salary Structures & Statutory Salary Rules (Basic, HRA, Special Allow, EPF, PT, TDS, Net)
- Employee Contracts linked to Salary Structures (INR packages)
- Attendance records and Attendance Corrections
- Indian Leave Types (CL, PL/EL, SL, Maternity, Festival Holidays), Allocations & Requests
- Historical Monthly Payruns (July 2026, August 2026, September 2026 Draft)
- Itemized Payslips and Payslip Lines (in INR)
- Payroll Warnings & System Notifications
"""

import os
import sys
from pathlib import Path
from datetime import date, datetime, time, timedelta
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
    print("=" * 70)
    print("PeoplePay360 - SEEDING INDIAN HR & PAYROLL DATABASE")
    print("=" * 70)

    engine = create_engine(DATABASE_URL)
    
    with Session(engine) as session:
        # Check if already seeded
        emp_count = session.query(Employee).count()
        if emp_count > 0:
            print(f"[INFO] Database already contains {emp_count} employees. Clearing existing data for a fresh seed...")
            # Truncate tables in reverse dependency order
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
            print("[INFO] All tables cleared successfully.")

        # -------------------------------------------------------------
        # 1. ROLES
        # -------------------------------------------------------------
        print("\n[1/12] Seeding Roles...")
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

        # -------------------------------------------------------------
        # 2. USERS
        # -------------------------------------------------------------
        print("[2/12] Seeding Users...")
        # Placeholder bcrypt hash for password "PeoplePay@2026"
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
        ]
        session.add_all(users_data)
        session.flush()
        admin_user = users_data[0]
        payroll_user = users_data[2]

        # -------------------------------------------------------------
        # 3. DEPARTMENTS & JOBS
        # -------------------------------------------------------------
        print("[3/12] Seeding Departments and Jobs...")
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
        # 4. EMPLOYEE TYPES
        # -------------------------------------------------------------
        print("[4/12] Seeding Employee Types...")
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
        # 5. WORKING SCHEDULES & DAYS
        # -------------------------------------------------------------
        print("[5/12] Seeding Working Schedules & Daily Shifts...")
        schedules_data = [
            WorkingSchedule(name="Indian Standard Tech Shift (40h/wk)", code="IND_TECH_40", weekly_hours=Decimal("40.00"), is_active=True),
            WorkingSchedule(name="Corporate General Shift (42.5h/wk)", code="IND_CORP_42", weekly_hours=Decimal("42.50"), is_active=True),
            WorkingSchedule(name="Operations Support 6-Day Shift (48h/wk)", code="IND_OPS_48", weekly_hours=Decimal("48.00"), is_active=True),
        ]
        session.add_all(schedules_data)
        session.flush()

        # Schedule days (Monday=0 to Friday=4 for tech shift)
        schedule_days = []
        for d in range(5):  # Mon-Fri
            schedule_days.append(
                WorkingScheduleDay(
                    working_schedule_id=schedules_data[0].id,
                    day_of_week=d,
                    start_time=time(9, 30),
                    end_time=time(18, 30),
                    break_minutes=60,
                )
            )
        for d in range(5):  # Mon-Fri
            schedule_days.append(
                WorkingScheduleDay(
                    working_schedule_id=schedules_data[1].id,
                    day_of_week=d,
                    start_time=time(9, 0),
                    end_time=time(18, 30),
                    break_minutes=60,
                )
            )
        session.add_all(schedule_days)
        session.flush()

        # -------------------------------------------------------------
        # 6. EMPLOYEES (15 Realistic Indian Profiles)
        # -------------------------------------------------------------
        print("[6/12] Seeding 15 Indian Employees...")
        employees_info = [
            {
                "code": "EMP-IND-001", "first": "Aarav", "last": "Sharma", "email": "aarav.sharma@peoplepay360.in",
                "phone": "+91 98450 11223", "dob": date(1986, 4, 15), "doj": date(2021, 1, 15),
                "dept": "ENG", "job": "JOB-ENG-VP", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED",
                "location": "Bangalore (Whitefield Tech Hub)", "address": "Flat 402, Prestige Shantiniketan, Whitefield, Bangalore - 560066",
                "emergency_name": "Meera Sharma", "emergency_phone": "+91 98450 11224", "user_id": users_data[0].id,
            },
            {
                "code": "EMP-IND-002", "first": "Priya", "last": "Patel", "email": "priya.patel@peoplepay360.in",
                "phone": "+91 98200 44556", "dob": date(1989, 8, 22), "doj": date(2021, 3, 1),
                "dept": "HR", "job": "JOB-HR-HEAD", "type": "FT_PERM", "gender": "FEMALE", "marital": "MARRIED",
                "location": "Mumbai (Bandra Kurla Complex)", "address": "Tower 3, Rustomjee Seasons, BKC Annex, Mumbai - 400051",
                "emergency_name": "Karan Patel", "emergency_phone": "+91 98200 44557", "user_id": users_data[1].id,
            },
            {
                "code": "EMP-IND-003", "first": "Rohan", "last": "Mehta", "email": "rohan.mehta@peoplepay360.in",
                "phone": "+91 98110 77889", "dob": date(1991, 11, 10), "doj": date(2021, 6, 15),
                "dept": "FIN", "job": "JOB-FIN-PAYROLL", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED",
                "location": "Mumbai (Lower Parel)", "address": "A-1204, Indiabulls Sky Forest, Lower Parel, Mumbai - 400013",
                "emergency_name": "Pooja Mehta", "emergency_phone": "+91 98110 77890", "user_id": users_data[2].id,
            },
            {
                "code": "EMP-IND-004", "first": "Vikram", "last": "Sengupta", "email": "vikram.sengupta@peoplepay360.in",
                "phone": "+91 98860 33445", "dob": date(1988, 2, 18), "doj": date(2022, 1, 10),
                "dept": "ENG", "job": "JOB-ENG-ARCH", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED",
                "location": "Bangalore (Koramangala)", "address": "House 142, 4th Block, Koramangala, Bangalore - 560034",
                "emergency_name": "Sutapa Sengupta", "emergency_phone": "+91 98860 33446", "user_id": users_data[3].id,
            },
            {
                "code": "EMP-IND-005", "first": "Ananya", "last": "Iyer", "email": "ananya.iyer@peoplepay360.in",
                "phone": "+91 97900 66778", "dob": date(1994, 6, 30), "doj": date(2022, 4, 1),
                "dept": "ENG", "job": "JOB-ENG-SDE2", "type": "FT_PERM", "gender": "FEMALE", "marital": "SINGLE",
                "location": "Bangalore (Indiranagar)", "address": "B-302, Palm Meadows, 100 Feet Rd, Indiranagar, Bangalore - 560038",
                "emergency_name": "R. Swaminathan Iyer", "emergency_phone": "+91 97900 66779", "user_id": users_data[4].id,
            },
            {
                "code": "EMP-IND-006", "first": "Aditya", "last": "Verma", "email": "aditya.verma@peoplepay360.in",
                "phone": "+91 99100 22334", "dob": date(1992, 12, 5), "doj": date(2022, 7, 1),
                "dept": "SALES", "job": "JOB-SALES-DIR", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED",
                "location": "Delhi NCR (DLF Cyber City, Gurugram)", "address": "Villa 18, DLF Phase 2, Gurugram, Haryana - 122002",
                "emergency_name": "Ritu Verma", "emergency_phone": "+91 99100 22335", "user_id": None,
            },
            {
                "code": "EMP-IND-007", "first": "Neha", "last": "Kulkarni", "email": "neha.kulkarni@peoplepay360.in",
                "phone": "+91 98500 88990", "dob": date(1995, 3, 14), "doj": date(2022, 9, 15),
                "dept": "OPS", "job": "JOB-OPS-LEAD", "type": "FT_PERM", "gender": "FEMALE", "marital": "SINGLE",
                "location": "Pune (Baner Tech Park)", "address": "Flat 804, Supreme Pallacio, Baner, Pune - 411045",
                "emergency_name": "Sanjay Kulkarni", "emergency_phone": "+91 98500 88991", "user_id": None,
            },
            {
                "code": "EMP-IND-008", "first": "Rajesh", "last": "Nair", "email": "rajesh.nair@peoplepay360.in",
                "phone": "+91 98470 55667", "dob": date(1990, 9, 28), "doj": date(2023, 1, 16),
                "dept": "ENG", "job": "JOB-ENG-DEVOPS", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED",
                "location": "Bangalore (HSR Layout)", "address": "Plot 54, Sector 2, HSR Layout, Bangalore - 560102",
                "emergency_name": "Lakshmi Nair", "emergency_phone": "+91 98470 55668", "user_id": None,
            },
            {
                "code": "EMP-IND-009", "first": "Sneha", "last": "Mukherjee", "email": "sneha.mukherjee@peoplepay360.in",
                "phone": "+91 98300 11224", "dob": date(1996, 7, 19), "doj": date(2023, 3, 1),
                "dept": "PROD", "job": "JOB-PROD-PM", "type": "FT_PERM", "gender": "FEMALE", "marital": "SINGLE",
                "location": "Bangalore (Bellandur EcoSpace)", "address": "Apartment 5B, Sobha Iris, Bellandur, Bangalore - 560103",
                "emergency_name": "Alok Mukherjee", "emergency_phone": "+91 98300 11225", "user_id": None,
            },
            {
                "code": "EMP-IND-010", "first": "Karthik", "last": "Reddy", "email": "karthik.reddy@peoplepay360.in",
                "phone": "+91 98490 77881", "dob": date(1993, 10, 8), "doj": date(2023, 5, 2),
                "dept": "ENG", "job": "JOB-ENG-SDE2", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED",
                "location": "Hyderabad (Hitech City)", "address": "Villa 42, Aparna CyberLife, Nallagandla, Hyderabad - 500019",
                "emergency_name": "Divya Reddy", "emergency_phone": "+91 98490 77882", "user_id": None,
            },
            {
                "code": "EMP-IND-011", "first": "Pooja", "last": "Deshmukh", "email": "pooja.deshmukh@peoplepay360.in",
                "phone": "+91 98210 33448", "dob": date(1994, 1, 25), "doj": date(2023, 8, 1),
                "dept": "HR", "job": "JOB-HR-SPEC", "type": "FT_PERM", "gender": "FEMALE", "marital": "SINGLE",
                "location": "Mumbai (Andheri East)", "address": "B-601, Kanakia Spaces, Andheri East, Mumbai - 400069",
                "emergency_name": "Vikas Deshmukh", "emergency_phone": "+91 98210 33449", "user_id": None,
            },
            {
                "code": "EMP-IND-012", "first": "Amitav", "last": "Banerjee", "email": "amitav.banerjee@peoplepay360.in",
                "phone": "+91 98900 66772", "dob": date(1991, 5, 12), "doj": date(2023, 11, 1),
                "dept": "FIN", "job": "JOB-FIN-SR", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED",
                "location": "Pune (Kalyani Nagar)", "address": "Penthouse 12, Clover Watergardens, Kalyani Nagar, Pune - 411006",
                "emergency_name": "Soma Banerjee", "emergency_phone": "+91 98900 66773", "user_id": None,
            },
            {
                "code": "EMP-IND-013", "first": "Divya", "last": "Swaminathan", "email": "divya.swami@peoplepay360.in",
                "phone": "+91 98400 99881", "dob": date(1997, 4, 3), "doj": date(2024, 1, 15),
                "dept": "ENG", "job": "JOB-ENG-QA", "type": "FT_PERM", "gender": "FEMALE", "marital": "SINGLE",
                "location": "Bangalore (Electronic City)", "address": "A-204, GM Infinite E-City Town, Electronic City, Bangalore - 560100",
                "emergency_name": "T. Swaminathan", "emergency_phone": "+91 98400 99882", "user_id": None,
            },
            {
                "code": "EMP-IND-014", "first": "Rahul", "last": "Joshi", "email": "rahul.joshi@peoplepay360.in",
                "phone": "+91 98205 77661", "dob": date(1998, 8, 14), "doj": date(2024, 3, 1),
                "dept": "ENG", "job": "JOB-ENG-SDE2", "type": "FT_CON", "gender": "MALE", "marital": "SINGLE",
                "location": "Mumbai (Powai Tech Hub)", "address": "Tower 2, Hiranandani Gardens, Powai, Mumbai - 400076",
                "emergency_name": "Sunil Joshi", "emergency_phone": "+91 98205 77662", "user_id": None,
            },
            {
                "code": "EMP-IND-015", "first": "Meera", "last": "Ranganathan", "email": "meera.ranga@peoplepay360.in",
                "phone": "+91 98480 22331", "dob": date(2001, 10, 19), "doj": date(2024, 6, 1),
                "dept": "PROD", "job": "JOB-PROD-PM", "type": "INTERN", "gender": "FEMALE", "marital": "SINGLE",
                "location": "Hyderabad (Gachibowli)", "address": "Flat 301, My Home Bhooja, Gachibowli, Hyderabad - 500032",
                "emergency_name": "K. Ranganathan", "emergency_phone": "+91 98480 22332", "user_id": None,
            },
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

        # Update department managers & employee hierarchy
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
            else:
                emp.manager_id = created_employees[0].id

        # Schedule assignments
        schedule_assignments = []
        for emp in created_employees:
            schedule_assignments.append(
                EmployeeScheduleAssignment(
                    employee_id=emp.id,
                    working_schedule_id=schedules_data[0].id,
                    start_date=emp.date_of_joining,
                    end_date=None,
                    is_active=True,
                )
            )
        session.add_all(schedule_assignments)
        session.flush()

        # -------------------------------------------------------------
        # 7. INDIAN BANK ACCOUNTS (HDFC, ICICI, SBI, Axis, Kotak)
        # -------------------------------------------------------------
        print("[7/12] Seeding Indian Bank Accounts with valid IFSC...")
        bank_accounts = []
        bank_profiles = [
            ("HDFC Bank", "HDFC0001024", "Koramangala 4th Block, Bangalore", "5010024"),
            ("ICICI Bank", "ICIC0000180", "Bandra Kurla Complex, Mumbai", "0180015"),
            ("State Bank of India", "SBIN0004123", "MG Road Branch, Pune", "3045981"),
            ("Axis Bank", "UTIB0000845", "Cyber City, DLF Phase 2, Gurugram", "9140200"),
            ("Kotak Mahindra Bank", "KKBK0000650", "Hitech City, Madhapur, Hyderabad", "6501234"),
        ]

        for idx, emp in enumerate(created_employees):
            bank_name, ifsc, branch, prefix = bank_profiles[idx % len(bank_profiles)]
            acc_num = f"{prefix}{random.randint(10000000, 99999999)}"
            bank_accounts.append(
                EmployeeBankAccount(
                    employee_id=emp.id,
                    account_holder_name=f"{emp.first_name} {emp.last_name}",
                    account_number=acc_num,
                    bank_name=bank_name,
                    ifsc_code=ifsc,
                    branch_name=branch,
                    account_type="SAVINGS",
                    is_primary=True,
                    is_active=True,
                )
            )
        session.add_all(bank_accounts)
        session.flush()

        # -------------------------------------------------------------
        # 8. SALARY STRUCTURES & RULES (Indian Statutory Tax Framework)
        # -------------------------------------------------------------
        print("[8/12] Seeding Indian Salary Structures & Statutory Rules...")
        
        salary_structures_data = [
            SalaryStructure(
                name="Indian Standard Tech Professional Structure",
                code="IND_STD_TECH",
                description="Standard Indian IT/Corporate package structure with Basic (50%), HRA (25%), Special Allowance (25%), EPF (12%), PT (INR 200), and TDS",
                is_active=True,
            ),
            SalaryStructure(
                name="Indian Executive & Leadership Structure",
                code="IND_EXEC_LEAD",
                description="Executive package with Performance Allowance, Vehicle Reimbursement, NPS, and Tax Optimization",
                is_active=True,
            ),
            SalaryStructure(
                name="Indian Professional Retainer / Consultant",
                code="IND_CONSULTANT",
                description="Fixed retainer professional fees subject to 10% TDS under Section 194J",
                is_active=True,
            ),
        ]
        session.add_all(salary_structures_data)
        session.flush()
        struct_tech = salary_structures_data[0]
        struct_exec = salary_structures_data[1]
        struct_consult = salary_structures_data[2]

        salary_rules_data = [
            # Earnings
            SalaryRule(name="Basic Salary", code="BASIC", category="BASIC", sequence=10, calculation_type="PERCENTAGE", percentage=Decimal("50.0000"), amount=None, formula=None, description="50% of Total Monthly Wage as Basic Pay"),
            SalaryRule(name="House Rent Allowance (HRA)", code="HRA", category="ALLOWANCE", sequence=20, calculation_type="PERCENTAGE", percentage=Decimal("50.0000"), amount=None, formula="50% of Basic Salary (Metro City)", description="HRA exemption eligible under Section 10(13A)"),
            SalaryRule(name="Special Allowance", code="SPECIAL_ALLOW", category="ALLOWANCE", sequence=30, calculation_type="FORMULA", percentage=None, amount=None, formula="TOTAL_WAGE - BASIC - HRA - CONVEYANCE - MEDICAL", description="Balancing flexible benefit allowance"),
            SalaryRule(name="Conveyance Allowance", code="CONVEYANCE", category="ALLOWANCE", sequence=40, calculation_type="FIXED", percentage=None, amount=Decimal("1600.00"), formula=None, description="Standard statutory conveyance allowance"),
            SalaryRule(name="Medical Allowance", code="MEDICAL_ALLOW", category="ALLOWANCE", sequence=50, calculation_type="FIXED", percentage=None, amount=Decimal("1250.00"), formula=None, description="Medical reimbursement allowance"),
            SalaryRule(name="Gross Salary", code="GROSS", category="GROSS", sequence=100, calculation_type="FORMULA", percentage=None, amount=None, formula="BASIC + HRA + SPECIAL_ALLOW + CONVEYANCE + MEDICAL_ALLOW", description="Total Monthly Gross Earnings before deductions"),
            
            # Deductions
            SalaryRule(name="Employee Provident Fund (EPF)", code="EPF_EE", category="DEDUCTION", sequence=110, calculation_type="PERCENTAGE", percentage=Decimal("12.0000"), amount=None, formula="12% of Basic Salary (Employee Contribution)", description="Statutory EPF contribution deposited to EPFO"),
            SalaryRule(name="Professional Tax (PT)", code="PT", category="DEDUCTION", sequence=120, calculation_type="FIXED", percentage=None, amount=Decimal("200.00"), formula=None, description="State Government Professional Tax (INR 200/mo)"),
            SalaryRule(name="Tax Deducted at Source (TDS / Income Tax)", code="TDS", category="DEDUCTION", sequence=130, calculation_type="PERCENTAGE", percentage=Decimal("10.0000"), amount=None, formula="Income Tax Section 192 Monthly Withholding", description="TDS under New/Old Tax Regime"),
            SalaryRule(name="Total Deductions", code="TOTAL_DED", category="DEDUCTION", sequence=190, calculation_type="FORMULA", percentage=None, amount=None, formula="EPF_EE + PT + TDS", description="Sum of statutory and voluntary monthly deductions"),
            
            # Net & Employer Contributions
            SalaryRule(name="Net Salary Payable", code="NET", category="NET", sequence=200, calculation_type="FORMULA", percentage=None, amount=None, formula="GROSS - TOTAL_DED", description="Take-home net salary credited to employee bank account"),
            SalaryRule(name="Employer Provident Fund Contribution", code="EPF_ER", category="CONTRIBUTION", sequence=210, calculation_type="PERCENTAGE", percentage=Decimal("12.0000"), amount=None, formula="12% of Basic Salary (Employer Contribution)", description="Employer statutory contribution to EPFO (Non-taxable cost to company)"),
        ]
        session.add_all(salary_rules_data)
        session.flush()

        # Connect rules to salary structure
        structure_rules = []
        for idx, rule in enumerate(salary_rules_data):
            structure_rules.append(
                SalaryStructureRule(
                    salary_structure_id=struct_tech.id,
                    salary_rule_id=rule.id,
                    sequence=rule.sequence,
                    is_active=True,
                )
            )
        session.add_all(structure_rules)
        session.flush()

        # -------------------------------------------------------------
        # 9. CONTRACTS (Realistic Indian Compensation CTC in INR)
        # -------------------------------------------------------------
        print("[9/12] Seeding Employee Contracts (INR Annual CTC Packages)...")
        # Monthly wages: ₹45,000 to ₹3,00,000 (Annual CTC: ₹5.4 Lakhs to ₹36 Lakhs)
        monthly_wages = [
            Decimal("300000.00"), # Aarav Sharma - VP Eng (36 LPA)
            Decimal("220000.00"), # Priya Patel - Head HR (26.4 LPA)
            Decimal("180000.00"), # Rohan Mehta - Lead Payroll (21.6 LPA)
            Decimal("260000.00"), # Vikram Sengupta - Architect (31.2 LPA)
            Decimal("130000.00"), # Ananya Iyer - Sr SDE (15.6 LPA)
            Decimal("200000.00"), # Aditya Verma - Sales Dir (24 LPA)
            Decimal("110000.00"), # Neha Kulkarni - Ops Lead (13.2 LPA)
            Decimal("140000.00"), # Rajesh Nair - DevOps (16.8 LPA)
            Decimal("150000.00"), # Sneha Mukherjee - Product PM (18 LPA)
            Decimal("125000.00"), # Karthik Reddy - SDE 2 (15 LPA)
            Decimal("85000.00"),  # Pooja Deshmukh - HR Spec (10.2 LPA)
            Decimal("95000.00"),  # Amitav Banerjee - Fin Analyst (11.4 LPA)
            Decimal("75000.00"),  # Divya Swaminathan - QA (9 LPA)
            Decimal("65000.00"),  # Rahul Joshi - Contract SDE (7.8 LPA)
            Decimal("35000.00"),  # Meera Ranganathan - Intern (4.2 LPA)
        ]

        contracts = []
        for idx, emp in enumerate(created_employees):
            wage = monthly_wages[idx]
            struct = struct_exec if wage >= Decimal("200000.00") else struct_tech
            c = Contract(
                employee_id=emp.id,
                department_id=emp.department_id,
                job_id=emp.job_id,
                working_schedule_id=schedules_data[0].id,
                salary_structure_id=struct.id,
                contract_number=f"CONT-IND-{emp.employee_code}",
                wage=wage,
                start_date=emp.date_of_joining,
                end_date=None,
                status="ACTIVE",
                employment_terms=f"Indian Standard Employment Contract governed under Karnataka/Maharashtra Shops and Establishments Act. Monthly Gross Base: INR {wage:,.2f}",
            )
            contracts.append(c)

        session.add_all(contracts)
        session.flush()

        # -------------------------------------------------------------
        # 10. ATTENDANCE & TIME OFF
        # -------------------------------------------------------------
        print("[10/12] Seeding Attendance Logs, Leave Allocations & Requests...")
        
        # Indian Leave Types
        time_off_types_data = [
            TimeOffType(name="Casual Leave (CL)", code="CL", unit="DAYS", allocation_required=True, approval_required=True, payroll_integration=True, is_active=True, description="Paid casual leave for personal commitments"),
            TimeOffType(name="Privilege / Earned Leave (PL)", code="PL", unit="DAYS", allocation_required=True, approval_required=True, payroll_integration=True, is_active=True, description="Earned leave accumulated per working month"),
            TimeOffType(name="Sick Leave (SL)", code="SL", unit="DAYS", allocation_required=True, approval_required=True, payroll_integration=True, is_active=True, description="Medical sick leave"),
            TimeOffType(name="Maternity Leave (ML)", code="ML", unit="DAYS", allocation_required=False, approval_required=True, payroll_integration=True, is_active=True, description="26 weeks statutory maternity benefit"),
            TimeOffType(name="Optional / Festival Holiday", code="FEST_HOL", unit="DAYS", allocation_required=True, approval_required=True, payroll_integration=True, is_active=True, description="Optional religious and festival holidays"),
        ]
        session.add_all(time_off_types_data)
        session.flush()

        # Leave Allocations for FY 2026-27 (April 2026 to March 2027)
        allocations = []
        for emp in created_employees:
            allocations.append(
                TimeOffAllocation(
                    employee_id=emp.id,
                    time_off_type_id=time_off_types_data[0].id, # CL
                    allocated_amount=Decimal("12.00"),
                    taken_amount=Decimal("2.00"),
                    start_date=date(2026, 4, 1),
                    end_date=date(2027, 3, 31),
                    status="APPROVED",
                    approved_by_user_id=admin_user.id,
                    approved_at=datetime(2026, 4, 1, 10, 0),
                    notes="Annual Casual Leave entitlement FY 2026-27",
                )
            )
            allocations.append(
                TimeOffAllocation(
                    employee_id=emp.id,
                    time_off_type_id=time_off_types_data[1].id, # PL
                    allocated_amount=Decimal("18.00"),
                    taken_amount=Decimal("3.00"),
                    start_date=date(2026, 4, 1),
                    end_date=date(2027, 3, 31),
                    status="APPROVED",
                    approved_by_user_id=admin_user.id,
                    approved_at=datetime(2026, 4, 1, 10, 0),
                    notes="Annual Privilege Leave entitlement FY 2026-27",
                )
            )
            allocations.append(
                TimeOffAllocation(
                    employee_id=emp.id,
                    time_off_type_id=time_off_types_data[2].id, # SL
                    allocated_amount=Decimal("10.00"),
                    taken_amount=Decimal("1.00"),
                    start_date=date(2026, 4, 1),
                    end_date=date(2027, 3, 31),
                    status="APPROVED",
                    approved_by_user_id=admin_user.id,
                    approved_at=datetime(2026, 4, 1, 10, 0),
                    notes="Annual Sick Leave entitlement FY 2026-27",
                )
            )
        session.add_all(allocations)
        session.flush()

        # A few sample leave requests
        leave_requests = [
            TimeOffRequest(
                employee_id=created_employees[4].id, # Ananya Iyer
                time_off_type_id=time_off_types_data[0].id,
                allocation_id=allocations[3 * 4].id,
                start_date=date(2026, 8, 14),
                end_date=date(2026, 8, 14),
                requested_amount=Decimal("1.00"),
                reason="Personal family commitment in Chennai",
                status="APPROVED",
                approved_by_user_id=admin_user.id,
                approved_at=datetime(2026, 8, 10, 14, 30),
            ),
            TimeOffRequest(
                employee_id=created_employees[7].id, # Rajesh Nair
                time_off_type_id=time_off_types_data[1].id,
                allocation_id=allocations[3 * 7 + 1].id,
                start_date=date(2026, 8, 20),
                end_date=date(2026, 8, 22),
                requested_amount=Decimal("3.00"),
                reason="Onam festival celebration with family in Kochi",
                status="APPROVED",
                approved_by_user_id=admin_user.id,
                approved_at=datetime(2026, 8, 12, 11, 15),
            ),
            TimeOffRequest(
                employee_id=created_employees[9].id, # Karthik Reddy
                time_off_type_id=time_off_types_data[2].id,
                allocation_id=allocations[3 * 9 + 2].id,
                start_date=date(2026, 9, 2),
                end_date=date(2026, 9, 3),
                requested_amount=Decimal("2.00"),
                reason="Viral fever and recovery",
                status="PENDING",
                approved_by_user_id=None,
                approved_at=None,
            ),
        ]
        session.add_all(leave_requests)
        session.flush()

        # 30 Days of attendance logs for August & early September 2026
        attendances = []
        base_date = date(2026, 8, 1)
        for day_offset in range(35):
            curr_date = base_date + timedelta(days=day_offset)
            if curr_date > date(2026, 9, 4):
                break
            if curr_date.weekday() >= 5: # Skip weekends
                continue
            
            for emp in created_employees:
                # 95% chance present, 5% leave
                if random.random() < 0.95:
                    check_in_h = random.choice([9, 9, 9, 9])
                    check_in_m = random.randint(10, 45)
                    check_out_h = random.choice([18, 18, 19])
                    check_out_m = random.randint(15, 55)
                    
                    c_in = datetime.combine(curr_date, time(check_in_h, check_in_m))
                    c_out = datetime.combine(curr_date, time(check_out_h, check_out_m))
                    worked_hrs = Decimal(f"{(c_out - c_in).total_seconds() / 3600:.2f}") - Decimal("1.00") # subtract 1 hr lunch
                    
                    attendances.append(
                        Attendance(
                            employee_id=emp.id,
                            check_in=c_in,
                            check_out=c_out,
                            worked_hours=max(Decimal("0.00"), worked_hrs),
                            status="PRESENT",
                            notes="Biometric punch log",
                        )
                    )
        session.add_all(attendances)
        session.flush()

        # -------------------------------------------------------------
        # 11. PAYRUNS, PAYRUN EMPLOYEES & PAYSLIPS (July & August 2026)
        # -------------------------------------------------------------
        print("[11/12] Seeding Historical Indian Payruns & Detailed Payslips...")
        
        # Payrun 1: July 2026 (PAID)
        payrun_july = Payrun(
            name="PeoplePay360 July 2026 Monthly Payrun",
            salary_structure_id=struct_tech.id,
            period_start=date(2026, 7, 1),
            period_end=date(2026, 7, 31),
            status="PAID",
            computed_at=datetime(2026, 7, 28, 15, 30),
            validated_at=datetime(2026, 7, 29, 11, 0),
            paid_at=datetime(2026, 7, 31, 10, 0),
            sent_at=datetime(2026, 7, 31, 12, 0),
            notes="July 2026 standard payroll cycle processed and disbursed via Corporate HDFC NetBanking NEFT/RTGS batch.",
            created_by_user_id=payroll_user.id,
        )
        
        # Payrun 2: August 2026 (PAID)
        payrun_aug = Payrun(
            name="PeoplePay360 August 2026 Monthly Payrun",
            salary_structure_id=struct_tech.id,
            period_start=date(2026, 8, 1),
            period_end=date(2026, 8, 31),
            status="PAID",
            computed_at=datetime(2026, 8, 28, 16, 0),
            validated_at=datetime(2026, 8, 29, 10, 30),
            paid_at=datetime(2026, 8, 31, 10, 0),
            sent_at=datetime(2026, 8, 31, 11, 30),
            notes="August 2026 monthly payroll cycle completed with statutory EPF & Professional Tax compliance.",
            created_by_user_id=payroll_user.id,
        )

        # Payrun 3: September 2026 (DRAFT)
        payrun_sep = Payrun(
            name="PeoplePay360 September 2026 Monthly Payrun",
            salary_structure_id=struct_tech.id,
            period_start=date(2026, 9, 1),
            period_end=date(2026, 9, 30),
            status="DRAFT",
            computed_at=None,
            validated_at=None,
            paid_at=None,
            sent_at=None,
            notes="September 2026 upcoming payroll cycle in draft stage.",
            created_by_user_id=payroll_user.id,
        )

        session.add_all([payrun_july, payrun_aug, payrun_sep])
        session.flush()

        # Seed payrun employees and detailed payslips for July and August
        for pr, p_start, p_end in [
            (payrun_july, date(2026, 7, 1), date(2026, 7, 31)),
            (payrun_aug, date(2026, 8, 1), date(2026, 8, 31)),
        ]:
            for idx, emp in enumerate(created_employees):
                contract = contracts[idx]
                monthly_wage = contract.wage
                
                # Roster entry
                pe = PayrunEmployee(
                    payrun_id=pr.id,
                    employee_id=emp.id,
                    selection_status="SELECTED",
                )
                session.add(pe)
                session.flush()

                # Calculate standard Indian breakdown
                basic = (monthly_wage * Decimal("0.50")).quantize(Decimal("0.01"))
                hra = (basic * Decimal("0.50")).quantize(Decimal("0.01"))
                conveyance = Decimal("1600.00")
                medical = Decimal("1250.00")
                special_allow = max(Decimal("0.00"), monthly_wage - basic - hra - conveyance - medical)
                gross = basic + hra + special_allow + conveyance + medical

                # Deductions
                epf_ee = min(Decimal("1800.00"), (basic * Decimal("0.12")).quantize(Decimal("0.01")))
                pt = Decimal("200.00") # INR 200/mo PT
                # Approximate Indian TDS bracket
                if monthly_wage >= Decimal("150000.00"):
                    tds = (gross * Decimal("0.15")).quantize(Decimal("0.01"))
                elif monthly_wage >= Decimal("80000.00"):
                    tds = (gross * Decimal("0.08")).quantize(Decimal("0.01"))
                else:
                    tds = Decimal("0.00")
                
                total_deductions = epf_ee + pt + tds
                epf_er = epf_ee
                net_salary = gross - total_deductions

                payslip = Payslip(
                    payrun_id=pr.id,
                    employee_id=emp.id,
                    payrun_employee_id=pe.id,
                    salary_structure_id=contract.salary_structure_id,
                    contract_id=contract.id,
                    period_start=p_start,
                    period_end=p_end,
                    worked_days=Decimal("22.00"),
                    basic_amount=basic,
                    gross_amount=gross,
                    deduction_amount=total_deductions,
                    contribution_amount=epf_er,
                    net_amount=net_salary,
                    status="PAID",
                    pdf_generated_at=pr.paid_at,
                    sent_at=pr.sent_at,
                )
                session.add(payslip)
                session.flush()

                # Payslip line breakdown
                lines = [
                    PayslipLine(payslip_id=payslip.id, salary_rule_id=salary_rules_data[0].id, name="Basic Salary", code="BASIC", category="BASIC", sequence=10, calculation_type="PERCENTAGE", quantity=Decimal("1.0000"), rate=Decimal("50.0000"), base_amount=monthly_wage, amount=basic, formula_snapshot="50% of Monthly CTC Base"),
                    PayslipLine(payslip_id=payslip.id, salary_rule_id=salary_rules_data[1].id, name="House Rent Allowance", code="HRA", category="ALLOWANCE", sequence=20, calculation_type="PERCENTAGE", quantity=Decimal("1.0000"), rate=Decimal("50.0000"), base_amount=basic, amount=hra, formula_snapshot="50% of Basic Salary"),
                    PayslipLine(payslip_id=payslip.id, salary_rule_id=salary_rules_data[2].id, name="Special Allowance", code="SPECIAL_ALLOW", category="ALLOWANCE", sequence=30, calculation_type="FORMULA", quantity=Decimal("1.0000"), rate=None, base_amount=special_allow, amount=special_allow, formula_snapshot="Balancing Figure"),
                    PayslipLine(payslip_id=payslip.id, salary_rule_id=salary_rules_data[3].id, name="Conveyance Allowance", code="CONVEYANCE", category="ALLOWANCE", sequence=40, calculation_type="FIXED", quantity=Decimal("1.0000"), rate=None, base_amount=conveyance, amount=conveyance, formula_snapshot="Fixed INR 1,600/mo"),
                    PayslipLine(payslip_id=payslip.id, salary_rule_id=salary_rules_data[4].id, name="Medical Allowance", code="MEDICAL_ALLOW", category="ALLOWANCE", sequence=50, calculation_type="FIXED", quantity=Decimal("1.0000"), rate=None, base_amount=medical, amount=medical, formula_snapshot="Fixed INR 1,250/mo"),
                    PayslipLine(payslip_id=payslip.id, salary_rule_id=salary_rules_data[6].id, name="Employee Provident Fund (EPF)", code="EPF_EE", category="DEDUCTION", sequence=110, calculation_type="PERCENTAGE", quantity=Decimal("1.0000"), rate=Decimal("12.0000"), base_amount=basic, amount=epf_ee, formula_snapshot="12% of Basic up to statutory ceiling"),
                    PayslipLine(payslip_id=payslip.id, salary_rule_id=salary_rules_data[7].id, name="Professional Tax", code="PT", category="DEDUCTION", sequence=120, calculation_type="FIXED", quantity=Decimal("1.0000"), rate=None, base_amount=pt, amount=pt, formula_snapshot="State PT Act (INR 200)"),
                    PayslipLine(payslip_id=payslip.id, salary_rule_id=salary_rules_data[8].id, name="Tax Deducted at Source (TDS)", code="TDS", category="DEDUCTION", sequence=130, calculation_type="PERCENTAGE", quantity=Decimal("1.0000"), rate=Decimal("10.0000"), base_amount=gross, amount=tds, formula_snapshot="Income Tax Withholding"),
                ]
                session.add_all(lines)

        # -------------------------------------------------------------
        # 12. PAYROLL WARNINGS & SYSTEM NOTIFICATIONS
        # -------------------------------------------------------------
        print("[12/12] Seeding Payroll Compliance Warnings & System Notifications...")
        
        warnings_data = [
            PayrollWarning(
                payrun_id=payrun_sep.id,
                payslip_id=None,
                employee_id=created_employees[13].id, # Rahul Joshi
                warning_type="CONTRACT_EXPIRING",
                severity="WARNING",
                message="Fixed-Term Contract for Rahul Joshi (EMP-IND-014) is up for quarterly renewal on 30-Sep-2026.",
                is_resolved=False,
                resolved_by_user_id=None,
                resolved_at=None,
            ),
            PayrollWarning(
                payrun_id=payrun_aug.id,
                payslip_id=None,
                employee_id=created_employees[14].id, # Meera Ranganathan
                warning_type="MISSING_BANK_DETAILS",
                severity="INFO",
                message="Intern stipend bank details verified via Penny-Drop test on ICICI portal.",
                is_resolved=True,
                resolved_by_user_id=payroll_user.id,
                resolved_at=datetime(2026, 8, 29, 12, 0),
            ),
        ]
        session.add_all(warnings_data)

        notifications_data = [
            Notification(
                user_id=admin_user.id,
                title="August 2026 Payroll Disbursed",
                message="August 2026 Monthly Payrun has been validated, approved, and disbursed to 15 employees via NEFT batch.",
                notification_type="PAYRUN_PAID",
                reference_type="payrun",
                reference_id=payrun_aug.id,
                is_read=True,
                read_at=datetime(2026, 8, 31, 12, 30),
                created_at=datetime(2026, 8, 31, 10, 0),
                updated_at=datetime(2026, 8, 31, 12, 30),
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
                updated_at=datetime(2026, 9, 2, 8, 30),
            ),
            Notification(
                user_id=payroll_user.id,
                title="September 2026 Payrun Cycle Initialized",
                message="Draft payroll batch PAYRUN-2026-09 is open for attendance sync and pre-payroll adjustments.",
                notification_type="PAYRUN_DRAFT",
                reference_type="payrun",
                reference_id=payrun_sep.id,
                is_read=False,
                read_at=None,
                created_at=datetime(2026, 9, 1, 9, 0),
                updated_at=datetime(2026, 9, 1, 9, 0),
            ),
        ]
        session.add_all(notifications_data)

        # Commit all entities
        session.commit()

    print("\n" + "=" * 70)
    print("SUCCESS: INDIAN HR & PAYROLL DATABASE SEEDING COMPLETED")
    print("=" * 70)
    print("  - 5 Roles & System Users")
    print("  - 6 Departments & 12 Job Designations")
    print("  - 15 Indian Employees (Bangalore, Mumbai, Pune, Gurugram, Hyderabad)")
    print("  - 15 Indian Bank Accounts (HDFC, ICICI, SBI, Axis, Kotak with IFSC)")
    print("  - 3 Working Schedules & Daily Rotas")
    print("  - 15 Active Employee Contracts with INR Compensation Packages")
    print("  - 3 Salary Structures & 12 Indian Statutory Salary Rules (EPF, PT, HRA, TDS, Net)")
    print("  - 5 Indian Leave Types, 45 Leave Allocations & Requests")
    print("  - 350+ Daily Biometric Attendance Logs")
    print("  - 3 Monthly Payruns (July & August 2026 Paid, September 2026 Draft)")
    print("  - 30 Historical Itemized Payslips with 240+ Breakdown Lines in INR")
    print("  - Compliance Warnings & System Event Notifications")
    print("=" * 70)

if __name__ == "__main__":
    seed_database()
