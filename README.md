# OFIZ Tasks — Phase 1 Setup Guide

## Quick start (run locally, zero cost)

```bash
# Option 1: Python (installed on most machines)
cd ofiz-tasks
python3 -m http.server 8080
# Open http://localhost:8080

# Option 2: Node (if installed)
npx serve .
```

Then open your browser to `http://localhost:8080` and sign in as any user.

---

## File structure

```
ofiz-tasks/
├── index.html          ← Main app shell + all page templates
├── css/
│   └── app.css         ← Design system + all component styles
├── js/
│   ├── data.js         ← State, demo data, Google Sheets API layer
│   ├── ui.js           ← Rendering functions for every page/component
│   └── app.js          ← Router, login, keyboard shortcuts
└── README.md
```

---

## Google Sheets setup (Phase 1 persistence)

### Step 1 — Create the spreadsheet
Create a new Google Sheet and name it **OFIZ Tasks**.
Add these tabs (sheets):
- `Tasks`
- `Templates`
- `Clients`
- `Users`
- `AuditLog`

### Step 2 — Add headers

**Tasks** (Row 1):
`id | title | clientId | type | status | priority | assigneeId | dueDate | notes | createdAt | closedAt | closeComment`

**Templates** (Row 1):
`id | title | clientId | recurrence | dayOfMonth | dayOfWeek | assigneeId | active`

**Clients** (Row 1):
`id | name | short | color | bg | active`

**Users** (Row 1):
`id | name | email | role | initials | avClass`

**AuditLog** (Row 1):
`timestamp | userId | action | taskId | field | value`

### Step 3 — Get credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable **Google Sheets API**
3. Create **API Key** → restrict to Sheets API
4. Create **OAuth 2.0 Client ID** (Web application type)
   - Authorised origins: `http://localhost:8080`
   - Add your GitHub Pages URL later when deploying

### Step 4 — Update js/data.js

```js
const CONFIG = {
  SHEET_ID:  'your-spreadsheet-id-from-url',
  API_KEY:   'your-api-key',
  CLIENT_ID: 'your-oauth-client-id.apps.googleusercontent.com',
  ...
};
```

Then set `State.useSheets = true` at the bottom of the CONFIG block.

### Step 5 — Seed initial data
Copy your clients and users from the DEMO object in `data.js` into the
respective Google Sheet tabs. The app will then read/write live.

---

## Deploy to GitHub Pages (free public hosting)

```bash
# 1. Create a GitHub repository named "ofiz-tasks"
# 2. Push this folder to the repo
git init
git add .
git commit -m "OFIZ Tasks Phase 1"
git remote add origin https://github.com/YOUR_USERNAME/ofiz-tasks.git
git push -u origin main

# 3. Go to Settings → Pages → Source: Deploy from branch → main / root
# Your app will be live at: https://YOUR_USERNAME.github.io/ofiz-tasks/
```

---

## What's in Phase 1

- [x] Login screen with 3 user roles (Admin, Assistant, Viewer)
- [x] Dashboard with live stats (total, due today, overdue, done)
- [x] All tasks page with filters (status, type, client, search)
- [x] Task detail modal with comment thread
- [x] Close task button with optional closing comment
- [x] Create / Edit / Delete tasks (Admin only)
- [x] Clients page with health scorecard + progress bars
- [x] Recurring templates page
- [x] Users & roles page with permission matrix
- [x] Role-based UI (Viewer can't close/create, non-admin nav hidden)
- [x] Toast notifications
- [x] Keyboard shortcuts (Esc to close modal, ⌘N new task)
- [x] Google Sheets data layer (stub — activate with credentials)

## Coming in Phase 2

- [ ] Daily email digest via Google Apps Script
- [ ] Browser push notifications for due-today tasks
- [ ] Overdue auto-flag at midnight (Apps Script trigger)
- [ ] Monthly close checklist mode
- [ ] Client health report export (PDF)
- [ ] Telegram bot integration for daily reminders

---

## PocketBase migration (when ready)

When you're ready to upgrade to PocketBase:
1. The `State` object in `data.js` maps 1:1 to PocketBase collections
2. Replace `State.addTask()`, `State.updateTask()` etc. with PocketBase SDK calls
3. Real-time updates work via `pb.collection('tasks').subscribe('*', callback)`
4. All your frontend code (ui.js, app.js) stays exactly the same

---

*Built for OFIZ Accounting by Claude — Phase 1, June 2026*
