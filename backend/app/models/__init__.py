# Phase 1 Models
from app.models.role import Role
from app.models.user import User
from app.models.department import Department
from app.models.job import Job
from app.models.employee_type import EmployeeType
from app.models.employee import Employee
from app.models.contract import Contract
from app.models.working_schedule import WorkingSchedule
from app.models.working_schedule_day import WorkingScheduleDay
from app.models.employee_schedule_assignment import EmployeeScheduleAssignment
from app.models.employee_bank_account import EmployeeBankAccount

# Phase 2 Models
from app.models.attendance import Attendance
from app.models.attendance_correction import AttendanceCorrection
from app.models.time_off_type import TimeOffType
from app.models.time_off_allocation import TimeOffAllocation
from app.models.time_off_request import TimeOffRequest

# Phase 3 Models
from app.models.salary_structure import SalaryStructure
from app.models.salary_rule import SalaryRule
from app.models.salary_structure_rule import SalaryStructureRule
from app.models.payrun import Payrun
from app.models.payrun_employee import PayrunEmployee
from app.models.payslip import Payslip
from app.models.payslip_line import PayslipLine
from app.models.payroll_warning import PayrollWarning
from app.models.notification import Notification
# Base
from app.database import Base

__all__ = [
    "Base",
    # Phase 1 (11)
    "Role",
    "User",
    "Department",
    "Job",
    "EmployeeType",
    "Employee",
    "Contract",
    "WorkingSchedule",
    "WorkingScheduleDay",
    "EmployeeScheduleAssignment",
    "EmployeeBankAccount",
    # Phase 2 (5)
    "Attendance",
    "AttendanceCorrection",
    "TimeOffType",
    "TimeOffAllocation",
    "TimeOffRequest",
    # Phase 3 (9)
    "SalaryStructure",
    "SalaryRule",
    "SalaryStructureRule",
    "Payrun",
    "PayrunEmployee",
    "Payslip",
    "PayslipLine",
    "PayrollWarning",
    "Notification",
]
