📌 Overview

This directory contains all Jinja2-based HTML templates used by the Flask application in SecureSight-AI.

These templates are responsible for:

Rendering the user interface (UI)
Displaying scan results and reports
Handling authentication views
Providing admin-level monitoring dashboards

They are dynamically rendered by Flask routes using render_template().

🧱 Tech Stack
Template Engine: Jinja2 (Flask default)
Languages: HTML5, CSS3, minimal JavaScript (inline)
Rendering: Server-side rendering via Flask
📂 Folder Structure
templates/
│
├── admin.html     # Admin dashboard (restricted access)
├── index.html     # Main user dashboard
├── login.html     # Authentication page
⚙️ Rendering Flow
Client Request
   ↓
Flask Route (app.py)
   ↓
render_template("*.html", data)
   ↓
Jinja Engine processes variables
   ↓
HTML Response sent to client
📄 File-Level Details
🔐 login.html

Purpose:

Handles user authentication (login form)

Key Features:

Username & password input fields
CSRF token integration ({{ csrf_token }})
Error message display (invalid login, blocked attempts)
Secure form submission (POST method)

Security Considerations:

Works with:
CSRF validation
Login rate limiting (IP-based)
No sensitive data stored client-side
🏠 index.html

Purpose:

Main dashboard for authenticated users

Key Features:

File upload interface
Scan status tracking
Result visualization (malicious/benign verdicts)
Dynamic content rendering (scan reports, metadata)

Dynamic Data Examples:

{{ filename }}
{{ scan_status }}
{{ verdict }}
{{ report_data }}

UI Responsibilities:

Display scan progress (polling /status/<id>)
Provide export/download options
Show structured report (hashes, stats, risk)
🛠️ admin.html

Purpose:

Admin-only dashboard for system monitoring

Key Features:

View all uploaded/scanned files
Monitor system activity
Access extended data not visible to normal users

Access Control:

Rendered only if:
User role == admin
Enforced in Flask route logic
🔄 Data Binding (Jinja2)

Templates use Jinja2 syntax:

Variable Injection
{{ variable_name }}
Conditional Rendering
{% if is_admin %}
   <p>Admin Panel</p>
{% endif %}
Loops
{% for item in reports %}
   <li>{{ item.name }}</li>
{% endfor %}
🔗 Integration with Flask (app.py)

Typical usage:

from flask import render_template

@app.route("/")
def dashboard():
    return render_template("index.html", data=scan_data)
🔐 Security Considerations
✅ Implemented
CSRF token integration in forms
Server-side rendering (reduces XSS risk)
No direct exposure of secrets in templates
Role-based rendering (admin vs user)
⚠️ Developer Notes
Always escape user inputs using Jinja (default safe)
Avoid inline JavaScript using untrusted data
Validate all form inputs server-side
⚡ Performance Notes
Lightweight HTML templates (no heavy frontend frameworks)
Server-side rendering → faster initial load
Minimal client-side JS → reduced attack surface
🧪 Testing Considerations
Test login form:
Invalid credentials
CSRF failures
Rate limit blocking
Test dashboard:
Empty state (no uploads)
Large report rendering
Test admin panel:
Unauthorized access prevention
⚠️ Known Limitations
No SPA (single-page app) behavior
Limited frontend interactivity
Inline JS (if present) not modularized
🚀 Future Improvements
Add frontend framework (React/Vue) for better UX
Separate static JS/CSS files
Add loading indicators for async operations
Improve UI/UX design (charts, graphs)
Role-based UI components