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
    "auth_engine.py",
    "vault.py",
    "db_config.py",
    "service.py",
    "privacy_gateway_engine.py",
    "siem_engine.py",
]

print("\n--- 1. Uploading Phase 5 Backend Files ---")
for f in backend_files:
    local_path = os.path.join(local_dir, f)
    if os.path.exists(local_path):
        target_service = f"{remote_service_dir}/{f}"
        target_repo = f"{remote_repo_dir}/{f}"
        print(f"Uploading {f} ({os.path.getsize(local_path)} bytes) -> {target_service}")
        sftp.put(local_path, target_service)
        sftp.put(local_path, target_repo)

# 2. Upload Frontend Source Files
frontend_sources = [
    "src/pages/SettingsPage.jsx",
    "src/components/firewall/PrivacyGatewayTab.jsx",
    "src/services/apiClient.js"
]

print("\n--- 2. Uploading Phase 5 Frontend Source Files ---")
for src_file in frontend_sources:
    local_path = os.path.join(local_dir, src_file)
    remote_path = f"{remote_repo_dir}/{src_file}"
    sftp_mkdir_p(os.path.dirname(remote_path))
    sftp.put(local_path, remote_path)
    print(f"Uploaded source: {src_file}")

# 3. Upload Production Frontend Build (dist)
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
stdin, stdout, stderr = ssh.exec_command("curl -s http://127.0.0.1:8003/settings/tenant")
res = stdout.read().decode('utf-8')
print("Tenant Settings Response:", res[:200])

ssh.close()
print("\nDeployment completed successfully!")
