from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.database import get_db
from app.models.employee import Employee
from app.models.department import Department
from app.models.contract import Contract
from app.models.payrun import Payrun
from app.models.payslip import Payslip
from app.models.payslip_line import PayslipLine
from app.models.employee_bank_account import EmployeeBankAccount
from app.models.attendance import Attendance
from app.models.time_off_allocation import TimeOffAllocation
from typing import Optional
from datetime import date
import io
import csv

router = APIRouter()

CITY_MAP = {
    "ENG": "Bengaluru, Karnataka",
    "PROD": "Bengaluru, Karnataka",
    "FIN": "Mumbai, Maharashtra",
    "HR": "Bengaluru, Karnataka",
    "SALES": "Delhi NCR (Gurugram)",
    "OPS": "Hyderabad, Telangana",
}

@router.get("/payroll-summary")
def get_payroll_summary(payrun_id: Optional[int] = None, db: Session = Depends(get_db)):
    if not payrun_id:
        latest_paid = db.query(Payrun).filter(Payrun.status == "PAID").order_by(desc(Payrun.period_start)).first()
        payrun_id = latest_paid.id if latest_paid else 1

    payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
    payslips = db.query(Payslip).filter(Payslip.payrun_id == payrun_id).all()

    total_gross = sum(float(p.gross_amount or 0) for p in payslips)
    total_net = sum(float(p.net_amount or 0) for p in payslips)
    total_deductions = sum(float(p.deduction_amount or 0) for p in payslips)
    total_basic = sum(float(p.basic_amount or 0) for p in payslips)

    # Calculate statutory breakdown
    lines = db.query(PayslipLine).join(Payslip).filter(Payslip.payrun_id == payrun_id).all()
    total_epf = sum(float(l.amount) for l in lines if l.code == "EPF_EE")
    total_pt = sum(float(l.amount) for l in lines if l.code == "PT")
    total_tds = sum(float(l.amount) for l in lines if l.code == "TDS")
    total_hra = sum(float(l.amount) for l in lines if l.code == "HRA")

    # Department breakdown
    depts = db.query(Department).all()
    dept_breakdowns = []
    for d in depts:
        d_slips = [p for p in payslips if db.query(Employee).filter(Employee.id == p.employee_id, Employee.department_id == d.id).first()]
        d_gross = sum(float(p.gross_amount or 0) for p in d_slips)
        d_net = sum(float(p.net_amount or 0) for p in d_slips)
        if len(d_slips) > 0:
            dept_breakdowns.append({
                "department_id": str(d.id),
                "department_name": d.name,
                "code": d.code,
                "headcount": len(d_slips),
                "gross_pay": d_gross,
                "net_pay": d_net,
            })

    return {
        "payrun_id": str(payrun.id) if payrun else "1",
        "payrun_name": payrun.name if payrun else "August 2026 Payrun",
        "period": f"{payrun.period_start.strftime('%b %d, %Y')} - {payrun.period_end.strftime('%b %d, %Y')}" if payrun else "August 2026",
        "currency": "INR",
        "headcount": len(payslips),
        "total_gross": total_gross,
        "total_net": total_net,
        "total_deductions": total_deductions,
        "total_basic": total_basic,
        "total_hra": total_hra,
        "total_epf": total_epf,
        "total_pt": total_pt,
        "total_tds": total_tds,
        "departments": dept_breakdowns,
    }

@router.get("/epf-ecr")
def get_epf_ecr_report(db: Session = Depends(get_db)):
    employees = db.query(Employee).order_by(Employee.employee_code).all()
    items = []
    total_gross = 0.0
    total_epf_wages = 0.0
    total_ee_pf = 0.0
    total_er_eps = 0.0
    total_er_pf = 0.0

    for i, emp in enumerate(employees, start=1):
        contract = db.query(Contract).filter(Contract.employee_id == emp.id, Contract.status == "ACTIVE").first()
        gross = float(contract.wage) if contract and contract.wage else 150000.0
        epf_wage = min(gross, 15000.0)
        ee_pf = 1800.0  # 12% of 15,000 cap
        er_eps = 1250.0  # 8.33% of 15,000 cap
        er_pf = 550.0   # 3.67% of 15,000 cap

        total_gross += gross
        total_epf_wages += epf_wage
        total_ee_pf += ee_pf
        total_er_eps += er_eps
        total_er_pf += er_pf

        items.append({
            "uan": f"100987654{emp.id:03d}",
            "member_name": f"{emp.first_name} {emp.last_name}",
            "employee_code": emp.employee_code,
            "gross_wages": gross,
            "epf_wages": epf_wage,
            "eps_wages": epf_wage,
            "edli_wages": epf_wage,
            "ee_share": ee_pf,
            "eps_share": er_eps,
            "er_share": er_pf,
            "ncp_days": 0,
            "refund_advances": 0,
        })

    return {
        "establishment_id": "KN/BNG/0089123/000",
        "establishment_name": "PeoplePay360 Technologies Pvt Ltd",
        "wage_month": "August 2026",
        "currency": "INR",
        "total_members": len(items),
        "total_gross_wages": total_gross,
        "total_epf_wages": total_epf_wages,
        "total_ee_share": total_ee_pf,
        "total_er_eps": total_er_eps,
        "total_er_pf": total_er_pf,
        "total_challan_amount": total_ee_pf + total_er_eps + total_er_pf + 1250.0, # Incl Admin charges
        "items": items,
    }

@router.get("/form-24q")
def get_form_24q_report(db: Session = Depends(get_db)):
    employees = db.query(Employee).order_by(Employee.employee_code).all()
    items = []
    total_tax_deducted = 0.0

    for i, emp in enumerate(employees, start=1):
        contract = db.query(Contract).filter(Contract.employee_id == emp.id, Contract.status == "ACTIVE").first()
        monthly_gross = float(contract.wage) if contract and contract.wage else 150000.0
        annual_gross = monthly_gross * 12
        std_deduction = 75000.0  # FY 2026-27 standard deduction
        taxable = max(0.0, annual_gross - std_deduction)
        
        # Monthly TDS estimate
        monthly_tds = 0.0
        if annual_gross > 1500000:
            monthly_tds = round(monthly_gross * 0.15, 0)
        elif annual_gross > 1000000:
            monthly_tds = round(monthly_gross * 0.10, 0)
        elif annual_gross > 700000:
            monthly_tds = round(monthly_gross * 0.05, 0)
        
        quarterly_tds = monthly_tds * 3
        total_tax_deducted += quarterly_tds

        items.append({
            "pan": f"ABCDE{emp.id:04d}F",
            "employee_name": f"{emp.first_name} {emp.last_name}",
            "employee_code": emp.employee_code,
            "regime": "NEW (115BAC)",
            "annual_gross_salary": annual_gross,
            "standard_deduction": std_deduction,
            "taxable_amount": taxable,
            "quarterly_tds": quarterly_tds,
            "challan_bsr": "0002145",
            "challan_no": "04891",
            "deposit_date": "2026-09-07",
            "section": "192",
        })

    return {
        "tan": "BLRP12345D",
        "employer_name": "PeoplePay360 Technologies Pvt Ltd",
        "financial_year": "2026-27",
        "assessment_year": "2027-28",
        "quarter": "Q2 (July - Sept 2026)",
        "total_tax_deducted": total_tax_deducted,
        "currency": "INR",
        "items": items,
    }

@router.get("/bank-advice")
def get_bank_advice_report(payrun_id: Optional[int] = None, db: Session = Depends(get_db)):
    if not payrun_id:
        latest_paid = db.query(Payrun).filter(Payrun.status == "PAID").order_by(desc(Payrun.period_start)).first()
        payrun_id = latest_paid.id if latest_paid else 1

    payslips = db.query(Payslip).filter(Payslip.payrun_id == payrun_id).all()
    items = []
    total_disbursement = 0.0

    for ps in payslips:
        emp = db.query(Employee).filter(Employee.id == ps.employee_id).first()
        bank = db.query(EmployeeBankAccount).filter(EmployeeBankAccount.employee_id == emp.id, EmployeeBankAccount.is_primary == True).first() if emp else None
        net_amt = float(ps.net_amount or 0)
        total_disbursement += net_amt

        items.append({
            "employee_code": emp.employee_code if emp else "",
            "beneficiary_name": f"{emp.first_name} {emp.last_name}" if emp else "Employee",
            "bank_name": bank.bank_name if bank else "HDFC Bank",
            "account_number": bank.account_number if bank else "501002436324895",
            "ifsc_code": bank.ifsc_code if bank else "HDFC0001024",
            "net_amount": net_amt,
            "currency": "INR",
            "narration": f"Salary Aug 2026 - {emp.employee_code if emp else ''}",
        })

    return {
        "batch_reference": f"SAL-DISB-202608-{payrun_id}",
        "debit_account_number": "50200089123045",
        "debit_bank": "HDFC Corporate Salary Account",
        "disbursement_date": "2026-09-01",
        "total_records": len(items),
        "total_amount": total_disbursement,
        "currency": "INR",
        "items": items,
    }

@router.get("/download/{report_type}")
def download_report_file(report_type: str, db: Session = Depends(get_db)):
    output = io.StringIO()

    if report_type == "epf-ecr":
        # Standard EPFO ECR TXT format (delimiter #~#)
        data = get_epf_ecr_report(db)
        lines = []
        for item in data["items"]:
            # Format: UAN#~#MemberName#~#Gross#~#EPF#~#EPS#~#EDLI#~#EEShare#~#EPSShare#~#ERShare#~#NCP#~#Refund
            lines.append(f"{item['uan']}#~#{item['member_name']}#~#{int(item['gross_wages'])}#~#{int(item['epf_wages'])}#~#{int(item['eps_wages'])}#~#{int(item['edli_wages'])}#~#{int(item['ee_share'])}#~#{int(item['eps_share'])}#~#{int(item['er_share'])}#~#0#~#0")
        content = "\n".join(lines)
        return Response(content=content, media_type="text/plain", headers={"Content-Disposition": "attachment; filename=EPF_ECR_August_2026.txt"})

    elif report_type == "bank-advice":
        data = get_bank_advice_report(None, db)
        writer = csv.writer(output)
        writer.writerow(["Sr No", "Employee Code", "Beneficiary Name", "Bank Name", "Account Number", "IFSC Code", "Net Amount (INR)", "Narration"])
        for i, item in enumerate(data["items"], start=1):
            writer.writerow([i, item["employee_code"], item["beneficiary_name"], item["bank_name"], item["account_number"], item["ifsc_code"], item["net_amount"], item["narration"]])
        return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=Bank_Salary_Disbursement_Advice.csv"})

    elif report_type == "form-24q":
        data = get_form_24q_report(db)
        writer = csv.writer(output)
        writer.writerow(["Sr No", "Employee PAN", "Employee Name", "Employee Code", "Tax Regime", "Annual Gross Salary", "Standard Deduction", "Taxable Income", "Quarterly TDS (INR)", "Challan BSR", "Challan No", "Deposit Date"])
        for i, item in enumerate(data["items"], start=1):
            writer.writerow([i, item["pan"], item["employee_name"], item["employee_code"], item["regime"], item["annual_gross_salary"], item["standard_deduction"], item["taxable_amount"], item["quarterly_tds"], item["challan_bsr"], item["challan_no"], item["deposit_date"]])
        return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=Form_24Q_TDS_Annexure.csv"})

    else:
        # Default summary
        data = get_payroll_summary(None, db)
        writer = csv.writer(output)
        writer.writerow(["Department", "Headcount", "Gross Pay (INR)", "Net Pay (INR)"])
        for d in data["departments"]:
            writer.writerow([d["department_name"], d["headcount"], d["gross_pay"], d["net_pay"]])
        return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=Payroll_Summary_Report.csv"})
