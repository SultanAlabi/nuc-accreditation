# NUC Accreditation Frontend

A premium, interactive, and responsive web application dashboard designed for Nigerian universities to track, manage, and submit accreditation records for National Universities Commission (NUC) reviews.

---

## 🎨 Premium User Experience Features

- **Dynamic KPI Dashboard**: Real-time university readiness calculations, active alerts count, and total accredited programmes stats.
- **Accreditation Tracker**: Interactive progress meters tracking every programme from resource compilation, department submission, APU review, all the way to final NUC verification.
- **Evidence Locker**: A centralized library for uploading and verifying critical accreditation files (course outlines, staff lists, facilities checklists) with bulk upload progress tracking.
- **Interactive Ratio Calculators**: Staff-to-Student and Space-to-Student calculators checking standards dynamically against official NUC guidelines.
- **Team Management Portal**: Invite reviewers, observer panel members, and manage roles dynamically with live access revoking.
- **Unified Notification Panel**: Dismissible real-time notification alerts for HOD submissions, verification approvals, or upcoming milestone deadlines.
- **Profile & Settings System**: Update user profiles, configure SMS & Email notification channels, change passwords, and deactivate accounts cleanly.
- **Password Recovery Flow**: A visually stunning, multi-step recovery wizard modal directly on the login page, featuring a secure 6-digit verification code system and automated in-browser debug assistant.

---

## 🛠 Tech Stack

- **Core**: React 18 & Vite (HMR enabled)
- **Styling**: Modern, responsive CSS with glassmorphic cards, CSS variables, sleek dark modes, and premium HSL color palettes.
- **Routing**: React Router DOM (v6) for seamless, smooth spa navigation.
- **Networking**: Axios (centralized API client with JWT automatic interceptors).
- **Authentication**: JWT token storage, persistence, and stateful User contexts.

---

## 📁 Directory Structure

```
frontend/
├── src/
│   ├── components/       # Reusable layout and interactive UI components
│   ├── pages/            # Core views: Dashboard, Programmes, Locker, Team, Settings, Notifications, Auth
│   ├── context/          # AuthContext for user state and token management
│   ├── services/         # api.js Centralized Axios configuration and service definitions
│   ├── hooks/            # useRole custom hook for permission rules
│   ├── utils/            # Helper functions (time utilities, standard mappings)
│   └── index.css         # Design tokens, variables, and global styles
├── index.html
├── package.json
└── README.md
```

---

## 💻 Frontend Setup & Startup

### Prerequisites
- Node.js 18+
- npm or yarn

### Quick Start
```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Configure environment variables (.env)
# Create a .env file inside frontend/ directory (see template below)

# 4. Run local development server
npm run dev
```

The frontend client will boot up and be accessible locally on: **`http://localhost:5173`**.

---

## 🔒 Environment Variables (`frontend/.env`)

Create a `.env` file in the `frontend/` directory to configure your backend API target:

```ini
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

---

## 🤝 API Service Layer Integration

The React app communicates with the backend via `src/services/api.js`. The client is equipped with automatic request/response interceptors to:
1. Automatically read the stored user token (`nuc_token`) and attach it as a `Bearer` token to all outgoing requests.
2. Intercept `401 Unauthorized` responses to cleanly log out invalid sessions and redirect back to `/login`.

The following services are mapped out of the box:
- **`authAPI`**: Register, Login, Logout, fetch current user info.
- **`programmesAPI`**: CRUD for academic programmes.
- **`milestonesAPI`**: Mark milestones as completed.
- **`documentsAPI`**: Fetch global library, upload programme files, verify evidence, or delete documents.
- **`notificationsAPI`**: Fetch alerts, mark single/all as read, dismiss.
- **`settingsAPI`**: Change password, preferences, profile edits, deactivation.
- **`teamAPI`**: Manage panel members and send team invites.

---

## 📋 Recent Changes (Changelog)

### June 14, 2026

#### Role System Updates
- **Navbar.jsx**: Updated role-based navigation links to use `APU` instead of `APU_OFFICER` for consistency with backend role naming.

#### Status Flow Changes
- **accreditation.js**: Updated `STATUS_CONFIG` to reflect new accreditation workflow:
  - `PENDING` → "Pending"
  - `IN_REVIEW` → "In Review" (replaces "APPROVED")
  - `FORWARDED_TO_NUC` → "Forwarded to NUC" (replaces "RESOURCE")
  - `ACCREDITED` → "Accredited"
  - `DENIED` → "Denied" (replaces "REACCREDIT")
- **CourseDetail.jsx** & **Courses.jsx**: Updated `STATUS_FLOW` array to match new status workflow.

#### Notification System Improvements
- **Notification.jsx**:
  - Added support for new backend notification types: `STATUS_CHANGE`, `MILESTONE_DUE`, `DOCUMENT_VERIFIED`
  - Added `BACKEND_TYPE_MAP` to map backend notification types to frontend display types
  - Implemented data normalization for backend API responses (maps `type` → `notification_type`, `is_read` → `read`)
  - Improved handling of paginated and array-based API responses

#### Team Portal Enhancements
- **Team.jsx**:
  - Updated team role constants: `PROFESSOR` → `LEAD`, `NUC_STAFF` → `MEMBER`, `OBSERVER` → `REVIEWER`
  - Added support for user object fields (name, email, phone, institution from nested user data)
  - Improved status display handling for team members

#### Layout & Navigation
- **Layout.jsx**:
  - Added real-time notification count fetching via `notificationsAPI.list()`
  - Implemented proper cleanup with cancelled flag in useEffect

#### Dashboard Improvements
- **Dashboard.jsx**:
  - Added user filtering to show only programmes created by the current HOD user
  - Fixed dependency array in useEffect to include `user`

#### Programme Management
- **api.js**: Added new programme API methods:
  - `submit(id)` - Submit programme for review
  - `forward(id)` - Forward programme to NUC
  - `decision(id, data)` - Make accreditation decision
- **NewCourse.jsx**: Added `staff_count` field mapping during programme creation
- **Courses.jsx**:
  - Updated milestone calculation logic to use new status values
  - Added `staff_count` support in ratio calculations
  - Fixed document counts handling

#### Staff Count Support
- **accreditation.js**: Updated `getNUCRatio` and `getReadinessScore` to support `staff_count` as alternative to `lecturer_count`

---

## 👥 Authors

- Sultan Alabi — Final Year Project
- Salisu Abdussamad Ramadan — Final Year Project
