# Google OAuth Quick Setup

## 30-Minute Setup Guide

### Step 1: Install Packages (2 min)
```bash
pip install -r requirements.txt
```

### Step 2: Google Cloud Setup (15 min)

1. Go to https://console.cloud.google.com/
2. Create new project called "SecureSight AI"
3. Go to APIs & Services → Library
4. Search and enable **Google+ API**
5. Go to Credentials
6. Click **Create Credentials** → **OAuth 2.0 Client ID**
7. Select **Web application**
8. Add Unauthorized redirect URIs:
   ```
   http://localhost:5000/auth/callback
   ```
9. Click Create and copy the Client ID and Secret

### Step 3: Configure Environment (5 min)

```bash
# Copy template
cp .env.example .env

# Edit .env with your values
```

Edit `.env` and set:
```env
GOOGLE_CLIENT_ID=your-client-id-from-step-2
GOOGLE_CLIENT_SECRET=your-client-secret-from-step-2
SECRET_KEY=any-random-string-32-chars-minimum
FLASK_DEBUG=false
```

### Step 4: Run Application (1 min)

```bash
python app.py
```

Visit: http://localhost:5000/login

### Step 5: Test

1. Click **Continue with Google**
2. Log in with your Google account
3. Grant permissions
4. You should be logged in!

## For Production

Change in `.env`:
```env
SESSION_COOKIE_SECURE=true
FLASK_DEBUG=false
```

And update Google Cloud credentials with:
```
https://yourdomain.com/auth/callback
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "OAuth not configured" | Check GOOGLE_CLIENT_ID in .env |
| "Redirect URI mismatch" | Verify callback URL in Google Cloud Console |
| Button doesn't appear | Clear browser cache and restart app |
| "Invalid state token" | Check SECRET_KEY is set and consistent |

## Features

✅ One-click Google login  
✅ Automatic user profile setup  
✅ Secure CSRF protection  
✅ Works with traditional login too  
✅ User picture in dashboard  

## Files Changed

- `oauth.py` - New OAuth handler
- `app.py` - Added OAuth routes
- `requirements.txt` - Added packages
- `templates/login.html` - Added Google button
- See `GOOGLE_OAUTH_SETUP.md` for full details

---

Need help? Check `GOOGLE_OAUTH_SETUP.md` for detailed setup guide.
