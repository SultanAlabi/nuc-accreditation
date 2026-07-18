import requests
login_url = 'http://127.0.0.1:8000/api/auth/login/'
report_url = 'http://127.0.0.1:8000/api/programmes/8/report/?format=pdf'
cred = {'email': 'alabisultan28@gmail.com', 'password': 'Gbollyboy04'}
try:
    r = requests.post(login_url, data=cred, timeout=10)
    r.raise_for_status()
    token = r.json().get('token')
    print('Got token, len', len(token))
    headers = {'Authorization': f'Bearer {token}'}
    r2 = requests.get(report_url, headers=headers, timeout=20)
    print('Report status', r2.status_code)
    print('Headers:', r2.headers)
    if r2.status_code == 200:
        open('live_report_1.pdf', 'wb').write(r2.content)
        print('Saved live_report_1.pdf,', len(r2.content), 'bytes')
    else:
        print('Body:', r2.text[:200])
except Exception as e:
    print('Request failed:', e)
