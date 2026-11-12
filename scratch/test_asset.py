import urllib.request

url = 'https://dataglow.ai/datax/assets/DataXPoc-DH37oYr-.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=10) as res:
        print('Status:', res.status)
        print('Size:', len(res.read()), 'bytes')
except Exception as e:
    print('Error:', e)

