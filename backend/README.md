# NUC Accreditation System — Backend Documentation

## Project Overview

The NUC Accreditation System is a web application that helps Nigerian universities manage
their programme accreditation process with the National Universities Commission (NUC).
This backend is built with Django and Django REST Framework, backed by a PostgreSQL database.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Python 3.13 | Programming language |
| Django 5.x | Web framework |
| Django REST Framework | API layer |
| PostgreSQL | Relational database |
| SimpleJWT | JWT authentication |
| django-cors-headers | Cross-origin resource sharing |
| python-dotenv | Environment variable management |

---

## Project Structure

```
backend/
├── config/                  # Django project settings
│   ├── settings.py          # All configuration (DB, auth, apps)
│   ├── urls.py              # Root URL routing
│   ├── wsgi.py
│   └── asgi.py
├── accounts/                # User authentication & roles
│   ├── models.py            # Custom User model
│   ├── serializers.py       # User serializers
│   ├── views.py             # Register, profile views
│   ├── admin.py             # Admin registration
│   └── urls.py              # Auth URL patterns
├── programmes/              # Core accreditation logic
│   ├── models.py            # Programme, Milestone models
│   ├── serializers.py
│   ├── views.py             # CRUD views
│   ├── admin.py
│   └── urls.py
├── documents/               # Evidence Locker
│   ├── models.py            # Document model
│   ├── serializers.py
│   ├── views.py             # Upload, verify views
│   ├── admin.py
│   └── urls.py
├── notifications/           # Milestone alerts
│   ├── models.py            # Notification model
│   ├── serializers.py
│   ├── views.py
│   ├── admin.py
│   └── urls.py
├── media/                   # Uploaded document files
├── requirements/
│   └── base.txt             # Python dependencies
├── .env                     # Environment variables (not in git)
└── manage.py
```

---

## Database Models

### User (accounts app)

Extends Django's AbstractUser with a role field.

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

Represents an academic programme seeking accreditation.

```python
Fields:
- id            : Auto primary key
- name          : Programme name (e.g. Computer Science)
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

A deadline or checkpoint within a programme's accreditation journey.

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

Evidence files uploaded as part of accreditation.

```python
Fields:
- id          : Auto primary key
- programme   : FK → Programme
- uploaded_by : FK → User
- title       : Document title
- category    : CURRICULUM | STAFF_LIST | FACILITY | FINANCIAL | OTHER
- file        : Uploaded file path (stored in media/documents/)
- status      : PENDING | VERIFIED | REJECTED
- notes       : Optional reviewer notes
- uploaded_at : Timestamp
```

### Notification (notifications app)

Alerts sent to users about milestones and status changes.

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

#### Register Request Example
```json
POST /api/auth/register/
{
    "email": "hod@university.edu.ng",
    "username": "hod_user",
    "password": "securepassword",
    "role": "HOD",
    "department": "Computer Science"
}
```

#### Login Request Example
```json
POST /api/auth/login/
{
    "email": "hod@university.edu.ng",
    "password": "securepassword"
}
```

#### Login Response Example
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGci...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGci..."
}
```

---

### Programmes

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | /api/programmes/ | Yes | List all programmes |
| POST | /api/programmes/ | Yes | Create a new programme |
| GET | /api/programmes/{id}/ | Yes | Get a single programme |
| PUT | /api/programmes/{id}/ | Yes | Update a programme |
| DELETE | /api/programmes/{id}/ | Yes | Delete a programme |

#### Create Programme Example
```json
POST /api/programmes/
Authorization: Bearer <access_token>

{
    "name": "Computer Science",
    "department": "Computing",
    "faculty": "Science and Technology",
    "student_count": 200,
    "staff_count": 15
}
```

---

### Milestones

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | /api/programmes/{id}/milestones/ | Yes | List milestones for a programme |
| POST | /api/programmes/{id}/milestones/ | Yes | Add a milestone |
| GET | /api/milestones/{id}/ | Yes | Get a single milestone |
| PUT | /api/milestones/{id}/ | Yes | Update a milestone |
| DELETE | /api/milestones/{id}/ | Yes | Delete a milestone |

#### Create Milestone Example
```json
POST /api/programmes/1/milestones/
Authorization: Bearer <access_token>

{
    "programme": 1,
    "title": "Submit Course Materials",
    "description": "All course materials must be submitted to NUC",
    "due_date": "2025-08-01"
}
```

---

### Documents

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | /api/programmes/{id}/documents/ | Yes | List documents for a programme |
| POST | /api/programmes/{id}/documents/ | Yes | Upload a document |
| GET | /api/documents/{id}/ | Yes | Get a single document |
| DELETE | /api/documents/{id}/ | Yes | Delete a document |
| PUT | /api/documents/{id}/verify/ | Yes | Verify a document |

#### Upload Document Example
```
POST /api/programmes/1/documents/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

title    = Curriculum 2024
category = CURRICULUM
programme = 1
file     = [PDF file]
```

---

### Notifications

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | /api/notifications/ | Yes | Get current user's notifications |
| PUT | /api/notifications/{id}/read/ | Yes | Mark notification as read |

---

## Authentication

The system uses JWT (JSON Web Token) authentication via `djangorestframework-simplejwt`.

- Access token lifetime: **1 hour**
- Refresh token lifetime: **7 days**

To authenticate requests, include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

When the access token expires, use the refresh endpoint to get a new one:

```json
POST /api/auth/token/refresh/
{
    "refresh": "<refresh_token>"
}
```

---

## Environment Variables

All sensitive configuration is stored in a `.env` file (never committed to Git).

```
SECRET_KEY=<django-secret-key>
DEBUG=True
DB_NAME=nuc_accreditation
DB_USER=nuc_user
DB_PASSWORD=<database-password>
DB_HOST=localhost
DB_PORT=5432
```

---

## Running the Project

```bash
# 1. Activate virtual environment
.\venv\Scripts\Activate.ps1    # Windows
source venv/bin/activate        # Mac/Linux

# 2. Install dependencies
pip install -r requirements/base.txt

# 3. Run migrations
python manage.py migrate

# 4. Create superuser
python manage.py createsuperuser

# 5. Start development server
python manage.py runserver
```

The API will be available at: `http://127.0.0.1:8000/`
The admin panel will be available at: `http://127.0.0.1:8000/admin/`

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