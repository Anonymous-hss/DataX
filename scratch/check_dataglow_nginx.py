import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('20.193.248.164', username='azureuserSDH', password='WelcomeSDH@2027')
stdin, stdout, stderr = ssh.exec_command('grep -n -C 5 "datax" /etc/nginx/sites-available/*')
print(stdout.read().decode('utf-8'))
err = stderr.read().decode('utf-8')
if err: print('err:', err)
ssh.close()
