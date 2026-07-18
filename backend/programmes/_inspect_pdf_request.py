import requests
login_url='http://127.0.0.1:8000/api/auth/login/'
report_pdf='http://127.0.0.1:8000/api/programmes/1/report/?format=pdf'
cred={'email':'alabisultan28@gmail.com','password':'Gbollyboy04'}
s=requests.Session()
r=s.post(login_url,data=cred)
print('login',r.status_code)
if r.status_code!=200:
    print(r.text)
    raise SystemExit(1)
token=r.json().get('token')
headers={'Authorization':f'Bearer {token}'}
r3=s.get(report_pdf,headers=headers)
print('pdf status',r3.status_code)
print('sent headers:')
for k,v in r3.request.headers.items():
    print(k,':',v)
print('\nresponse headers:')
for k,v in r3.headers.items():
    print(k,':',v)
print('\nresponse body snippet', r3.text[:200])
