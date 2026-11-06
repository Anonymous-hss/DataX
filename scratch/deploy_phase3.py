import sys
sys.stdout.reconfigure(encoding='utf-8')
import os
import paramiko
import time
import requests

local_dir = r"h:\AAVIL Inc\DataX\DataX"
remote_service_dir = "/home/azureuserSDH/Production/datax-service"
remote_repo_dir = "/home/azureuserSDH/Production/DataX"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("Connecting to Azure VM 20.193.248.164...")
ssh.connect("20.193.248.164", username="azureuserSDH", password="WelcomeSDH@2027", timeout=20)
print("Connected successfully!")

sftp = ssh.open_sftp()

def sftp_mkdir_p(remote_directory):
    dirs_ = []
    dir_ = remote_directory
    while len(dir_) > 1:
        dirs_.append(dir_)
        dir_, _ = os.path.split(dir_)
    if len(dir_) == 1:
        dirs_.append(dir_)
    while len(dirs_):
        d = dirs_.pop()
        try:
            sftp.stat(d)
        except:
            sftp.mkdir(d)

# 1. Upload Backend Python Files
backend_files = [
    "siem_engine.py",
    "license_engine.py",
    "gateway_benchmark.py",
    "db_config.py",
    "privacy_gateway_engine.py",
    "service.py"
]

print("\n--- 1. Uploading Phase 3 Backend Files ---")
for f in backend_files:
    local_path = os.path.join(local_dir, f)
    if os.path.exists(local_path):
        target_service = f"{remote_service_dir}/{f}"
        target_repo = f"{remote_repo_dir}/{f}"
        print(f"Uploading {f} ({os.path.getsize(local_path)} bytes) -> {target_service}")
        sftp.put(local_path, target_service)
        sftp.put(local_path, target_repo)

# 2. Upload Frontend Source Files
print("\n--- 2. Uploading Phase 3 Frontend Source ---")
src_file = "src/components/firewall/PrivacyGatewayTab.jsx"
sftp.put(os.path.join(local_dir, src_file), f"{remote_repo_dir}/{src_file}")

# 3. Upload dist (Frontend Build)
print("\n--- 3. Uploading Production Frontend Build (dist) ---")
local_dist = os.path.join(local_dir, "dist")
remote_dist = f"{remote_repo_dir}/dist"

upload_count = 0
for root, dirs, files in os.walk(local_dist):
    rel_path = os.path.relpath(root, local_dist).replace("\\", "/")
    target_remote_dir = remote_dist if rel_path == "." else f"{remote_dist}/{rel_path}"
    sftp_mkdir_p(target_remote_dir)
    for fname in files:
        src_file = os.path.join(root, fname)
        dest_file = f"{target_remote_dir}/{fname}"
        sftp.put(src_file, dest_file)
        upload_count += 1
print(f"Uploaded {upload_count} dist build artifacts to {remote_dist}")

sftp.close()

# 4. Restart PM2 Process on Azure VM
print("\n--- 4. Restarting PM2 Backend Harness ---")
stdin, stdout, stderr = ssh.exec_command("pm2 restart datax-agent-harness")
print(stdout.read().decode('utf-8'))

time.sleep(5)

# 5. Check local VM responses
print("\n--- 5. Checking Local VM Endpoints ---")
stdin, stdout, stderr = ssh.exec_command("curl -s http://127.0.0.1:8003/license/status")
print("Local VM curl /license/status:\n", stdout.read().decode('utf-8'))

stdin, stdout, stderr = ssh.exec_command("curl -s http://127.0.0.1:8003/siem/verify-ledger")
print("Local VM curl /siem/verify-ledger:\n", stdout.read().decode('utf-8'))

ssh.close()
print("\nDeployment complete. Verifying live HTTPS production endpoints...\n")

# 6. Test Public HTTPS Endpoints
headers = {"Content-Type": "application/json"}

# Test A: License Status
try:
    r = requests.get("https://dataglow.ai/datax-api/license/status", timeout=10)
    print(f"HTTPS GET /license/status: HTTP {r.status_code}")
    print(r.text[:300])
except Exception as e:
    print(f"Error testing /license/status: {e}")

# Test B: SIEM Verify Ledger
try:
    r = requests.get("https://dataglow.ai/datax-api/siem/verify-ledger", timeout=10)
    print(f"\nHTTPS GET /siem/verify-ledger: HTTP {r.status_code}")
    print(r.text[:300])
except Exception as e:
    print(f"Error testing /siem/verify-ledger: {e}")

# Test C: SIEM Test Dispatch
try:
    r = requests.post("https://dataglow.ai/datax-api/siem/test-dispatch", json={}, timeout=10)
    print(f"\nHTTPS POST /siem/test-dispatch: HTTP {r.status_code}")
    print(r.text[:300])
except Exception as e:
    print(f"Error testing /siem/test-dispatch: {e}")

# Test D: Gateway Benchmark Run
try:
    r = requests.post("https://dataglow.ai/datax-api/gateway/benchmark/run", json={"rounds": 8, "concurrency": 2}, timeout=15)
    print(f"\nHTTPS POST /gateway/benchmark/run: HTTP {r.status_code}")
    print(r.text[:300])
except Exception as e:
    print(f"Error testing /gateway/benchmark/run: {e}")
