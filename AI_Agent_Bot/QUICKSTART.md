# 🚀 Quick Start Guide - SecureSight AI

## Step-by-Step Setup

### 1. Install Dependencies
Open terminal in project directory and run:
```bash
pip install -r requirements.txt
```

### 2. Create .env File
Create a `.env` file in the AI_Agent_Bot folder with:
```env
SECRET_KEY=supersecret-change-in-production-12345
VT_API_KEY=your-api-key-here
BOT_TOKEN=your-telegram-bot-token
SERVER_URL=http://127.0.0.1:5000/receive
```

### 3. Start the Application
```bash
python app.py
```

### 4. Open Your Browser
Navigate to: http://127.0.0.1:5000/login

### 5. Login
Use one of these demo accounts:

**Admin Account:**
- Username: `admin`
- Password: `admin123`
- Access: Full system + Admin Panel

**User Account:**
- Username: `user`
- Password: `user123`
- Access: Dashboard only

### 6. Explore Features

#### Main Dashboard (/)
- View real-time security analysis
- Upload files for scanning
- Monitor threats
- Interactive 3D models
- Scroll animations

#### Admin Panel (/admin)
- Only accessible with admin account
- System statistics
- Recent activity
- Multiple 3D visualizations
- Advanced analytics

## 🎨 Features Implemented

✅ **Authentication System**
- Login/Logout with session management
- Password hashing for security
- Role-based access (Admin/User)

✅ **Interactive 3D Models**
- Spline 3D models on multiple pages
- Parallax scrolling effects
- Interactive visualizations

✅ **Advanced Animations**
- Scroll-triggered animations (AOS)
- Hover effects with gradients
- Button ripple effects
- Card transformations
- Loading animations
- Particle effects

✅ **Admin Panel**
- Comprehensive dashboard
- Real-time statistics
- Activity tracking
- Data visualization

✅ **Enhanced UI/UX**
- Modern gradient designs
- Glass-morphism effects
- Responsive layout
- Touch-friendly interface

## 🔍 Testing the Features

### Test Authentication
1. Try logging in with wrong credentials → Should see error
2. Login with correct credentials → Redirects to dashboard
3. Try accessing /admin as regular user → Redirects to dashboard
4. Login as admin → Can access /admin panel
5. Click logout → Returns to login page

### Test Animations
1. Scroll down the page → Elements animate in
2. Hover over stat cards → Smooth transformations
3. Hover over buttons → Ripple effects
4. Interact with Spline models → 3D interactivity

### Test File Upload
1. Click dropzone or drag file → Upload animation
2. File gets analyzed → Progress indicator
3. Results display → Stats update

## 🛠️ Troubleshooting

**Issue:** Login page doesn't load
- **Solution:** Check if Flask is running on port 5000

**Issue:** No 3D models visible
- **Solution:** Check internet connection (Spline models load from CDN)

**Issue:** Animations not working
- **Solution:** Ensure AOS library is loading (check browser console)

**Issue:** Can't login
- **Solution:** Use exact credentials (case-sensitive)
  - admin/admin123 or user/user123

**Issue:** Session expires
- **Solution:** Login again (sessions are in-memory)

## 📱 Browser Compatibility

✅ Chrome/Edge (Recommended)
✅ Firefox
✅ Safari
✅ Mobile browsers

## ⚡ Performance Tips

- First load may take longer (loading 3D models)
- Scroll animations are GPU-accelerated
- Mouse trails are throttled for performance
- Particle effects have reduced frequency

## 🔐 Security Notes

**For Development/Demo:**
- Simple in-memory user storage
- Basic password hashing

**For Production, Add:**
- Database for user storage
- Stronger password policies
- HTTPS/SSL
- CSRF protection
- Rate limiting
- Environment-specific SECRET_KEY

## 📊 Demo Data

The application includes demo users:
- `admin` - Full access
- `user` - Limited access

In production, implement:
- User registration
- Password reset
- Email verification
- Profile management

## 🎯 Next Steps

1. **Run the app** and explore all features
2. **Test animations** by scrolling and hovering
3. **Compare login vs admin access** with different accounts
4. **Upload files** to see the analysis in action
5. **Check mobile responsiveness** on different devices

## 💡 Tips

- Use admin account to see all features
- Scroll slowly to enjoy animations
- Interact with 3D models (drag/zoom)
- Try dark mode toggle
- Test file upload with various file types

## 🆘 Need Help?

1. Check browser console for errors (F12)
2. Verify Flask server is running
3. Ensure all dependencies are installed
4. Check .env file configuration
5. Review README.md for detailed documentation

---

**Enjoy exploring SecureSight AI! 🚀**
