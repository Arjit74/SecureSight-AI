# CRITICAL: Fix redirect_uri_mismatch - Step by Step

## Your Exact Redirect URI

Based on your app configuration, your app uses this redirect URI:

```
http://127.0.0.1:5000/auth/callback
http://localhost:5000/auth/callback
```

**You MUST add BOTH of these to Google Cloud Console.**

---

## Step-by-Step Google Cloud Setup

### Step 1: Open Google Cloud Console
Go to: https://console.cloud.google.com

### Step 2: Select Your Project
- Click the project dropdown (top left)
- Select **"securesight-ai"** or your project name

### Step 3: Go to Credentials
- Left sidebar: **APIs & Services**
- Click: **Credentials**

### Step 4: Find Your OAuth Client
- Look for the entry with:
  - Name: (usually blank or has your app name)
  - Type: **OAuth 2.0 Client ID**
  - Application type: **Web application**
- Click on it to open

### Step 5: Edit Authorized Redirect URIs
- Find the section: **Authorized redirect URIs**
- Click the **pencil/edit icon** next to it (or click the whole section to edit)

### Step 6: Add BOTH URIs
Delete any existing URIs and add these two (one per line):

```
http://127.0.0.1:5000/auth/callback
http://localhost:5000/auth/callback
```

**IMPORTANT: Add BOTH lines exactly as shown (copy/paste if possible)**

### Step 7: Save
- Click the **SAVE** button
- Wait for confirmation (should say "Credentials updated")

### Step 8: Verify
- Scroll down and verify you see:
  - Client ID: `437695924861-dauqkcjr...` (your value)
  - Client Secret: `GOCSPX-...` (your value)
  - Authorized redirect URIs showing your two URLs

---

## Test Again

1. **Stop** your Flask app (Ctrl+C if running)
2. **Wait** 30 seconds (Google needs time to update)
3. **Restart** Flask:
   ```
   python app.py
   ```
4. **Test** by opening: http://127.0.0.1:5000/login
5. Click **"Continue with Google"**
6. You should see Google's login page (not an error)

---

## What to Look For

✅ **Good**: Redirects to Google login page  
✅ **Good**: You can enter your email  
✅ **Good**: After login, redirected back to your dashboard  

❌ **Bad**: "Error 400: redirect_uri_mismatch" - means URIs don't match  
❌ **Bad**: "Unauthorized client" - means Client ID/Secret is wrong  

---

## If Still Getting Error:

### Double-Check:
1. Did you add **BOTH** URIs (127.0.0.1 AND localhost)?
2. Are the URIs exactly as shown above (with `/auth/callback` at the end)?
3. Did you click **SAVE** after editing?
4. Did you wait 30 seconds?
5. Did you restart the Flask app?

### Try This:
1. Delete the entire redirect URI section
2. Add back just one:
   ```
   http://localhost:5000/auth/callback
   ```
3. Save and test
4. If that works, add the second one

### Last Resort:
1. Create a **brand new** OAuth 2.0 Client ID:
   - In Credentials, click **Create Credentials**
   - Select **OAuth 2.0 Client ID**
   - Choose **Web application**
   - Enter name: "SecureSight AI"
   - Add Authorized JavaScript origins (optional): `http://localhost:5000`
   - Add Authorized redirect URIs:
     ```
     http://localhost:5000/auth/callback
     http://127.0.0.1:5000/auth/callback
     ```
   - Create and copy the new credentials
2. Update your `.env` with the new:
   ```
   GOOGLE_CLIENT_ID=new-client-id
   GOOGLE_CLIENT_SECRET=new-client-secret
   ```
3. Restart the app

---

## Screenshot Guide (Google Cloud Console)

```
┌─ APIs & Services
│  └─ Credentials
│     └─ [Click your OAuth 2.0 Web app]
│        ┌─ Client ID: 437695924861-...
│        ├─ Client Secret: GOCSPX-...
│        └─ Authorized redirect URIs:
│           ├─ http://127.0.0.1:5000/auth/callback
│           ├─ http://localhost:5000/auth/callback
│           └─ [SAVE button]
```

---

## Quick Checklist

- [ ] Opens Google Cloud Console
- [ ] Found OAuth 2.0 Client ID credentials
- [ ] Clicked edit on Authorized redirect URIs
- [ ] Added: `http://127.0.0.1:5000/auth/callback`
- [ ] Added: `http://localhost:5000/auth/callback`
- [ ] Clicked SAVE
- [ ] Waited 30 seconds
- [ ] Restarted Flask app (`python app.py`)
- [ ] Tested by visiting http://127.0.0.1:5000/login
- [ ] Clicked "Continue with Google"

---

## Debug Mode

If you want to see exactly what redirect_uri your app is trying to use, run:

```bash
python app.py
```

And look for this line in the output:
```
DEBUG: OAuth Redirect URI: http://...
```

This shows exactly what URI you need to add to Google.

---

**Still stuck?** Make sure you're in the right Google Cloud project and the Client ID/Secret match what's in your `.env` file.
