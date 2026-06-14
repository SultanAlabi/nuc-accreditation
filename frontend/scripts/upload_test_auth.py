import os
import requests

BASE = 'http://127.0.0.1:8000'
LOGIN = BASE + '/api/auth/login/'
UPLOAD = BASE + '/api/programmes/1/documents/'

creds = {
    'email': os.environ.get('TEST_HOD_EMAIL', 'testhod@example.com'),
    'password': os.environ.get('TEST_HOD_PASSWORD', 'change-me-placeholder'),
}

s = requests.Session()
r = s.post(LOGIN, json=creds)
print('login', r.status_code, r.text)
if r.status_code != 200:
    raise SystemExit('login failed')

# token in response (API returns 'token')
try:
    token = r.json().get('token')
except Exception:
    token = None

if not token:
    # maybe DRF SimpleJWT returns access/refresh
    token = r.json().get('access')

print('token:', token)
headers = {'Authorization': f'Bearer {token}'} if token else {}

files = {'file': ('test.txt', b'hello authenticated', 'text/plain')}
data = {'file_name': 'test.txt', 'category': 'OTHER'}

r = s.post(UPLOAD, headers=headers, files=files, data=data)
print('upload', r.status_code, r.text)
