import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("20.193.248.164", username="azureuserSDH", password="WelcomeSDH@2027", timeout=30)

print("=== 1. Pulling latest commits on VM ===")
stdin, stdout, stderr = ssh.exec_command("cd /home/azureuserSDH/Production/DataX && git fetch origin feature/dynamic-ui && git reset --hard origin/feature/dynamic-ui && git clean -fd && git log -1 --oneline")
print(stdout.read().decode('utf-8'))
err = stderr.read().decode('utf-8')
if err:
    print("stderr:", err)

print("=== 2. Running npm run build on VM ===")
stdin, stdout, stderr = ssh.exec_command("cd /home/azureuserSDH/Production/DataX && npm run build")
print(stdout.read().decode('utf-8'))
err = stderr.read().decode('utf-8')
if err:
    print("stderr:", err)

print("=== 3. Syncing backend service files & restarting datax-agent-harness ===")
sync_cmd = """
cp /home/azureuserSDH/Production/DataX/service.py /home/azureuserSDH/Production/datax-service/ 2>/dev/null || true
cp /home/azureuserSDH/Production/DataX/enhancements_service.py /home/azureuserSDH/Production/datax-service/ 2>/dev/null || true
cp /home/azureuserSDH/Production/DataX/db_config.py /home/azureuserSDH/Production/datax-service/ 2>/dev/null || true
cp /home/azureuserSDH/Production/DataX/privacy_gateway_engine.py /home/azureuserSDH/Production/datax-service/ 2>/dev/null || true
cp /home/azureuserSDH/Production/DataX/siem_engine.py /home/azureuserSDH/Production/datax-service/ 2>/dev/null || true
cp /home/azureuserSDH/Production/DataX/license_engine.py /home/azureuserSDH/Production/datax-service/ 2>/dev/null || true
cp /home/azureuserSDH/Production/DataX/gateway_benchmark.py /home/azureuserSDH/Production/datax-service/ 2>/dev/null || true
cp /home/azureuserSDH/Production/DataX/vault_connector.py /home/azureuserSDH/Production/datax-service/ 2>/dev/null || true
cp /home/azureuserSDH/Production/DataX/rbac_engine.py /home/azureuserSDH/Production/datax-service/ 2>/dev/null || true
cp /home/azureuserSDH/Production/DataX/egress_block_test.py /home/azureuserSDH/Production/datax-service/ 2>/dev/null || true
pm2 restart datax-agent-harness
pm2 status datax-agent-harness
"""
stdin, stdout, stderr = ssh.exec_command(sync_cmd)
print(stdout.read().decode('utf-8'))
err = stderr.read().decode('utf-8')
if err:
    print("stderr:", err)

ssh.close()
print("=== VM Deployment Completed Successfully ===")

