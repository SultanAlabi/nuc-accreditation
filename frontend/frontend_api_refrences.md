# NUC AccreditMS — Frontend API Reference
## For Frontend Developer

---

## Base URL
```
http://127.0.0.1:8000
```

## Authentication
All protected endpoints require this header:
```
Authorization: Bearer <access_token>
```

Token is returned on login and register. Store it in localStorage:
```javascript
localStorage.setItem('access_token', response.data.token)
```

---

## Axios Instance Setup
```javascript
// src/services/api.js
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

## User Roles
| Role Value | Description |
|---|---|
| `HOD` | Head of Department |
| `APU` | APU Officer |
| `NUC_VISITOR` | NUC Visitor |

---

---

# AUTHENTICATION ENDPOINTS

---

## Register
```
POST /api/auth/register/
```
**No auth required**

**Request Body:**
```json
{
    "first_name": "Sultan",
    "last_name": "Alabi",
    "email": "sultan@university.edu.ng",
    "password": "password123",
    "role": "HOD",
    "staff_id": "STF001",
    "university": "Fountain University",
    "department": "Computer Science",
    "faculty": "Science"
}
```

**Response 201:**
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
        "university": "Fountain University",
        "department": "Computer Science",
        "faculty": "Science"
    }
}
```

**Fields by role:**
| Field | HOD | APU | NUC_VISITOR |
|---|---|---|---|
| first_name | Required | Required | Required |
| last_name | Required | Required | Required |
| email | Required | Required | Required |
| password | Required | Required | Required |
| staff_id | Required | Required | Required |
| university | Required | Required | Optional |
| department | Required | Optional | Optional |
| faculty | Required | Optional | Optional |

---

## Login
```
POST /api/auth/login/
```
**No auth required**

**Request Body:**
```json
{
    "email": "sultan@university.edu.ng",
    "password": "password123"
}
```

**Response 200:**
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
        "university": "Fountain University",
        "department": "Computer Science",
        "faculty": "Science"
    }
}
```

**Error 401:**
```json
{ "error": "Invalid email or password" }
```

---

## Get Current User
```
GET /api/auth/me/
```
**Auth required**

**Response 200:**
```json
{
    "id": 1,
    "first_name": "Sultan",
    "last_name": "Alabi",
    "email": "sultan@university.edu.ng",
    "role": "HOD",
    "staff_id": "STF001",
    "university": "Fountain University",
    "department": "Computer Science",
    "faculty": "Science"
}
```

---

## Logout
```
POST /api/auth/logout/
```
**Auth required**

**Response 200:**
```json
{ "message": "Logged out successfully" }
```

---

---

# PROGRAMME ENDPOINTS

---

## Get All Programmes
```
GET /api/programmes/
```
**Auth required — All roles**

**Filters (query params):**
```
/api/programmes/?status=PENDING
/api/programmes/?status=IN_REVIEW
/api/programmes/?status=FORWARDED_TO_NUC
/api/programmes/?status=ACCREDITED
/api/programmes/?status=DENIED
/api/programmes/?faculty=Science
/api/programmes/?department=Computing
```

**Use by role:**
```javascript
// HOD — see their pending programmes
GET /api/programmes/?status=PENDING

// APU — see programmes ready for review
GET /api/programmes/?status=IN_REVIEW

// NUC — see programmes forwarded to them
GET /api/programmes/?status=FORWARDED_TO_NUC
```

**Response 200:**
```json
[
    {
        "id": 1,
        "name": "Computer Science",
        "department": "Computing",
        "faculty": "Science",
        "status": "PENDING",
        "student_count": 200,
        "staff_count": 15,
        "created_by": 1,
        "created_at": "2026-05-12T10:00:00Z",
        "updated_at": "2026-05-12T10:00:00Z",
        "milestones": []
    }
]
```

---

## Create Programme
```
POST /api/programmes/
```
**Auth required — HOD only**

**Request Body:**
```json
{
    "name": "Computer Science",
    "department": "Computing",
    "faculty": "Science",
    "student_count": 200,
    "staff_count": 15
}
```

**Response 201:**
```json
{
    "id": 1,
    "name": "Computer Science",
    "department": "Computing",
    "faculty": "Science",
    "status": "PENDING",
    "student_count": 200,
    "staff_count": 15,
    "created_by": 1,
    "created_at": "2026-05-12T10:00:00Z",
    "updated_at": "2026-05-12T10:00:00Z",
    "milestones": []
}
```

**Error 403 (wrong role):**
```json
{ "detail": "You do not have permission to perform this action." }
```

---

## Get Single Programme
```
GET /api/programmes/{id}/
```
**Auth required — All roles**

---

## Update Programme
```
PUT /api/programmes/{id}/
PATCH /api/programmes/{id}/
```
**Auth required — HOD and APU only**

---

## Delete Programme
```
DELETE /api/programmes/{id}/
```
**Auth required — HOD only**

---

## Submit Programme to APU
```
POST /api/programmes/{id}/submit/
```
**Auth required — HOD only**
**Programme must be in PENDING status**

**No body required**

**Response 200:**
```json
{
    "message": "Programme submitted for APU review.",
    "status": "IN_REVIEW"
}
```

**Error — wrong status:**
```json
{ "error": "Only PENDING programmes can be submitted." }
```

**Frontend — show this button when:**
```javascript
user.role === 'HOD' && programme.status === 'PENDING'
```

---

## Forward Programme to NUC
```
POST /api/programmes/{id}/forward/
```
**Auth required — APU only**
**Programme must be IN_REVIEW**

**No body required**

**Response 200:**
```json
{
    "message": "Programme forwarded to NUC.",
    "status": "FORWARDED_TO_NUC"
}
```

**Frontend — show this button when:**
```javascript
user.role === 'APU' && programme.status === 'IN_REVIEW'
```

---

## NUC Final Decision
```
POST /api/programmes/{id}/decision/
```
**Auth required — NUC_VISITOR only**
**Programme must be FORWARDED_TO_NUC**

**Request Body:**
```json
{
    "decision": "ACCREDITED",
    "comments": "All requirements met satisfactorily."
}
```

**decision must be:** `ACCREDITED` or `DENIED`

**Response 200:**
```json
{
    "message": "Programme ACCREDITED.",
    "status": "ACCREDITED",
    "comments": "All requirements met satisfactorily."
}
```

**Frontend — show these buttons when:**
```javascript
user.role === 'NUC_VISITOR' && programme.status === 'FORWARDED_TO_NUC'
```

---

## Programme Status Flow
```
PENDING
   ↓  (HOD clicks Submit)
IN_REVIEW
   ↓  (APU clicks Forward to NUC)
FORWARDED_TO_NUC
   ↓  (NUC makes decision)
ACCREDITED or DENIED
```

---

---

# MILESTONE ENDPOINTS

---

## Get Milestones for Programme
```
GET /api/programmes/{id}/milestones/
```
**Auth required — All roles**

**Response 200:**
```json
[
    {
        "id": 1,
        "programme": 1,
        "title": "Submit Course Materials",
        "description": "All course materials must be submitted",
        "due_date": "2026-08-01",
        "status": "PENDING",
        "created_at": "2026-05-12T10:00:00Z"
    }
]
```

---

## Add Milestone
```
POST /api/programmes/{id}/milestones/
```
**Auth required — HOD and APU only**

**Request Body:**
```json
{
    "programme": 1,
    "title": "Submit Course Materials",
    "description": "All course materials must be submitted",
    "due_date": "2026-08-01"
}
```

---

## Update Milestone
```
PUT /api/milestones/{id}/
PATCH /api/milestones/{id}/
```
**Auth required — HOD and APU only**

---

## Delete Milestone
```
DELETE /api/milestones/{id}/
```
**Auth required — HOD only**

---

---

# DOCUMENT ENDPOINTS

---

## Get Documents for Programme
```
GET /api/programmes/{id}/documents/
```
**Auth required — All roles**

**Response 200:**
```json
[
    {
        "id": 1,
        "programme": 1,
        "uploaded_by": 1,
        "title": "Curriculum 2024",
        "category": "CURRICULUM",
        "file": "/media/documents/curriculum.pdf",
        "status": "PENDING",
        "notes": "",
        "uploaded_at": "2026-05-12T10:00:00Z"
    }
]
```

---

## Upload Document
```
POST /api/programmes/{id}/documents/
```
**Auth required — HOD only**
**Content-Type: multipart/form-data**

**Form fields:**
```
title      = Curriculum 2024
category   = CURRICULUM
programme  = 1
file       = [file upload]
```

**Category options:**
```
CURRICULUM
STAFF_LIST
FACILITY
FINANCIAL
OTHER
```

**Frontend example:**
```javascript
const formData = new FormData()
formData.append('title', title)
formData.append('category', category)
formData.append('programme', programmeId)
formData.append('file', fileInput)

await api.post(`/api/programmes/${id}/documents/`, formData, {
    // Do not set Content-Type manually. Let the browser/axios set the correct
    // Content-Type (including the multipart boundary) automatically.
})
```

---

## Verify Document
```
PUT /api/documents/{id}/verify/
```
**Auth required — APU only**

**No body required**

**Response 200:**
```json
{
    "id": 1,
    "status": "VERIFIED",
    ...
}
```

**Frontend — show verify button when:**
```javascript
user.role === 'APU' && document.status === 'PENDING'
```

---

## Delete Document
```
DELETE /api/documents/{id}/
```
**Auth required — HOD only**

---

---

# RATIO CALCULATOR ENDPOINTS

---

## Manual Ratio Calculation
```
POST /api/programmes/calculator/
```
**Auth required — All roles**

**Request Body:**
```json
{
    "student_count": 200,
    "staff_count": 10,
    "faculty_type": "SCIENCE"
}
```

**Faculty type options:**
```
SCIENCE
ARTS
ENGINEERING
MEDICINE
LAW
SOCIAL_SCIENCE
EDUCATION
```

**Response 200 — Compliant:**
```json
{
    "actual_ratio": 13.33,
    "max_allowed_ratio": 15,
    "faculty_type": "Science",
    "compliant": true,
    "status": "COMPLIANT",
    "message": "Ratio of 1:13.33 meets NUC standard of 1:15.",
    "staff_needed": 0
}
```

**Response 200 — Non-Compliant:**
```json
{
    "actual_ratio": 25.0,
    "max_allowed_ratio": 15,
    "faculty_type": "Science",
    "compliant": false,
    "status": "NON_COMPLIANT",
    "message": "Ratio of 1:25.0 exceeds NUC maximum of 1:15. More staff required.",
    "staff_needed": 4
}
```

---

## Get NUC Standards Reference
```
GET /api/programmes/standards/
```
**Auth required — All roles**

**Response 200:**
```json
[
    {
        "faculty_type": "SCIENCE",
        "label": "Science",
        "max_ratio": 15,
        "description": "Maximum 1 staff to 15 students"
    },
    {
        "faculty_type": "ARTS",
        "label": "Arts/Humanities",
        "max_ratio": 20,
        "description": "Maximum 1 staff to 20 students"
    },
    {
        "faculty_type": "ENGINEERING",
        "label": "Engineering",
        "max_ratio": 10,
        "description": "Maximum 1 staff to 10 students"
    },
    {
        "faculty_type": "MEDICINE",
        "label": "Medicine",
        "max_ratio": 5,
        "description": "Maximum 1 staff to 5 students"
    }
]
```

---

## Calculate Ratio for Existing Programme
```
GET /api/programmes/{id}/ratio/?faculty_type=SCIENCE
```
**Auth required — All roles**

**Response 200:**
```json
{
    "actual_ratio": 13.33,
    "max_allowed_ratio": 15,
    "faculty_type": "Science",
    "compliant": true,
    "status": "COMPLIANT",
    "message": "Ratio of 1:13.33 meets NUC standard of 1:15.",
    "staff_needed": 0,
    "programme": "Computer Science",
    "department": "Computing"
}
```

---

---

# NOTIFICATION ENDPOINTS

---

## Get Notifications
```
GET /api/notifications/
```
**Auth required — All roles**
**Returns only notifications for the logged in user**

**Response 200:**
```json
[
    {
        "id": 1,
        "user": 1,
        "milestone": null,
        "type": "STATUS_CHANGE",
        "message": "Programme 'Computer Science' submitted for review.",
        "is_read": false,
        "created_at": "2026-05-12T10:00:00Z"
    }
]
```

**Notification types:**
```
MILESTONE_DUE
STATUS_CHANGE
DOCUMENT_VERIFIED
```

---

## Mark Notification as Read
```
PUT /api/notifications/{id}/read/
```
**Auth required — All roles**

**No body required**

**Response 200:**
```json
{
    "id": 1,
    "is_read": true,
    ...
}
```

---

---

# ROLE-BASED UI GUIDE

## What each role sees and can do

### HOD Dashboard
```javascript
// Show:
- Their programmes (filter by created_by or status=PENDING)
- Upload document button
- Submit for review button (when status=PENDING)
- Notifications

// Hide:
- Verify document button
- Forward to NUC button
- NUC decision buttons
```

### APU Dashboard
```javascript
// Show:
- Programmes in review (status=IN_REVIEW)
- Verify document button
- Forward to NUC button (when status=IN_REVIEW)
- Notifications

// Hide:
- Create programme button
- Upload document button
- NUC decision buttons
```

### NUC Visitor Dashboard
```javascript
// Show:
- Programmes forwarded to NUC (status=FORWARDED_TO_NUC)
- Accredit button
- Deny button
- Notifications
- Read-only view of all documents

// Hide:
- Create programme button
- Upload document button
- Verify document button
- Submit/Forward buttons
```

---

---

# ERROR RESPONSES

| Status Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created successfully |
| 204 | Deleted successfully |
| 400 | Bad request — check your input |
| 401 | Unauthorized — no token or expired token |
| 403 | Forbidden — wrong role |
| 404 | Not found |
| 500 | Server error |

---

# QUICK REFERENCE

| Action | Method | Endpoint | Role |
|---|---|---|---|
| Register | POST | /api/auth/register/ | Any |
| Login | POST | /api/auth/login/ | Any |
| Get current user | GET | /api/auth/me/ | Any |
| List programmes | GET | /api/programmes/ | Any |
| Create programme | POST | /api/programmes/ | HOD |
| Submit to APU | POST | /api/programmes/{id}/submit/ | HOD |
| Forward to NUC | POST | /api/programmes/{id}/forward/ | APU |
| NUC decision | POST | /api/programmes/{id}/decision/ | NUC |
| Add milestone | POST | /api/programmes/{id}/milestones/ | HOD/APU |
| Upload document | POST | /api/programmes/{id}/documents/ | HOD |
| Verify document | PUT | /api/documents/{id}/verify/ | APU |
| Calculate ratio | POST | /api/programmes/calculator/ | Any |
| NUC standards | GET | /api/programmes/standards/ | Any |
| Get notifications | GET | /api/notifications/ | Any |
| Mark read | PUT | /api/notifications/{id}/read/ | Any |