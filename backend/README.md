# NUC Accreditation System

A web-based accreditation and quality assurance management system for Nigerian universities, built to streamline the NUC (National Universities Commission) accreditation process.

---

## Project Status

| Component | Status |
|---|---|
| Backend API | ✅ Complete |
| Database | ✅ Connected (PostgreSQL) |
| Authentication | ✅ Complete |
| Frontend Scaffold | ✅ In Progress |

---

## Tech Stack

### Backend
- Python 3.13
- Django 5.2
- Django REST Framework
- PostgreSQL
- SimpleJWT (Authentication)
- django-cors-headers

### Frontend
- React 18
- Vite
- Axios
- React Router DOM

---

## Project Structure

```
nuc-accreditation/
├── backend/                        # Django REST API
│   ├── accounts/                   # Authentication & user roles
│   ├── programmes/                 # Programme & milestone management
│   ├── documents/                  # Evidence locker & file uploads
│   ├── notifications/              # Milestone alerts
│   ├── config/                     # Django settings & URLs
│   ├── requirements/
│   │   └── base.txt                # Python dependencies
│   └── manage.py
│
├── frontend/                       # React + Vite
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # Page components
│   │   ├── context/                # Auth context
│   │   ├── services/               # Axios API instance
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── utils/                  # Helper functions
│   │   └── styles/                 # Global CSS
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL
- Git

---

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/SultanAlabi/nuc-accreditation.git
cd nuc-accreditation/backend

# 2. Create and activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1

# Mac/Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements/base.txt

# 4. Create .env file in backend folder
# See Environment Variables section below

# 5. Run migrations
python manage.py migrate

# 6. Create superuser
python manage.py createsuperuser

# 7. Start server
python manage.py runserver
```

Backend runs at: `http://127.0.0.1:8000`
Admin panel: `http://127.0.0.1:8000/admin/`

---

### Frontend Setup

```bash
# Open a new terminal
cd nuc-accreditation/frontend

# 1. Install dependencies
npm install

# 2. Create .env file in frontend folder
# See Environment Variables section below

# 3. Start dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Environment Variables

### Backend — create `backend/.env`

```
SECRET_KEY=your-django-secret-key
DEBUG=True
DB_NAME=nuc_accreditation
DB_USER=nuc_user
DB_PASSWORD=your-database-password
DB_HOST=localhost
DB_PORT=5432
```

### Frontend — create `frontend/.env`

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register/` | No | Register new user |
| POST | `/api/auth/login/` | No | Login, returns token + user |
| POST | `/api/auth/logout/` | Yes | Logout |
| GET | `/api/auth/me/` | Yes | Get current user |
| POST | `/api/auth/token/refresh/` | No | Refresh JWT token |

#### Register
```json
POST /api/auth/register/
{
    "first_name": "Sultan",
    "last_name": "Alabi",
    "email": "sultan@university.edu.ng",
    "password": "password123",
    "role": "HOD",
    "staff_id": "STF001",
    "university": "University of Lagos",
    "department": "Computer Science",
    "faculty": "Science"
}
```

#### Login
```json
POST /api/auth/login/
{
    "email": "sultan@university.edu.ng",
    "password": "password123"
}
```

#### Response (both register and login)
```json
{
    "token": "eyJ0eXAiOiJKV1Qi...",
    "user": {
        "id": 1,
        "first_name": "Sultan",
        "last_name": "Alabi",
        "email": "sultan@university.edu.ng",
        "role": "HOD",
        "staff_id": "STF001",
        "university": "University of Lagos",
        "department": "Computer Science",
        "faculty": "Science"
    }
}
```

---

### Programmes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/programmes/` | Yes | List all programmes |
| POST | `/api/programmes/` | Yes | Create programme |
| GET | `/api/programmes/{id}/` | Yes | Get single programme |
| PUT | `/api/programmes/{id}/` | Yes | Update programme |
| DELETE | `/api/programmes/{id}/` | Yes | Delete programme |

---

### Milestones

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/programmes/{id}/milestones/` | Yes | List milestones |
| POST | `/api/programmes/{id}/milestones/` | Yes | Add milestone |
| GET | `/api/milestones/{id}/` | Yes | Get milestone |
| PUT | `/api/milestones/{id}/` | Yes | Update milestone |
| DELETE | `/api/milestones/{id}/` | Yes | Delete milestone |

---

### Documents

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/programmes/{id}/documents/` | Yes | List documents |
| POST | `/api/programmes/{id}/documents/` | Yes | Upload document |
| GET | `/api/documents/{id}/` | Yes | Get document |
| DELETE | `/api/documents/{id}/` | Yes | Delete document |
| PUT | `/api/documents/{id}/verify/` | Yes | Verify document |

---

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications/` | Yes | Get notifications |
| PUT | `/api/notifications/{id}/read/` | Yes | Mark as read |

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_token>
```

Token is returned on login and register. Access token expires after **1 hour**. Use the refresh endpoint to get a new one.

---

## User Roles

| Role | Description |
|---|---|
| `HOD` | Head of Department — manages programmes and uploads documents |
| `APU` | APU Officer — reviews and verifies accreditation submissions |
| `NUC_VISITOR` | NUC Visitor — read-only access to all data |

---

## Development Sprints

| Sprint | Focus | Status |
|---|---|---|
| Sprint 1 | Project setup, folder structure, Git | ✅ Complete |
| Sprint 2 | User authentication, JWT, roles | ✅ Complete |
| Sprint 3 | Programme and Milestone management | ✅ Complete |
| Sprint 4 | Document upload and verification | ✅ Complete |
| Sprint 5 | Notifications system | ✅ Complete |
| Sprint 6 | Admin panel, cleanup, documentation | ✅ Complete |
| Sprint 7 | Frontend scaffold, API integration | ✅ Complete |

---

## Contributing (Frontend Developer)

1. Clone the repo:
```bash
git clone https://github.com/SultanAlabi/nuc-accreditation.git
```

2. Go into frontend:
```bash
cd nuc-accreditation/frontend
npm install
```

3. Create your `.env` file:
```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

4. Start the dev server:
```bash
npm run dev
```

5. The Axios instance in `src/services/api.js` is already configured to attach the Bearer token to every request automatically.

---

## Author

Sultan Alabi — Final Year Project
Salisu Abdussamad Ramadan - Final Year Project