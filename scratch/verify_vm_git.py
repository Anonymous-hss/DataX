import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("20.193.248.164", username="azureuserSDH", password="WelcomeSDH@2027", timeout=20)

print("--- Checking git status in /home/azureuserSDH/Production/DataX on Azure VM ---")
stdin, stdout, stderr = ssh.exec_command("cd /home/azureuserSDH/Production/DataX && git fetch origin && git status")
print(stdout.read().decode('utf-8'))
print(stderr.read().decode('utf-8'))

print("--- Checking PM2 Status ---")
stdin, stdout, stderr = ssh.exec_command("pm2 status datax-agent-harness")
print(stdout.read().decode('utf-8'))

ssh.close()

