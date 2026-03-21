# Fix: redirect_uri_mismatch Error

## Problem
You're getting: **Error 400: redirect_uri_mismatch**

This means the redirect URI your app is sending to Google doesn't match what's registered in Google Cloud Console.

## Solution

### Step 1: Determine Your Redirect URI

The app uses this redirect URI format:
```
http://YOUR_DOMAIN/auth/callback
```

**For Development** (localhost):
```
http://localhost:5000/auth/callback
http://127.0.0.1:5000/auth/callback
```

**For Production** (your domain):
```
https://yourdomain.com/auth/callback
```

### Step 2: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID (Web application)
5. Under "Authorized redirect URIs", click **Edit**
6. Add/Update the redirect URIs:
   - **For local development**: Add both:
     ```
     http://localhost:5000/auth/callback
     http://127.0.0.1:5000/auth/callback
     ```
   - **For production**: Add:
     ```
     https://yourdomain.com/auth/callback
     ```
7. Click **Save**

### Step 3: Verify Your .env Configuration

Make sure your `.env` has:
```env
GOOGLE_CLIENT_ID=your-actual-client-id
GOOGLE_CLIENT_SECRET=your-actual-client-secret
SECRET_KEY=your-random-secret-key
```

### Step 4: Restart Your App

```bash
# Stop the app (Ctrl+C)
# Then restart:
python app.py
```

### Step 5: Test

1. Go to http://localhost:5000/login
2. Click "Continue with Google"
3. You should see Google's login page (not an error)

## Common Issues

### Issue: Still Getting redirect_uri_mismatch

**Check these:**
1. ✅ Did you check **BOTH** http://localhost AND http://127.0.0.1?
2. ✅ Did you include the **exact path** `/auth/callback`?
3. ✅ Did you use **http** (not https) for localhost?
4. ✅ Did you save the changes in Google Console?
5. ✅ Did you wait 30 seconds and restart your app?

### Issue: redirect_uri looks correct but still fails

**Try this:**
1. Delete your credentials and create new ones
2. Start fresh with both redirect URIs:
   - `http://localhost:5000/auth/callback`
   - `http://127.0.0.1:5000/auth/callback`
3. Save and restart the app

### Issue: Want to test a different port

If running on port 8000 instead of 5000:
1. Add to Google Console:
   ```
   http://localhost:8000/auth/callback
   http://127.0.0.1:8000/auth/callback
   ```
2. Restart the app on port 8000

## Quick Verification Checklist

- [ ] Opened Google Cloud Console
- [ ] Found OAuth 2.0 credentials (Web application)
- [ ] Edited "Authorized redirect URIs"
- [ ] Added `http://localhost:5000/auth/callback`
- [ ] Added `http://127.0.0.1:5000/auth/callback`
- [ ] Clicked Save
- [ ] Restarted Flask app
- [ ] Cleared browser cache (optional but recommended)
- [ ] Tried login again

## Advanced: Debug Mode

To see the exact redirect URI being sent:

1. Add to your `.env`:
   ```env
   FLASK_DEBUG=true
   ```

2. Restart the app and check the console output for the redirect log

3. The URL shown will tell you exactly what redirect_uri is being used

## Need Help?

If it's still not working:
1. Check the exact error message from Google
2. Verify you're using the right Google project (not a different one)
3. Ensure your Client ID and Secret match the credentials you created
4. Try creating brand new OAuth credentials and starting fresh

---

**Still stuck?** The most common solution is adding BOTH `localhost` and `127.0.0.1` versions to Google Cloud Console authorized URIs.
