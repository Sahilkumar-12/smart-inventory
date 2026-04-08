import json
from urllib import request

# Login body
data = json.dumps({"username": "testuser", "password": "testpassword"}).encode('utf-8')
req = request.Request("http://localhost:8000/auth/login", data=data, headers={'Content-Type': 'application/json'})

try:
    with request.urlopen(req) as response:
        login_res = json.loads(response.read())
except Exception as e:
    print("Login failed:", e)
    exit(1)

token = login_res["access_token"]
print("Got token")

# Get products
req2 = request.Request("http://localhost:8000/products/", headers={'Authorization': f'Bearer {token}'})
try:
    with request.urlopen(req2) as response:
        print("Status", response.status)
        print("Response", json.loads(response.read()))
except Exception as e:
    print("Failed")
    if hasattr(e, 'read'):
        print(e.read().decode())
    else:
        print(e)
