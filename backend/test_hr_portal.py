import urllib.request
import urllib.error
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000/api"

def api_call(endpoint, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{endpoint}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)

    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            status_code = resp.status
            resp_body = json.loads(resp.read().decode("utf-8"))
            return status_code, resp_body
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except:
            return e.code, err_body

def test_hr_portal_suite():
    print("\n=======================================================")
    print("   PEOPLEPAY360 HR PORTAL & RBAC TEST SUITE")
    print("=======================================================\n")

    # 1. Test Auth & Personas
    status, personas = api_call("/auth/personas")
    assert status == 200, f"Personas failed: {personas}"
    assert len(personas) >= 4, f"Expected at least 4 personas, got {len(personas)}"
    roles = [p["role"] for p in personas]
    assert "ADMIN" in roles and "HR" in roles and "PAYROLL" in roles and "EMPLOYEE" in roles
    print(f"[PASS] 1. Auth Personas verified: {len(personas)} personas covering canonical roles {set(roles)}")

    # 2. Test Live HR Dashboard Stats
    status, hr_stats = api_call("/dashboard/hr", headers={"X-User-Role": "HR", "X-User-Id": "2"})
    assert status == 200, f"HR Dashboard failed: {hr_stats}"
    assert "workforce" in hr_stats and "attendance" in hr_stats and "leaves" in hr_stats and "contracts" in hr_stats
    print(f"[PASS] 2. Live HR Dashboard API verified:")
    print(f"       - Total Workforce: {hr_stats['workforce']['total_employees']}")
    print(f"       - Active Staff: {hr_stats['workforce']['active_employees']}")
    print(f"       - Attendance Present: {hr_stats['attendance']['present_today']}")
    print(f"       - Active Contracts: {hr_stats['contracts']['active_contracts']}")

    # 3. Test Departments CRUD
    t_stamp = int(datetime.now().timestamp() * 1000) % 100000
    dept_code = f"TEST_{t_stamp}"
    dept_name = f"Test Ops Unit {t_stamp}"
    status, dept_resp = api_call(
        "/departments",
        method="POST",
        data={"name": dept_name, "code": dept_code, "description": "HR Automated Test Department"},
        headers={"X-User-Role": "HR", "X-User-Id": "2"}
    )
    assert status == 200, f"Create department failed: {dept_resp}"
    dept_id = dept_resp["id"]
    print(f"[PASS] 3. Department created successfully: ID #{dept_id}, Code {dept_code}")

    status, depts = api_call("/departments")
    assert status == 200
    assert any(d["id"] == str(dept_id) for d in depts)
    print(f"       - Department listed with employee count: {len(depts)} total departments")

    # 4. Test Jobs CRUD
    job_code = f"TJ_{t_stamp}"
    job_name = f"QA Engineer {t_stamp}"
    status, job_resp = api_call(
        "/jobs",
        method="POST",
        data={"name": job_name, "code": job_code, "description": "Automated testing role"},
        headers={"X-User-Role": "HR", "X-User-Id": "2"}
    )
    assert status == 200, f"Create job failed: {job_resp}"
    job_id = job_resp["id"]
    print(f"[PASS] 4. Job created successfully: ID #{job_id}, Code {job_code}")

    # 5. Test Employee Creation
    emp_email = f"qa.tester.{int(datetime.now().timestamp()) % 10000}@peoplepay360.in"
    status, emp_data = api_call(
        "/employees",
        method="POST",
        data={
            "first_name": "Dev",
            "last_name": "Sharma",
            "email": emp_email,
            "phone": "+91 98888 12345",
            "department_id": int(dept_id),
            "job_id": int(job_id),
            "date_of_joining": "2025-01-10",
            "work_location": "Bengaluru HQ",
            "status": "ACTIVE"
        },
        headers={"X-User-Role": "HR", "X-User-Id": "2"}
    )
    assert status == 200, f"Create employee failed: {emp_data}"
    new_emp_id = int(emp_data["id"])
    print(f"[PASS] 5. Employee created successfully: ID #{new_emp_id}, Code {emp_data['employee_code']}, Name {emp_data['name']}")

    # 6. Test Masked Bank Account Management & Set-Primary
    status, bank_resp = api_call(
        "/bank-accounts",
        method="POST",
        data={
            "employee_id": new_emp_id,
            "bank_name": "HDFC Bank",
            "account_number": "50100987654321",
            "ifsc_code": "HDFC0001234",
            "branch_name": "Indiranagar Branch",
            "is_primary": True
        },
        headers={"X-User-Role": "HR", "X-User-Id": "2"}
    )
    assert status == 200, f"Create bank account failed: {bank_resp}"
    bank_id = bank_resp["id"]
    print(f"[PASS] 6. Bank Account created with secure masking: ID #{bank_id}")

    status, bank_list = api_call(f"/bank-accounts?employee_id={new_emp_id}")
    assert status == 200
    assert len(bank_list) >= 1
    assert "4321" in bank_list[0]["masked_account_number"]
    assert "5010098" not in bank_list[0]["masked_account_number"]
    print(f"       - Masked account display verified: '{bank_list[0]['masked_account_number']}'")

    # 7. Test Contract Creation & Historical Preservation
    status, contract_resp = api_call(
        "/contracts",
        method="POST",
        data={
            "employee_id": new_emp_id,
            "name": "Employment Agreement - Dev Sharma",
            "wage": 85000.0,
            "start_date": "2025-01-10",
            "status": "ACTIVE"
        },
        headers={"X-User-Role": "HR", "X-User-Id": "2"}
    )
    assert status == 200, f"Create contract failed: {contract_resp}"
    contract_id = contract_resp["id"]
    print(f"[PASS] 7. Contract created successfully: ID #{contract_id}, Wage Rs 85,000/mo")

    # 8. Test Attendance Punch & Audit-Correct Workflow
    status, att_punch = api_call(
        "/attendance",
        method="POST",
        data={
            "employee_id": new_emp_id,
            "check_in": "2025-03-01T09:15:00Z",
            "check_out": "2025-03-01T18:30:00Z",
            "status": "PRESENT"
        },
        headers={"X-User-Role": "HR", "X-User-Id": "2"}
    )
    assert status == 200, f"Punch attendance failed: {att_punch}"
    att_id = int(att_punch["id"])
    print(f"[PASS] 8. Attendance Punch recorded: ID #{att_id}, Worked {att_punch['worked_hours']} hrs")

    # Correct attendance with mandatory reason
    status, att_corr = api_call(
        f"/attendance/{att_id}/correct",
        method="POST",
        data={
            "new_check_in": "2025-03-01T09:00:00Z",
            "new_check_out": "2025-03-01T18:00:00Z",
            "reason": "Biometric terminal timing calibration adjustment"
        },
        headers={"X-User-Role": "HR", "X-User-Id": "2"}
    )
    assert status == 200, f"Correct attendance failed: {att_corr}"
    assert att_corr["status_state"] == "CORRECTED"
    print(f"       - Attendance Audit Correction verified: ID #{att_id} status={att_corr['status_state']}")

    # 9. Test Working Schedules & Employee Assignment
    sched_code = f"SHIFT_{t_stamp}"
    sched_name = f"General Tech Shift {t_stamp} (9:30 AM - 6:30 PM)"
    status, sched_resp = api_call(
        "/schedules",
        method="POST",
        data={
            "name": sched_name,
            "code": sched_code,
            "weekly_hours": 42.5,
            "days": [
                {"day_of_week": i, "start_time": "09:30", "end_time": "18:30", "is_working_day": (i < 5)}
                for i in range(7)
            ]
        },
        headers={"X-User-Role": "HR", "X-User-Id": "2"}
    )
    assert status == 200, f"Create schedule failed: {sched_resp}"
    sched_id = int(sched_resp["id"])
    print(f"[PASS] 9. Working Schedule created: ID #{sched_id}, Code {sched_code}")

    # Assign schedule to employee
    status, assign_resp = api_call(
        "/schedules/assign",
        method="POST",
        data={
            "employee_id": new_emp_id,
            "working_schedule_id": sched_id,
            "start_date": "2025-01-10"
        },
        headers={"X-User-Role": "HR", "X-User-Id": "2"}
    )
    assert status == 200, f"Assign schedule failed: {assign_resp}"
    print(f"       - Working Schedule assigned to employee #{new_emp_id}")

    # 10. Test RBAC Security Enforcement (Employee blocked from HR endpoints)
    status, forbid_resp = api_call(
        "/departments",
        method="POST",
        data={"name": "Forbidden Unit", "code": "FORBID"},
        headers={"X-User-Role": "EMPLOYEE", "X-User-Id": "5"}
    )
    assert status == 403, f"Expected 403 Forbidden for Employee on HR endpoint, got {status}"
    print(f"[PASS] 10. RBAC Security verified: Employee persona correctly blocked (HTTP 403) from HR modification endpoints")

    print("\n=======================================================")
    print("   ALL 10 HR PORTAL TEST SCENARIOS PASSED (100%)")
    print("=======================================================\n")

if __name__ == "__main__":
    test_hr_portal_suite()
