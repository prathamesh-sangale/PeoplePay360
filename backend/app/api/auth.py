from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.role import Role
from app.models.employee import Employee
from app.models.department import Department
from app.models.job import Job
from app.auth.rbac import (
    create_access_token,
    get_current_user,
    normalize_role_name,
)
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None
    role: Optional[str] = None


class SwitchRoleRequest(BaseModel):
    role: str
    user_id: Optional[int] = None


def resolve_or_create_user_for_employee(emp: Employee, db: Session) -> User:
    """
    Ensures an Employee has an active User account with role EMPLOYEE.
    Creates or links the User account automatically if missing.
    """
    if emp.user_id:
        existing_user = db.query(User).filter(User.id == emp.user_id).first()
        if existing_user:
            return existing_user

    # Check if a User already exists with this employee's email or username
    user_email = emp.email.strip().lower() if emp.email else f"{emp.employee_code.lower()}@peoplepay360.in"
    user_name = user_email.split("@")[0]
    
    existing_user = db.query(User).filter(
        (User.email.ilike(user_email)) | (User.username.ilike(user_name))
    ).first()

    if existing_user:
        emp.user_id = existing_user.id
        db.commit()
        return existing_user

    # Find or create EMPLOYEE role
    emp_role = db.query(Role).filter(Role.name.in_(["EMPLOYEE", "Employee"])).first()
    if not emp_role:
        emp_role = db.query(Role).first()

    new_user = User(
        username=user_name,
        email=user_email,
        password_hash="pbkdf2:sha256:600000$demo$defaultpasswordhash",
        role_id=emp_role.id if emp_role else None,
        is_active=True,
    )
    db.add(new_user)
    db.flush()
    emp.user_id = new_user.id
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates a user by email, username, or employee code and returns a signed JWT access token.
    1. Verifies in User table first.
    2. If not found in User, searches Employee table by email or employee_code.
    3. Automatically creates/links active User record for employees.
    4. Identifies the exact enterprise role (ADMIN, HR, PAYROLL, EMPLOYEE) and designated portal.
    """
    user: Optional[User] = None
    clean_identifier = payload.email.strip() if payload.email else ""

    if clean_identifier:
        # 1. Search in User table
        user = db.query(User).filter(
            (User.email.ilike(clean_identifier)) | (User.username.ilike(clean_identifier))
        ).first()

        # 2. If not in User, search in Employee table
        if not user:
            emp = db.query(Employee).filter(
                (Employee.email.ilike(clean_identifier)) | (Employee.employee_code.ilike(clean_identifier))
            ).first()
            if emp:
                user = resolve_or_create_user_for_employee(emp, db)

    # 3. Fallback for role-based fast switching (if role parameter passed)
    if not user and payload.role:
        norm_role = normalize_role_name(payload.role)
        for u in db.query(User).all():
            r = db.query(Role).filter(Role.id == u.role_id).first() if u.role_id else None
            if r and normalize_role_name(r.name) == norm_role:
                user = u
                break

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or credentials. Please verify your email or employee code.",
        )

    # Resolve Role
    role_obj = db.query(Role).filter(Role.id == user.role_id).first() if user.role_id else None
    norm_role = normalize_role_name(role_obj.name if role_obj else "EMPLOYEE")
    
    # Resolve Employee Profile
    emp = db.query(Employee).filter(
        (Employee.user_id == user.id) | (Employee.email.ilike(user.email))
    ).first()
    if emp and not emp.user_id:
        emp.user_id = user.id
        db.commit()

    dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp and emp.department_id else None
    job = db.query(Job).filter(Job.id == emp.job_id).first() if emp and emp.job_id else None

    token = create_access_token(user.id, user.username, user.email, norm_role)

    full_name = f"{emp.first_name} {emp.last_name}".strip() if emp else user.username.replace(".", " ").title()
    dept_name = dept.name if dept else ("Engineering & Technology" if norm_role == "ADMIN" else "Operations")

    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "full_name": full_name,
            "role": norm_role,
            "raw_role": role_obj.name if role_obj else norm_role,
            "employee_id": str(emp.id) if emp else None,
            "employee_code": emp.employee_code if emp else None,
            "department": dept_name,
            "job_title": job.name if job else ("System Administrator" if norm_role == "ADMIN" else "Staff"),
        }
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns the currently authenticated user with their normalized role profile and employee details."""
    emp = db.query(Employee).filter(
        (Employee.user_id == current_user.id) | (Employee.email.ilike(current_user.email))
    ).first()
    dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp and emp.department_id else None
    job = db.query(Job).filter(Job.id == emp.job_id).first() if emp and emp.job_id else None
    role_obj = db.query(Role).filter(Role.id == current_user.role_id).first() if current_user.role_id else None
    norm_role = normalize_role_name(role_obj.name if role_obj else "EMPLOYEE")

    full_name = f"{emp.first_name} {emp.last_name}".strip() if emp else current_user.username.replace(".", " ").title()
    dept_name = dept.name if dept else ("Administration" if norm_role == "ADMIN" else "Operations")

    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email,
        "full_name": full_name,
        "role": norm_role,
        "raw_role": role_obj.name if role_obj else norm_role,
        "employee_id": str(emp.id) if emp else None,
        "employee_code": emp.employee_code if emp else None,
        "department": dept_name,
        "job_title": job.name if job else None,
    }


@router.get("/personas")
def list_personas(db: Session = Depends(get_db)):
    """
    Returns the expanded canonical enterprise role personas for fast one-click login & role switching:
    1. ADMIN: Aarav Sharma (VP of Engineering & Admin)
    2. HR 1: Priya Patel (Head of HR)
    3. HR 2: Pooja Deshmukh (HR Operations Lead)
    4. PAYROLL 1: Rohan Mehta (Head of Finance & Payroll)
    5. PAYROLL 2: Amitav Banerjee (Senior Payroll & Tax Specialist)
    6. EMPLOYEE 1: Ananya Iyer (Sr Software Engineer)
    7. EMPLOYEE 2: Vikram Sengupta (Principal Architect)
    """
    CANONICAL_TARGETS = [
        {
            "role": "ADMIN",
            "email": "aarav.sharma@peoplepay360.in",
            "title": "System Administrator",
            "badge_color": "indigo",
            "description": "Full system oversight, User/Role admin, Settings, Audit logs, Global controls.",
        },
        {
            "role": "HR",
            "email": "priya.patel@peoplepay360.in",
            "title": "Human Resources Lead",
            "badge_color": "blue",
            "description": "Complete employee lifecycle, contracts, attendance, time off, schedules.",
        },
        {
            "role": "HR",
            "email": "pooja.deshmukh@peoplepay360.in",
            "title": "HR Operations & Talent Partner",
            "badge_color": "blue",
            "description": "Onboarding, leave approvals, attendance tracking, contract compliance.",
        },
        {
            "role": "PAYROLL",
            "email": "rohan.mehta@peoplepay360.in",
            "title": "Head of Finance & Payroll",
            "badge_color": "emerald",
            "description": "Salary structures, rules, payrun batch computing, payslips, ECR compliance.",
        },
        {
            "role": "PAYROLL",
            "email": "amitav.banerjee@peoplepay360.in",
            "title": "Senior Payroll & Tax Specialist",
            "badge_color": "emerald",
            "description": "EPF, PT, TDS deductions, timesheet validation, bank payout disbursements.",
        },
        {
            "role": "EMPLOYEE",
            "email": "ananya.iyer@peoplepay360.in",
            "title": "Employee Self-Service (Sr SDE)",
            "badge_color": "amber",
            "description": "Personal profile, live duty hours, leave balances, payslips & tax details.",
        },
        {
            "role": "EMPLOYEE",
            "email": "vikram.sengupta@peoplepay360.in",
            "title": "Principal Architect (Staff Self-Service)",
            "badge_color": "amber",
            "description": "Personal profile, live duty hours, leave balances, payslips & tax details.",
        },
    ]

    personas = []
    for item in CANONICAL_TARGETS:
        norm_role = item["role"]
        
        # Look up user or employee
        user = db.query(User).filter(User.email.ilike(item["email"])).first()
        emp = db.query(Employee).filter(Employee.email.ilike(item["email"])).first()
        if not emp and user:
            emp = db.query(Employee).filter(Employee.user_id == user.id).first()

        dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp and emp.department_id else None
        job = db.query(Job).filter(Job.id == emp.job_id).first() if emp and emp.job_id else None
        
        full_name = f"{emp.first_name} {emp.last_name}" if emp else (user.username.replace(".", " ").title() if user else item["role"].title())
        email = user.email if user else (emp.email if emp else item["email"])

        personas.append({
            "user_id": str(user.id) if user else "1",
            "username": user.username if user else email.split("@")[0],
            "email": email,
            "full_name": full_name,
            "role": norm_role,
            "raw_role": norm_role,
            "display_title": item["title"],
            "description": item["description"],
            "badge_color": item["badge_color"],
            "avatar_initials": "".join([part[0].upper() for part in full_name.split()[:2]]),
            "department": dept.name if dept else "Administration",
            "job_title": job.name if job else item["title"],
            "employee_id": str(emp.id) if emp else None,
            "employee_code": emp.employee_code if emp else None,
        })

    return personas


@router.get("/sample-employees")
def list_sample_employees(db: Session = Depends(get_db)):
    """
    Returns a directory of active staff employees for convenient login testing.
    Reviewers can select any employee (e.g. Vikram Sengupta, Neha Kulkarni, Aditya Verma, etc.)
    to experience personalized Employee Self-Service.
    """
    employees = db.query(Employee).filter(Employee.status == "ACTIVE").order_by(Employee.employee_code).all()
    results = []
    
    for emp in employees:
        dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp.department_id else None
        job = db.query(Job).filter(Job.id == emp.job_id).first() if emp.job_id else None
        full_name = f"{emp.first_name} {emp.last_name}".strip()

        # Check role of user if linked
        user = db.query(User).filter(User.id == emp.user_id).first() if emp.user_id else None
        role_obj = db.query(Role).filter(Role.id == user.role_id).first() if user and user.role_id else None
        norm_role = normalize_role_name(role_obj.name if role_obj else "EMPLOYEE")

        results.append({
            "employee_id": str(emp.id),
            "employee_code": emp.employee_code,
            "full_name": full_name,
            "email": emp.email,
            "role": norm_role,
            "department": dept.name if dept else "General",
            "job_title": job.name if job else "Specialist",
            "avatar_initials": "".join([part[0].upper() for part in full_name.split()[:2]]),
        })

    return results
