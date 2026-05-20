# NUC Accreditation Backend API

A robust, web-based quality assurance and accreditation management backend system for Nigerian universities, designed to streamline the National Universities Commission (NUC) accreditation workflows. Built with Django and Django REST Framework.

---

## 🚀 Key Features & Completed Systems

- **User Authentication & Management**: Standard JWT authentication with role-based permissions (`HOD`, `APU`, `NUC_VISITOR`).
- **Comprehensive User Settings**: Secure profile updates, password change, notification preference controls, and account deactivation views.
- **Accreditation Programmes & Milestones**: Track progress, calculate staff-student and facility ratios automatically against NUC standards, and toggle status.
- **Evidence Locker / Document System**: 
  - Programme-specific uploads.
  - A global, fully filterable and searchable evidence locker.
  - Multi-role verification workflows.
- **Milestone Notification Center**: Track real-time alerts, dismiss notifications, or mark all as read.
- **Dashboard KPI Services**: Instantly aggregates university readiness index and accreditation counts.
- **Team Management Portal**: Add team members, manage active/revoked access levels, and invite new users.

---

## 🛠 Tech Stack

- **Core**: Python 3.13 / Django 6.0
- **Framework**: Django REST Framework (DRF)
- **Database**: PostgreSQL (connected)
- **Auth**: SimpleJWT (JSON Web Token)
- **CORS**: django-cors-headers

---

## 📁 Project Structure

```
backend/
├── accounts/                   # Auth, Roles, and Settings
├── programmes/                 # Programme, Milestone, and Standards Calculators
├── documents/                  # Evidence Locker, Uploads, and Verification
├── notifications/              # Alerts, Dismiss, and Mark All Read
├── dashboard/                  # Aggregate KPI statistics
├── team/                       # Team Panel Members and Invitations
├── config/                     # Core settings & project routing
├── requirements/               # Python dependencies
└── manage.py
```

---

## 💻 Backend Setup & Installation

### Prerequisites
- Python 3.10+
- PostgreSQL
- pip & virtualenv

### Quick Start
```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Mac/Linux
source venv/bin/activate

# 3. Install required Python packages
pip install -r requirements/base.txt

# 4. Set up environment variables (.env)
# Create a .env file inside backend/ directory (see template below)

# 5. Generate and apply database migrations
python manage.py makemigrations accounts team
python manage.py migrate

# 6. Create an administrator (super-user)
python manage.py createsuperuser

# 7. Start the development server
python manage.py runserver
```

The server runs on **`http://127.0.0.1:8000/`**.  
The Django Admin panel is accessible at **`http://127.0.0.1:8000/admin/`**.

---

## 🔒 Environment Variables (`backend/.env`)

```ini
SECRET_KEY=your-django-secret-key
DEBUG=True
DB_NAME=nuc_accreditation
DB_USER=nuc_user
DB_PASSWORD=your-database-password
DB_HOST=localhost
DB_PORT=5432
```

---

## 🔌 API Reference & Endpoints

All protected endpoints require a `Bearer <token>` inside the `Authorization` header.

### 🔑 Authentication & Profiles

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register/` | No | Register new user |
| POST | `/api/auth/login/` | No | Obtain JWT token + user details |
| POST | `/api/auth/logout/` | Yes | Invalidate user session |
| GET | `/api/auth/me/` | Yes | Get currently logged-in user profile |
| PATCH | `/api/auth/profile/` | Yes | Update user profile fields |
| POST | `/api/auth/change-password/` | Yes | Secure password change view |
| PATCH | `/api/auth/preferences/` | Yes | Update SMS & Email notification preferences |
| DELETE | `/api/auth/account/` | Yes | Deactivate currently logged-in user account |
| POST | `/api/auth/token/refresh/` | No | Refresh JWT access token |

---

### 📋 Programme Management

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/programmes/` | Yes | List all programmes |
| POST | `/api/programmes/` | Yes | Create a new programme (HOD) |
| GET | `/api/programmes/{id}/` | Yes | Retrieve details of a programme |
| PATCH | `/api/programmes/{id}/` | Yes | Partially update programme |
| DELETE | `/api/programmes/{id}/` | Yes | Delete programme |
| GET | `/api/programmes/{id}/ratio/` | Yes | Compute student-staff ratios |
| GET | `/api/programmes/calculator/` | Yes | Interactive ratio calculator utility |
| GET | `/api/programmes/standards/` | Yes | Fetch NUC accreditation standards guidelines |

---

### 🎓 Milestone & Task Management

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/programmes/{pid}/milestones/` | Yes | List milestones for a programme |
| POST | `/api/programmes/{pid}/milestones/` | Yes | Add a new milestone |
| GET | `/api/programmes/milestones/{id}/` | Yes | Retrieve single milestone details |
| PATCH | `/api/programmes/milestones/{id}/` | Yes | Update milestone (mark status as COMPLETED) |
| DELETE | `/api/programmes/milestones/{id}/` | Yes | Delete milestone |

---

### 📂 Evidence Locker (Documents)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/documents/` | Yes | **Global list** of all documents across all programmes (Evidence Locker) |
| GET | `/api/programmes/{pid}/documents/` | Yes | List documents uploaded for a specific programme |
| POST | `/api/programmes/{pid}/documents/` | Yes | Upload document for a specific programme (HOD) |
| GET | `/api/documents/{id}/` | Yes | Retrieve single document details |
| PATCH | `/api/documents/{id}/` | Yes | Edit document metadata |
| PATCH | `/api/documents/{id}/verify/` | Yes | **Verify document status** to `VERIFIED` (APU Officer only) |
| DELETE | `/api/documents/{id}/` | Yes | Delete document (HOD only) |

---

### 🔔 Milestone Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications/` | Yes | Retrieve user notifications (supports read/unread filtering) |
| PATCH | `/api/notifications/{id}/read/` | Yes | Mark a single notification as read |
| DELETE | `/api/notifications/{id}/` | Yes | **Dismiss/Delete** a notification |
| POST | `/api/notifications/mark-all-read/` | Yes | **Mark all** user notifications as read in bulk |

---

### 📊 Dashboard Summary KPI

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/summary/` | Yes | Returns overall university readiness index and document stats |

---

### 👥 Team Portal

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/team/members/` | Yes | List all team members & observer profiles |
| POST | `/api/team/members/` | Yes | Add new member (HOD or APU) |
| PATCH | `/api/team/members/{id}/` | Yes | Update status (ACTIVE/REVOKED) or access privileges |
| DELETE | `/api/team/members/{id}/` | Yes | Remove team member |
| POST | `/api/team/invites/` | Yes | Send team invitation to email |

---

## 👥 Authors

- Sultan Alabi — Final Year Project
- Salisu Abdussamad Ramadan — Final Year Project