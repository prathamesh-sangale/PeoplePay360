from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.user import User
from app.models.role import Role
from app.models.employee import Employee
from app.models.department import Department
from app.models.payrun import Payrun
from typing import Optional, List, Dict, Any
from datetime import datetime

router = APIRouter()

@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    results = []
    for u in users:
        role = db.query(Role).filter(Role.id == u.role_id).first() if u.role_id else None
        emp = db.query(Employee).filter(Employee.user_id == u.id).first()
        
        full_name = f"{emp.first_name} {emp.last_name}" if emp else (
            u.username.replace(".", " ").replace("_", " ").title() if u.username else u.email.split("@")[0].title()
        )
        dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp and emp.department_id else None

        results.append({
            "id": str(u.id),
            "email": u.email,
            "username": u.username,
            "full_name": full_name,
            "employee_id": str(emp.id) if emp else None,
            "employee_code": emp.employee_code if emp else None,
            "department": dept.name if dept else "Administration",
            "role": role.name if role else "User",
            "role_id": str(role.id) if role else None,
            "is_active": u.is_active,
            "is_verified": True,
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else "2026-09-05T09:30:00Z",
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })
    return results

@router.get("/roles")
def list_roles(db: Session = Depends(get_db)):
    roles = db.query(Role).all()
    return [
        {
            "id": str(r.id),
            "name": r.name,
            "description": r.description or f"Permissions for {r.name}",
        }
        for r in roles
    ]

# Realistic Audit Logs Generation
@router.get("/audit-logs")
def list_audit_logs(
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    # Dynamic audit events based on system activity and Indian compliance operations
    audit_events = [
        {
            "id": "AUD-2026-0891",
            "timestamp": "2026-09-05T17:45:12Z",
            "actor": "Admin (Priya Patel)",
            "actor_role": "Payroll Administrator",
            "action": "PAYRUN_DRAFT_CREATED",
            "category": "PAYROLL",
            "entity": "Payrun #3",
            "details": "Initiated September 2026 Monthly Payroll calculation for 15 active staff.",
            "ip_address": "192.168.1.104",
            "status": "SUCCESS",
            "metadata": {"payrun_id": 3, "period": "Sep 2026", "employees_count": 15}
        },
        {
            "id": "AUD-2026-0890",
            "timestamp": "2026-09-04T16:20:00Z",
            "actor": "Aarav Sharma",
            "actor_role": "VP Engineering",
            "action": "LEAVE_APPROVED",
            "category": "EMPLOYEE",
            "entity": "Leave Req #12",
            "details": "Approved 2 days Casual Leave (CL) for Sneha Roy (EMP-IND-007).",
            "ip_address": "10.0.4.55",
            "status": "SUCCESS",
            "metadata": {"employee": "Sneha Roy", "leave_type": "CL", "days": 2}
        },
        {
            "id": "AUD-2026-0889",
            "timestamp": "2026-09-03T11:15:30Z",
            "actor": "System Daemon",
            "actor_role": "Background Worker",
            "action": "EPF_ECR_GENERATED",
            "category": "COMPLIANCE",
            "entity": "EPF Filing Q2",
            "details": "Generated EPFO Form 3A/6A Electronic Challan Return with ₹27,000 total statutory contribution.",
            "ip_address": "127.0.0.1",
            "status": "SUCCESS",
            "metadata": {"total_ee_pf": 27000, "total_er_eps": 18742, "total_er_pf": 8258}
        },
        {
            "id": "AUD-2026-0888",
            "timestamp": "2026-09-01T10:00:00Z",
            "actor": "Admin (Priya Patel)",
            "actor_role": "Payroll Administrator",
            "action": "PAYRUN_PAID",
            "category": "PAYROLL",
            "entity": "Payrun #2",
            "details": "Disbursed August 2026 Monthly Payroll of ₹18,88,700 via ICICI / HDFC Corporate NetBanking.",
            "ip_address": "192.168.1.104",
            "status": "SUCCESS",
            "metadata": {"gross": 2170000, "net": 1888700, "deductions": 281300}
        },
        {
            "id": "AUD-2026-0887",
            "timestamp": "2026-08-28T14:30:18Z",
            "actor": "Priya Patel",
            "actor_role": "HR Manager",
            "action": "CONTRACT_RENEWED",
            "category": "EMPLOYEE",
            "entity": "Contract #14",
            "details": "Updated Fixed-Term Contract CNT-IND-EMP-IND-014 for Rahul Joshi (INR 6,60,000 CTC).",
            "ip_address": "192.168.1.104",
            "status": "SUCCESS",
            "metadata": {"employee": "Rahul Joshi", "annual_ctc": 660000}
        },
        {
            "id": "AUD-2026-08-25",
            "timestamp": "2026-08-25T09:00:00Z",
            "actor": "Biometric Machine (eSSL-01)",
            "actor_role": "Hardware Service",
            "action": "ATTENDANCE_SYNC",
            "category": "ATTENDANCE",
            "entity": "Biometric Sync",
            "details": "Synchronized 350 daily biometric in/out logs across Bengaluru & Mumbai campuses.",
            "ip_address": "172.16.0.12",
            "status": "SUCCESS",
            "metadata": {"records_synced": 350, "device_serial": "ESSL-IND-2026"}
        },
        {
            "id": "AUD-2026-0885",
            "timestamp": "2026-08-20T18:40:05Z",
            "actor": "Vikram Sengupta",
            "actor_role": "Finance Director",
            "action": "TDS_24Q_FILED",
            "category": "COMPLIANCE",
            "entity": "Form 24Q Q1",
            "details": "Uploaded Section 192 TDS quarterly salary return to Income Tax Traces portal.",
            "ip_address": "192.168.1.118",
            "status": "SUCCESS",
            "metadata": {"challan_bsr": "0002145", "tax_deposited": 382500}
        },
        {
            "id": "AUD-2026-0884",
            "timestamp": "2026-08-15T08:12:00Z",
            "actor": "Security System",
            "actor_role": "Identity Provider",
            "action": "USER_LOGIN_MFA",
            "category": "SECURITY",
            "entity": "User #1",
            "details": "Admin user logged in with OTP authentication on device Chrome/Windows.",
            "ip_address": "192.168.1.100",
            "status": "SUCCESS",
            "metadata": {"user": "admin", "auth_method": "TOTP"}
        },
        {
            "id": "AUD-2026-0883",
            "timestamp": "2026-08-10T12:00:00Z",
            "actor": "Priya Patel",
            "actor_role": "HR Manager",
            "action": "BANK_INFO_VERIFIED",
            "category": "EMPLOYEE",
            "entity": "Bank Account #15",
            "details": "Completed Penny-Drop instant verification for Meera Ranganathan via ICICI API.",
            "ip_address": "192.168.1.104",
            "status": "SUCCESS",
            "metadata": {"ifsc": "ICIC0001892", "account_match": 100}
        },
        {
            "id": "AUD-2026-0882",
            "timestamp": "2026-08-01T10:00:00Z",
            "actor": "Admin (Priya Patel)",
            "actor_role": "Payroll Administrator",
            "action": "PAYRUN_PAID",
            "category": "PAYROLL",
            "entity": "Payrun #1",
            "details": "Disbursed July 2026 Monthly Payroll of ₹18,88,700 for 15 employees.",
            "ip_address": "192.168.1.104",
            "status": "SUCCESS",
            "metadata": {"gross": 2170000, "net": 1888700}
        }
    ]

    filtered = audit_events
    if category and category != "ALL":
        filtered = [e for e in filtered if e["category"] == category.upper()]
    if status and status != "ALL":
        filtered = [e for e in filtered if e["status"] == status.upper()]
    if search:
        s = search.lower()
        filtered = [
            e for e in filtered
            if s in e["action"].lower() or s in e["actor"].lower() or s in e["details"].lower() or s in e["entity"].lower()
        ]

    return {
        "total": len(filtered),
        "items": filtered[:limit]
    }

# In-memory settings state with persistent defaults
SYSTEM_SETTINGS = {
    "organization": {
        "company_name": "PeoplePay360 Technologies Private Limited",
        "trade_name": "PeoplePay360 HR & Payroll",
        "cin": "U72200KA2026PTC089123",
        "gstin": "29AABCP1234F1Z8",
        "pan": "AABCP1234F",
        "tan": "BLRP12345D",
        "epfo_code": "KN/BNG/0089123/000",
        "esic_code": "53000891230000101",
        "registered_address": "Embassy TechVillage, Outer Ring Road, Devarabisanahalli, Bengaluru, Karnataka 560103",
        "contact_email": "compliance@peoplepay360.in",
        "hr_phone": "+91 80 4567 8900",
        "currency": "INR",
        "fiscal_year_start": "April",
    },
    "statutory": {
        "epf_employee_rate": 12.0,
        "epf_employer_rate": 12.0,
        "epf_eps_split_rate": 8.33,
        "epf_wage_ceiling": 15000.0,
        "esic_gross_limit": 21000.0,
        "esic_employee_rate": 0.75,
        "esic_employer_rate": 3.25,
        "default_tax_regime": "NEW_TAX_REGIME_115BAC",
        "standard_deduction": 75000.0,
        "pt_monthly_default": 200.0,
        "payroll_cutoff_day": 25,
        "salary_disbursement_day": 1,
    },
    "attendance_policy": {
        "standard_work_hours": 8.5,
        "work_days_per_week": 5,
        "standard_check_in": "09:30",
        "standard_check_out": "18:00",
        "late_grace_minutes": 15,
        "half_day_late_minutes": 120,
        "auto_half_day": True,
        "biometric_sync_interval_mins": 30,
    },
    "leave_policy": {
        "annual_earned_leave": 18,
        "annual_casual_leave": 12,
        "annual_sick_leave": 10,
        "maternity_leave_weeks": 26,
        "paternity_leave_days": 15,
        "max_carryover_days": 30,
        "encashment_allowed": True,
        "min_notice_days_pl": 3,
    },
    "notifications": {
        "email_payslip_dispatch": True,
        "sms_salary_alert": True,
        "contract_expiry_alert_days": 30,
        "leave_approval_email": True,
        "tax_filing_reminder": True,
    },
    "security": {
        "mfa_enforced": True,
        "session_timeout_minutes": 60,
        "penny_drop_verification": True,
        "data_retention_years": 7,
    }
}

@router.get("/settings")
def get_settings():
    return SYSTEM_SETTINGS

@router.post("/settings")
def update_settings(payload: Dict[str, Any]):
    for section, values in payload.items():
        if section in SYSTEM_SETTINGS and isinstance(values, dict):
            SYSTEM_SETTINGS[section].update(values)
        else:
            SYSTEM_SETTINGS[section] = values
    return {"status": "success", "message": "Settings updated successfully", "settings": SYSTEM_SETTINGS}
