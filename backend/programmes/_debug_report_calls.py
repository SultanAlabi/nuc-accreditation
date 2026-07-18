import requests
login_url = 'http://127.0.0.1:8000/api/auth/login/'
prog_url = 'http://127.0.0.1:8000/api/programmes/1/'
report_json = 'http://127.0.0.1:8000/api/programmes/1/report/?format=json'
report_pdf = 'http://127.0.0.1:8000/api/programmes/1/report/?format=pdf'
cred = {'email': 'alabisultan28@gmail.com', 'password': 'Gbollyboy04'}

s = requests.Session()
try:
    r = s.post(login_url, data=cred, timeout=10)
    print('login', r.status_code, r.text[:200])
    r.raise_for_status()
    token = r.json().get('token')
    headers = {'Authorization': f'Bearer {token}'}
    r1 = s.get(prog_url, headers=headers, timeout=10)
    print('programme detail', r1.status_code, r1.headers.get('Content-Type'), str(r1.text)[:400])
    r2 = s.get(report_json, headers=headers, timeout=20)
    print('report json', r2.status_code, r2.headers.get('Content-Type'), str(r2.text)[:400])
    r3 = s.get(report_pdf, headers=headers, timeout=20)
    print('report pdf', r3.status_code, r3.headers.get('Content-Type'))
    if r3.status_code == 200:
        open('live_report_1.pdf','wb').write(r3.content)
        print('saved live_report_1.pdf size', len(r3.content))
    else:
        print('pdf body', r3.text[:400])
except Exception as e:
    print('error', e)
