# CoolTech Technician Panel

A field technician self-service portal for **CoolTech AC Services**.  
Matches the CoolTech admin panel theme exactly — dark navy sidebar (`#1A1A2E`) + orange brand (`#EA580C`).

---

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Demo Login

| Field    | Value                    |
|----------|--------------------------|
| Email    | ramesh@cooltech.com      |
| Password | tech123                  |

Other demo accounts: `vijay@cooltech.com` / `arjun@cooltech.com` (same password)

---

## Modules

| Module            | Description |
|-------------------|-------------|
| **Dashboard**     | Active job highlight, today's jobs, upcoming schedule, AMC reminder, monthly stats |
| **My Jobs**       | All assigned jobs with interactive checklist, status updates, part tracking, remarks |
| **My Schedule**   | Weekly calendar strip + day timeline with job slots |
| **AMC Visits**    | Assigned AMC accounts, visit progress, service checklist, report submission |
| **Attendance**    | Clock in/out, monthly calendar grid, daily records |
| **Expenses**      | Submit fuel/parts/food claims with receipt tracking |
| **Parts Request** | Request materials from warehouse, view parts catalog & stock |
| **Leave Requests**| Apply for leave, view balance (Casual / Sick / Earned) |
| **My Salary**     | Payslip history, earnings breakdown, incentives, PF deductions |
| **My Profile**    | Personal info, skills, certifications, performance trends |

---

## Tech Stack

- React 18 + React Router v6
- Vite 5
- Pure CSS (no Tailwind) — custom design tokens matching CoolTech admin theme
- All data is local mock data (no backend required)

---

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx        # Collapsible dark sidebar with tooltips
│   │   └── Header.jsx         # Sticky header with live clock + dropdown
│   └── ui/
│       └── Components.jsx     # Badge, TypeTag, Modal, Toast, StripCard, etc.
├── constants/
│   ├── navigation.js          # Nav items, page titles, routes
│   ├── statusMaps.js          # Status label/color maps
│   └── tokens.js              # Brand colors and font stack
├── data/
│   └── mockData.js            # All mock data for Ramesh Kumar (T01)
├── pages/
│   ├── LoginPage.jsx
│   ├── Dashboard.jsx
│   ├── JobsPage.jsx
│   ├── SchedulePage.jsx
│   ├── AMCPage.jsx
│   ├── AttendancePage.jsx
│   ├── ExpensesPage.jsx
│   ├── InventoryPage.jsx
│   ├── LeavesPage.jsx
│   ├── SalaryPage.jsx
│   └── ProfilePage.jsx
├── styles/
│   └── main.css               # Full design system
├── App.jsx                    # Router + auth shell
└── main.jsx
```
