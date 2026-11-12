import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('20.193.248.164', username='azureuserSDH', password='WelcomeSDH@2027')
stdin, stdout, stderr = ssh.exec_command('grep -rn "datax" /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null')
print(stdout.read().decode('utf-8'))
stdin, stdout, stderr = ssh.exec_command('cat /etc/nginx/sites-enabled/*')
print(stdout.read().decode('utf-8'))
ssh.close()

