# NUC Accreditation System — Full Project Documentation

## Project Overview

The NUC Accreditation System is a web application that helps Nigerian universities manage
their programme accreditation process with the National Universities Commission (NUC).
The system is built as a full-stack application with a React frontend and Django REST
Framework backend, backed by a PostgreSQL database.

---

## Full Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Python 3.13 | Programming language |
| Django 5.x | Web framework |
| Django REST Framework | API layer |
| PostgreSQL | Relational database |
| SimpleJWT | JWT authentication |
| django-cors-headers | Cross-origin resource sharing |
| python-dotenv | Environment variable management |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| Axios | HTTP client for API calls |
| React Router DOM | Client-side routing |

---

## Full Project Structure

```
nuc-accreditation/
├── backend/                         # Django REST API
│   ├── config/                      # Django project settings
│   │   ├── settings.py              # All configuration
│   │   ├── urls.py                  # Root URL routing
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── accounts/                    # User authentication & roles
│   │   ├── models.py                # Custom User model
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── admin.py
│   │   └── urls.py
│   ├── programmes/                  # Core accreditation logic
│   │   ├── models.py                # Programme, Milestone models
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── admin.py
│   │   └── urls.py
│   ├── documents/                   # Evidence Locker
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── admin.py
│   │   └── urls.py
│   ├── notifications/               # Milestone alerts
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── admin.py
│   │   └── urls.py
│   ├── media/                       # Uploaded document files
│   ├── requirements/
│   │   └── base.txt                 # Python dependencies
│   ├── .env                         # Environment variables (not in git)
│   └── manage.py
│
├── frontend/                        # React + Vite
│   ├── public/
│   ├── src/
│   │   ├── assets/                  # Fonts, images, static files
│   │   ├── components/
│   │   │   ├── common/              # Reusable UI components
│   │   │   ├── dashboard/           # Dashboard components
│   │   │   ├── courses/             # Course components
│   │   │   ├── calculator/          # Ratio calculator
│   │   │   ├── documents/           # Evidence locker components
│   │   │   └── layout/              # Sidebar, Topbar, PageWrapper
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Courses.jsx
│   │   │   ├── CourseDetail.jsx
│   │   │   ├── Calculator.jsx
│   │   │   ├── Documents.jsx
│   │   │   └── Login.jsx
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── services/
│   │   │   └── api.js               # Axios instance + API calls
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Authentication context
│   │   ├── utils/                   # Helper functions
│   │   ├── styles/                  # Global CSS files
│   │   ├── App.jsx                  # Root component + routing
│   │   └── main.jsx
│   ├── .env                         # VITE_API_BASE_URL (not in git)
│   ├── .gitignore
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## How Frontend and Backend Connect

The frontend communicates with the backend through HTTP requests via Axios.

```
React (localhost:5173)          Django (localhost:8000)
        |                               |
        |  POST /api/auth/login/        |
        | ----------------------------> |
        |                               |
        |  { access: "token..." }       |
        | <---------------------------- |
        |                               |
        |  GET /api/programmes/         |
        |  Authorization: Bearer token  |
        | ----------------------------> |
        |                               |
        |  [ { id: 1, name: "CS" } ]   |
        | <---------------------------- |
```

### Axios Instance (services/api.js)

```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
```

---

## Running the Full Project

### Backend

```bash
# 1. Navigate to backend
cd backend

# 2. Activate virtual environment
.\venv\Scripts\Activate.ps1      # Windows
source venv/bin/activate          # Mac/Linux

# 3. Install dependencies
pip install -r requirements/base.txt

# 4. Run migrations
python manage.py migrate

# 5. Start server
python manage.py runserver
```

Backend runs at: `http://127.0.0.1:8000`

### Frontend

```bash
# Open a second terminal
cd frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Environment Variables

### Backend (.env inside backend/)
```
SECRET_KEY=<django-secret-key>
DEBUG=True
DB_NAME=nuc_accreditation
DB_USER=nuc_user
DB_PASSWORD=<database-password>
DB_HOST=localhost
DB_PORT=5432
```

### Frontend (.env inside frontend/)
```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## Database Models

### User (accounts app)

```python
Fields:
- id          : Auto primary key
- email       : Unique login identifier
- username    : Display name
- password    : Hashed password
- role        : HOD | APU | NUC_VISITOR
- department  : Department name
- phone       : Contact number
```

### Programme (programmes app)

```python
Fields:
- id            : Auto primary key
- name          : Programme name
- department    : Department it belongs to
- faculty       : Parent faculty
- status        : PENDING | IN_REVIEW | ACCREDITED | DENIED
- student_count : Total number of students
- staff_count   : Total number of academic staff
- created_by    : FK → User
- created_at    : Timestamp
- updated_at    : Timestamp
```

### Milestone (programmes app)

```python
Fields:
- id          : Auto primary key
- programme   : FK → Programme
- title       : Milestone name
- description : Details
- due_date    : Deadline date
- status      : PENDING | COMPLETED | OVERDUE
- created_at  : Timestamp
```

### Document (documents app)

```python
Fields:
- id          : Auto primary key
- programme   : FK → Programme
- uploaded_by : FK → User
- title       : Document title
- category    : CURRICULUM | STAFF_LIST | FACILITY | FINANCIAL | OTHER
- file        : Uploaded file path
- status      : PENDING | VERIFIED | REJECTED
- notes       : Optional reviewer notes
- uploaded_at : Timestamp
```

### Notification (notifications app)

```python
Fields:
- id          : Auto primary key
- user        : FK → User
- milestone   : FK → Milestone (optional)
- type        : MILESTONE_DUE | STATUS_CHANGE | DOCUMENT_VERIFIED
- message     : Notification text
- is_read     : Boolean (default False)
- created_at  : Timestamp
```

---

## User Roles & Permissions

| Role | Description | Access Level |
|---|---|---|
| HOD | Head of Department | Create/manage programmes, upload documents |
| APU | APU Officer | Review programmes, verify documents |
| NUC_VISITOR | NUC Visitor | Read-only access to all data |

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | /api/auth/register/ | No | Register a new user |
| POST | /api/auth/login/ | No | Login, returns JWT tokens |
| POST | /api/auth/token/refresh/ | No | Refresh access token |
| GET | /api/auth/profile/ | Yes | Get current user's profile |
| PUT | /api/auth/profile/ | Yes | Update current user's profile |

### Programmes

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | /api/programmes/ | Yes | List all programmes |
| POST | /api/programmes/ | Yes | Create a new programme |
| GET | /api/programmes/{id}/ | Yes | Get a single programme |
| PUT | /api/programmes/{id}/ | Yes | Update a programme |
| DELETE | /api/programmes/{id}/ | Yes | Delete a programme |

### Milestones

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | /api/programmes/{id}/milestones/ | Yes | List milestones |
| POST | /api/programmes/{id}/milestones/ | Yes | Add a milestone |
| GET | /api/milestones/{id}/ | Yes | Get a single milestone |
| PUT | /api/milestones/{id}/ | Yes | Update a milestone |
| DELETE | /api/milestones/{id}/ | Yes | Delete a milestone |

### Documents

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | /api/programmes/{id}/documents/ | Yes | List documents |
| POST | /api/programmes/{id}/documents/ | Yes | Upload a document |
| GET | /api/documents/{id}/ | Yes | Get a single document |
| DELETE | /api/documents/{id}/ | Yes | Delete a document |
| PUT | /api/documents/{id}/verify/ | Yes | Verify a document |

### Notifications

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | /api/notifications/ | Yes | Get user notifications |
| PUT | /api/notifications/{id}/read/ | Yes | Mark as read |

---

## Authentication Flow

1. User submits email and password on Login page
2. Frontend sends POST to `/api/auth/login/`
3. Backend validates credentials and returns JWT tokens
4. Frontend stores tokens in `localStorage`
5. Every subsequent request includes `Authorization: Bearer <token>`
6. Token expires after 1 hour — refresh token valid for 7 days

---

## Git & Version Control

Repository: `https://github.com/SultanAlabi/nuc-accreditation`

### Saving changes
```bash
git add .
git commit -m "describe your change"
git push
```

### For frontend developer — clone the repo
```bash
git clone https://github.com/SultanAlabi/nuc-accreditation.git
cd nuc-accreditation/frontend
npm install
npm run dev
```

---

## Sprint Summary

| Sprint | Focus | Status |
|---|---|---|
| Sprint 1 | Project setup, folder structure, Git | Complete |
| Sprint 2 | User authentication, JWT, roles | Complete |
| Sprint 3 | Programme and Milestone management | Complete |
| Sprint 4 | Document upload and verification | Complete |
| Sprint 5 | Notifications system | Complete |
| Sprint 6 | Admin panel, cleanup, documentation | Complete |
| Sprint 7 | Frontend scaffold, API integration | Complete |