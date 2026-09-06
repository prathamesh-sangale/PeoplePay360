import sys
import os
import uuid
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.employee import Employee
from app.models.department import Department
from app.models.job import Job
from app.api.employees import EmployeeCreate, EmployeeUpdate, create_employee, update_employee, get_employee_detail, list_employees

def test_employee_address_persistence():
    print("=================================================================")
    print("PEOPLEPAY360 - EMPLOYEE ADDRESS & WORK LOCATION PRESERVATION TEST")
    print("=================================================================")
    db = SessionLocal()

    try:
        dept = db.query(Department).first()
        job = db.query(Job).first()
        assert dept is not None and job is not None, "Department and Job must exist in DB"

        custom_address = "Flat 402, Green Glen Layout, Bellandur, Bengaluru 560103"
        test_email = f"address.test.{uuid.uuid4().hex[:8]}@peoplepay360.in"

        # TEST 1: Creation with Custom Address
        print("\n[TEST 1] Creating Employee with Custom Address...")
        payload = EmployeeCreate(
            first_name="Rohan",
            last_name="Kulkarni",
            email=test_email,
            department_id=dept.id,
            job_id=job.id,
            initial_wage=90000.0,
            date_of_joining=date.today(),
            work_location=custom_address,
            status="ACTIVE",
        )
        res = create_employee(payload, db=db)
        emp_id = res["id"]
        emp_code = res["employee_code"]
        assert res["work_location"] == custom_address, f"Expected '{custom_address}', got '{res['work_location']}'"
        print(f"  [PASS] Created employee {emp_code} with work_location: '{res['work_location']}'")

        # TEST 2: Detail endpoint retrieval
        print("\n[TEST 2] Retrieving Employee Detail via API...")
        detail = get_employee_detail(id=str(emp_id), db=db)
        assert detail["work_location"] == custom_address, f"Detail endpoint returned '{detail['work_location']}' instead of '{custom_address}'"
        print(f"  [PASS] Detail API returned exact address: '{detail['work_location']}'")

        # TEST 3: List endpoint retrieval
        print("\n[TEST 3] Querying Employee in Directory Listing...")
        employees = list_employees(search="Rohan", db=db)
        matching = [e for e in employees if e["id"] == str(emp_id)]
        assert len(matching) == 1, "Employee must be found in directory list"
        assert matching[0]["work_location"] == custom_address, f"Directory returned '{matching[0]['work_location']}'"
        print(f"  [PASS] Directory list returned exact address: '{matching[0]['work_location']}'")

        # TEST 4: Updating Address via PUT endpoint
        print("\n[TEST 4] Updating Employee Address via PUT API...")
        updated_address = "Plot 88, Sector 18, Udyog Vihar, Gurugram, Haryana 122015"
        update_res = update_employee(
            id=str(emp_id),
            payload=EmployeeUpdate(work_location=updated_address),
            db=db,
        )
        assert update_res["work_location"] == updated_address, f"Update returned '{update_res['work_location']}'"

        refreshed_detail = get_employee_detail(id=str(emp_id), db=db)
        assert refreshed_detail["work_location"] == updated_address, f"Refreshed detail returned '{refreshed_detail['work_location']}'"
        print(f"  [PASS] Successfully updated and verified new address: '{refreshed_detail['work_location']}'")

        print("\n=================================================================")
        print("ALL 4 ADDRESS PRESERVATION & MUTATION TESTS PASSED SUCCESSFULLY!")
        print("=================================================================")
    finally:
        db.close()

if __name__ == "__main__":
    test_employee_address_persistence()
