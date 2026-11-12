import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('20.193.248.164', username='azureuserSDH', password='WelcomeSDH@2027', timeout=20)

print("=== Nginx Config ===")
stdin, stdout, stderr = ssh.exec_command("sudo cat /etc/nginx/sites-enabled/* 2>/dev/null || cat /etc/nginx/conf.d/* 2>/dev/null")
print(stdout.read().decode('utf-8'))

print("=== PM2 Logs datax-agent-harness ===")
stdin, stdout, stderr = ssh.exec_command("pm2 logs datax-agent-harness --lines 40 --nostream")
print(stdout.read().decode('utf-8'))
print(stderr.read().decode('utf-8'))

print("=== Listening Ports on VM ===")
stdin, stdout, stderr = ssh.exec_command("sudo netstat -tlpn 2>/dev/null || ss -tlpn")
print(stdout.read().decode('utf-8'))

ssh.close()

