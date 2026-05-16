Gmail SMTP setup for SynapseCRM (backend)

This document describes the minimal steps to enable real email delivery via Gmail App Passwords.

1) Requirements
- A Gmail account
- 2-Step Verification enabled for that account
- A generated App Password (see step 2)

2) Create an App Password
- Open Google Account > Security > "2-Step Verification" and turn it on.
- After enabling, go to "App passwords".
- Create a new App Password: select "Other (Custom name)" and name it `SynapseCRM`.
- Copy the generated 16-character app password (you will not be shown it again).
ronp eibn pikr smaa
3) Configure environment variables
Add the following to your backend environment (local `.env` or deployment variables):

SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_generated_app_password
EMAIL_FROM="SynapseCRM <your_gmail_address@gmail.com>"

Notes:
- `SMTP_USER`/`SMTP_PASS` are used by the server to authenticate to Gmail.
- `EMAIL_FROM` defines the From header used in outgoing messages.
- Remove any `RESEND_API_KEY` or `EMAIL_PROVIDER` variables if present.

4) Restart the backend
From the `backend/` folder run:

```bash
npm install       # if you updated dependencies or after uninstalling resend
npm run dev       # development with nodemon
# or in production
npm start
```

5) Quick manual test (API call)
Trigger a password reset to send a reset email (replace host/port if necessary):

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com"}'
```

- In non-production modes, if SMTP is not configured the server logs the reset link to the console for safe testing.
- In production, the server will throw an error if `SMTP_USER`/`SMTP_PASS` are not set.

6) Run automated tests
To re-run the auth tests (covers the forgot/reset flow):

```bash
cd backend
npx jest src/__tests__/auth.test.js --runInBand
```

7) Troubleshooting
- If emails are not delivered:
  - Verify the `SMTP_USER` and `SMTP_PASS` values are correct.
  - Confirm 2-Step Verification is enabled (App Passwords require it).
  - Check spam/junk folders.
  - Tail the server logs for errors from Nodemailer.

8) Future migration
- If you later gain a verified domain and want a transactional service (SendGrid/Resend/Postmark), you can replace the transport in `src/services/emailService.js`.

File references:
- Mail transport and reset flow: `src/services/emailService.js`
- Alert emails: `src/utils/emailService.js`

If you want, I can commit the changes now and/or update the frontend docs to reference these env vars.
