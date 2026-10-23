import urllib.request
import json
import time

def post_json(url, payload):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'User-Agent': 'DataX-Test/1.0'}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

test_email = f"client_qa_{int(time.time())}@enterprise.com"
test_pw = "EnterpriseSecure#2026!"

print(f"Testing registration for: {test_email}...")

# 1. Test registration via /datax-api/api/auth/register
status, body = post_json(
    "https://dataglow.ai/datax-api/api/auth/register",
    {"email": test_email, "password": test_pw, "fullName": "Enterprise Lead", "tenantId": "tenant_enterprise"}
)
print(f"1. /datax-api/api/auth/register -> Status {status}: user={body.get('user', {}).get('email')}, token={bool(body.get('token'))}")

# 2. Test login via /datax-api/api/auth/login
status, body = post_json(
    "https://dataglow.ai/datax-api/api/auth/login",
    {"email": test_email, "password": test_pw}
)
print(f"2. /datax-api/api/auth/login -> Status {status}: user={body.get('user', {}).get('email')}, token={bool(body.get('token'))}")

# 3. Test direct /api/auth/login proxy (from frontend route)
status, body = post_json(
    "https://dataglow.ai/api/auth/login",
    {"email": test_email, "password": test_pw}
)
print(f"3. Direct https://dataglow.ai/api/auth/login -> Status {status}: user={body.get('user', {}).get('email')}")

# 4. Test demo account login
status, body = post_json(
    "https://dataglow.ai/api/auth/login",
    {"email": "admin@dataglow.ai", "password": "admin"}
)
print(f"4. Demo account admin login -> Status {status}: role={body.get('user', {}).get('role')}")
