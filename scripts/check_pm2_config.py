import paramiko
import sys
import io
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('20.193.248.164', username='azureuserSDH', password='WelcomeSDH@2027', timeout=15)

stdin, stdout, stderr = ssh.exec_command("pm2 jlist")
data = json.loads(stdout.read().decode('utf-8'))
for proc in data:
    if proc.get('name') == 'datax-agent-harness' or proc.get('pm_id') == 6:
        print("PM2 Process Info:")
        print("  Name:", proc.get('name'))
        print("  ID:", proc.get('pm_id'))
        print("  Status:", proc.get('pm2_env', {}).get('status'))
        print("  Script:", proc.get('pm2_env', {}).get('pm_exec_path'))
        print("  CWD:", proc.get('pm2_env', {}).get('pm_cwd'))
        print("  Uptime:", proc.get('pm2_env', {}).get('pm_uptime'))

ssh.close()
