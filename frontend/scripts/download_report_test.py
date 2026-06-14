import requests, os, tempfile

BASE = 'http://127.0.0.1:8000'
LOGIN = BASE + '/api/auth/login/'
REPORT = BASE + '/api/programmes/6/report-pdf/'

creds = {
    'email': os.environ.get('TEST_HOD_EMAIL', 'testhod@example.com'),
    'password': os.environ.get('TEST_HOD_PASSWORD', 'change-me-placeholder'),
}

s = requests.Session()
r = s.post(LOGIN, json=creds)
print('login', r.status_code)
if r.status_code != 200:
    print(r.text)
    raise SystemExit('login failed')

try:
    token = r.json().get('token') or r.json().get('access')
except Exception:
    token = None

headers = {'Authorization': f'Bearer {token}'} if token else {}
# Check programme exists
detail = s.get(f"{BASE}/api/programmes/6/", headers=headers)
print('programme detail status', detail.status_code)
if detail.status_code == 200:
    print('programme:', detail.json())

resp = s.get(REPORT, headers=headers, params={'format': 'pdf'})
print('status', resp.status_code)
print('content-type', resp.headers.get('Content-Type'))
print('content-length', len(resp.content))

if resp.status_code == 200 and resp.headers.get('Content-Type') == 'application/pdf':
    out = os.environ.get('REPORT_OUTPUT') or os.path.join(tempfile.gettempdir(), 'tmp_report.pdf')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'wb') as f:
        f.write(resp.content)
    print('saved', out)
else:
    print(resp.text)
