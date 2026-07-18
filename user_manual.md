# NUC Accreditation System - User Manual

Welcome to the NUC Accreditation System User Manual. This robust, web-based quality assurance platform streamlines the National Universities Commission (NUC) accreditation workflows for Nigerian universities.

---

## 1. System Overview and Roles

The platform provides role-based access to ensure security and streamlined workflows.

### User Roles
- **HOD (Head of Department)**: Can create programmes, submit them for review, and upload supporting documents (evidence).
- **APU (Academic Planning Unit)**: Responsible for reviewing submissions, managing the team portal, verifying evidence, and forwarding programmes to the NUC.
- **NUC_VISITOR (NUC Staff / Reviewer)**: Can view submitted programmes, review evidence, and make final accreditation decisions.

---

## 2. Getting Started

### Authentication
- **Login/Register**: Access the system via the frontend URL (`http://localhost:5173`). New users can register for an account, while existing users can log in using their credentials.
- **Password Recovery**: If you forget your password, use the "Forgot Password" flow on the login page to receive a secure 6-digit verification code.

### Demo Accounts
For demonstration and testing purposes, four demo accounts have been pre-configured in the system. Use the following credentials to log in:

- **Django Admin**
  - Email: `admin@demo.com`
  - Password: `password123`

- **HOD (Head of Department)**
  - Email: `mlawal@gmail.com`
  - Password: `mlawal123`
  - Role: HOD
- **APU Officer** & **NUC Official** to be created by the user

**Web Hosting Link** : [nuc-accreditation.vercel.app](https://nuc-accreditation.vercel.app/)

### Dashboard
Once logged in, you will be presented with a dynamic KPI Dashboard that provides:
- Real-time university readiness index calculations.
- Active alert counts.
- Total accredited programmes statistics.
*(Note: HODs will only see data relevant to the programmes they have created.)*

---

## 3. Core Features & Workflows

### 3.1 Managing Programmes
The Accreditation Tracker allows you to monitor every programme through its lifecycle.

- **Creating a Programme (HOD)**: Navigate to the Programmes section and add a new programme, including details like staff count for ratio calculations.
- **Programme Workflow**:
  - `Pending`: Initial state when created.
  - `In Review`: Submitted by the HOD to the APU for review.
  - `Forwarded to NUC`: Verified by the APU and sent to the NUC.
  - `Accredited` / `Denied`: Final decision made by the NUC panel.
- **Ratio Calculators**: The system features interactive Staff-to-Student and Space-to-Student calculators that automatically check against official NUC guidelines.

### 3.2 Evidence Locker (Documents)
The Evidence Locker is a centralized library for managing all accreditation files (e.g., course outlines, staff lists, facilities checklists).

- **Uploading Documents (HOD)**: Navigate to a specific programme to upload relevant documents.
- **Global Library**: View all uploaded documents across all programmes via the main Evidence Locker interface.
- **Verification Workflow (APU)**: APU Officers can review uploaded documents and mark them as `VERIFIED`.

### 3.3 Milestones & Task Management
Each programme features milestones to track progress.
- Users can view upcoming milestone deadlines.
- Tasks can be marked as completed as the department progresses through the accreditation requirements.

### 3.4 Notifications
Stay updated with the unified Notification Panel.
- Receive alerts for status changes, upcoming milestones, and document verifications.
- **Actions**: Mark individual notifications as read, mark all as read, or dismiss them entirely.

### 3.5 Team Management
The Team Portal is used to manage system users and invite reviewers.
- **Invite Users (HOD/APU)**: Send email invitations to new panel members.
- **Manage Roles**: View all team members and dynamically update their status (`ACTIVE` / `REVOKED`) and roles (`LEAD`, `MEMBER`, `REVIEWER`).

### 3.6 User Settings
Manage your account preferences via the Settings system.
- **Profile**: Update your personal details.
- **Preferences**: Configure your preferred notification channels (SMS & Email).
- **Security**: Change your password securely.
- **Deactivation**: Deactivate your account cleanly if it is no longer needed.

---

## 4. Need Help?

If you encounter any issues:
- Check your internet connection and ensure the server is running.
- Ensure your role has the appropriate permissions for the action you are trying to perform.
- Contact the system administrator for account-related inquiries.
