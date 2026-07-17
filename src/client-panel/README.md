# CoolTech Client Portal

A Worksuite-inspired client self-service portal built for **CoolTech AC Services**.  
Matches the CoolTech admin panel theme (dark sidebar · orange brand).

---

## Modules Included

| Module              | Description                                              |
|---------------------|----------------------------------------------------------|
| Dashboard           | Welcome banner, KPIs, active jobs, pending invoices, tickets, AMC progress |
| My Service Jobs     | Full job history with status filters and detail modal    |
| Invoices            | View, filter, pay, download invoices                     |
| Payments            | Complete payment history with method and reference       |
| AMC Contracts       | Visit progress, schedule, coverage details               |
| Quotations          | Review and approve quotations from CoolTech              |
| Contracts           | View signed contracts, terms, signatories                |
| Support Tickets     | Raise tickets, view message threads, reply               |
| Service Reminders   | Upcoming and completed service reminders                 |
| Documents           | Download contracts, invoices, reports, warranties        |
| My Profile          | Edit contact info, change password, notification prefs   |

---

## Getting Started

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## Demo Login

| Field    | Value                  |
|----------|------------------------|
| Email    | admin@sunrise.com      |
| Password | client123              |

---

## Tech Stack

- React 18 + React Router v6
- Vite 5
- Pure CSS (no Tailwind) — custom design tokens matching CoolTech admin theme
- Lucide React icons
- All data is local mock data (no backend required)

---

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx      # Collapsible dark sidebar
│   │   └── Header.jsx       # Sticky top bar with profile dropdown
│   └── ui/
│       └── Components.jsx   # Shared: Badge, Modal, Toast, Avatar, ProgressBar
├── constants/
│   ├── navigation.js        # Nav items, paths, page titles
│   └── tokens.js            # Brand colors and fonts
├── data/
│   └── mockData.js          # All mock data for the logged-in client
├── pages/
│   ├── LoginPage.jsx
│   ├── Dashboard.jsx
│   ├── JobsPage.jsx
│   ├── InvoicesPage.jsx
│   ├── PaymentsPage.jsx
│   ├── AMCPage.jsx
│   ├── QuotationsPage.jsx
│   ├── ContractsPage.jsx
│   ├── TicketsPage.jsx
│   ├── RemindersPage.jsx
│   ├── DocumentsPage.jsx
│   └── ProfilePage.jsx
├── styles/
│   └── main.css             # Full design system CSS
├── App.jsx                  # Router + auth shell
└── main.jsx                 # React entry point
```
