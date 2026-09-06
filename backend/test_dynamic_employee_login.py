import urllib.request
import urllib.error
import json
import random
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def http_request(method: str, url: str, data: dict = None, headers: dict = None):
    headers = headers or {}
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"detail": body}

def test_login(email: str, expected_role: str, expected_code: str = None):
    print(f"\n[*] Testing login for: {email} (Expected Role: {expected_role})...")
    status_code, data = http_request("POST", f"{BASE_URL}/auth/login", {"email": email, "password": "password123"})
    assert status_code == 200, f"Failed login for {email}: {status_code} {data}"
    assert "access_token" in data, "No access_token returned"
    user = data["user"]
    print(f"    -> Logged in as: {user['full_name']} | Role: {user['role']} | Code: {user.get('employee_code')} | Dept: {user.get('department')}")
    assert user["role"] == expected_role, f"Role mismatch: expected {expected_role}, got {user['role']}"
    if expected_code:
        assert user.get("employee_code") == expected_code, f"Code mismatch: expected {expected_code}, got {user.get('employee_code')}"
    return data["access_token"], user

def run_tests():
    print("==================================================")
    print("  PEOPLEPAY360 DYNAMIC EMPLOYEE LOGIN TEST SUITE  ")
    print("==================================================")

    # 1. Admin Login
    admin_token, admin_user = test_login("aarav.sharma@peoplepay360.in", "ADMIN", "EMP-IND-001")

    # 2. HR Login
    hr_token, hr_user = test_login("priya.patel@peoplepay360.in", "HR", "EMP-IND-002")

    # 3. Payroll Login
    payroll_token, payroll_user = test_login("rohan.mehta@peoplepay360.in", "PAYROLL", "EMP-IND-003")

    # 4. Standard Employee (Ananya Iyer)
    emp_token_1, emp_user_1 = test_login("ananya.iyer@peoplepay360.in", "EMPLOYEE", "EMP-IND-005")

    # 5. Other Employee (Vikram Sengupta)
    emp_token_2, emp_user_2 = test_login("vikram.sengupta@peoplepay360.in", "EMPLOYEE", "EMP-IND-004")

    # 6. Other Employee by Code (EMP-IND-007 / Neha Kulkarni)
    emp_token_3, emp_user_3 = test_login("EMP-IND-007", "EMPLOYEE", "EMP-IND-007")

    # 7. Other Employee (Aditya Verma)
    emp_token_4, emp_user_4 = test_login("aditya.verma@peoplepay360.in", "EMPLOYEE", "EMP-IND-006")

    # 8. Test /api/auth/me with Vikram Sengupta's token
    print("\n[*] Testing /api/auth/me with Vikram Sengupta token...")
    me_status, me_data = http_request("GET", f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {emp_token_2}"})
    assert me_status == 200, f"/auth/me failed: {me_data}"
    print(f"    -> Profile: {me_data['full_name']} | Role: {me_data['role']} | Code: {me_data.get('employee_code')}")
    assert me_data["full_name"] == "Vikram Sengupta"
    assert me_data["role"] == "EMPLOYEE"

    # 9. Test /api/dashboard/employee with Vikram Sengupta's token
    print("\n[*] Testing /api/dashboard/employee with Vikram Sengupta token...")
    dash_status, dash_data = http_request("GET", f"{BASE_URL}/dashboard/employee", headers={"Authorization": f"Bearer {emp_token_2}"})
    assert dash_status == 200, f"/dashboard/employee failed: {dash_data}"
    print(f"    -> Dashboard for: {dash_data['employee']['name']} ({dash_data['employee']['department']})")
    assert dash_data["employee"]["name"] == "Vikram Sengupta"

    # 10. Test invalid email login
    print("\n[*] Testing invalid email login...")
    inv_status, inv_data = http_request("POST", f"{BASE_URL}/auth/login", {"email": "nonexistent.person@unknown.com", "password": "pass"})
    assert inv_status == 401, f"Expected 401 for invalid email, got {inv_status}"
    print(f"    -> Correctly rejected with: {inv_data.get('detail')}")

    # 11. Create a dynamic new employee and test their login immediately
    print("\n[*] Testing newly created employee dynamic login...")
    rand_id = random.randint(1000, 9999)
    new_emp_email = f"test.worker.{rand_id}@peoplepay360.in"
    new_emp_code = f"EMP-TEST-{rand_id}"

    create_status, create_data = http_request("POST", f"{BASE_URL}/employees", {
        "first_name": "Suresh",
        "last_name": f"Raina{rand_id}",
        "email": new_emp_email,
        "employee_code": new_emp_code,
        "department_id": 1,
        "job_id": 1,
        "status": "ACTIVE"
    })
    assert create_status == 200, f"Failed to create employee: {create_data}"
    print(f"    -> Created employee: Suresh Raina{rand_id} ({new_emp_code}, {new_emp_email})")

    # Now login with this brand new employee's email
    new_token, new_user = test_login(new_emp_email, "EMPLOYEE", new_emp_code)
    assert new_user["full_name"] == f"Suresh Raina{rand_id}"

    print("\n==================================================")
    print("  ALL 11/11 AUTHENTICATION & PORTAL TESTS PASSED!  ")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
