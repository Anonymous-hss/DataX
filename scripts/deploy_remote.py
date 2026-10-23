import os
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('20.193.248.164', username='azureuserSDH', password='WelcomeSDH@2027')
sftp = ssh.open_sftp()

def upload_dir(local_dir, remote_dir):
    try:
        sftp.mkdir(remote_dir)
    except IOError:
        pass
    for item in os.listdir(local_dir):
        lpath = os.path.join(local_dir, item)
        rpath = f'{remote_dir}/{item}'
        if os.path.isdir(lpath):
            upload_dir(lpath, rpath)
        else:
            sftp.put(lpath, rpath)

print('Uploading frontend dist...')
upload_dir(r'h:\AAVIL Inc\DataX\DataX\dist', '/home/azureuserSDH/Production/DataX/dist')
print('Frontend dist uploaded.')

# Check /etc/nginx/sites-enabled/dataglow
stdin, stdout, stderr = ssh.exec_command('cat /etc/nginx/sites-enabled/dataglow')
nginx_conf = stdout.read().decode('utf-8')

auth_block = """
    # Direct /api/auth/ proxy for DataX Authentication
    location /api/auth/ {
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '$http_origin' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        proxy_pass http://127.0.0.1:8003/api/auth/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 100M;
    }
"""

if 'location /api/auth/' not in nginx_conf:
    print('Injecting /api/auth/ proxy into Nginx...')
    idx = nginx_conf.find('location /datax-api/ {')
    new_conf = nginx_conf[:idx] + auth_block + '\n    ' + nginx_conf[idx:]
    with sftp.open('/tmp/dataglow_nginx.conf', 'w') as f:
        f.write(new_conf)
    stdin, stdout, stderr = ssh.exec_command('echo WelcomeSDH@2027 | sudo -S cp /tmp/dataglow_nginx.conf /etc/nginx/sites-enabled/dataglow && echo WelcomeSDH@2027 | sudo -S nginx -t && echo WelcomeSDH@2027 | sudo -S systemctl reload nginx')
    print('Nginx test & reload:\n', stdout.read().decode(), stderr.read().decode())
else:
    print('Nginx already contains /api/auth/ location.')

stdin, stdout, stderr = ssh.exec_command('pm2 restart 6')
print('PM2 restart:', stdout.read().decode())

sftp.close()
ssh.close()
print('Deploy complete.')
