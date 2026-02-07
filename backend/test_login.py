import asyncio
import json
import urllib.request
import urllib.parse
import sys

def test_login():
    url = "http://localhost:8000/api/auth/login"
    data = urllib.parse.urlencode({
        "username": "krushagarwal7879@gmail.com",
        "password": "Admin@123"
    }).encode()
    
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    
    print(f"Testing Login API: {url}")
    try:
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            body = response.read().decode()
            print(f"Status: {status}")
            print(f"Response: {body[:200]}...")
            
            if status == 200:
                print("SUCCESS: Backend Login is working.")
            else:
                print("FAILURE: Status code not 200.")
                
    except urllib.error.URLError as e:
        print(f"ERROR: Could not connect to backend. {e}")
        if hasattr(e, 'read'):
            print(e.read().decode())

if __name__ == "__main__":
    test_login()
