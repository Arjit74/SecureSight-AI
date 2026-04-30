# SecureSight AI Agent Bot - Deployment Guide

This guide covers deploying your Flask application with Telegram bot integration and OAuth online.

## Project Overview
- **Framework**: Flask 2.3.3
- **Bot**: Telegram Bot Integration
- **Auth**: Google OAuth + Admin Panel
- **ML Model**: XGBoost (securesight_threat_xgboost_v1.h5)
- **File Upload**: Yes (uploads/ directory)

---

## Option 1: Deploy on Render (Recommended for Beginners)

### Steps:

1. **Prepare Your Project**
   - Create a `.gitignore` file (if not exists):
     ```
     .env
     __pycache__/
     *.pyc
     .DS_Store
     uploads/*
     !uploads/.gitkeep
     ```
   - Create `Procfile` in root:
     ```
     web: gunicorn app:app
     ```
   - Update `requirements.txt` - add gunicorn:
     ```
     Flask==2.3.3
     Werkzeug==2.3.7
     gunicorn==21.2.0
     python-dotenv==1.0.0
     python-telegram-bot==20.3
     requests==2.31.0
     google-auth-oauthlib==1.2.0
     google-auth-httplib2==0.2.0
     google-api-python-client==2.108.0
     Authlib==1.3.0
     ```

2. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/your-repo.git
   git push -u origin main
   ```

3. **Deploy on Render**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: securesight-ai-bot
     - **Runtime**: Python 3
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `gunicorn app:app`
     - **Environment Variables**:
       ```
       SECRET_KEY=your-random-secret-key
       ADMIN_USERNAME=admin
       ADMIN_PASSWORD=your-secure-password
       SESSION_COOKIE_SECURE=true
       
       # OAuth (from Google Cloud Console)
       GOOGLE_CLIENT_ID=your-client-id
       GOOGLE_CLIENT_SECRET=your-client-secret
       GOOGLE_REDIRECT_URI=https://your-app.onrender.com/auth/callback
       
       # Telegram Bot
       TELEGRAM_BOT_TOKEN=your-bot-token
       
       # Flask
       FLASK_ENV=production
       ```

4. **Set Telegram Webhook** (instead of polling)
   ```
   POST https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://your-app.onrender.com/telegram/webhook
   ```

---

## Option 2: Deploy on Railway

### Steps:

1. **Push to GitHub** (same as above)

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Configure environment variables (same as Render)

3. **Set Custom Domain**
   - Go to Settings → Domain
   - Add your custom domain (or use railway.app subdomain)

---

## Option 3: Deploy on PythonAnywhere (For Telegram Bots)

### Steps:

1. **Sign up** at [pythonanywhere.com](https://pythonanywhere.com)

2. **Upload your project**
   - Use Web interface or Git clone
   ```bash
   git clone https://github.com/YOUR_USERNAME/your-repo.git
   ```

3. **Create Virtual Environment**
   - Web Tab → Create new web app → Python 3.x
   - Bash console:
   ```bash
   cd /home/YOUR_USERNAME/your-repo
   mkvirtualenv --python=/usr/bin/python3.9 myapp
   pip install -r requirements.txt
   ```

4. **Configure WSGI**
   - Web → Edit WSGI configuration
   ```python
   import sys
   path = '/home/YOUR_USERNAME/your-repo'
   if path not in sys.path:
       sys.path.append(path)
   
   from app import app as application
   ```

5. **Set Environment Variables**
   - Web → Edit WSGI again, add at top:
   ```python
   import os
   os.environ['SECRET_KEY'] = 'your-secret-key'
   # ... add other variables
   ```

6. **Reload Web App**
   - Click "Reload" button

---

## Option 4: Deploy on AWS (EC2)

### Steps:

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - Instance type: t3.micro (free tier eligible)

2. **Connect and Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Python and dependencies
   sudo apt install python3 python3-pip python3-venv nginx -y
   
   # Clone project
   cd /home/ubuntu
   git clone https://github.com/YOUR_USERNAME/your-repo.git
   cd your-repo
   
   # Create virtual environment
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   pip install gunicorn
   ```

3. **Configure Gunicorn Service**
   - Create `/etc/systemd/system/securesight.service`:
   ```ini
   [Unit]
   Description=SecureSight AI Bot
   After=network.target
   
   [Service]
   User=ubuntu
   WorkingDirectory=/home/ubuntu/your-repo
   ExecStart=/home/ubuntu/your-repo/venv/bin/gunicorn -w 4 -b 127.0.0.1:8000 app:app
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   ```
   
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start securesight
   sudo systemctl enable securesight
   ```

4. **Configure Nginx Reverse Proxy**
   - Create `/etc/nginx/sites-available/securesight`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
   
       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```
   
   ```bash
   sudo ln -s /etc/nginx/sites-available/securesight /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. **SSL Certificate (Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d your-domain.com
   ```

---

## Option 5: Deploy on Heroku (Legacy - Still Works)

**Note**: Heroku free tier is deprecated. Use paid dynos.

```bash
# Install Heroku CLI
# Create app
heroku create your-app-name

# Add Procfile and requirements.txt

# Push to Heroku
git push heroku main

# Set environment variables
heroku config:set SECRET_KEY=your-secret-key
heroku config:set ADMIN_USERNAME=admin
# ... set all variables

# View logs
heroku logs --tail
```

---

## Pre-Deployment Checklist

### 1. **Environment Variables**
   - [ ] `SECRET_KEY` - strong random key
   - [ ] `ADMIN_USERNAME` & `ADMIN_PASSWORD`
   - [ ] `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
   - [ ] `GOOGLE_REDIRECT_URI` - matches your deployment URL
   - [ ] `TELEGRAM_BOT_TOKEN`
   - [ ] `SESSION_COOKIE_SECURE=true` (for HTTPS)
   - [ ] `FLASK_ENV=production`

### 2. **Google OAuth Setup**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create OAuth 2.0 Credentials (Web Application)
   - Add Authorized Redirect URI: `https://your-deployed-app.com/auth/callback`
   - Copy Client ID and Secret

### 3. **Telegram Bot Setup**
   - Talk to @BotFather on Telegram
   - Create new bot, get token
   - Set webhook to your deployed URL
   - Command: `POST https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-app.com/telegram/webhook`

### 4. **File Uploads**
   - [ ] Ensure `uploads/` directory exists
   - [ ] For cloud storage, consider AWS S3:
   ```python
   # Add to requirements.txt
   boto3==1.28.0
   ```

### 5. **Security**
   - [ ] Disable debug mode: `FLASK_DEBUG=0`
   - [ ] Use HTTPS everywhere
   - [ ] Set `SESSION_COOKIE_SECURE=true`
   - [ ] Set `SESSION_COOKIE_HTTPONLY=true`
   - [ ] Use strong random `SECRET_KEY`
   - [ ] Keep dependencies updated

---

## Deployment Comparison

| Platform | Cost | Ease | Notes |
|----------|------|------|-------|
| **Render** | $7-12/mo | ⭐⭐⭐⭐⭐ | Best for beginners, easy setup |
| **Railway** | $5-50/mo | ⭐⭐⭐⭐⭐ | Good alternative to Render |
| **PythonAnywhere** | $5/mo | ⭐⭐⭐⭐ | Good for bots (webhooks work well) |
| **AWS** | $5-20/mo | ⭐⭐⭐ | More control, more complex |
| **Heroku** | $25+/mo | ⭐⭐⭐⭐ | Expensive now, not recommended |

---

## Post-Deployment

### 1. **Test Your Deployment**
   - Visit `https://your-app.com`
   - Test login functionality
   - Test file upload
   - Test Telegram bot

### 2. **Monitor Logs**
   - Render: Dashboard → Logs
   - Railway: Deployments → Logs
   - PythonAnywhere: Web tab
   - AWS EC2: `sudo systemctl status securesight`

### 3. **Set Up Monitoring**
   ```bash
   # Add to requirements.txt
   python-json-logger==2.0.7
   sentry-sdk==1.39.1
   ```

### 4. **Backup Strategy**
   - Backup uploads directory regularly
   - Use git for code backups
   - Consider database backups if you add one

### 5. **Custom Domain**
   - Purchase domain (Namecheap, GoDaddy, etc.)
   - Update DNS records to point to your deployment
   - Enable SSL/HTTPS

---

## Troubleshooting

### Problem: Telegram Webhook Not Working
**Solution**: 
- Check webhook URL is accessible: `curl https://your-app.com/telegram/webhook`
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check firewall/security group rules

### Problem: OAuth Redirect Mismatch
**Solution**:
- Verify `GOOGLE_REDIRECT_URI` matches exactly in:
  - Google Cloud Console
  - `oauth.py` configuration
  - Environment variables
- Include protocol (https://) and exact path

### Problem: File Upload Fails
**Solution**:
- Ensure `uploads/` directory exists and is writable
- Check upload size limit in Flask config
- Verify disk space available

### Problem: App Crashes After Deployment
**Solution**:
- Check deployment logs for error messages
- Verify all environment variables are set
- Ensure `requirements.txt` is up to date
- Test locally before deploying

---

## Recommended: Render Deployment (Quick Start)

If you want the fastest route, follow **Option 1 (Render)**. Here's the TL;DR:

1. Update requirements.txt with gunicorn
2. Create Procfile: `web: gunicorn app:app`
3. Push to GitHub
4. Go to render.com, create web service
5. Connect GitHub repo
6. Set environment variables
7. Deploy!

Your app will be live in 2-3 minutes.

---

## Support Documentation

Refer to your existing docs:
- [QUICKSTART.md](./QUICKSTART.md) - Quick setup guide
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) - Security considerations
- [DEBUG_LOGIN_REDIRECT.md](./DEBUG_LOGIN_REDIRECT.md) - OAuth debugging

