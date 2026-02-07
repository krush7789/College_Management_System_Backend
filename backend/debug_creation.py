
import urllib.request
import json
import urllib.parse
import urllib.error

BASE_URL = "http://localhost:8000/api"
ADMIN_EMAIL = "krushagarwal7879@gmail.com"
ADMIN_PASS = "Admin@123"

def post_json(url, data, token):
    req = urllib.request.Request(url, method="POST")
    req.add_header('Content-Type', 'application/json')
    req.add_header('Authorization', f'Bearer {token}')
    json_data = json.dumps(data).encode('utf-8')
    try:
        print(f"POSTing to {url} with {data}")
        with urllib.request.urlopen(req, data=json_data) as response:
            print("Response Code:", response.getcode())
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code}")
        print("Body:", e.read().decode('utf-8'))
    except Exception as e:
        print(f"Error: {e}")

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
            return json.loads(response.read().decode('utf-8')).get("access_token")
    except Exception as e:
        print("Login failed:", e)
        return None

def main():
    token = login()
    if not token: return
    
    # Try create branch
    post_json(f"{BASE_URL}/branches/", {"name": "Debug CSE", "code": "DEBUGCSE"}, token)

    # Try create teacher
    post_json(f"{BASE_URL}/users/teacher", {
        "first_name": "Debug", "last_name": "Teacher",
        "email": "debug@teacher.com", "password": "Pass@123",
        "phone_number": "9999999999", "gender": "male",
        "designation": "Prof", "department": "CSE"
    }, token)

if __name__ == "__main__":
    main()
