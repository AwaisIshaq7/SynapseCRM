# SynapseCRM — Improvements, HCI Patterns & SMTP Setup

This document describes what was improved in the project, what you can add next, and how to configure **Gmail SMTP** for **Forgot Password** emails.

---

## 1. HCI patterns applied (quiz reference)

| # | Pattern | What we did in SynapseCRM | Main files |
|---|---------|---------------------------|------------|
| 1 | **Instant gratification** | Customer search updates as you type (debounced) | `pages/CustomerListPage.jsx` |
| 2 | **Reentrance** | Saved list filters (`sessionStorage`), form draft (`localStorage`), URL `?selected=` for preview | `utils/storage.js`, `CustomerListPage.jsx`, `CustomerFormPage.jsx` |
| 3 | **Habituation** | Keyboard shortcuts: `Ctrl+Shift+D` → Dashboard, `Ctrl+Shift+C` → Customers | `hooks/useKeyboardShortcuts.js`, `Layout.jsx`, `Navbar.jsx` |
| 4 | **Spatial memory** | Fixed admin sidebar; stable nav order; selected card ring | `Sidebar.jsx`, `CustomerCard.jsx` |
| 5 | **Prospective memory** | “Recently viewed customers” on dashboard | `components/hci/RecentCustomers.jsx`, `storage.js` |
| 6 | **Two-panel selector** | On wide screens: list left, preview right | `CustomerListPage.jsx`, `CustomerPreviewPanel.jsx` |
| 7 | **One-window drill down** | Mobile: tap card → full customer page | `CustomerCard.jsx` → `/customers/:id` |
| 8 | **Intriguing branches** | Link from customer detail to churn reports | `CustomerDetailPage.jsx` |
| 9 | **Multi-level help** | `?` tooltips on form/settings fields | `components/hci/FieldHelp.jsx` |
| 10 | **Hub & spoke** | Dashboard + sidebar/top nav as hub | `DashboardPage.jsx`, `Layout.jsx` |
| 11 | **Modal panel** | Delete customer/interaction uses confirm modal | `components/hci/ConfirmModal.jsx` |
| 12 | **Sequence map** | Add customer: Contact → Company & status steps | `components/hci/StepIndicator.jsx`, `CustomerFormPage.jsx` |
| 13 | **Breadcrumbs** | Hierarchy on main app pages | `components/hci/Breadcrumbs.jsx` |
| 14 | **Annotated scrollbar** | Styled scrollbar on main scroll area | `index.css`, `Layout.jsx` |
| 15 | **Color-coded sections** | Settings: blue / violet / green section borders | `SettingsPage.jsx`, `index.css` |
| 16 | **Diagonal balance** | Form/list headers: title left, actions right | `form-header-diagonal` in `index.css` |

### New HCI component folder

```
frontend/src/components/hci/
  Breadcrumbs.jsx
  ConfirmModal.jsx
  CustomerPreviewPanel.jsx
  FieldHelp.jsx
  RecentCustomers.jsx
  StepIndicator.jsx
```

---

## 2. Auth: Keep me signed in, email verification, demo account

| Feature | Behavior |
|---------|----------|
| **Keep me signed in** | Checked → token in `localStorage` (30 days). Unchecked → `sessionStorage` (cleared when browser closes). Saves email when checked. |
| **Forgot password** | Same row as “Keep me signed in” on login page. |
| **Verified registration** | New users get a verification email; cannot sign in until they click the link. |
| **Demo account** | `demo@synapsecrm.com` / `Demo@1234` — auto-created when backend starts. “Try Demo Account” signs in directly. |

---

## 3. Other technical improvements

| Area | Change |
|------|--------|
| **Database** | MongoDB Atlas connected via standard replica-set URI (works when `mongodb+srv` DNS fails on Windows) |
| **Backend** | `server.js` picks Atlas vs Railway connection options automatically |
| **Email** | Gmail SMTP via env vars; improved reset email HTML; `npm run test:smtp` |
| **Env** | `backend/.env` + `.env.example` include SMTP variables |

---

## 3. Further improvements (backlog)

| Priority | Idea | Pattern / benefit |
|----------|------|-------------------|
| High | Drag-and-drop widget order on Settings | Spatial memory + reentrance |
| High | “Finish later” on long forms with explicit button | Reentrance |
| Medium | Command palette (`Ctrl+K`) for global search | Habituation |
| Medium | Onboarding stepper for new users | Sequence map |
| Medium | Full help page / F1 docs | Multi-level help |
| Medium | Unified nav for sales manager + admin (same layout) | Habituation + spatial memory |
| Low | Scroll markers on long interaction timeline | Annotated scrollbar |
| Low | Email notification preferences in Settings | Prospective memory |

---

## 4. Gmail SMTP — Forgot password setup

SynapseCRM sends reset links from:

- **API:** `POST /api/auth/forgot-password` with `{ "email": "user@example.com" }`
- **Frontend:** `/forgot-password` page
- **Email service:** `backend/src/services/emailService.js`

### Does this work for every Gmail / every user?

| Question | Answer |
|----------|--------|
| Can **any user** reset if they registered with Gmail? | **Yes** — if that exact email exists in the database. |
| Can users with **Outlook / Yahoo / work email** reset? | **Yes** — same flow; provider does not matter. |
| Does each user need their **own** Gmail app password? | **No** — only **one** `SMTP_USER` in `.env` sends all reset emails. |
| Who is the email **from**? | Your configured sender (e.g. `msamishahid5@gmail.com`). |
| Who receives the reset link? | The email they used to **register / login** in SynapseCRM. |

Example: User registered as `colleague@company.com` → reset mail is **sent to** `colleague@company.com`, **from** `msamishahid5@gmail.com` (your SMTP account).

### Step A — Google account (one-time)

1. Use a **Gmail** account (e.g. `you@gmail.com`).
2. Turn on **2-Step Verification**:  
   https://myaccount.google.com/security
3. Create an **App Password**:  
   https://myaccount.google.com/apppasswords  
   - App: **Mail**  
   - Device: **Other** → name it `SynapseCRM`  
   - Google shows **16 characters** (often in groups of 4).  
   - **Remove all spaces** when pasting into `.env`.  
   - Example: `abcd efgh ijkl mnop` → `abcdefghijklmnop`

> Do **not** use your normal Gmail password in SMTP tools or in `.env`.

### Step B — Fill `backend/.env`

```env
FRONTEND_URL=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_SERVICE=gmail
SMTP_USER=your.real@gmail.com
SMTP_PASS=your16charapppassword
EMAIL_FROM=SynapseCRM <your.real@gmail.com>
```

Replace:

- `SMTP_USER` — full Gmail address that sends mail  
- `SMTP_PASS` — 16-character app password (no spaces)  
- `EMAIL_FROM` — usually same address as `SMTP_USER`  
- `FRONTEND_URL` — must match where users open the app (reset links use this)

Restart the backend after saving `.env`:

```bash
cd backend
npm run dev
```

### Common mistake: password with spaces

If the SMTP log shows the password as `spph uent utpc geil` (with spaces), Gmail returns **535 BadCredentials**.

- In the test tool and in `.env`, use **one continuous 16-character string**: `spphuentutpcgeil`
- The project strips spaces automatically in code, but some online testers send spaces literally.

If you still get **535** with no spaces, the app password is **wrong or revoked** — create a **new** app password (Step A) and update `SMTP_PASS`.

### Step C — Online SMTP test tool (same values)

Use any “SMTP test” site and enter:

| Field | Value for SynapseCRM + Gmail |
|-------|------------------------------|
| **SMTP server** | `smtp.gmail.com` |
| **Port** | `587` |
| **Security** | `STARTTLS` or `TLS` (not “SSL/465” unless you switch port) |
| **Username** | Your full Gmail, e.g. `you@gmail.com` |
| **Password** | App password (16 chars, no spaces) |
| **From email** | Same as `SMTP_USER` |
| **To email** | Your email (or another inbox to test) |

**Do not use** `your.site.com` or port `25` — those are for other hosts, not Gmail.

**Port guide:**

| Port | Security | Use with Gmail? |
|------|----------|-----------------|
| 587 | STARTTLS | Yes (recommended — matches this project) |
| 465 | SSL | Yes (set `SMTP_PORT=465` and `SMTP_SECURE=true`) |
| 25 | Plain | No (blocked by Gmail / ISPs) |

### Step D — Test from this project

```bash
cd backend
npm run test:smtp you@gmail.com
```

If you see `SMTP connection verified` and `Test email sent`, forgot-password will work.

### Step E — Test forgot password in the app

1. Open http://localhost:5173/forgot-password  
2. Enter an email that **exists** in your MongoDB `users` collection  
3. Check inbox (and spam) for **Reset your SynapseCRM password**  
4. Click the link → `/reset-password/:token` → set new password  

### Production (Vercel / Railway)

Set the same variables in the host’s **environment** dashboard (never commit real passwords to Git):

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
- `FRONTEND_URL=https://your-frontend-domain.vercel.app`

---

## 5. Troubleshooting email

| Problem | Fix |
|---------|-----|
| `EAUTH` / **535 BadCredentials** | Password had spaces in tester, or app password invalid — regenerate at [App Passwords](https://myaccount.google.com/apppasswords); sign in as **synapsecrm@gmail.com** |
| Email skipped in logs | `SMTP_USER` or `SMTP_PASS` missing in `.env` |
| Link opens wrong site | Fix `FRONTEND_URL` in `.env` |
| No email but API says success | User email not in database (API still returns generic success) |
| `querySrv ECONNREFUSED` (MongoDB) | Use standard `mongodb://` URI (already documented for Atlas) |

---

## 6. Security notes

- `.env` is gitignored — keep SMTP password only there or in host secrets  
- Rotate app password if it was shared in chat or committed by mistake  
- Reset tokens expire (see `User` model `generateResetToken`)  
- In production, reset links are **not** returned in API JSON (only sent by email)

---

## 7. Quick file index

| Topic | Path |
|-------|------|
| HCI components | `frontend/src/components/hci/` |
| Local storage helpers | `frontend/src/utils/storage.js` |
| Email sending | `backend/src/services/emailService.js` |
| Forgot password API | `backend/src/controllers/authController.js` |
| SMTP test script | `backend/test-smtp.js` |
| Env template | `backend/.env.example` |
