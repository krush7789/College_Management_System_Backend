
import urllib.request
import json
import urllib.parse

BASE_URL = "http://localhost:8000/api"
ADMIN_EMAIL = "krushagarwal7879@gmail.com"
ADMIN_PASS = "Admin@123"

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
    except Exception as e:
        print("Login failed:", e)
        return None

def main():
    token = login()
    if not token: return
    
    # Check users
    req = urllib.request.Request(f"{BASE_URL}/users/", method="GET") # User endpoint might vary, checking /users from users.py which has prefix /users and @router.get("/")
    req.add_header('Authorization', f'Bearer {token}')
    try:
        with urllib.request.urlopen(req) as response:
            users = json.loads(response.read().decode('utf-8'))
            print(f"Total Users Found: {len(users)}")
            for u in users:
                print(f"- {u['email']} ({u['role']})")
    except Exception as e:
        print("Failed to fetch users:", e)

if __name__ == "__main__":
    main()
