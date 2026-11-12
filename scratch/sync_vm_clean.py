import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("20.193.248.164", username="azureuserSDH", password="WelcomeSDH@2027", timeout=20)

print("--- Resetting /home/azureuserSDH/Production/DataX to clean origin/feature/dynamic-ui ---")
stdin, stdout, stderr = ssh.exec_command("cd /home/azureuserSDH/Production/DataX && git reset --hard origin/feature/dynamic-ui && git clean -fd && git status")
print(stdout.read().decode('utf-8'))
print(stderr.read().decode('utf-8'))

print("--- Syncing backend files to /home/azureuserSDH/Production/datax-service ---")
sync_cmd = """
cp /home/azureuserSDH/Production/DataX/service.py /home/azureuserSDH/Production/datax-service/
cp /home/azureuserSDH/Production/DataX/db_config.py /home/azureuserSDH/Production/datax-service/
cp /home/azureuserSDH/Production/DataX/privacy_gateway_engine.py /home/azureuserSDH/Production/datax-service/
cp /home/azureuserSDH/Production/DataX/siem_engine.py /home/azureuserSDH/Production/datax-service/
cp /home/azureuserSDH/Production/DataX/license_engine.py /home/azureuserSDH/Production/datax-service/
cp /home/azureuserSDH/Production/DataX/gateway_benchmark.py /home/azureuserSDH/Production/datax-service/
cp /home/azureuserSDH/Production/DataX/vault_connector.py /home/azureuserSDH/Production/datax-service/
cp /home/azureuserSDH/Production/DataX/rbac_engine.py /home/azureuserSDH/Production/datax-service/
cp /home/azureuserSDH/Production/DataX/egress_block_test.py /home/azureuserSDH/Production/datax-service/
pm2 restart datax-agent-harness
"""
stdin, stdout, stderr = ssh.exec_command(sync_cmd)
print(stdout.read().decode('utf-8'))

ssh.close()

