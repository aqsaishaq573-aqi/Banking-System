# Banking System

A modern, full-stack Banking System web application designed with a robust React frontend and a multi-layered backend infrastructure. This project features complete user authentication, audit logging, multi-role dashboards (Admin and Customer), and transactional tracking.

## 🚀 Features

### Frontend (React + TypeScript)
*   **Cover Page:** Interactive landing page for user entry.
*   **Authentication:** Clean Signup and Login components managing secure access.
*   **Dashboards:**
    *   **Customer Dashboard:** View account balances, execute transfers, track accounts, and lodge complaints.
    *   **Admin Dashboard:** Manage users, monitor all transactions, resolve complaints, and view live audit logs.
*   **Modern UI:** Built using `lucide-react` for beautiful icons and structured layouts.

### Backend & Database
*   **API Layer:** Run via Express (`backend-server.js` & `dev-backend.js`).
*   **Business Logic:** Structured modular controllers handling Accounts, Audit Logs, Auth, Customers, and Transactions.
*   **Oracle SQL/MJS Tooling:** Advanced maintenance scripts for constraint management (`check-constraints.js`), permission grants (`grant-permissions.mjs`), and database table initialization.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework:** React (with TypeScript)
*   **Build Tool:** Vite
*   **Styling:** TailwindCSS
*   **Icons:** Lucide React

### Backend
*   **Runtime Environment:** Node.js
*   **Framework:** Express.js
*   **Scripting languages:** JavaScript (ESM / `.mjs`), Tool Command Language (`.tcl`)

### Database
*   **Database Management System:** Oracle Database
*   **Query Language:** SQL

---

## 📂 Folder Structure

```text
├── bank project sem 5/
│   ├── components/
│   │   ├── auth/                # Login, Signup, and Auth API utilities
│   │   │   └── backend/         # Backend controller modules (.tcl files / scripts)
│   │   ├── customer/            # Customer specific views and actions
│   │   ├── Accounts.tsx         # Account monitoring component
│   │   ├── AdminComplaints.tsx  # Admin view to manage customer queries
│   │   ├── AuditLog.tsx         # Live activity history logging
│   │   ├── Dashboard.tsx        # Overview pane
│   │   └── Transactions.tsx     # Transaction ledger logs
│   ├── App.tsx                  # Main app component router
│   ├── index.html               # Main entry HTML file
│   ├── package.json             # App dependencies and run scripts
│   ├── backend-server.js        # Primary application server entry
│   └── *.mjs / *.js / *.sql     # Database seeding, automation, and constraint testing scripts
```
│   │   ├── customer/            # Customer specific views and actions
