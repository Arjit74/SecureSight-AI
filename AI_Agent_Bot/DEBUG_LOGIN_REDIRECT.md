# Fix: Redirects Back to Login After OAuth

## What I Fixed

I added extensive debugging to help identify why you're being redirected back to login. The issue is likely one of these:

1. **Token parsing failing** - Google's response format not being recognized  
2. **Session not being set** - `username` key missing from session
3. **User info not being extracted** - Email or google_id is empty

## How to Debug

### Step 1: Run Your App with Debug Output

```bash
python app.py
```

### Step 2: Try Google Login

1. Open http://127.0.0.1:5000/login
2. Click "Continue with Google"  
3. Log in with your Google account
4. Watch the console output

### Step 3: Look for This Output

You should see lines like:

```
DEBUG: OAuth callback started
DEBUG: Got token from Google: <class '...'>
DEBUG: Token dict keys: ['access_token', 'id_token', ...]
DEBUG: Decoded ID token: {'email': 'your@email.com', 'name': 'Your Name', ...}
DEBUG: Parsed user info: {'email': 'your@email.com', ...}
DEBUG: Extracted - google_id: 123456, email: your@email.com, name: Your Name
DEBUG: Created new OAuth user: 123456
DEBUG: Session set - username: Your Name
DEBUG: Session keys: ['user_id', 'username', 'email', 'picture', ...]
DEBUG: About to redirect to index
```

### If You See "ERROR: Missing required user info!"

This means either:
- `google_id` is None (the `sub` claim is missing from token)
- `email` is None (the `email` claim is missing from token)

The console will show what was actually in the token, which helps us figure out the issue.

## Common Solutions

### Solution 1: Check Google Permissions

Make sure you're granting permission to see your email:

1. When logging in with Google, there's a screen asking for permissions
2. Make sure it says something like "can view your email"
3. Don't skip this step
4. If you see a second prompt, grant all permissions

### Solution 2: Ensure Scopes Are Correct

The app requests: `openid email profile`

If Google isn't returning email, make sure you're authorizing the app to access it.

### Solution 3: Check Your Google Cloud Credentials

Your `.env` file has:
```
CLIENT_ID=your_actual_id
CLIENT_SECRET=your_actual_secret
```

Verify these are still valid and not revoked:
1. Go to https://console.cloud.google.com
2. Select your project
3. Check these credentials are active

## The Real Problem (Most Likely)

After login, your session should have:
- `session['username']` = Your Name or Email
- `session['email']` = your@email.com
- `session['user_id']` = Google's sub ID

The `login_required` decorator checks for `session['username']`. If it's not there, you get redirected to login.

## Testing Session Directly

1. Log in with username/password (the demo account):
   - Username: `admin`
   - Password: `admin123`
2. If this works, the session/login system is fine
3. If this also fails, there's a bigger issue

## Advanced: Inspect Token Directly

If debugging shows the token has the data but it's not being extracted, I might need to adjust the `parse_token()` function.

Share the console output that shows:
```
ERROR: Missing required user info!
  google_id: ...
  email: ...
  Full user_info: ...
```

Look especially at `DEBUG: Token dict keys:` and `DEBUG: Full token content:` - this tells us what Google actually sent.

## Next Steps  

1. Run the app: `python app.py`
2. Try Google login  
3. **Share the console debug output** - especially any ERROR or DEBUG lines
4. This will tell us exactly what's happening

The debugging output will pinpoint the exact issue!
