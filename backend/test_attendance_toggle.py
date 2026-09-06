import sys
import os
from datetime import datetime, timezone, date, time
from decimal import Decimal

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.user import User
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.attendance_correction import AttendanceCorrection
from app.models.working_schedule import WorkingSchedule
from app.models.working_schedule_day import WorkingScheduleDay
from app.models.employee_schedule_assignment import EmployeeScheduleAssignment
from app.api.attendance import get_today_attendance, toggle_punch_attendance, correct_attendance, AttendanceCorrectionRequest

def test_attendance_toggle():
    print("=================================================================")
    print("PEOPLEPAY360 - ATTENDANCE TOGGLE SYSTEM COMPREHENSIVE TEST SUITE")
    print("=================================================================")

    db = SessionLocal()
    passed = 0
    total = 0

    try:
        # Load test users: Ananya Iyer (EMPLOYEE) and Priya Patel (HR)
        ananya_user = db.query(User).filter(User.username == "ananya.iyer").first()
        priya_user = db.query(User).filter(User.username == "priya.patel").first()
        assert ananya_user is not None, "Ananya user must exist"
        assert priya_user is not None, "Priya HR user must exist"
        ananya_user.normalized_role = "EMPLOYEE"
        priya_user.normalized_role = "HR"

        ananya_emp = db.query(Employee).filter(Employee.user_id == ananya_user.id).first()
        assert ananya_emp is not None, "Ananya employee record must exist"

        # Clean up any existing open attendance sessions for Ananya to have a pristine test state
        db.query(Attendance).filter(Attendance.employee_id == ananya_emp.id, Attendance.check_out == None).delete()
        db.commit()

        # TEST 1: Initial State (OFF)
        total += 1
        print("\n[TEST 1] Testing Initial State (OFF - Not Working)...")
        today_status = get_today_attendance(current_user=ananya_user, db=db)
        assert today_status["is_working"] is False, "Initial state should be is_working=False"
        print(f"  Status: is_working={today_status['is_working']}, shift={today_status['shift_start']} - {today_status['shift_end']}")
        print("  [PASS] PASSED: Initial state correctly reports is_working=False (OFF).")
        passed += 1

        # TEST 2: OFF -> ON (Clock In)
        total += 1
        print("\n[TEST 2] Testing OFF -> ON Toggle (Clock In)...")
        punch1 = toggle_punch_attendance(current_user=ananya_user, db=db)
        assert punch1["action"] == "CLOCK_IN", f"Expected CLOCK_IN, got {punch1['action']}"
        assert punch1["is_working"] is True, "Expected is_working=True after clock-in"
        assert punch1["check_in"] is not None, "check_in timestamp must be populated"
        assert punch1["check_out"] is None, "check_out must be None while working"
        
        # Verify in DB
        created_att = db.query(Attendance).filter(Attendance.id == int(punch1["attendance_id"])).first()
        assert created_att is not None
        assert created_att.check_out is None
        assert created_att.employee_id == ananya_emp.id
        print(f"  Punch 1: {punch1['action']} at {punch1['check_in_time']} (Status: {punch1['attendance_status']})")
        print("  [PASS] PASSED: OFF -> ON created active attendance session using server timestamp.")
        passed += 1

        # TEST 3: State Verification while Working (ON)
        total += 1
        print("\n[TEST 3] Testing Today Status while Working (ON)...")
        working_status = get_today_attendance(current_user=ananya_user, db=db)
        assert working_status["is_working"] is True, "Must report is_working=True while clocked in"
        assert working_status["attendance_id"] == punch1["attendance_id"]
        assert working_status["check_in"] is not None
        print(f"  Working Session: ID={working_status['attendance_id']}, Started={working_status['check_in_time']}, Status={working_status['status']}")
        print("  [PASS] PASSED: GET /api/attendance/today accurately reflects active working session.")
        passed += 1

        # TEST 4: ON -> OFF (Clock Out & Worked Hours Calculation)
        total += 1
        print("\n[TEST 4] Testing ON -> OFF Toggle (Clock Out)...")
        punch2 = toggle_punch_attendance(current_user=ananya_user, db=db)
        assert punch2["action"] == "CLOCK_OUT", f"Expected CLOCK_OUT, got {punch2['action']}"
        assert punch2["is_working"] is False, "Expected is_working=False after clock-out"
        assert punch2["check_out"] is not None, "check_out timestamp must be populated"
        assert punch2["worked_hours"] is not None, "worked_hours must be calculated"
        
        # Verify in DB
        closed_att = db.query(Attendance).filter(Attendance.id == int(punch2["attendance_id"])).first()
        assert closed_att.check_out is not None
        assert closed_att.worked_hours is not None
        print(f"  Punch 2: {punch2['action']} at {punch2['check_out_time']} (Worked: {punch2['formatted_worked_time']})")
        print("  [PASS] PASSED: ON -> OFF closed attendance session and computed worked_hours.")
        passed += 1

        # TEST 5: Subsequent State (OFF - Completed)
        total += 1
        print("\n[TEST 5] Testing State after Clock-Out (OFF - Completed)...")
        completed_status = get_today_attendance(current_user=ananya_user, db=db)
        assert completed_status["is_working"] is False, "Must report is_working=False after shift ends"
        assert completed_status["check_in"] is not None
        assert completed_status["check_out"] is not None
        print(f"  Completed Shift: Check-In={completed_status['check_in_time']}, Check-Out={completed_status['check_out_time']}, Duration={completed_status['formatted_worked_time']}")
        print("  [PASS] PASSED: Successfully reports completed work session without open state.")
        passed += 1

        # TEST 6: HR Audit Correction Workflow
        total += 1
        print("\n[TEST 6] Testing HR Audit Correction on Attendance Record...")
        corr_req = AttendanceCorrectionRequest(
            new_check_in=datetime.now(timezone.utc),
            new_check_out=datetime.now(timezone.utc),
            reason="Verified biometric sync adjustment approved by HR Lead."
        )
        corr_resp = correct_attendance(
            id=int(punch2["attendance_id"]),
            payload=corr_req,
            current_user=priya_user,
            db=db
        )
        assert corr_resp["status"] == "success"
        
        # Verify audit history
        audit_entry = db.query(AttendanceCorrection).filter(AttendanceCorrection.attendance_id == int(punch2["attendance_id"])).first()
        assert audit_entry is not None, "Audit entry must be created in attendance_corrections table"
        assert audit_entry.corrected_by_user_id == priya_user.id
        assert audit_entry.reason == "Verified biometric sync adjustment approved by HR Lead."
        print(f"  Audit Entry #{audit_entry.id}: Corrected by User ID {audit_entry.corrected_by_user_id}")
        print("  [PASS] PASSED: HR correction successfully updated attendance and recorded audit trail.")
        passed += 1

        print("\n=================================================================")
        print(f"VERIFICATION COMPLETE: {passed}/{total} ATTENDANCE TESTS PASSED (100%)")
        print("=================================================================")

    finally:
        db.close()

if __name__ == "__main__":
    test_attendance_toggle()
