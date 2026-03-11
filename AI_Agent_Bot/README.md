# SecureSight AI - Enhanced Security Analysis Platform

## 🚀 New Features

### 1. **Authentication System**
- ✅ Login/Logout functionality with session management
- ✅ User authentication with password hashing
- ✅ Protected routes requiring login
- ✅ Role-based access control (Admin/User)

**Demo Credentials:**
- **Admin:** username: `admin`, password: `admin123`
- **User:** username: `user`, password: `user123`

### 2. **Admin Panel**
- ✅ Complete system overview with real-time statistics
- ✅ Interactive 3D Spline models for data visualization
- ✅ Recent activity table with filtering
- ✅ Comprehensive analytics dashboard
- ✅ Advanced scroll animations using AOS library

**Access:** `/admin` route (Admin users only)

### 3. **Interactive Spline 3D Models**
Multiple 3D models integrated across the platform:
- **Login Page:** Animated security lock model with particle effects
- **Main Dashboard:** Floating hero model with parallax scrolling
- **Admin Panel:** Multiple interactive security visualization models
- **Analysis Sections:** Embedded 3D visualizations for enhanced user experience

### 4. **Advanced Animations & Interactions**
- ✅ Scroll-triggered animations using AOS (Animate On Scroll)
- ✅ Parallax effects on 3D models
- ✅ Hover effects with gradient transitions
- ✅ Button ripple effects
- ✅ Smooth page transitions
- ✅ Animated stat counters
- ✅ Mouse trail particles (subtle)
- ✅ Card hover transformations
- ✅ Loading animations
- ✅ Modal slide-in/fade effects
- ✅ Typing effects for titles

### 5. **Enhanced UI/UX**
- ✅ Modern gradient backgrounds
- ✅ Glass-morphism effects
- ✅ Animated background particles
- ✅ Floating elements with keyframe animations
- ✅ Responsive design improvements
- ✅ User badge showing current logged-in user
- ✅ Logout button in header
- ✅ Admin panel access button (for admin users)

## 📁 Project Structure

```
AI_Agent_Bot/
├── app.py                    # Main Flask application with auth
├── bot.py                    # Telegram bot integration
├── requirements.txt          # Python dependencies
├── templates/
│   ├── index.html           # Main dashboard (protected)
│   ├── login.html           # Login page with Spline 3D model
│   └── admin.html           # Admin panel with analytics
├── static/
│   ├── css/
│   │   └── app.css          # Enhanced styles with animations
│   └── js/
│       ├── app.js           # Main application logic
│       └── animations.js    # Enhanced animation effects
└── uploads/                 # File upload directory
```

## 🔧 Installation & Setup

1. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   SECRET_KEY=your-secret-key-here
   VT_API_KEY=your-virustotal-api-key
   BOT_TOKEN=your-telegram-bot-token
   SERVER_URL=http://127.0.0.1:5000/receive
   ```

3. **Run the Application:**
   ```bash
   python app.py
   ```

4. **Access the Application:**
   - Login Page: `http://127.0.0.1:5000/login`
   - Dashboard: `http://127.0.0.1:5000/` (requires login)
   - Admin Panel: `http://127.0.0.1:5000/admin` (admin only)

## 🎨 Spline 3D Models

The application integrates multiple Spline 3D models for an immersive experience:

1. **Login Page Model:** Security-themed interactive 3D scene
2. **Dashboard Hero:** Floating 3D visualization with parallax
3. **Admin Panel Models:** 
   - Security system visualization
   - MacBook Pro interactive model
4. **Analysis Sections:** Embedded security-themed 3D models

## ⚡ Key Technologies

- **Backend:** Flask (Python)
- **Frontend:** HTML5, CSS3, JavaScript
- **Animations:** AOS (Animate On Scroll) Library
- **3D Models:** Spline Design Integration
- **Security:** Werkzeug password hashing, Flask sessions
- **UI Effects:** CSS keyframe animations, transform effects

## 🔐 Security Features

- Password hashing using Werkzeug
- Session-based authentication
- Protected routes with decorators
- Role-based access control
- Logout functionality clearing sessions

## 📊 Admin Features

The admin panel provides:
- Total items analyzed
- Files scanned count
- URLs checked count
- Threats detected
- Safe files count
- Currently analyzing items
- Recent activity table
- Interactive 3D visualizations

## 🎯 Animation Features

### Scroll Animations
- Fade-in on scroll
- Slide-up effects
- Zoom-in for stats
- Staggered delays for sequential reveals

### Hover Effects
- Card elevation on hover
- Gradient background transitions
- Scale transformations
- Shadow depth changes

### Interactive Elements
- Button ripple effects
- Dropzone animations
- Modal slide-ins
- Progress bar shimmer
- Particle trails

## 🌐 Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Login page with 3D model |
| `/logout` | Authenticated | Logout and clear session |
| `/` | Authenticated | Main dashboard |
| `/admin` | Admin Only | Admin control panel |
| `/data` | Authenticated | API endpoint for items |
| `/receive` | Public | Telegram bot webhook |
| `/uploads/<file>` | Authenticated | File download |

## 🎨 Customization

### Changing Spline Models
Edit the iframe src in the respective template files:
- `templates/login.html` - Line with Spline iframe
- `templates/index.html` - Multiple Spline model sections
- `templates/admin.html` - Admin panel models

### Adjusting Animation Speed
Modify AOS settings in templates:
```javascript
AOS.init({
  duration: 800,  // Animation duration in ms
  easing: 'ease-out-cubic',
  once: true,
  offset: 100
});
```

### User Management
Currently uses in-memory dictionary. For production:
1. Implement database (SQLite/PostgreSQL)
2. Add user registration
3. Implement password reset
4. Add email verification

## 📱 Responsive Design

All pages are fully responsive:
- Mobile-first approach
- Breakpoints at 768px
- Touch-friendly interface
- Optimized Spline models for mobile

## 🔄 Future Enhancements

- [ ] Database integration for users
- [ ] User registration system
- [ ] Password reset functionality
- [ ] Two-factor authentication
- [ ] Real-time notifications
- [ ] Export data to PDF
- [ ] Advanced filtering and search
- [ ] User activity logs
- [ ] API rate limiting
- [ ] WebSocket for real-time updates

## 👥 User Roles

### Admin Users
- Full access to all features
- Admin panel access
- User management capabilities
- System statistics overview

### Regular Users
- Dashboard access
- File upload and analysis
- URL checking
- Personal activity view

## 🚦 Getting Started

1. Start the Flask server: `python app.py`
2. Open browser to `http://127.0.0.1:5000/login`
3. Login with demo credentials
4. Explore the interactive dashboard
5. If admin, access `/admin` for advanced features

## 📝 License

This project is part of SecureSight AI security analysis platform.

## 🤝 Contributing

Contributions welcome! Please submit pull requests or open issues.

---

**Made with ❤️ using Flask, Spline, and modern web technologies**
