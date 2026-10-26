"""
DataX Production Deployment Script
Synchronizes compiled frontend assets (dist/) and modular backend services to Azure VM,
restarts PM2 process 6, and executes health probes against the live reverse-proxy.
"""

import os
import sys
import io
import time
import urllib.request
import json
import paramiko

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOSTNAME = "20.193.248.164"
USERNAME = "azureuserSDH"
PASSWORD = "WelcomeSDH@2027"

LOCAL_DIST = r"h:\AAVIL Inc\DataX\DataX\dist"
REMOTE_DIST = "/home/azureuserSDH/Production/DataX/dist"

LOCAL_BACKEND_DIR = r"h:\AAVIL Inc\DataX\DataX"
REMOTE_BACKEND_DIR = "/home/azureuserSDH/Production/datax-service"

BACKEND_FILES = [
    "service.py",
    "models.py",
    "resilience.py",
    "connectors.py",
    "engine.py",
    "pipeline.py",
    "vault.py",
    "sap_generator.py",
    "db_pool.py",
    "profiler.py",
    "benchmark.py",
    "security_rbac.py",
    "sanitizer.py",
    "rate_limiter.py",
    "structured_logger.py",
    "metrics.py",
    "alerts.py",
    "lifecycle.py",
    "checkpointer.py",
    "orchestrator.py",
    "governance.py",
    "change_management.py",
    "ai_governance.py",
    "tenant_manager.py",
    "connector_ecosystem.py",
    "developer_platform.py",
    "release_management.py",
    "reporting.py",
    "continuity.py",
    "entitlements.py",
    "support_engine.py",
    "shadow_reconciler.py",
    "auth_engine.py"
]

def deploy():
    print("=" * 60)
    print("DATAX PRODUCTION DEPLOYMENT & VERIFICATION")
    print("=" * 60)

    # 1. Connect SSH / SFTP
    print(f"\n[1/4] Connecting to Azure VM ({HOSTNAME})...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOSTNAME, port=22, username=USERNAME, password=PASSWORD, timeout=20)
    sftp = client.open_sftp()
    print("✓ SSH connection established.")

    # Helper for remote directory creation
    def sftp_mkdir_p(remote_directory):
        dirs_ = []
        dir_ = remote_directory
        while len(dir_) > 1:
            dirs_.append(dir_)
            dir_, _ = os.path.split(dir_)
        if len(dir_) == 1:
            dirs_.append(dir_)
        while len(dirs_):
            d = dirs_.pop().replace('\\', '/')
            try:
                sftp.stat(d)
            except IOError:
                sftp.mkdir(d)

    # 2. Upload Backend Modular Files
    print(f"\n[2/4] Deploying {len(BACKEND_FILES)} backend modules to {REMOTE_BACKEND_DIR}...")
    sftp_mkdir_p(REMOTE_BACKEND_DIR)
    for bf in BACKEND_FILES:
        local_path = os.path.join(LOCAL_BACKEND_DIR, bf)
        if os.path.exists(local_path):
            remote_path = f"{REMOTE_BACKEND_DIR}/{bf}"
            sftp.put(local_path, remote_path)
            print(f"  -> Uploaded: {bf}")
        else:
            print(f"  [WARN] Local file missing: {bf}")

    # 3. Upload Frontend Dist
    print(f"\n[3/4] Deploying frontend assets to {REMOTE_DIST}...")
    sftp_mkdir_p(REMOTE_DIST)
    dist_count = 0
    for root, dirs, files in os.walk(LOCAL_DIST):
        rel_path = os.path.relpath(root, LOCAL_DIST)
        if rel_path == ".":
            remote_path = REMOTE_DIST
        else:
            remote_path = os.path.join(REMOTE_DIST, rel_path).replace("\\", "/")
        sftp_mkdir_p(remote_path)
        for f in files:
            l_file = os.path.join(root, f)
            r_file = os.path.join(remote_path, f).replace("\\", "/")
            sftp.put(l_file, r_file)
            dist_count += 1
    print(f"✓ Uploaded {dist_count} frontend distribution assets.")
    sftp.close()

    # 3b. Verify Backend Integrity on VM Before Restarting
    print("\n[3b] Verifying backend Python integrity on remote VM using PM2 venv...")
    remote_py = "/home/azureuserSDH/Production/nexlayer-backend/venv/bin/python3"
    verify_cmd = f"export DATAX_JWT_SECRET=f56ec733b0d04065616a8b79712fea38978b471f268ef4997b533088e59f36e7 && {remote_py} -c \"import sys; sys.path.insert(0, '/home/azureuserSDH/Production/datax-service'); import service; print('✓ Remote import verified! Route count:', len(service.app.routes))\""
    stdin, stdout, stderr = client.exec_command(verify_cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if err:
        print(f"[ERROR ON VM]:\n{err}")
    if out:
        print(out)
    if "Remote import verified!" not in out:
        print("Backend verification failed on VM! Aborting restart.")
        client.close()
        sys.exit(1)

    # 4. Restart PM2 Process 6
    print("\n[4/4] Restarting PM2 process 6 (datax-agent-harness)...")
    stdin, stdout, stderr = client.exec_command("pm2 restart 6")
    time.sleep(3)
    stdin, stdout, stderr = client.exec_command("pm2 jlist")
    raw_status = stdout.read().decode('utf-8')
    try:
        proc_data = json.loads(raw_status)
        for proc in proc_data:
            if proc.get('pm_id') == 6:
                print(f"✓ PM2 Process #6 Status: {proc.get('pm2_env', {}).get('status')}")
    except Exception:
        print("✓ Restart command transmitted.")

    client.close()

    # 5. Live Probes
    print("\nExecuting live health probes against https://dataglow.ai/datax-api/ ...")
    time.sleep(2)

    endpoints = [
        ("Health Probe", "https://dataglow.ai/datax-api/health"),
        ("Resilience Status", "https://dataglow.ai/datax-api/resilience/status"),
        ("Public System Status", "https://dataglow.ai/datax-api/status/public"),
        ("Shadow Reconciliation Reports", "https://dataglow.ai/datax-api/reconciliation/shadow/reports")
    ]

    for label, url in endpoints:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "DataX-Deploy-Probe/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                print(f"✓ {label} ({url}): HTTP {resp.status} - OK")
        except Exception as e:
            print(f"✗ {label} ({url}): FAILED - {e}")

    print("\n" + "=" * 60)
    print("DEPLOYMENT & LIVE VERIFICATION COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    deploy()
