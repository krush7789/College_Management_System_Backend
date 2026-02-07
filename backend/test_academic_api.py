import requests
import sys

BASE_URL = "http://localhost:8000/api"
LOGIN_URL = f"{BASE_URL}/auth/login"

def test_academic_structure():
    session = requests.Session()
    
    # 1. Login as Admin
    print("Logging in...")
    login_data = {"username": "admin@college.com", "password": "Admin@123"}
    resp = session.post(LOGIN_URL, data=login_data)
    if resp.status_code != 200:
        print(f"Login failed: {resp.status_code} {resp.text}")
        return
    
    print("Login successful.")

    # 2. Test Semesters
    print("\nTesting Semesters...")
    # Create Semester
    sem_data = {"semester_name": 1, "academic_year": "2023-24"}
    resp = session.post(f"{BASE_URL}/admin/semesters", json=sem_data)
    print(f"Create Semester: {resp.status_code}")
    if resp.status_code == 201:
        sem_id = resp.json()["id"]
        # Update Semester
        patch_data = {"academic_year": "2023-24 (Updated)"}
        resp = session.patch(f"{BASE_URL}/admin/semesters/{sem_id}", json=patch_data)
        print(f"Patch Semester: {resp.status_code} {resp.json().get('academic_year')}")
    
    # 3. Test Sections
    print("\nTesting Sections...")
    # Get Branch (need an ID)
    resp = session.get(f"{BASE_URL}/admin/branches")
    branches = resp.json()
    if not branches:
        print("No branches found, cannot test sections.")
    else:
        branch_id = branches[0]["id"]
        # Get Semester (need an ID)
        resp = session.get(f"{BASE_URL}/admin/semesters")
        semesters = resp.json()
        if not semesters:
            print("No semesters found, cannot test sections.")
        else:
            sem_id = semesters[0]["id"]
            section_data = {
                "section_name": "A",
                "branch_id": branch_id,
                "semester_id": sem_id,
                "max_students": 60
            }
            resp = session.post(f"{BASE_URL}/admin/sections", json=section_data)
            print(f"Create Section: {resp.status_code}")
            if resp.status_code == 201:
                sec_id = resp.json()["id"]
                # Update Section
                patch_data = {"section_name": "B"}
                resp = session.patch(f"{BASE_URL}/admin/sections/{sec_id}", json=patch_data)
                print(f"Patch Section: {resp.status_code} {resp.json().get('section_name')}")

if __name__ == "__main__":
    test_academic_structure()
