
import urllib.request
import json
import urllib.parse
import random

BASE_URL = "http://localhost:8000/api"
ADMIN_EMAIL = "krushagarwal7879@gmail.com"
ADMIN_PASS = "Admin@123"

BRANCHES = [
    {"name": "Computer Science & Engineering", "code": "CSE"},
    {"name": "Information Technology", "code": "IT"},
    {"name": "Electronics & Communication", "code": "ECE"},
    {"name": "Mechanical Engineering", "code": "ME"},
    {"name": "Civil Engineering", "code": "CE"},
]

SEMESTERS = [
    {"number": i, "academic_year": "2024-2025"} for i in range(1, 9)
]

SECTIONS = ["A", "B"]

TEACHERS = [
    {"first_name": "Rajesh", "last_name": "Kumar", "email": "rajesh.kumar@college.edu", "designation": "HOD", "department": "CSE"},
    {"first_name": "Anita", "last_name": "Sharma", "email": "anita.sharma@college.edu", "designation": "Associate Professor", "department": "IT"},
    {"first_name": "Suresh", "last_name": "Reddy", "email": "suresh.reddy@college.edu", "designation": "Assistant Professor", "department": "ECE"},
    {"first_name": "Meera", "last_name": "Patel", "email": "meera.patel@college.edu", "designation": "Professor", "department": "ME"},
    {"first_name": "Vikram", "last_name": "Singh", "email": "vikram.singh@college.edu", "designation": "Lecturer", "department": "CE"},
]

STUDENTS = [
    {"first_name": "Aarav", "last_name": "Gupta", "base_email": "aarav", "gender": "male"},
    {"first_name": "Vihaan", "last_name": "Malhotra", "base_email": "vihaan", "gender": "male"},
    {"first_name": "Aditya", "last_name": "Joshi", "base_email": "aditya", "gender": "male"},
    {"first_name": "Diya", "last_name": "Verma", "base_email": "diya", "gender": "female"},
    {"first_name": "Ananya", "last_name": "Rao", "base_email": "ananya", "gender": "female"},
    {"first_name": "Riya", "last_name": "Kapoor", "base_email": "riya", "gender": "female"},
    {"first_name": "Arjun", "last_name": "Nair", "base_email": "arjun", "gender": "male"},
    {"first_name": "Ishaan", "last_name": "Mehta", "base_email": "ishaan", "gender": "male"},
]

def post_json(url, data, token=None):
    req = urllib.request.Request(url, method="POST")
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    
    json_data = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req, data=json_data) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Request failed: {url} - {e.code}")
        print(e.read().decode('utf-8'))
        return None

def get_json(url, token):
    req = urllib.request.Request(url, method="GET")
    req.add_header('Authorization', f'Bearer {token}')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Failed GET {url}: {e}")
        return []

def login():
    url = f"{BASE_URL}/auth/login"
    data = urllib.parse.urlencode({
        "username": ADMIN_EMAIL,
        "password": ADMIN_PASS
    }).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode('utf-8'))
            return res.get("access_token")
    except urllib.error.HTTPError as e:
        print("Login failed:", e.code, e.read().decode())
        return None

def main():
    print("Logging in as Admin...")
    token = login()
    if not token:
        print("Failed to get token. Checks credits.")
        return

    print("Success. Token obtained.")
    
    # 1. Create Branches
    print("--- Creating Branches ---")
    created_branches = {}
    existing_branches = get_json(f"{BASE_URL}/branches/", token)
    
    for b in BRANCHES:
        found = next((ex for ex in existing_branches if ex['code'] == b['code']), None)
        if found:
            created_branches[b['code']] = found['id']
            # print(f"Branch {b['code']} exists.")
        else:
            new_b = post_json(f"{BASE_URL}/branches/", b, token)
            if new_b:
                created_branches[b['code']] = new_b['id']
                print(f"Created Branch: {b['name']}")
    
    # 2. Create Semesters
    print("--- Creating Semesters ---")
    created_semesters = {}
    existing_semesters = get_json(f"{BASE_URL}/semesters/", token)

    for s in SEMESTERS:
        found = next((ex for ex in existing_semesters if ex['number'] == s['number']), None)
        if found:
            created_semesters[s['number']] = found['id']
        else:
            new_s = post_json(f"{BASE_URL}/semesters/", s, token)
            if new_s:
                created_semesters[s['number']] = new_s['id']
                print(f"Created Semester: {s['number']}")

    # 3. Create Sections (One for each branch/semester combo ideally, but let's just create generic ones linked to branches)
    # Actually logic: Sections are linked to Branch AND Semester. 
    # Let's create sections for Semester 1, 3, 5, 7 for CSE and IT to show variety.
    print("--- Creating Sections ---")
    created_sections = [] # List of {id, branch_id, semester_id}
    
    target_sem_nums = [1, 8] # Just 1st and Last
    target_branch_codes = ['CSE', 'IT'] # Just two branches

    # Fetch existing sections just to be safe, though not strictly updating this list for check
    # existing_sections = get_json(f"{BASE_URL}/sections/", token)

    counter = 0
    for b_code in target_branch_codes:
        if b_code not in created_branches: continue
        bid = created_branches[b_code]
        
        for s_num in target_sem_nums:
            if s_num not in created_semesters: continue
            sid = created_semesters[s_num]
            
            for sec_name in SECTIONS:
                # Try create
                payload = {"name": sec_name, "branch_id": bid, "semester_id": sid}
                res = post_json(f"{BASE_URL}/sections/", payload, token)
                if res:
                    created_sections.append(res)
                    counter += 1
                else:
                    # If failed, maybe exists, try to find it via specific GET logic or just assume exists?
                    # Since we don't have easy search API, we skip.
                    pass
    print(f"Processed Sections. (Total created/checked: {counter})")

    # 4. Create Teachers
    print("--- Creating Teachers ---")
    for t in TEACHERS:
        payload = {
            "first_name": t['first_name'],
            "last_name": t['last_name'],
            "email": t['email'],
            "password": "Password@123",
            "phone_number": f"9{random.randint(100000000, 999999999)}",
            "gender": "female" if t['first_name'] in ['Anita', 'Meera'] else "male",
            "date_of_birth": "1985-05-15",
            "designation": t['designation'],
            "department": t['department']
        }
        res = post_json(f"{BASE_URL}/users/teacher", payload, token)
        if res:
            print(f"Created Teacher: {t['email']} / Password@123")
        else:
            print(f"Teacher {t['email']} likely exists.")

    # 5. Create Students
    print("--- Creating Students ---")
    # Fetch all sections again to have a valid pool
    all_sections = get_json(f"{BASE_URL}/sections/", token)
    if not all_sections:
        print("No sections found to enroll students.")
        return

    for s in STUDENTS:
        # Pick random section
        sec = random.choice(all_sections)
        
        email = f"{s['base_email']}@student.college.edu"
        payload = {
            "first_name": s['first_name'],
            "last_name": s['last_name'],
            "email": email,
            "password": "Password@123", # Standard password
            "phone_number": f"8{random.randint(100000000, 999999999)}",
            "gender": s['gender'],
            "date_of_birth": "2003-08-20",
            "roll_no": f"RN-{random.randint(10000, 99999)}", # Shorter roll no
            "branch_id": sec['branch_id'],
            "section_id": sec['id']
        }
        res = post_json(f"{BASE_URL}/users/student", payload, token)
        if res:
             print(f"Created Student: {email} / Password@123")
        else:
             print(f"Student {email} likely exists.")

if __name__ == "__main__":
    main()
