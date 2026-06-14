import requests
import os
import tempfile

BASE = 'http://127.0.0.1:8000'
LOGIN = BASE + '/api/auth/login/'
UPLOAD = BASE + '/api/programmes/6/documents/'

creds = {
    'email': os.environ.get('TEST_HOD_EMAIL', 'testhod@example.com'),
    'password': os.environ.get('TEST_HOD_PASSWORD', 'change-me-placeholder'),
}

TEST_FILE = os.environ.get('TEST_UPLOAD_FILE') or os.path.join(tempfile.gettempdir(), 'test-doc.docx')

# Ensure a tiny test file exists outside the repository.
if not os.path.exists(TEST_FILE):
    os.makedirs(os.path.dirname(TEST_FILE), exist_ok=True)
    with open(TEST_FILE, 'wb') as f:
        f.write(b"Test doc content")

s = requests.Session()
r = s.post(LOGIN, json=creds)
print('login', r.status_code, r.text)
if r.status_code != 200:
    raise SystemExit('login failed')

try:
    token = r.json().get('token')
except Exception:
    token = None

if not token:
    token = r.json().get('access')

print('token:', token)
headers = {'Authorization': f'Bearer {token}'} if token else {}

with open(TEST_FILE, 'rb') as fh:
    files = {'file': (os.path.basename(TEST_FILE), fh, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
    data = {'file_name': os.path.basename(TEST_FILE), 'category': 'lesson_notes'}
    r = s.post(UPLOAD, headers=headers, files=files, data=data)
    print('upload', r.status_code, r.text)

# Cleanup temporary test file if we created it
# (leave it if user prefers)

