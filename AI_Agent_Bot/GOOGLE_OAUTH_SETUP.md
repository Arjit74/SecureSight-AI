# Google OAuth2 Authentication Setup Guide

This guide provides step-by-step instructions to set up Google OAuth2 authentication for the SecureSight AI application.

## Prerequisites

- Python 3.8+
- Flask application running
- Google Cloud Platform account
- Basic knowledge of environment variables

## Installation

### 1. Install Required Packages

The OAuth packages are already included in `requirements.txt`. Install them if you haven't already:

```bash
pip install -r requirements.txt
```

Required packages:
- `authlib` - OAuth2 client library
- `google-auth-oauthlib` - Google OAuth support
- `google-auth-httplib2` - HTTP support for Google Auth
- `google-api-python-client` - Google API client

### 2. Set Up Google Cloud Project

#### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter a project name (e.g., "SecureSight AI") and click "CREATE"
5. Wait for the project to be created and select it

#### Step 2: Enable Google+ API

1. In the Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click on it and press **ENABLE**

#### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **CREATE CREDENTIALS** > **OAuth 2.0 Client ID**
3. If prompted, create an **OAuth consent screen** first:
   - Select "External" user type
   - Fill in the required information:
     - App name: "SecureSight AI"
     - User support email: Your email
     - Developer contact: Your email
   - For scopes, add:
     - `userinfo.email`
     - `userinfo.profile`
     - `openid`
   - Add test users if in development mode
4. Return to **Credentials** and click **CREATE CREDENTIALS** > **OAuth 2.0 Client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   ```
   http://localhost:5000/auth/callback          (Development)
   https://yourdomain.com/auth/callback         (Production)
   ```
7. Click **CREATE**
8. You'll see a dialog with your Client ID and Client Secret
9. Download the JSON or copy these values

### 3. Configure Environment Variables

1. Create or edit your `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Add your Google OAuth credentials:
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

3. Set other important security variables:
   ```env
   SECRET_KEY=your-secure-random-key-min-32-chars
   SESSION_COOKIE_SECURE=true
   FLASK_DEBUG=false
   ```

## Usage

### For Users

1. Navigate to the login page `/login`
2. Two login options are available:
   - **Traditional Login**: Enter username and password
   - **Google Login**: Click "Continue with Google" button
3. For Google login:
   - You'll be redirected to Google's authentication page
   - Sign in with your Google account
   - Grant permissions to SecureSight AI
   - You'll be automatically logged in and redirected to the dashboard

### For Developers

The OAuth implementation is handled by the `oauth.py` module:

```python
from oauth import oauth_handler

# Initialize with Flask app
oauth_handler.init_app(app)

# In your route:
@app.route("/auth/google")
def auth_google():
    return oauth_handler.google.authorize_redirect(redirect_uri)
```

## Application Flow

```
User             Browser          Google         SecureSight App
 |                  |                |                   |
 |----- Click ----->|                |                   |
 |   "Continue      |---- GET /auth/google -->|          |
 |    with Google"  |                |        |          |
 |                  |                |        (generate  |
 |                  |                |         auth URL) |
 |                  |<---- redirect -----|                |
 |                  | to Google login     |              |
 |                  |=======>|                            |
 |  (User signs in) |        |                            |
 |  (Grants perms)  |<======|                            |
 |                  |<---- auth code -----|              |
 |                  |                      |             |
 |                  |---- GET /auth/callback?code=xxx -->|
 |                  |                      |  (exchange  |
 |                  |                      |   code for  |
 |                  |                      |   token)    |
 |                  |<------ SetCookie --------|          |
 |                  | (session created)  |              |
 |                  |<---- redirect ------|              |
 |                  |     to /index       |              |
 |  (Logged in)     |<-----|              |              |
 |                  |                     |              |
```

## Security Features

The implementation includes:

- ✅ **CSRF Protection**: State tokens prevent cross-site request forgery
- ✅ **Secure Sessions**: HttpOnly, SameSite cookies
- ✅ **OAuth 2.0 Standard**: Industry-standard authentication
- ✅ **User Data Protection**: No passwords stored for OAuth users
- ✅ **Token Exchange**: Authorization code exchanged server-side
- ✅ **HTTPS Ready**: Configurable for secure cookies in production

## Troubleshooting

### "Google OAuth is not configured"

**Problem**: The Google login button shows an error.

**Solution**:
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
- Restart the Flask application
- Check that the `.env` file is in the project root directory

### Redirect URI Mismatch

**Problem**: "The redirect_uri does not match the registered value"

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click on your OAuth 2.0 client
4. Under "Authorized redirect URIs", verify:
   - Development: `http://localhost:5000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`
5. Save changes and restart the app

### "Invalid or expired token"

**Problem**: Login fails with token error.

**Solution**:
- Check that the system clock on your server is synchronized (OAuth requires time sync)
- Verify your Google credentials are correct
- Ensure your Google Cloud project is active

### Session Not Persisting

**Problem**: Users are logged out after page reload.

**Solution**:
- Verify `SECRET_KEY` is set in `.env`
- Check that `SESSION_COOKIE_SECURE` is `true` for HTTPS, `false` for HTTP (development)
- Ensure cookies are not being blocked by browser settings

## User Data Storage

OAuth users are stored in the `oauth_users` dictionary:

```python
oauth_users = {
    "google_id_123": {
        "email": "user@example.com",
        "name": "John Doe",
        "picture": "https://...",
        "created_at": "2024-01-15T10:30:00"
    }
}
```

**Note**: This is an in-memory storage suitable for development. For production, use a database like PostgreSQL or MongoDB.

## Production Deployment

### Security Checklist

- [ ] Set `FLASK_DEBUG=false` in `.env`
- [ ] Set `SESSION_COOKIE_SECURE=true` for HTTPS
- [ ] Use a strong `SECRET_KEY` (minimum 32 characters, random)
- [ ] Configure proper HTTPS/SSL certificate
- [ ] Update Google redirect URI to your domain
- [ ] Use environment-specific `.env` files (don't commit to Git)
- [ ] Store credentials in a secure vault (AWS Secrets Manager, HashiCorp Vault, etc.)
- [ ] Implement proper user database instead of in-memory storage
- [ ] Add rate limiting on authentication endpoints
- [ ] Enable CSRF protection on all forms
- [ ] Set up proper logging and monitoring

### Example Production Setup

```env
FLASK_DEBUG=false
SECRET_KEY=<very-long-random-string>
SESSION_COOKIE_SECURE=true

GOOGLE_CLIENT_ID=<production-client-id>
GOOGLE_CLIENT_SECRET=<production-client-secret>

# Add your domain redirect URI in Google Cloud Console
# https://yourdomain.com/auth/callback
```

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Authlib Documentation](https://docs.authlib.org/)
- [Flask-Login Extension](https://flask-login.readthedocs.io/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review Flask and Authlib documentation
3. Check Google Cloud Console for error logs
4. Verify all credentials are correctly set

---

**Last Updated**: March 2024
**Compatibility**: Python 3.8+, Flask 2.3+, Authlib 1.3+
