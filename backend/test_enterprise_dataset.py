"""
Comprehensive Test Suite for 230 Employee Enterprise Dataset & Balanced Roles
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import urllib.request
import json

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def test_dataset():
    print("=" * 70)
    print("  VERIFYING 230 EMPLOYEE ENTERPRISE DATASET & ROLES INTEGRITY")
    print("=" * 70)

    with Session(engine) as session:
        # 1. Total Counts
        emp_count = session.execute(text("SELECT COUNT(*) FROM employees")).scalar()
        user_count = session.execute(text("SELECT COUNT(*) FROM users")).scalar()
        contract_count = session.execute(text("SELECT COUNT(*) FROM contracts WHERE status='ACTIVE'")).scalar()
        bank_count = session.execute(text("SELECT COUNT(*) FROM employee_bank_accounts WHERE is_primary=True")).scalar()
        alloc_count = session.execute(text("SELECT COUNT(*) FROM time_off_allocations")).scalar()

        print(f"[*] Total Employees: {emp_count} (Expected: 230)")
        assert emp_count == 230, f"Expected 230 employees, got {emp_count}"

        print(f"[*] Total Users: {user_count} (Expected: >= 230)")
        assert user_count >= 230

        print(f"[*] Active Contracts: {contract_count} (Expected: 230)")
        assert contract_count == 230

        print(f"[*] Primary Bank Accounts: {bank_count} (Expected: 229 due to intentional missing bank case)")
        assert bank_count == 229

        print(f"[*] Leave Allocations: {alloc_count} (Expected: >= 690, i.e. 3 per employee)")
        assert alloc_count >= 690

        # 2. Department Breakdown
        dept_rows = session.execute(text("""
            SELECT d.code, d.name, COUNT(e.id) as emp_count
            FROM departments d
            LEFT JOIN employees e ON e.department_id = d.id
            GROUP BY d.code, d.name
            ORDER BY emp_count DESC
        """)).fetchall()

        print("\n[*] Department Headcount Breakdown:")
        dept_map = {}
        for row in dept_rows:
            dept_map[row[0]] = row[2]
            print(f"    - {row[0]} ({row[1]}): {row[2]} staff")

        assert dept_map["ENG"] == 85, f"ENG expected 85, got {dept_map['ENG']}"
        assert dept_map["HR"] == 25, f"HR expected 25, got {dept_map['HR']}"
        assert dept_map["FIN"] == 22, f"FIN expected 22, got {dept_map['FIN']}"
        assert dept_map["PROD"] == 28, f"PROD expected 28, got {dept_map['PROD']}"
        assert dept_map["SALES"] == 40, f"SALES expected 40, got {dept_map['SALES']}"
        assert dept_map["OPS"] == 30, f"OPS expected 30, got {dept_map['OPS']}"

        # 3. User Role Distribution
        role_rows = session.execute(text("""
            SELECT r.name, COUNT(u.id) as user_count
            FROM roles r
            LEFT JOIN users u ON u.role_id = r.id
            GROUP BY r.name
            ORDER BY user_count DESC
        """)).fetchall()

        print("\n[*] User Role Distribution:")
        role_map = {}
        for row in role_rows:
            role_map[row[0]] = row[1]
            print(f"    - Role '{row[0]}': {row[1]} users")

        assert role_map["ADMIN"] >= 1
        assert role_map["HR"] >= 25, f"Expected >= 25 HR users, got {role_map.get('HR')}"
        assert role_map["PAYROLL"] >= 22, f"Expected >= 22 Payroll users, got {role_map.get('PAYROLL')}"
        assert role_map["EMPLOYEE"] >= 180, f"Expected >= 180 Employee users, got {role_map.get('EMPLOYEE')}"

        # 4. Manager Hierarchy Validation
        print("\n[*] Validating Managerial Tree & Zero Circular References...")
        top_heads = session.execute(text("""
            SELECT e.employee_code, e.first_name, e.last_name, d.code
            FROM employees e
            JOIN departments d ON d.id = e.department_id
            WHERE e.manager_id IS NULL
        """)).fetchall()
        print(f"    - Top Department Heads without manager: {len(top_heads)}")
        for h in top_heads:
            print(f"      * {h[0]}: {h[1]} {h[2]} (Head of {h[3]})")
        assert len(top_heads) == 6, f"Expected 6 department heads, got {len(top_heads)}"

        # Check all other 224 employees have a valid manager within their department
        invalid_managers = session.execute(text("""
            SELECT e.employee_code, e.first_name, e.last_name, e.department_id, m.department_id as mgr_dept_id
            FROM employees e
            JOIN employees m ON m.id = e.manager_id
            WHERE e.department_id != m.department_id
        """)).fetchall()
        assert len(invalid_managers) == 0, f"Cross-department manager error found: {invalid_managers}"
        print("    -> 100% of employees report to valid managers within their own department.")

        # Check circular references
        # Follow manager chain for each employee
        emp_records = session.execute(text("SELECT id, manager_id FROM employees")).fetchall()
        mgr_lookup = {r[0]: r[1] for r in emp_records}
        for emp_id in mgr_lookup:
            visited = set()
            curr = emp_id
            while curr is not None:
                assert curr not in visited, f"Circular manager loop detected at emp {curr}!"
                visited.add(curr)
                curr = mgr_lookup.get(curr)

        print("    -> Manager tree acyclic check passed (0 loops, perfectly balanced).")

    # 5. API Login Verification for Different Roles
    print("\n[*] Testing Live JWT Authentication & Role Routing:")
    BASE_URL = "http://127.0.0.1:8000"

    test_logins = [
        ("aarav.sharma@peoplepay360.in", "ADMIN", "Aarav Sharma"),
        ("priya.patel@peoplepay360.in", "HR", "Priya Patel"),
        ("pooja.deshmukh@peoplepay360.in", "HR", "Pooja Deshmukh"),
        ("rohan.mehta@peoplepay360.in", "PAYROLL", "Rohan Mehta"),
        ("amitav.banerjee@peoplepay360.in", "PAYROLL", "Amitav Banerjee"),
        ("ananya.iyer@peoplepay360.in", "EMPLOYEE", "Ananya Iyer"),
        ("EMP-IND-050", "EMPLOYEE", None),
        ("EMP-IND-100", "HR", None),
        ("EMP-IND-120", "PAYROLL", None),
        ("EMP-IND-200", "EMPLOYEE", None),
    ]

    for identifier, expected_role, expected_name in test_logins:
        req = urllib.request.Request(
            f"{BASE_URL}/api/auth/login",
            data=json.dumps({"email": identifier, "password": "PeoplePay@2026"}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode("utf-8"))
            user_info = data["user"]
            assert user_info["role"] == expected_role, f"Expected role {expected_role} for {identifier}, got {user_info['role']}"
            if expected_name:
                assert expected_name.lower() in user_info["full_name"].lower(), f"Expected name {expected_name}, got {user_info['full_name']}"
            print(f"    -> Login [{identifier}] -> Name: {user_info['full_name']} | Role: {user_info['role']} | Code: {user_info['employee_code']} | Dept: {user_info['department']}")

    print("\n" + "=" * 70)
    print("  ALL 230 EMPLOYEE & ROLE INTEGRITY TESTS PASSED FLAWLESSLY!")
    print("=" * 70)

if __name__ == "__main__":
    test_dataset()
