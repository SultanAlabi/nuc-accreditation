# NUC Accreditation System - Installation Guide

This guide provides step-by-step instructions to set up both the backend (Django) and frontend (React/Vite) of the NUC Accreditation System on your local development machine.

## Prerequisites

Ensure you have the following installed on your system:
- **Python**: Version 3.10 or higher.
- **Node.js**: Version 18 or higher.
- **npm** or **yarn**: Comes with Node.js.
- **PostgreSQL**: Ensure the database service is running and you have created a database for the project.

---

## 1. Backend Setup (Django)

The backend is built with Python 3.13, Django 6.0, and Django REST Framework.

### Step 1: Navigate to the backend directory
Open your terminal or command prompt and navigate to the backend folder:
```bash
cd backend
```

### Step 2: Create and activate a virtual environment
It's highly recommended to use a virtual environment to manage your Python dependencies.

```bash
# Create virtual environment
python -m venv venv

# Activate it (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Activate it (Mac/Linux)
source venv/bin/activate
```

### Step 3: Install Python dependencies
Install the required packages using pip:
```bash
pip install -r requirements/base.txt
```

### Step 4: Configure environment variables
Create a `.env` file in the `backend/` directory with the following variables, replacing the database credentials with your own:

```ini
SECRET_KEY=your-django-secret-key
DEBUG=True
DB_NAME=nuc_accreditation
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
```

### Step 5: Run Database Migrations
Apply the initial database schema:
```bash
python manage.py makemigrations accounts team
python manage.py migrate
```

### Step 6: Create an administrator account
Create a superuser to access the Django admin interface:
```bash
python manage.py createsuperuser
```
Follow the prompts to enter a username, email, and password.

### Step 7: Start the development server
Start the Django development server:
```bash
python manage.py runserver
```
The backend API is now running at `http://127.0.0.1:8000/`.
The Django Admin panel is accessible at `http://127.0.0.1:8000/admin/`.

---

## 2. Frontend Setup (React/Vite)

The frontend is a modern SPA built with React 18, Vite, and React Router v6.

### Step 1: Navigate to the frontend directory
Open a **new terminal window** and navigate to the frontend folder:
```bash
cd frontend
```

### Step 2: Install dependencies
Install the required Node packages:
```bash
npm install
```

### Step 3: Configure environment variables
Create a `.env` file in the `frontend/` directory to tell the React app where to find the backend API:

```ini
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

### Step 4: Start the development server
Start the Vite development server:
```bash
npm run dev
```

The frontend client will boot up and be accessible locally at `http://localhost:5173`.

---

## Summary
You should now have:
- The Django Backend running on `http://127.0.0.1:8000/`
- The React Frontend running on `http://localhost:5173/`

You can visit the frontend URL in your browser and start interacting with the NUC Accreditation System!
