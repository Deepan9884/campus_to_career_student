# Campus to Career AI

Campus to Career AI is an AI-driven platform helping students build career-ready skills through intelligent resume analysis, mock interviews, GitHub insights, and personalized learning paths.

## 📧 Email Service Setup (For Render Deployment)

**Important:** Render blocks SMTP ports. Use Resend or Brevo API for email delivery.

### Quick Setup (3 commands)
```bash
cd backend
npm run email:check    # Check current status
npm run email:setup    # Interactive setup wizard
npm run email:test     # Test email delivery
```

### Get API Keys
- **Resend (Recommended):** https://resend.com/api-keys
- **Brevo (Alternative):** https://app.brevo.com/settings/keys/api

### Add to Render
1. Go to Render Dashboard → Your Service → Environment
2. Add: `RESEND_API_KEY=re_xxx` or `BREVO_API_KEY=xkeysib-xxx`
3. Save & Redeploy

📖 **Full Guide:** [backend/EMAIL_SETUP_GUIDE.md](backend/EMAIL_SETUP_GUIDE.md)

---

