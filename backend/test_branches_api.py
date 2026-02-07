import requests
import asyncio

BASE_URL = "http://localhost:8000/api/admin/branches"
LOGIN_URL = "http://localhost:8000/api/auth/login"

def test_branches():
    # 1. Login
    session = requests.Session()
    login_data = {"username": "admin@college.com", "password": "Admin@123"}
    resp = session.post(LOGIN_URL, data=login_data)
    if resp.status_code != 200:
        print(f"Login failed: {resp.status_code} {resp.text}")
        return
    
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. List Branches
    resp = session.get(BASE_URL, headers=headers)
    print(f"List: {resp.status_code}")
    print(resp.json())
    
    # 3. Create Branch
    new_branch = {
        "branch_name": "Test Engineering",
        "branch_code": "TEST",
        "is_active": True
    }
    resp = session.post(BASE_URL, json=new_branch, headers=headers)
    print(f"Create: {resp.status_code}")
    if resp.status_code == 201:
        branch_id = resp.json()["id"]
        print("Created ID:", branch_id)
        
        # 4. Patch Branch
        patch_data = {"branch_name": "Test Eng Updated", "is_active": False}
        resp = session.patch(f"{BASE_URL}/{branch_id}", json=patch_data, headers=headers)
        print(f"Patch: {resp.status_code}")
        print(resp.json())
        
        # 5. Delete Branch (Actually usage PATCH to deactivate, but my code removed DELETE endpoint)
        # Verify it lists as inactive
        resp = session.get(f"{BASE_URL}/{branch_id}", headers=headers)
        print(f"Get One: {resp.status_code} IsActive: {resp.json()['is_active']}")
    else:
        print("Create failed:", resp.text)

if __name__ == "__main__":
    test_branches()
