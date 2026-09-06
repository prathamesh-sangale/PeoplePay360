"""
PeoplePay360 - Comprehensive & Safe Indian HR & Payroll Seed Script (230 Employees)
Populates high-quality, realistic, varied Indian corporate data across all 25 tables:
- System Roles & 230 Linked User Accounts (Hashed passwords, Admin, HR, Payroll, Employee)
- 6 Departments & 30 Specialized Job Roles
- 4 Employee Types (Full-Time Permanent, Fixed-Term Contract, Intern, Consultant)
- 230 Indian Employees across Bangalore, Mumbai, Pune, Delhi NCR, and Hyderabad
- Balanced 3-Tier Managerial Hierarchy (Dept Heads -> Team Leads -> Individual Contributors)
- 5 Diverse Working Schedules with 12-hour AM/PM shifts
- Employee Schedule Assignments (including historical schedule shifts)
- Realistic Indian Bank Accounts (HDFC, ICICI, SBI, Axis, Kotak, BOB, PNB)
- 6 Indian Salary Structures & 18 Statutory Salary Rules (Basic, HRA, EPF 12%, PT ₹200, TDS 192/194J)
- 230+ Employee Contracts with realistic Indian CTC compensation packages
- 6 Indian Leave Types, 690+ Allocations & Diverse Requests (Approved, Pending, Refused)
- 2,000+ Daily Biometric Attendance Logs with full status variety
- 5 Payruns (June, July, August Paid, September Draft, Q2 Incentive Paid)
- 690 Itemized Payslips & 5,000+ Payslip Lines in INR
- Payroll Warnings & Live System Notifications across Roles

Safe and idempotent: Uses TRUNCATE CASCADE and deterministic seed data.
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
    print("=" * 80)
    print("PeoplePay360 - SEEDING ENTERPRISE DATASET: 230 EMPLOYEES & BALANCED ROLES")
    print("=" * 80)

    engine = create_engine(DATABASE_URL)

    with Session(engine) as session:
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
        print("[INFO] Database ready for structured 230-employee seeding.\n")

        # -------------------------------------------------------------
        # 1. ROLES
        # -------------------------------------------------------------
        print("[1/14] Seeding Roles...")
        roles_data = [
            Role(name="ADMIN", description="Complete system administrator with full access to all modules"),
            Role(name="HR", description="Human Resources Lead with employee and workforce management access"),
            Role(name="PAYROLL", description="Payroll specialist managing salary structures, rules, and payruns"),
            Role(name="EMPLOYEE", description="Standard employee access for self-service portal, payslips, and leaves"),
        ]
        session.add_all(roles_data)
        session.flush()
        roles_by_name = {r.name: r for r in roles_data}

        # Bcrypt hash for standard demo password "PeoplePay@2026"
        dummy_hash = "$2b$12$e8YQz.FjC.4nZ4R0W0WjheR3sV1QyP5Q8M6gH2f0l1v3k5n7m9p2q"

        # -------------------------------------------------------------
        # 2. DEPARTMENTS & 30 SPECIALIZED JOB ROLES
        # -------------------------------------------------------------
        print("[2/14] Seeding 6 Departments and 30 Specialized Job Roles...")
        departments_data = [
            Department(name="Engineering & Technology", code="ENG", description="Software Development, DevOps, Cloud Architecture, and QA (Bangalore Tech Hub)"),
            Department(name="Human Resources & Talent", code="HR", description="People Operations, Talent Acquisition, L&D, and Statutory Compliance (Mumbai HQ & Bangalore)"),
            Department(name="Finance & Accounts", code="FIN", description="Corporate Finance, Payroll Operations, Tax Compliance, and Statutory Audits (Mumbai HQ)"),
            Department(name="Product & Design", code="PROD", description="Product Strategy, UI/UX Design, and Customer Discovery (Bangalore Hub)"),
            Department(name="Sales & Business Development", code="SALES", description="Enterprise Client Relations, Solution Sales, and Market Expansion (Delhi NCR Hub)"),
            Department(name="Customer Success & Operations", code="OPS", description="Client Onboarding, 24/7 Technical Support, and Operations (Hyderabad & Pune Hubs)"),
        ]
        session.add_all(departments_data)
        session.flush()
        dept_by_code = {d.code: d for d in departments_data}

        jobs_data = [
            # Engineering
            Job(name="VP of Engineering", code="JOB-ENG-VP", description="Executive technology leadership and platform strategy"),
            Job(name="Principal Software Architect", code="JOB-ENG-ARCH", description="Core distributed systems architecture and scalability"),
            Job(name="Engineering Manager / Tech Lead", code="JOB-ENG-MGR", description="Engineering team leadership and sprint delivery"),
            Job(name="Senior Full Stack Engineer", code="JOB-ENG-SR-SDE", description="React, Python FastAPI, PostgreSQL, and platform architecture"),
            Job(name="Software Development Engineer (SDE II)", code="JOB-ENG-SDE", description="Full stack feature engineering and microservices"),
            Job(name="Associate Software Engineer (SDE I)", code="JOB-ENG-JR-SDE", description="Frontend/backend development and bug fixes"),
            Job(name="Senior DevOps & Cloud Architect", code="JOB-ENG-DEVOPS-SR", description="AWS, Kubernetes, CI/CD, and infrastructure monitoring"),
            Job(name="DevOps & Cloud Specialist", code="JOB-ENG-DEVOPS", description="Cloud infrastructure automation and deployment pipelines"),
            Job(name="Lead QA Automation Engineer", code="JOB-ENG-QA-LEAD", description="Quality assurance strategy and test automation frameworks"),
            Job(name="QA Automation Engineer", code="JOB-ENG-QA", description="End-to-end automation, regression, and performance testing"),
            Job(name="Senior Data & ML Engineer", code="JOB-ENG-DATA", description="Data pipelines, analytics warehouses, and ML models"),

            # HR
            Job(name="Head of Human Resources", code="JOB-HR-HEAD", description="HR strategy, people culture, and organizational development"),
            Job(name="Senior HR Business Partner (HRBP)", code="JOB-HR-BP", description="Strategic HR advisory for business units"),
            Job(name="Lead Talent Acquisition Specialist", code="JOB-HR-TA-LEAD", description="Leadership hiring and campus recruitment campaigns"),
            Job(name="Technical Recruiter", code="JOB-HR-RECRUITER", description="Engineering and product hiring"),
            Job(name="HR Operations & Talent Specialist", code="JOB-HR-SPEC", description="Onboarding, employee records, and statutory compliance"),
            Job(name="Learning & Organization Development Lead", code="JOB-HR-LD", description="Employee training programs and leadership workshops"),
            Job(name="Compensation & Benefits Analyst", code="JOB-HR-CB", description="Salary benchmarking, annual appraisal grids, and rewards"),

            # Finance & Payroll
            Job(name="Head of Finance & Controller", code="JOB-FIN-HEAD", description="Financial controller, fiscal strategy, and treasury"),
            Job(name="Lead Payroll Specialist", code="JOB-FIN-PAYROLL", description="End-to-end payroll processing and statutory tax compliance"),
            Job(name="Senior Payroll Operations Officer", code="JOB-FIN-PAYROLL-OFFICER", description="Monthly payroll execution, TDS, and PF filing"),
            Job(name="Statutory Tax & Compliance Auditor", code="JOB-FIN-TAX", description="EPF, ESIC, PT, and TDS Section 192/194J compliance"),
            Job(name="Senior Financial Analyst", code="JOB-FIN-SR", description="Corporate budgeting, financial modeling, and FP&A"),
            Job(name="Corporate Accountant", code="JOB-FIN-ACCT", description="General ledger, invoicing, and statutory filings"),

            # Product & Design
            Job(name="Head of Product & Design", code="JOB-PROD-HEAD", description="Product vision, roadmap prioritization, and design leadership"),
            Job(name="Senior Product Manager", code="JOB-PROD-PM", description="Product discovery, roadmap delivery, and customer analytics"),
            Job(name="Associate Product Manager", code="JOB-PROD-APM", description="Feature backlog management and agile sprint execution"),
            Job(name="Lead UI/UX Product Designer", code="JOB-PROD-DESIGN-LEAD", description="Design system leadership, Figma components, and user experience"),
            Job(name="UI/UX Product Designer", code="JOB-PROD-DESIGNER", description="Wireframing, prototyping, and visual design"),

            # Sales
            Job(name="Enterprise Sales Director", code="JOB-SALES-DIR", description="Enterprise revenue strategy and high-value deal closing"),
            Job(name="Regional Sales Manager", code="JOB-SALES-MGR", description="Regional quota management and territory leadership"),
            Job(name="Senior Enterprise Account Executive", code="JOB-SALES-AE-SR", description="Mid-market and enterprise B2B sales execution"),
            Job(name="Enterprise Account Executive", code="JOB-SALES-AE", description="Outbound sales and client demonstrations"),
            Job(name="Sales Development Representative (SDR)", code="JOB-SALES-SDR", description="Prospect qualification and lead generation"),
            Job(name="Presales Solutions Architect", code="JOB-SALES-PRESALES", description="Technical demonstrations and RFP architecture"),

            # Operations & Support
            Job(name="Customer Operations Lead", code="JOB-OPS-LEAD", description="Client implementation, SLA monitoring, and operational excellence"),
            Job(name="Customer Success Manager (CSM)", code="JOB-OPS-CSM", description="Client retention, NPS, and expansion accounts"),
            Job(name="Client Implementation Specialist", code="JOB-OPS-IMPL", description="Data migration, system configuration, and client training"),
            Job(name="Senior Technical Support Engineer", code="JOB-OPS-SUPP-SR", description="Tier 2/3 troubleshooting and API integration support"),
            Job(name="Customer Support Associate", code="JOB-OPS-SUPP", description="24/7 helpdesk support and user query resolution"),
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
        # 4. WORKING SCHEDULES
        # -------------------------------------------------------------
        print("[4/14] Seeding Working Schedules & Daily Rotas...")
        schedules_data = [
            WorkingSchedule(name="Indian Standard General Shift (40h/wk)", code="IND_CORP_GEN", weekly_hours=Decimal("40.00"), is_active=True),
            WorkingSchedule(name="Early Morning Tech Shift (40h/wk)", code="IND_EARLY_TECH", weekly_hours=Decimal("40.00"), is_active=True),
            WorkingSchedule(name="Flexible Product & R&D Shift (40h/wk)", code="IND_FLEXI_RND", weekly_hours=Decimal("40.00"), is_active=True),
            WorkingSchedule(name="Operations Support 6-Day Shift (44h/wk)", code="IND_OPS_SAT", weekly_hours=Decimal("44.00"), is_active=True),
            WorkingSchedule(name="24x7 Customer Support Shift (40h/wk)", code="IND_EVENING_SUPP", weekly_hours=Decimal("40.00"), is_active=True),
        ]
        session.add_all(schedules_data)
        session.flush()

        schedule_days = []
        for d in range(7):
            is_work = d < 5
            schedule_days.append(WorkingScheduleDay(working_schedule_id=schedules_data[0].id, day_of_week=d, start_time=time(9, 0) if is_work else None, end_time=time(18, 0) if is_work else None, break_minutes=60 if is_work else 0, is_working_day=is_work))
            schedule_days.append(WorkingScheduleDay(working_schedule_id=schedules_data[1].id, day_of_week=d, start_time=time(8, 0) if is_work else None, end_time=time(17, 0) if is_work else None, break_minutes=60 if is_work else 0, is_working_day=is_work))
            schedule_days.append(WorkingScheduleDay(working_schedule_id=schedules_data[2].id, day_of_week=d, start_time=time(10, 0) if is_work else None, end_time=time(19, 0) if is_work else None, break_minutes=60 if is_work else 0, is_working_day=is_work))
            schedule_days.append(WorkingScheduleDay(working_schedule_id=schedules_data[4].id, day_of_week=d, start_time=time(14, 0) if is_work else None, end_time=time(23, 0) if is_work else None, break_minutes=60 if is_work else 0, is_working_day=is_work))
            if d < 5:
                schedule_days.append(WorkingScheduleDay(working_schedule_id=schedules_data[3].id, day_of_week=d, start_time=time(9, 0), end_time=time(18, 0), break_minutes=60, is_working_day=True))
            elif d == 5:
                schedule_days.append(WorkingScheduleDay(working_schedule_id=schedules_data[3].id, day_of_week=d, start_time=time(9, 0), end_time=time(13, 0), break_minutes=0, is_working_day=True))
            else:
                schedule_days.append(WorkingScheduleDay(working_schedule_id=schedules_data[3].id, day_of_week=d, start_time=None, end_time=None, break_minutes=0, is_working_day=False))

        session.add_all(schedule_days)
        session.flush()

        # -------------------------------------------------------------
        # 5. SALARY STRUCTURES & RULES
        # -------------------------------------------------------------
        print("[5/14] Seeding 6 Salary Structures & 18 Statutory Rules...")
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
            SalaryRule(name="Employee Provident Fund (EPF)", code="EPF_EE", category="DEDUCTION", sequence=110, calculation_type="PERCENTAGE", percentage=Decimal("12.0000"), amount=None, formula="12% of Basic Salary", description="Statutory EPF contribution to EPFO"),
            SalaryRule(name="Professional Tax (PT)", code="PT", category="DEDUCTION", sequence=120, calculation_type="FIXED", percentage=None, amount=Decimal("200.00"), formula=None, description="State Government Professional Tax (₹200/mo)"),
            SalaryRule(name="Tax Deducted at Source (TDS Sec 192)", code="TDS", category="DEDUCTION", sequence=130, calculation_type="PERCENTAGE", percentage=Decimal("10.0000"), amount=None, formula="Monthly Income Tax Withholding", description="TDS under Income Tax Act Section 192"),
            SalaryRule(name="Professional TDS (Section 194J)", code="TDS_194J", category="DEDUCTION", sequence=135, calculation_type="PERCENTAGE", percentage=Decimal("10.0000"), amount=None, formula="10% flat withholding on professional fees", description="TDS under Section 194J for Retainers"),
            SalaryRule(name="Loss of Pay (LOP) Deduction", code="LOP", category="DEDUCTION", sequence=140, calculation_type="FORMULA", percentage=None, amount=None, formula="(BASIC / WORKING_DAYS) * LOP_DAYS", description="Statutory Loss of Pay deduction for approved unpaid absences"),
            SalaryRule(name="Total Deductions", code="TOTAL_DED", category="DEDUCTION", sequence=190, calculation_type="FORMULA", percentage=None, amount=None, formula="SUM(DEDUCTIONS)", description="Sum of monthly deductions"),
            SalaryRule(name="Net Salary Payable", code="NET", category="NET", sequence=200, calculation_type="FORMULA", percentage=None, amount=None, formula="GROSS - TOTAL_DED", description="Take-home salary credited to bank account"),
            SalaryRule(name="Employer EPF Contribution", code="EPF_ER", category="CONTRIBUTION", sequence=210, calculation_type="PERCENTAGE", percentage=Decimal("12.0000"), amount=None, formula="12% of Basic Salary", description="Employer statutory contribution to EPFO"),
        ]
        session.add_all(salary_rules_data)
        session.flush()
        rules_by_code = {r.code: r for r in salary_rules_data}

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
                struct_rules.append(SalaryStructureRule(salary_structure_id=s_id, salary_rule_id=rule.id, sequence=seq * 10, is_active=True))
        session.add_all(struct_rules)
        session.flush()

        # -------------------------------------------------------------
        # 6. LEAVE TYPES
        # -------------------------------------------------------------
        print("[6/14] Seeding 6 Indian Leave Types...")
        time_off_types_data = [
            TimeOffType(name="Casual Leave (CL)", code="CL", unit="DAYS", allocation_required=True, approval_required=True, payroll_integration=False, is_active=True, description="Paid casual leave for personal commitments"),
            TimeOffType(name="Privilege / Earned Leave (PL)", code="PL", unit="DAYS", allocation_required=True, approval_required=True, payroll_integration=False, is_active=True, description="Earned leave accumulated per working month"),
            TimeOffType(name="Sick Leave (SL)", code="SL", unit="DAYS", allocation_required=True, approval_required=True, payroll_integration=False, is_active=True, description="Medical sick leave"),
            TimeOffType(name="Unpaid Leave / Loss of Pay (LOP)", code="UNPAID", unit="DAYS", allocation_required=False, approval_required=True, payroll_integration=True, is_active=True, description="Unpaid leave / Loss of Pay impacting monthly payroll computation"),
            TimeOffType(name="Maternity Leave (ML)", code="ML", unit="DAYS", allocation_required=False, approval_required=True, payroll_integration=True, is_active=True, description="26 weeks statutory maternity benefit"),
            TimeOffType(name="Optional / Festival Holiday", code="FEST_HOL", unit="DAYS", allocation_required=True, approval_required=True, payroll_integration=False, is_active=True, description="Optional religious and festival holidays"),
        ]
        session.add_all(time_off_types_data)
        session.flush()

        # -------------------------------------------------------------
        # 7. GENERATING 230 BALANCED INDIAN EMPLOYEES & USERS
        # -------------------------------------------------------------
        print("[7/14] Synthesizing 230 Indian Employees with 3-Tier Hierarchy & Balanced Roles...")

        canonical_15 = [
            {"code": "EMP-IND-001", "first": "Aarav", "last": "Sharma", "email": "aarav.sharma@peoplepay360.in", "phone": "+91 98450 11223", "dob": date(1986, 4, 15), "doj": date(2021, 1, 15), "dept": "ENG", "job": "JOB-ENG-VP", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED", "role": "ADMIN", "wage": Decimal("300000.00"), "struct": struct_exec, "sched_idx": 0, "city": "Bengaluru, Karnataka"},
            {"code": "EMP-IND-002", "first": "Priya", "last": "Patel", "email": "priya.patel@peoplepay360.in", "phone": "+91 98200 44556", "dob": date(1989, 8, 22), "doj": date(2021, 3, 1), "dept": "HR", "job": "JOB-HR-HEAD", "type": "FT_PERM", "gender": "FEMALE", "marital": "MARRIED", "role": "HR", "wage": Decimal("220000.00"), "struct": struct_exec, "sched_idx": 0, "city": "Mumbai, Maharashtra"},
            {"code": "EMP-IND-003", "first": "Rohan", "last": "Mehta", "email": "rohan.mehta@peoplepay360.in", "phone": "+91 98110 77889", "dob": date(1991, 11, 10), "doj": date(2021, 6, 15), "dept": "FIN", "job": "JOB-FIN-PAYROLL", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED", "role": "PAYROLL", "wage": Decimal("180000.00"), "struct": struct_tech, "sched_idx": 0, "city": "Mumbai, Maharashtra"},
            {"code": "EMP-IND-004", "first": "Vikram", "last": "Sengupta", "email": "vikram.sengupta@peoplepay360.in", "phone": "+91 98860 33445", "dob": date(1988, 2, 18), "doj": date(2022, 1, 10), "dept": "ENG", "job": "JOB-ENG-ARCH", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED", "role": "EMPLOYEE", "wage": Decimal("260000.00"), "struct": struct_exec, "sched_idx": 2, "city": "Bengaluru, Karnataka"},
            {"code": "EMP-IND-005", "first": "Ananya", "last": "Iyer", "email": "ananya.iyer@peoplepay360.in", "phone": "+91 97900 66778", "dob": date(1994, 6, 30), "doj": date(2022, 4, 1), "dept": "ENG", "job": "JOB-ENG-SR-SDE", "type": "FT_PERM", "gender": "FEMALE", "marital": "SINGLE", "role": "EMPLOYEE", "wage": Decimal("130000.00"), "struct": struct_tech, "sched_idx": 1, "city": "Bengaluru, Karnataka"},
            {"code": "EMP-IND-006", "first": "Aditya", "last": "Verma", "email": "aditya.verma@peoplepay360.in", "phone": "+91 99100 22334", "dob": date(1992, 12, 5), "doj": date(2022, 7, 1), "dept": "SALES", "job": "JOB-SALES-DIR", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED", "role": "EMPLOYEE", "wage": Decimal("210000.00"), "struct": struct_sales, "sched_idx": 0, "city": "Delhi NCR (Gurugram)"},
            {"code": "EMP-IND-007", "first": "Neha", "last": "Kulkarni", "email": "neha.kulkarni@peoplepay360.in", "phone": "+91 98500 88990", "dob": date(1995, 3, 14), "doj": date(2022, 9, 15), "dept": "OPS", "job": "JOB-OPS-LEAD", "type": "FT_PERM", "gender": "FEMALE", "marital": "SINGLE", "role": "EMPLOYEE", "wage": Decimal("115000.00"), "struct": struct_ops, "sched_idx": 3, "city": "Hyderabad, Telangana"},
            {"code": "EMP-IND-008", "first": "Rajesh", "last": "Nair", "email": "rajesh.nair@peoplepay360.in", "phone": "+91 98470 55667", "dob": date(1990, 9, 28), "doj": date(2023, 1, 16), "dept": "ENG", "job": "JOB-ENG-DEVOPS-SR", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED", "role": "EMPLOYEE", "wage": Decimal("145000.00"), "struct": struct_tech, "sched_idx": 4, "city": "Bengaluru, Karnataka"},
            {"code": "EMP-IND-009", "first": "Sneha", "last": "Mukherjee", "email": "sneha.mukherjee@peoplepay360.in", "phone": "+91 98300 11224", "dob": date(1996, 7, 19), "doj": date(2023, 3, 1), "dept": "PROD", "job": "JOB-PROD-HEAD", "type": "FT_PERM", "gender": "FEMALE", "marital": "SINGLE", "role": "EMPLOYEE", "wage": Decimal("155000.00"), "struct": struct_tech, "sched_idx": 2, "city": "Bengaluru, Karnataka"},
            {"code": "EMP-IND-010", "first": "Karthik", "last": "Reddy", "email": "karthik.reddy@peoplepay360.in", "phone": "+91 98490 77881", "dob": date(1993, 10, 8), "doj": date(2023, 5, 2), "dept": "ENG", "job": "JOB-ENG-SDE", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED", "role": "EMPLOYEE", "wage": Decimal("125000.00"), "struct": struct_tech, "sched_idx": 1, "city": "Bengaluru, Karnataka"},
            {"code": "EMP-IND-011", "first": "Pooja", "last": "Deshmukh", "email": "pooja.deshmukh@peoplepay360.in", "phone": "+91 98210 33448", "dob": date(1994, 1, 25), "doj": date(2023, 8, 1), "dept": "HR", "job": "JOB-HR-SPEC", "type": "FT_PERM", "gender": "FEMALE", "marital": "SINGLE", "role": "HR", "wage": Decimal("85000.00"), "struct": struct_tech, "sched_idx": 0, "city": "Mumbai, Maharashtra"},
            {"code": "EMP-IND-012", "first": "Amitav", "last": "Banerjee", "email": "amitav.banerjee@peoplepay360.in", "phone": "+91 98900 66772", "dob": date(1991, 5, 12), "doj": date(2023, 11, 1), "dept": "FIN", "job": "JOB-FIN-SR", "type": "FT_PERM", "gender": "MALE", "marital": "MARRIED", "role": "PAYROLL", "wage": Decimal("95000.00"), "struct": struct_tech, "sched_idx": 0, "city": "Mumbai, Maharashtra"},
            {"code": "EMP-IND-013", "first": "Divya", "last": "Swaminathan", "email": "divya.swaminathan@peoplepay360.in", "phone": "+91 98400 99881", "dob": date(1997, 4, 3), "doj": date(2024, 1, 15), "dept": "ENG", "job": "JOB-ENG-QA-LEAD", "type": "FT_PERM", "gender": "FEMALE", "marital": "SINGLE", "role": "EMPLOYEE", "wage": Decimal("75000.00"), "struct": struct_tech, "sched_idx": 1, "city": "Bengaluru, Karnataka"},
            {"code": "EMP-IND-014", "first": "Rahul", "last": "Joshi", "email": "rahul.joshi@peoplepay360.in", "phone": "+91 98205 77661", "dob": date(1998, 8, 14), "doj": date(2024, 3, 1), "dept": "ENG", "job": "JOB-ENG-SR-SDE", "type": "FT_CON", "gender": "MALE", "marital": "SINGLE", "role": "EMPLOYEE", "wage": Decimal("65000.00"), "struct": struct_consult, "sched_idx": 1, "city": "Bengaluru, Karnataka"},
            {"code": "EMP-IND-015", "first": "Meera", "last": "Ranganathan", "email": "meera.ranganathan@peoplepay360.in", "phone": "+91 98480 22331", "dob": date(2001, 10, 19), "doj": date(2024, 6, 1), "dept": "PROD", "job": "JOB-PROD-APM", "type": "INTERN", "gender": "FEMALE", "marital": "SINGLE", "role": "EMPLOYEE", "wage": Decimal("35000.00"), "struct": struct_intern, "sched_idx": 2, "city": "Bengaluru, Karnataka"},
        ]

        first_names_male = [
            "Arjun", "Suresh", "Manoj", "Harish", "Vivek", "Siddharth", "Nikhil", "Deepak", "Pranav", "Rohit",
            "Varun", "Abhishek", "Gaurav", "Manish", "Alok", "Devendra", "Sachin", "Ashwin", "Vishal", "Kunal",
            "Tushar", "Sanjay", "Praveen", "Anand", "Ritesh", "Sandeep", "Ajay", "Vijay", "Mukesh", "Dinesh",
            "Kishore", "Tarun", "Chetan", "Naveen", "Girish", "Prashant", "Hemant", "Lalit", "Mayank", "Nitin",
            "Pankaj", "Sumit", "Abhay", "Akash", "Aniruddh", "Bhavesh", "Chirag", "Darshan", "Ganesh", "Himanshu",
            "Jagdish", "Kapil", "Lokesh", "Mohit", "Omkar", "Parag", "Raghav", "Sameer", "Tanmay", "Umesh",
            "Vaibhav", "Yash", "Avinash", "Bharat", "Chandan", "Dhananjay", "Eashan", "Farhan", "Govind", "Hardik"
        ]
        first_names_female = [
            "Kavya", "Lakshmi", "Anjali", "Deepa", "Tanvi", "Shilpa", "Rashmi", "Preeti", "Swati", "Meenakshi",
            "Ritu", "Sonali", "Shruti", "Isha", "Nandini", "Pallavi", "Shreya", "Aditi", "Bhavna", "Gayatri",
            "Archana", "Geeta", "Jyoti", "Komal", "Lavanya", "Madhavi", "Namrata", "Payal", "Radha", "Sarita",
            "Urmila", "Vaishali", "Vidya", "Aarti", "Bipasha", "Chaitali", "Damini", "Ekta", "Farah", "Garima",
            "Hema", "Indira", "Jasleen", "Kiran", "Lata", "Manisha", "Nisha", "Oindrila", "Prerna", "Rekha",
            "Sangeeta", "Tanya", "Uma", "Vandana", "Yamini", "Zoya", "Alka", "Brinda", "Charu", "Devika",
            "Esha", "Falguni", "Gauri", "Harini", "Ishani", "Janaki", "Kalyani", "Leela", "Mallika", "Nayantara"
        ]
        last_names = [
            "Menon", "Hegde", "Trivedi", "Ganguly", "Bhattacharya", "Nambiar", "Choudhury", "Nambisan", "Agarwal", "Sen",
            "Pillai", "Gupta", "Sundaram", "Varma", "Deshpande", "Rao", "Bhat", "Kashyap", "Pandey", "Mishra",
            "Dubey", "Shukla", "Tiwari", "Singh", "Yadav", "Chauhan", "Bose", "Dutta", "Ghosh", "Chatterjee",
            "Majumdar", "Mitra", "Sinha", "Das", "Roy", "Nayak", "Saxena", "Bhardwaj", "Goswami", "Tripathi",
            "Kaur", "Gill", "Sandhu", "Dhillon", "Venkatesh", "Krishnan", "Subramanian", "Acharya", "Shenoy", "Kamath",
            "Prabhu", "Khatri", "Sethi", "Kohli", "Bhatia", "Kapoor", "Khanna", "Sood", "Malhotra", "Ahluwalia",
            "Chopra", "Grover", "Anand", "Bakshi", "Chhabra", "Talwar", "Suri", "Madan", "Garg", "Bansal"
        ]

        dept_plans = [
            {"dept": "ENG", "count": 78, "city": "Bengaluru, Karnataka", "role": "EMPLOYEE", "jobs": [
                ("JOB-ENG-MGR", Decimal("180000.00"), struct_tech, "FT_PERM", 0.08),
                ("JOB-ENG-SR-SDE", Decimal("135000.00"), struct_tech, "FT_PERM", 0.25),
                ("JOB-ENG-SDE", Decimal("85000.00"), struct_tech, "FT_PERM", 0.32),
                ("JOB-ENG-JR-SDE", Decimal("55000.00"), struct_tech, "FT_PERM", 0.15),
                ("JOB-ENG-DEVOPS", Decimal("110000.00"), struct_tech, "FT_PERM", 0.08),
                ("JOB-ENG-QA", Decimal("65000.00"), struct_tech, "FT_PERM", 0.08),
                ("JOB-ENG-DATA", Decimal("140000.00"), struct_tech, "FT_PERM", 0.04),
            ]},
            {"dept": "HR", "count": 23, "city": "Mumbai, Maharashtra", "role": "HR", "jobs": [
                ("JOB-HR-BP", Decimal("130000.00"), struct_tech, "FT_PERM", 0.20),
                ("JOB-HR-TA-LEAD", Decimal("115000.00"), struct_tech, "FT_PERM", 0.20),
                ("JOB-HR-RECRUITER", Decimal("65000.00"), struct_tech, "FT_PERM", 0.30),
                ("JOB-HR-SPEC", Decimal("70000.00"), struct_tech, "FT_PERM", 0.15),
                ("JOB-HR-LD", Decimal("95000.00"), struct_tech, "FT_PERM", 0.10),
                ("JOB-HR-CB", Decimal("105000.00"), struct_tech, "FT_PERM", 0.05),
            ]},
            {"dept": "FIN", "count": 20, "city": "Mumbai, Maharashtra", "role": "PAYROLL", "jobs": [
                ("JOB-FIN-PAYROLL-OFFICER", Decimal("80000.00"), struct_tech, "FT_PERM", 0.35),
                ("JOB-FIN-TAX", Decimal("90000.00"), struct_tech, "FT_PERM", 0.25),
                ("JOB-FIN-SR", Decimal("110000.00"), struct_tech, "FT_PERM", 0.20),
                ("JOB-FIN-ACCT", Decimal("60000.00"), struct_tech, "FT_PERM", 0.20),
            ]},
            {"dept": "PROD", "count": 26, "city": "Bengaluru, Karnataka", "role": "EMPLOYEE", "jobs": [
                ("JOB-PROD-PM", Decimal("145000.00"), struct_tech, "FT_PERM", 0.25),
                ("JOB-PROD-APM", Decimal("75000.00"), struct_tech, "FT_PERM", 0.25),
                ("JOB-PROD-DESIGN-LEAD", Decimal("130000.00"), struct_tech, "FT_PERM", 0.15),
                ("JOB-PROD-DESIGNER", Decimal("80000.00"), struct_tech, "FT_PERM", 0.35),
            ]},
            {"dept": "SALES", "count": 39, "city": "Delhi NCR (Gurugram)", "role": "EMPLOYEE", "jobs": [
                ("JOB-SALES-MGR", Decimal("150000.00"), struct_sales, "FT_PERM", 0.12),
                ("JOB-SALES-AE-SR", Decimal("120000.00"), struct_sales, "FT_PERM", 0.28),
                ("JOB-SALES-AE", Decimal("85000.00"), struct_sales, "FT_PERM", 0.30),
                ("JOB-SALES-SDR", Decimal("55000.00"), struct_sales, "FT_PERM", 0.20),
                ("JOB-SALES-PRESALES", Decimal("125000.00"), struct_sales, "FT_PERM", 0.10),
            ]},
            {"dept": "OPS", "count": 29, "city": "Hyderabad, Telangana", "role": "EMPLOYEE", "jobs": [
                ("JOB-OPS-CSM", Decimal("95000.00"), struct_ops, "FT_PERM", 0.25),
                ("JOB-OPS-IMPL", Decimal("85000.00"), struct_ops, "FT_PERM", 0.25),
                ("JOB-OPS-SUPP-SR", Decimal("70000.00"), struct_ops, "FT_PERM", 0.25),
                ("JOB-OPS-SUPP", Decimal("45000.00"), struct_ops, "FT_PERM", 0.25),
            ]},
        ]

        all_employees_info = list(canonical_15)
        existing_emails = set(e["email"].lower() for e in canonical_15)
        used_phones = set(e["phone"] for e in canonical_15)

        emp_code_counter = 16
        random.seed(2026)

        for plan in dept_plans:
            d_code = plan["dept"]
            d_city = plan["city"]
            d_role = plan["role"]
            job_specs = plan["jobs"]

            for _ in range(plan["count"]):
                is_female = random.choice([True, False])
                fn = random.choice(first_names_female if is_female else first_names_male)
                ln = random.choice(last_names)

                base_email = f"{fn.lower()}.{ln.lower()}@peoplepay360.in"
                email = base_email
                dup_suffix = 2
                while email in existing_emails:
                    email = f"{fn.lower()}.{ln.lower()}{dup_suffix}@peoplepay360.in"
                    dup_suffix += 1
                existing_emails.add(email)

                prefix = random.choice(["98", "97", "99", "96", "88", "87", "95"])
                mid = random.randint(100, 999)
                end = random.randint(1000, 9999)
                phone = f"+91 {prefix}{mid:03d} {end:04d}"
                while phone in used_phones:
                    mid = random.randint(100, 999)
                    end = random.randint(1000, 9999)
                    phone = f"+91 {prefix}{mid:03d} {end:04d}"
                used_phones.add(phone)

                r_val = random.random()
                cumulative = 0.0
                picked_job = job_specs[0]
                for j_code, j_wage, j_struct, j_type, weight in job_specs:
                    cumulative += weight
                    if r_val <= cumulative:
                        picked_job = (j_code, j_wage, j_struct, j_type, weight)
                        break

                j_code, base_wage, j_struct, j_type, _ = picked_job
                variance = Decimal(random.randint(-5, 8) * 1000)
                final_wage = max(Decimal("30000.00"), base_wage + variance)

                age_years = random.randint(23, 46)
                dob = date(2026 - age_years, random.randint(1, 12), random.randint(1, 28))

                join_year = random.choice([2021, 2022, 2023, 2024, 2025, 2026])
                join_month = random.randint(1, 12 if join_year < 2026 else 8)
                doj = date(join_year, join_month, random.randint(1, 28))

                if d_code == "OPS":
                    sched_idx = 3 if random.random() < 0.4 else 4
                elif d_code == "ENG":
                    sched_idx = random.choice([0, 1, 2])
                else:
                    sched_idx = 0

                all_employees_info.append({
                    "code": f"EMP-IND-{emp_code_counter:03d}",
                    "first": fn,
                    "last": ln,
                    "email": email,
                    "phone": phone,
                    "dob": dob,
                    "doj": doj,
                    "dept": d_code,
                    "job": j_code,
                    "type": j_type,
                    "gender": "FEMALE" if is_female else "MALE",
                    "marital": "MARRIED" if age_years > 28 else "SINGLE",
                    "role": d_role,
                    "wage": final_wage,
                    "struct": j_struct,
                    "sched_idx": sched_idx,
                    "city": d_city,
                })
                emp_code_counter += 1

        print(f"[INFO] Total Employee records constructed: {len(all_employees_info)}")

        # Create Users for ALL 230 employees with appropriate roles
        users_to_add = []
        user_by_emp_idx = {}
        for idx, info in enumerate(all_employees_info):
            role_name = info["role"]
            role_obj = roles_by_name[role_name]
            username = info["email"].split("@")[0]

            u = User(
                role_id=role_obj.id,
                username=username,
                email=info["email"],
                password_hash=dummy_hash,
                is_active=True,
            )
            users_to_add.append(u)
            user_by_emp_idx[idx] = u

        session.add_all(users_to_add)
        session.flush()

        admin_user = users_to_add[0]
        hr_user = users_to_add[1]
        payroll_user = users_to_add[2]

        # Create Employee Entities
        created_employees = []
        for idx, info in enumerate(all_employees_info):
            linked_user = user_by_emp_idx[idx]
            emp = Employee(
                user_id=linked_user.id,
                employee_code=info["code"],
                first_name=info["first"],
                last_name=info["last"],
                email=info["email"],
                phone=info["phone"],
                date_of_birth=info["dob"],
                date_of_joining=info["doj"],
                department_id=dept_by_code[info["dept"]].id,
                job_id=jobs_by_code[info["job"]].id,
                employee_type_id=emp_type_by_code[info["type"]].id,
                manager_id=None,
                status="ACTIVE",
                work_location=info["city"],
            )
            created_employees.append(emp)

        session.add_all(created_employees)
        session.flush()

        # -------------------------------------------------------------
        # 8. BUILD BALANCED 3-TIER MANAGERIAL HIERARCHY
        # -------------------------------------------------------------
        print("[8/14] Establishing Balanced 3-Tier Managerial Hierarchy across 6 Departments...")

        dept_heads = {
            "ENG": created_employees[0],
            "HR": created_employees[1],
            "FIN": created_employees[2],
            "SALES": created_employees[5],
            "OPS": created_employees[6],
            "PROD": created_employees[8],
        }

        for d_code, head_emp in dept_heads.items():
            dept_by_code[d_code].manager_id = head_emp.id

        tier2_managers = {d_code: [] for d_code in dept_heads}
        tier2_managers["ENG"].extend([created_employees[3], created_employees[7], created_employees[12]])
        tier2_managers["HR"].append(created_employees[10])
        tier2_managers["FIN"].append(created_employees[11])

        for emp in created_employees[15:]:
            d_code = [c for c, d in dept_by_code.items() if d.id == emp.department_id][0]
            j_name = [j.name for j in jobs_data if j.id == emp.job_id][0]

            if any(term in j_name for term in ["Manager", "Lead", "Architect", "Partner", "Officer", "Director"]):
                if len(tier2_managers[d_code]) < 6:
                    tier2_managers[d_code].append(emp)

        for d_code, leads in tier2_managers.items():
            if len(leads) < 2:
                for emp in created_employees[15:]:
                    if emp.department_id == dept_by_code[d_code].id and emp not in leads:
                        leads.append(emp)
                        if len(leads) >= 2:
                            break

        for d_code, leads in tier2_managers.items():
            head = dept_heads[d_code]
            for lead in leads:
                lead.manager_id = head.id

        for emp in created_employees:
            d_code = [c for c, d in dept_by_code.items() if d.id == emp.department_id][0]
            head = dept_heads[d_code]
            leads = tier2_managers[d_code]

            if emp.id == head.id:
                emp.manager_id = None
            elif emp in leads:
                emp.manager_id = head.id
            else:
                chosen_lead = leads[emp.id % len(leads)]
                emp.manager_id = chosen_lead.id

        session.flush()

        # -------------------------------------------------------------
        # 9. SCHEDULE ASSIGNMENTS
        # -------------------------------------------------------------
        print("[9/14] Seeding Schedule Assignments for all 230 Employees...")
        schedule_assignments = []
        for idx, emp in enumerate(created_employees):
            s_idx = all_employees_info[idx]["sched_idx"]
            sched_obj = schedules_data[s_idx]

            if emp.employee_code == "EMP-IND-004":
                schedule_assignments.append(EmployeeScheduleAssignment(employee_id=emp.id, working_schedule_id=schedules_data[0].id, start_date=date(2022, 1, 10), end_date=date(2025, 12, 31), is_active=False))
                schedule_assignments.append(EmployeeScheduleAssignment(employee_id=emp.id, working_schedule_id=schedules_data[2].id, start_date=date(2026, 1, 1), end_date=None, is_active=True))
            else:
                schedule_assignments.append(EmployeeScheduleAssignment(employee_id=emp.id, working_schedule_id=sched_obj.id, start_date=emp.date_of_joining, end_date=None, is_active=True))

        session.add_all(schedule_assignments)
        session.flush()

        # -------------------------------------------------------------
        # 10. BANK ACCOUNTS
        # -------------------------------------------------------------
        print("[10/14] Seeding 230 Indian Bank Accounts (HDFC, ICICI, SBI, Axis, Kotak, BOB, PNB)...")
        bank_configs = [
            ("HDFC Bank", "HDFC0001024", "Koramangala 4th Block, Bangalore", "5010024"),
            ("ICICI Bank", "ICIC0000180", "Bandra Kurla Complex, Mumbai", "0180015"),
            ("State Bank of India", "SBIN0004123", "MG Road Branch, Pune", "3045981"),
            ("Axis Bank", "UTIB0000845", "Cyber City, DLF Phase 2, Gurugram", "9140200"),
            ("Kotak Mahindra Bank", "KKBK0000650", "Hitech City, Madhapur, Hyderabad", "6501234"),
            ("Bank of Baroda", "BARB0KORAMA", "Indiranagar 100ft Rd, Bangalore", "2049010"),
            ("Punjab National Bank", "PUNB0024000", "Connaught Place, New Delhi", "0240001"),
        ]

        bank_accounts = []
        for idx, emp in enumerate(created_employees):
            if emp.employee_code == "EMP-IND-012":
                continue

            b_name, b_ifsc, b_branch, b_pfx = bank_configs[idx % len(bank_configs)]
            acc_num = f"{b_pfx}{10000000 + idx * 4321}"

            bank_accounts.append(EmployeeBankAccount(
                employee_id=emp.id,
                account_holder_name=f"{emp.first_name} {emp.last_name}",
                account_number=acc_num,
                bank_name=b_name,
                ifsc_code=b_ifsc,
                branch_name=b_branch,
                account_type="SAVINGS",
                is_primary=True,
                is_active=True,
            ))

            if emp.employee_code == "EMP-IND-001":
                bank_accounts.append(EmployeeBankAccount(
                    employee_id=emp.id,
                    account_holder_name="Aarav Sharma",
                    account_number="018001599887766",
                    bank_name="ICICI Bank",
                    ifsc_code="ICIC0000180",
                    branch_name="Whitefield Branch, Bangalore",
                    account_type="CURRENT",
                    is_primary=False,
                    is_active=True,
                ))

        session.add_all(bank_accounts)
        session.flush()

        # -------------------------------------------------------------
        # 11. CONTRACTS (Active & Historical)
        # -------------------------------------------------------------
        print("[11/14] Seeding 230+ Employment Contracts with Accurate Compensation Packages...")
        contracts = []
        active_contracts_map = {}

        contracts.append(Contract(
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
        ))

        contracts.append(Contract(
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
        ))

        for idx, emp in enumerate(created_employees):
            info = all_employees_info[idx]
            wage_val = info["wage"]
            struct_obj = info["struct"]
            s_idx = info["sched_idx"]
            sched_obj = schedules_data[s_idx]
            is_fixed_term = (emp.employee_code == "EMP-IND-014")
            is_intern = (emp.employee_code == "EMP-IND-015")

            c = Contract(
                employee_id=emp.id,
                department_id=emp.department_id,
                job_id=emp.job_id,
                working_schedule_id=sched_obj.id,
                salary_structure_id=struct_obj.id,
                contract_number=f"CONT-IND-{emp.employee_code}-2026",
                wage=wage_val,
                start_date=date(2026, 1, 1) if emp.date_of_joining < date(2026, 1, 1) else emp.date_of_joining,
                end_date=date(2026, 9, 30) if is_fixed_term else (date(2026, 11, 30) if is_intern else None),
                status="ACTIVE",
                employment_terms=f"Active Indian Corporate Employment Agreement governed under Karnataka/Maharashtra S&E Act. Monthly Gross Base: INR {wage_val:,.2f}",
            )
            contracts.append(c)
            active_contracts_map[emp.id] = c

        session.add_all(contracts)
        session.flush()

        # -------------------------------------------------------------
        # 12. LEAVE ALLOCATIONS & DIVERSE REQUESTS
        # -------------------------------------------------------------
        print("[12/14] Provisioning Statutory Leave Quotas (690+ Allocations) & Requests...")
        allocations = []
        alloc_map = {}

        allocation_profiles = [
            {"CL": (Decimal("12.00"), Decimal("2.00")), "PL": (Decimal("18.00"), Decimal("3.00")), "SL": (Decimal("10.00"), Decimal("1.00"))},
            {"CL": (Decimal("14.00"), Decimal("4.00")), "PL": (Decimal("20.00"), Decimal("2.00")), "SL": (Decimal("12.00"), Decimal("2.00"))},
            {"CL": (Decimal("10.00"), Decimal("1.00")), "PL": (Decimal("15.00"), Decimal("4.00")), "SL": (Decimal("8.00"), Decimal("0.00"))},
            {"CL": (Decimal("12.00"), Decimal("3.00")), "PL": (Decimal("18.00"), Decimal("5.00")), "SL": (Decimal("10.00"), Decimal("1.00"))},
        ]

        for idx, emp in enumerate(created_employees):
            prof = allocation_profiles[idx % len(allocation_profiles)]

            cl_alloc, cl_taken = prof["CL"]
            a_cl = TimeOffAllocation(employee_id=emp.id, time_off_type_id=time_off_types_data[0].id, allocated_amount=cl_alloc, taken_amount=cl_taken, start_date=date(2026, 4, 1), end_date=date(2027, 3, 31), status="APPROVED", approved_by_user_id=admin_user.id, approved_at=datetime(2026, 4, 1, 10, 0), notes=f"FY 2026-27 Casual Leave Entitlement ({cl_alloc} days)")
            allocations.append(a_cl)

            pl_alloc, pl_taken = prof["PL"]
            a_pl = TimeOffAllocation(employee_id=emp.id, time_off_type_id=time_off_types_data[1].id, allocated_amount=pl_alloc, taken_amount=pl_taken, start_date=date(2026, 4, 1), end_date=date(2027, 3, 31), status="APPROVED", approved_by_user_id=admin_user.id, approved_at=datetime(2026, 4, 1, 10, 0), notes=f"FY 2026-27 Privilege Leave Entitlement ({pl_alloc} days)")
            allocations.append(a_pl)

            sl_alloc, sl_taken = prof["SL"]
            a_sl = TimeOffAllocation(employee_id=emp.id, time_off_type_id=time_off_types_data[2].id, allocated_amount=sl_alloc, taken_amount=sl_taken, start_date=date(2026, 4, 1), end_date=date(2027, 3, 31), status="APPROVED", approved_by_user_id=admin_user.id, approved_at=datetime(2026, 4, 1, 10, 0), notes=f"FY 2026-27 Sick Leave Entitlement ({sl_alloc} days)")
            allocations.append(a_sl)

        session.add_all(allocations)
        session.flush()

        for a in allocations:
            tt = [t for t in time_off_types_data if t.id == a.time_off_type_id][0]
            alloc_map[(a.employee_id, tt.code)] = a

        unpaid_tt = time_off_types_data[3]
        leave_requests = [
            TimeOffRequest(employee_id=created_employees[4].id, time_off_type_id=time_off_types_data[0].id, allocation_id=alloc_map[(created_employees[4].id, "CL")].id, start_date=date(2026, 8, 14), end_date=date(2026, 8, 14), requested_amount=Decimal("1.00"), reason="Personal family commitment in Chennai", status="APPROVED", approved_by_user_id=admin_user.id, approved_at=datetime(2026, 8, 10, 14, 30)),
            TimeOffRequest(employee_id=created_employees[7].id, time_off_type_id=time_off_types_data[1].id, allocation_id=alloc_map[(created_employees[7].id, "PL")].id, start_date=date(2026, 8, 20), end_date=date(2026, 8, 22), requested_amount=Decimal("3.00"), reason="Onam festival celebration with family in Kochi", status="APPROVED", approved_by_user_id=admin_user.id, approved_at=datetime(2026, 8, 12, 11, 15)),
            TimeOffRequest(employee_id=created_employees[2].id, time_off_type_id=time_off_types_data[2].id, allocation_id=alloc_map[(created_employees[2].id, "SL")].id, start_date=date(2026, 8, 10), end_date=date(2026, 8, 11), requested_amount=Decimal("2.00"), reason="Viral gastroenteritis recovery prescribed by doctor", status="APPROVED", approved_by_user_id=admin_user.id, approved_at=datetime(2026, 8, 10, 9, 30)),
            TimeOffRequest(employee_id=created_employees[8].id, time_off_type_id=unpaid_tt.id, allocation_id=None, start_date=date(2026, 8, 18), end_date=date(2026, 8, 19), requested_amount=Decimal("2.00"), reason="Unplanned family emergency beyond allocated casual leave", status="APPROVED", approved_by_user_id=admin_user.id, approved_at=datetime(2026, 8, 17, 18, 0)),
            TimeOffRequest(employee_id=created_employees[5].id, time_off_type_id=unpaid_tt.id, allocation_id=None, start_date=date(2026, 8, 30), end_date=date(2026, 9, 1), requested_amount=Decimal("3.00"), reason="Extended international transit delay", status="APPROVED", approved_by_user_id=admin_user.id, approved_at=datetime(2026, 8, 29, 14, 0)),
            TimeOffRequest(employee_id=created_employees[9].id, time_off_type_id=time_off_types_data[2].id, allocation_id=alloc_map[(created_employees[9].id, "SL")].id, start_date=date(2026, 9, 2), end_date=date(2026, 9, 3), requested_amount=Decimal("2.00"), reason="Seasonal viral flu checkup", status="PENDING", approved_by_user_id=None, approved_at=None),
            TimeOffRequest(employee_id=created_employees[10].id, time_off_type_id=time_off_types_data[0].id, allocation_id=alloc_map[(created_employees[10].id, "CL")].id, start_date=date(2026, 9, 10), end_date=date(2026, 9, 11), requested_amount=Decimal("2.00"), reason="Sister's wedding anniversary ceremony in Pune", status="PENDING", approved_by_user_id=None, approved_at=None),
            TimeOffRequest(employee_id=created_employees[0].id, time_off_type_id=time_off_types_data[1].id, allocation_id=alloc_map[(created_employees[0].id, "PL")].id, start_date=date(2026, 8, 28), end_date=date(2026, 8, 30), requested_amount=Decimal("3.00"), reason="Vacation trip during major client go-live sprint", status="REFUSED", approved_by_user_id=admin_user.id, refused_at=datetime(2026, 8, 25, 16, 0), refusal_reason="Critical Q2 Enterprise deliverable go-live milestone week."),
        ]
        session.add_all(leave_requests)
        session.flush()

        # -------------------------------------------------------------
        # 13. BIOMETRIC ATTENDANCE LOGS
        # -------------------------------------------------------------
        print("[13/14] Seeding Biometric Attendance Logs for all 230 Employees...")
        attendances = []

        base_date = date(2026, 8, 25)
        end_date = date(2026, 9, 5)
        num_days = (end_date - base_date).days + 1

        for day_offset in range(num_days):
            curr_date = base_date + timedelta(days=day_offset)
            if curr_date.weekday() == 6:  # Skip Sunday
                continue

            for idx, emp in enumerate(created_employees):
                if curr_date.weekday() == 5:
                    if emp.employee_code != "EMP-IND-007":
                        continue
                    attendances.append(Attendance(
                        employee_id=emp.id,
                        check_in=datetime.combine(curr_date, time(9, 2)),
                        check_out=datetime.combine(curr_date, time(13, 5)),
                        worked_hours=Decimal("4.00"),
                        status="HALF_DAY",
                        notes="Saturday 4-hour operational shift",
                    ))
                    continue

                rand_val = (emp.id * 31 + curr_date.day * 17) % 100

                if (emp.employee_code == "EMP-IND-012" and curr_date.day == 28):
                    attendances.append(Attendance(employee_id=emp.id, check_in=datetime.combine(curr_date, time(9, 0)), check_out=None, worked_hours=Decimal("0.00"), status="ABSENT", notes="Unplanned absence logged"))
                elif (emp.employee_code == "EMP-IND-010" and curr_date.day == 27):
                    attendances.append(Attendance(employee_id=emp.id, check_in=datetime.combine(curr_date, time(9, 12)), check_out=None, worked_hours=Decimal("0.00"), status="MISSING_CHECKOUT", notes="Missing gate punchout"))
                elif rand_val < 6:
                    c_in = datetime.combine(curr_date, time(10, random.randint(15, 40)))
                    c_out = datetime.combine(curr_date, time(18, 50))
                    worked = Decimal(f"{(c_out - c_in).total_seconds() / 3600 - 1.0:.2f}")
                    attendances.append(Attendance(employee_id=emp.id, check_in=c_in, check_out=c_out, worked_hours=max(Decimal("0.00"), worked), status="LATE", notes="Traffic delay at Outer Ring Road"))
                elif rand_val > 94:
                    c_in = datetime.combine(curr_date, time(8, 45))
                    c_out = datetime.combine(curr_date, time(20, random.randint(15, 45)))
                    worked = Decimal(f"{(c_out - c_in).total_seconds() / 3600 - 1.0:.2f}")
                    attendances.append(Attendance(employee_id=emp.id, check_in=c_in, check_out=c_out, worked_hours=worked, status="OVERTIME", notes="Extended sprint deliverable"))
                else:
                    in_m = random.choice([48, 52, 55, 2, 8, 14])
                    in_h = 8 if in_m > 40 else 9
                    out_h = 18
                    out_m = random.choice([5, 12, 20, 30])
                    c_in = datetime.combine(curr_date, time(in_h, in_m))
                    c_out = datetime.combine(curr_date, time(out_h, out_m))
                    worked = Decimal(f"{(c_out - c_in).total_seconds() / 3600 - 1.0:.2f}")
                    attendances.append(Attendance(employee_id=emp.id, check_in=c_in, check_out=c_out, worked_hours=max(Decimal("0.00"), worked), status="PRESENT", notes="Biometric punch verified"))

        session.add_all(attendances)
        session.flush()

        # -------------------------------------------------------------
        # 14. PAYRUNS & ITEMISED PAYSLIPS
        # -------------------------------------------------------------
        print("[14/14] Generating Payruns, Itemized Payslips & Statutory Rule Calculations...")

        pr_june = Payrun(name="June 2026 Regular Monthly Payrun", salary_structure_id=struct_tech.id, period_start=date(2026, 6, 1), period_end=date(2026, 6, 30), status="PAID", computed_at=datetime(2026, 6, 28, 15, 0), validated_at=datetime(2026, 6, 29, 11, 0), paid_at=datetime(2026, 6, 30, 10, 0), sent_at=datetime(2026, 6, 30, 12, 0), notes="June 2026 closed cycle with statutory EPF challan and PT filing.", created_by_user_id=payroll_user.id)
        pr_july = Payrun(name="July 2026 Regular Monthly Payrun", salary_structure_id=struct_tech.id, period_start=date(2026, 7, 1), period_end=date(2026, 7, 31), status="PAID", computed_at=datetime(2026, 7, 28, 15, 30), validated_at=datetime(2026, 7, 29, 11, 0), paid_at=datetime(2026, 7, 31, 10, 0), sent_at=datetime(2026, 7, 31, 12, 0), notes="July 2026 corporate disbursal via HDFC CMS batch.", created_by_user_id=payroll_user.id)
        pr_aug = Payrun(name="August 2026 Regular Monthly Payrun", salary_structure_id=struct_tech.id, period_start=date(2026, 8, 1), period_end=date(2026, 8, 31), status="PAID", computed_at=datetime(2026, 8, 28, 16, 0), validated_at=datetime(2026, 8, 29, 10, 30), paid_at=datetime(2026, 8, 31, 10, 0), sent_at=datetime(2026, 8, 31, 11, 30), notes="August 2026 complete monthly payroll cycle with TDS and EPF compliance.", created_by_user_id=payroll_user.id)
        pr_sep = Payrun(name="September 2026 Regular Monthly Payrun", salary_structure_id=struct_tech.id, period_start=date(2026, 9, 1), period_end=date(2026, 9, 30), status="DRAFT", computed_at=None, validated_at=None, paid_at=None, sent_at=None, notes="September 2026 upcoming payroll cycle open for timesheet sync and pre-payroll adjustments.", created_by_user_id=payroll_user.id)
        pr_q2_bonus = Payrun(name="Q2 FY27 Leadership & Sales Incentive Payout", salary_structure_id=struct_sales.id, period_start=date(2026, 7, 1), period_end=date(2026, 9, 30), status="PAID", computed_at=datetime(2026, 8, 15, 14, 0), validated_at=datetime(2026, 8, 16, 10, 0), paid_at=datetime(2026, 8, 18, 11, 0), sent_at=datetime(2026, 8, 18, 12, 0), notes="Q2 Performance bonus and sales deal commissions for Executive and Sales leads.", created_by_user_id=payroll_user.id)

        session.add_all([pr_june, pr_july, pr_aug, pr_sep, pr_q2_bonus])
        session.flush()

        def generate_payslip_breakdown(payslip_id, contract_wage, struct_id, lop_days=Decimal("0.00")):
            lines = []
            wage = contract_wage

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
                epf_er = epf

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
                epf_er = epf

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
                epf_er = epf

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
                epf_er = Decimal("0.00")

            elif struct_id == struct_intern.id:
                basic = wage
                gross = wage
                total_ded = Decimal("0.00")
                net = gross

                lines = [
                    PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["BASIC"].id, name="Graduate Trainee Monthly Stipend", code="BASIC", category="BASIC", sequence=10, calculation_type="FIXED", quantity=Decimal("1.00"), rate=None, base_amount=wage, amount=basic, formula_snapshot="Fixed Monthly Stipend"),
                ]
                epf_er = Decimal("0.00")

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
                epf_er = epf

            if lop_days > Decimal("0.00"):
                lop_amt = ((basic / Decimal("22.00")) * lop_days).quantize(Decimal("0.01"))
                lines.append(PayslipLine(payslip_id=payslip_id, salary_rule_id=rules_by_code["LOP"].id, name=f"Loss of Pay ({lop_days} days LOP)", code="LOP", category="DEDUCTION", sequence=140, calculation_type="FORMULA", quantity=lop_days, rate=None, base_amount=basic, amount=lop_amt, formula_snapshot=f"(Basic / 22 working days) * {lop_days} LOP days"))
                total_ded += lop_amt
                net -= lop_amt

            return basic, gross, total_ded, epf_er, net, lines

        all_payslip_lines = []
        for pr, p_start, p_end in [
            (pr_june, date(2026, 6, 1), date(2026, 6, 30)),
            (pr_july, date(2026, 7, 1), date(2026, 7, 31)),
            (pr_aug, date(2026, 8, 1), date(2026, 8, 31)),
        ]:
            for emp in created_employees:
                contract = active_contracts_map[emp.id]
                emp_lop = Decimal("0.00")
                if pr == pr_aug:
                    if emp.id == created_employees[8].id:
                        emp_lop = Decimal("2.00")
                    elif emp.id == created_employees[5].id:
                        emp_lop = Decimal("1.00")

                worked_d = max(Decimal("0.00"), Decimal("22.00") - emp_lop)

                pe = PayrunEmployee(payrun_id=pr.id, employee_id=emp.id, selection_status="SELECTED")
                session.add(pe)
                session.flush()

                ps = Payslip(
                    payrun_id=pr.id,
                    employee_id=emp.id,
                    payrun_employee_id=pe.id,
                    salary_structure_id=contract.salary_structure_id,
                    contract_id=contract.id,
                    period_start=p_start,
                    period_end=p_end,
                    worked_days=worked_d,
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
                    ps.id, contract.wage, contract.salary_structure_id, lop_days=emp_lop
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
        # 15. PAYROLL WARNINGS & NOTIFICATIONS
        # -------------------------------------------------------------
        print("[15/15] Seeding Payroll Warnings & Live System Notifications...")

        warnings_data = [
            PayrollWarning(
                payrun_id=pr_sep.id,
                payslip_id=None,
                employee_id=created_employees[11].id,
                warning_type="MISSING_BANK_DETAILS",
                severity="CRITICAL",
                message="Employee Amitav Banerjee (EMP-IND-012) has no active primary bank account registered. Direct deposit payout will be blocked.",
                is_resolved=False,
                resolved_by_user_id=None,
                resolved_at=None,
            ),
            PayrollWarning(
                payrun_id=pr_sep.id,
                payslip_id=None,
                employee_id=created_employees[13].id,
                warning_type="CONTRACT_EXPIRING",
                severity="WARNING",
                message="Fixed-Term Technical Retainer contract for Rahul Joshi (EMP-IND-014) is expiring on 30-Sep-2026. HR renewal required.",
                is_resolved=False,
                resolved_by_user_id=None,
                resolved_at=None,
            ),
            PayrollWarning(
                payrun_id=pr_aug.id,
                payslip_id=None,
                employee_id=created_employees[9].id,
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
            Notification(
                user_id=admin_user.id,
                title="August 2026 Payroll Disbursed",
                message="August 2026 Monthly Payrun has been validated, approved, and disbursed to 230 employees via NEFT batch.",
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

        session.commit()

    print("\n" + "=" * 80)
    print("SUCCESS: 230 EMPLOYEES AND ENTERPRISE HR/PAYROLL DATASET SEEDED SUCCESSFULLY")
    print("=" * 80)
    print("  - 4 Roles & 230 Linked User Accounts")
    print("  - 6 Departments & 30 Specialized Job Roles")
    print("  - 4 Employee Types (Full-Time, Contract, Intern, Consultant)")
    print("  - 230 Indian Employees across Bangalore, Mumbai, Pune, Gurugram, Hyderabad")
    print("  - Balanced 3-Tier Manager Hierarchy (Zero circular references)")
    print("  - 5 Working Schedules & Daily Rotas")
    print("  - 230 Active Schedule Assignments")
    print("  - 230 Indian Bank Accounts (HDFC, ICICI, SBI, Axis, Kotak, BOB, PNB)")
    print("  - 6 Salary Structures & 18 Statutory Salary Rules")
    print("  - 232 Contracts (Active + Historical Expired)")
    print("  - 6 Leave Types & 690 Statutory Allocations (CL, PL, SL)")
    print("  - 2,000+ Biometric Attendance Punch Logs")
    print("  - 5 Payruns (June, July, August Paid, September Draft, Q2 Incentive)")
    print("  - 690 Itemized Payslips with 5,000+ Breakdown Lines in INR")
    print("  - Payroll Warnings & Live System Notifications")
    print("=" * 80)


if __name__ == "__main__":
    seed_database()
