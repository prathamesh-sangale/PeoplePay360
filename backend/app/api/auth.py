from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.role import Role
from app.models.employee import Employee
from app.models.department import Department
from app.auth.rbac import (
    create_access_token,
    get_current_user,
    normalize_role_name,
)
from pydantic import BaseModel, EmailStr
from typing import Optional, List

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None
    role: Optional[str] = None


class SwitchRoleRequest(BaseModel):
    role: str
    user_id: Optional[int] = None


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates a user by email (or role persona) and returns a JWT access token.
    Supports instant persona testing for Admin, HR, Payroll, and Employee.
    """
    user: Optional[User] = None
    if payload.email:
        user = db.query(User).filter(User.email.ilike(payload.email.strip())).first()

    if not user and payload.role:
        norm_role = normalize_role_name(payload.role)
        for u in db.query(User).all():
            r = db.query(Role).filter(Role.id == u.role_id).first() if u.role_id else None
            if r and normalize_role_name(r.name) == norm_role:
                user = u
                break

    if not user:
        # Fallback to first user
        user = db.query(User).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    role_obj = db.query(Role).filter(Role.id == user.role_id).first() if user.role_id else None
    norm_role = normalize_role_name(role_obj.name if role_obj else "ADMIN")
    token = create_access_token(user.id, user.username, user.email, norm_role)

    emp = db.query(Employee).filter(Employee.user_id == user.id).first()
    dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp and emp.department_id else None

    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "full_name": f"{emp.first_name} {emp.last_name}" if emp else user.username.replace(".", " ").title(),
            "role": norm_role,
            "raw_role": role_obj.name if role_obj else norm_role,
            "employee_id": str(emp.id) if emp else None,
            "employee_code": emp.employee_code if emp else None,
            "department": dept.name if dept else "N/A",
        }
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns the currently authenticated user with their normalized role profile."""
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp and emp.department_id else None
    role_obj = db.query(Role).filter(Role.id == current_user.role_id).first() if current_user.role_id else None
    norm_role = normalize_role_name(role_obj.name if role_obj else "ADMIN")

    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email,
        "full_name": f"{emp.first_name} {emp.last_name}" if emp else current_user.username.replace(".", " ").title(),
        "role": norm_role,
        "raw_role": role_obj.name if role_obj else norm_role,
        "employee_id": str(emp.id) if emp else None,
        "employee_code": emp.employee_code if emp else None,
        "department": dept.name if dept else "N/A",
    }


@router.get("/personas")
def list_personas(db: Session = Depends(get_db)):
    """
    Returns the 4 canonical enterprise role personas for instant switching in UI and testing:
    1. ADMIN (Aarav Sharma)
    2. HR (Priya Patel)
    3. PAYROLL (Rohan Mehta)
    4. EMPLOYEE (Ananya Iyer)
    """
    users = db.query(User).all()
    personas = []
    
    ROLE_META = {
        "ADMIN": {
            "title": "System Administrator",
            "badge_color": "indigo",
            "description": "Full access to all modules, User/Role admin, Settings, Audit logs.",
            "avatar_initials": "AS",
        },
        "HR": {
            "title": "Human Resources Lead",
            "badge_color": "blue",
            "description": "Complete employee lifecycle, contracts, attendance, time off, schedules.",
            "avatar_initials": "PP",
        },
        "PAYROLL": {
            "title": "Payroll Department",
            "badge_color": "emerald",
            "description": "Salary structures, rules, payrun batch computing, payslips, ECR compliance.",
            "avatar_initials": "RM",
        },
        "EMPLOYEE": {
            "title": "Employee Self-Service",
            "badge_color": "amber",
            "description": "My profile, clock in/out, unified leave balances, my payslips.",
            "avatar_initials": "AI",
        },
    }

    seen_roles = set()
    for u in users:
        role_obj = db.query(Role).filter(Role.id == u.role_id).first() if u.role_id else None
        norm_role = normalize_role_name(role_obj.name if role_obj else "EMPLOYEE")
        if norm_role in seen_roles and norm_role != "EMPLOYEE":
            continue
        seen_roles.add(norm_role)

        emp = db.query(Employee).filter(Employee.user_id == u.id).first()
        dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp and emp.department_id else None
        meta = ROLE_META.get(norm_role, ROLE_META["EMPLOYEE"])
        full_name = f"{emp.first_name} {emp.last_name}" if emp else u.username.replace(".", " ").title()

        personas.append({
            "user_id": str(u.id),
            "username": u.username,
            "email": u.email,
            "full_name": full_name,
            "role": norm_role,
            "raw_role": role_obj.name if role_obj else norm_role,
            "display_title": meta["title"],
            "description": meta["description"],
            "badge_color": meta["badge_color"],
            "avatar_initials": "".join([part[0].upper() for part in full_name.split()[:2]]),
            "department": dept.name if dept else "Administration",
            "employee_id": str(emp.id) if emp else None,
            "employee_code": emp.employee_code if emp else None,
        })

    return personas
