import requests

url = 'http://127.0.0.1:8000/api/programmes/1/documents/'
files = {
    'file': ('test.txt', b'hello test', 'text/plain')
}
data = {
    'file_name': 'test.txt',
    'category': 'OTHER'
}

try:
    r = requests.post(url, files=files, data=data, timeout=10)
    print('status:', r.status_code)
    print('headers:', r.headers)
    print('body:', r.text)
except Exception as e:
    print('error:', e)
