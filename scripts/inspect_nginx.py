import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('20.193.248.164', username='azureuserSDH', password='WelcomeSDH@2027', timeout=15)

stdin, stdout, stderr = ssh.exec_command("grep -rn 'location /datax' /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null || cat /etc/nginx/sites-enabled/default")
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()
