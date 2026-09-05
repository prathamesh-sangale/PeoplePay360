from fastapi import APIRouter
from app.api.dashboard import router as dashboard_router
from app.api.employees import router as employees_router
from app.api.contracts import router as contracts_router
from app.api.attendance import router as attendance_router
from app.api.time_off import router as time_off_router
from app.api.payroll import router as payroll_router
from app.api.schedules import router as schedules_router
from app.api.notifications import router as notifications_router
from app.api.admin import router as admin_router

api_router = APIRouter(prefix="/api")

api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(employees_router, prefix="/employees", tags=["Employees"])
api_router.include_router(contracts_router, prefix="/contracts", tags=["Contracts"])
api_router.include_router(attendance_router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(time_off_router, prefix="/time-off", tags=["Time Off"])
api_router.include_router(payroll_router, prefix="/payroll", tags=["Payroll"])
api_router.include_router(schedules_router, prefix="/schedules", tags=["Schedules"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin"])
