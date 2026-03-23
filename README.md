# SecureSight-AI Complete Project Guide

Last updated: March 19, 2026

## 1) What This Project Is

SecureSight-AI is a multi-component cyber security platform focused on malicious URL and suspicious file analysis.

It combines:
- A hardened Node.js backend API for URL scanning and verdict orchestration.
- A Python ML bridge for model inference and fallback predictions.
- A Flask web app and Telegram bot workflow for file upload analysis and report export.
- A browser extension UI for real-time user-facing warning, scanner, and reporting screens.
- Training pipelines and datasets for model development.

## 2) Main Components And What They Use

### Backend API (`backend/`)

Purpose:
- Core API gateway and scan orchestration.

Stack:
- Node.js + Express
- PostgreSQL (`pg`)
- Security middleware: `helmet`, `cors`, `express-rate-limit`
- URL intelligence modules in `backend/lib`

Notable implementation details:
- URL validation and normalization before processing.
- API key support via `X-API-Key` (enabled only if `API_KEY` is set).
- Cache for scan results with TTL and max-entry control.
- CORS allow-list support, including extension origins.
- Graceful ML fallback when bridge/model is unavailable.

Entry point:
- `backend/server.js`

### ML Bridge (`node-ml-bridge/`)

Purpose:
- Connect Node backend with Python model inference runtime.

Stack:
- Node.js subprocess execution (`child_process`)
- Python runtime with model/scaler artifacts

Notable implementation details:
- `ml_service.js` exposes `initialize`, `predictUrl`, and model metadata helpers.
- Backend dynamically resolves bridge path and falls back to a safe prediction profile if unavailable.

### Flask App + Telegram Bot (`AI_Agent_Bot/`)

Purpose:
- File upload and report workflow for web UI and Telegram channel.

Stack:
- Flask, Werkzeug, python-dotenv, requests
- python-telegram-bot

Notable implementation details:
- Session-based authentication with role checks.
- CSRF token validation on login.
- Login brute-force protection (IP/window based).
- Environment-driven user credentials with secure fallback warnings.
- VirusTotal integration with asynchronous polling and export formats.

Entry points:
- Web app: `AI_Agent_Bot/app.py`
- Bot: `AI_Agent_Bot/bot.py`

### Browser Extension (`extension/`)

Purpose:
- User-side runtime protection and visualization layer.

Stack:
- WebExtension APIs
- Manifest v2 configuration
- UI pages (`dashboard`, `scanner`, `warning`, `report`)

Notable implementation details:
- Background scan workflow hooks with decision logging.
- Dedicated warning/scanner pages for user decision flow.
- Dashboard/report screens for analysis visibility.

Manifest:
- `extension/utils/manifest.json`

### Model Training And Data (`ml/`, `Model Training/`, `datasets/`)

Purpose:
- Feature engineering, dataset generation, model training, and experiments.

Includes:
- URL feature extraction and training scripts.
- Advanced/hybrid training code paths.
- Legacy standalone training workspace under `Model Training/`.
- Dataset metadata and CSV assets.

## 3) Security Hardening Implemented

The current codebase includes the following hardening steps discussed and integrated:

- Backend request hardening:
	- Strict URL input validation and normalization.
	- API and scan rate limits.
	- Request size limits.
	- Security headers via `helmet`.
	- CORS allow-list with explicit origin checks.
	- Optional API key authentication on sensitive routes.

- Backend resilience:
	- Safe ML fallback service when bridge/model is not available.
	- Request ID header (`X-Request-Id`) for traceability.
	- Controlled error responses for CORS and internal failures.

- Flask auth hardening:
	- Session cookie safety flags.
	- CSRF token injection and validation.
	- Login attempt throttling by client IP and time window.
	- Environment-based credential hashes with secure warnings on fallback.
	- Debug mode controlled by environment variable.

## 4) High-Level Architecture Flow

### URL scan flow

1. Client submits URL to backend (`/api/scan/url`).
2. Backend validates and normalizes URL.
3. Cache lookup is attempted.
4. URL features are extracted.
5. ML bridge returns prediction (or fallback is used).
6. Heuristics engine evaluates URL context.
7. Weighted risk score and verdict are produced.
8. Result is persisted in PostgreSQL and returned.

### File analysis flow (Flask side)

1. User uploads file via Flask app or Telegram bot.
2. File is stored in `AI_Agent_Bot/uploads`.
3. VirusTotal upload and polling run asynchronously.
4. Enriched report is assembled (hashes, metadata, stats, verdict narrative).
5. Report is exported as JSON, CSV, or TXT.

## 5) Repository Map

- `backend/`: API server, DB integration, route handlers, helper tests.
- `backend/lib/`: feature extraction, heuristics, decision logic.
- `node-ml-bridge/`: Node-to-Python ML integration layer.
- `AI_Agent_Bot/`: Flask app, Telegram bot, templates, static assets.
- `extension/`: browser extension background + UI pages.
- `ml/`: inference/training scripts and nested training workspace.
- `Model Training/`: legacy standalone model training workspace.
- `datasets/`: label/config data artifacts.
- `docs/`: API, architecture, and ML design documentation.
- `tests/`: project-level performance/accuracy test placeholders.
- `scripts/`: maintenance automation (including README generator).

For folder-level details and function listings, open each folder README.

## 6) Prerequisites

- Node.js 18+ recommended
- npm
- Python 3.10+ recommended
- PostgreSQL 14+ recommended
- VirusTotal API key (for Flask VT flow)
- Telegram bot token (for bot workflow)

## 7) Environment Configuration

### Backend environment (`backend/.env`)

Start from `backend/.env.example`.

Key variables:

| Variable | Purpose |
|---|---|
| `PORT` | Backend API port (default 3000) |
| `NODE_ENV` | Runtime mode |
| `API_KEY` | Optional API key for protected endpoints |
| `CORS_ALLOWED_ORIGINS` | Comma-separated CORS allow-list |
| `REQUEST_SIZE_LIMIT` | Max request body size |
| `RATE_LIMIT_MAX` | Global API requests per minute |
| `SCAN_RATE_LIMIT_MAX` | Scan requests per minute |
| `SCAN_CACHE_TTL_MS` | URL scan cache TTL |
| `SCAN_CACHE_MAX_ENTRIES` | Max cache size |
| `DATABASE_URL` | Optional single-string Postgres config |
| `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` | Postgres discrete config |
| `PGSSLMODE` | SSL mode (`require` for managed DBs) |

### Flask and bot environment (`AI_Agent_Bot/.env`)

Key variables used by current code:

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Flask session signing key |
| `SESSION_COOKIE_SECURE` | Enables secure cookie flag over HTTPS |
| `ADMIN_USERNAME` | Admin username key |
| `ADMIN_PASSWORD_HASH` | Admin password hash |
| `USER_USERNAME` | Optional user account username |
| `USER_PASSWORD_HASH` | Optional user account password hash |
| `MAX_LOGIN_ATTEMPTS` | Login failure cap per IP/window |
| `LOGIN_WINDOW_SEC` | Login rate-limit window |
| `VT_API_KEY` | VirusTotal API key |
| `FLASK_DEBUG` | Flask debug toggle |
| `BOT_TOKEN` | Telegram bot token |
| `SERVER_URL` | Bot target receive endpoint |
| `STATUS_URL` | Bot status endpoint |
| `EXPORT_URL` | Bot export endpoint |

## 8) How To Run The Whole Project

### Step A: Start backend API

```powershell
cd backend
npm install
Copy-Item .env.example .env
# Edit .env values
npm run dev
```

Backend default URL:
- `http://localhost:3000`

### Step B: Start Flask app

```powershell
cd AI_Agent_Bot
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Flask default URL:
- `http://127.0.0.1:5000/login`

### Step C: Start Telegram bot (optional)

```powershell
cd AI_Agent_Bot
.\.venv\Scripts\Activate.ps1
python bot.py
```

### Step D: Load extension (optional)

- Open browser extension developer mode.
- Load unpacked extension from `extension/`.
- Verify backend URL/API key settings in extension runtime if needed.

## 9) Backend API Quick Map

Public/operational endpoints:

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Service and dependency health |
| GET | `/api/security/status` | Effective security runtime settings |
| POST | `/api/scan/url` | Single URL analysis |
| POST | `/api/scan/bulk` | Bulk URL analysis (max 50) |
| POST | `/api/scan/file` | Placeholder (501 Not Implemented) |
| GET | `/api/scans` | Paginated scan history |
| GET | `/api/scans/:scanId` | Specific scan details |
| GET | `/api/model/info` | Model metadata and performance rows |
| POST | `/api/debug/features` | Feature extraction debug output |

Auth note:
- If `API_KEY` is set, include `X-API-Key` for `/api/scan*`, `/api/scans*`, `/api/model/*`, and `/api/debug/*`.

## 10) Flask Web Routes Quick Map

| Route | Method(s) | Purpose |
|---|---|---|
| `/login` | GET, POST | User login with CSRF and throttling |
| `/logout` | GET | Session clear/logout |
| `/` | GET | Main dashboard (auth required) |
| `/admin` | GET | Admin dashboard (admin only) |
| `/receive` | POST | Bot/webhook ingest endpoint |
| `/upload` | POST | Web upload endpoint |
| `/data` | GET | Raw item feed |
| `/status/<item_id>` | GET | Item status polling |
| `/export/<item_id>` | GET | Report export (json/csv/txt) |
| `/suggest` | GET | Query suggestions |
| `/uploads/<filename>` | GET | Download uploaded file |

## 11) Testing And Validation

Backend tests:

```powershell
cd backend
npm test
npm run test:coverage
```

Current backend test focus:
- URL normalization and validation behavior.
- Score and verdict helper logic.
- Security-related endpoint behavior.
- Feature extraction behavior on valid and malformed input.

## 12) Data, Models, And Training Notes

- URL detection pipeline currently drives production behavior.
- File scan endpoint in backend is still intentionally not implemented.
- ML bridge supports fallback behavior for uptime resilience.
- Training scripts under `ml/training/` include advanced/hybrid experimental pipelines.
- Legacy or alternate training assets are also present in `Model Training/`.

## 13) Operational Status And Known Gaps

Current strengths:
- Hardened backend boundary controls and resilient runtime behavior.
- Auth and CSRF protections added in Flask login flow.
- End-to-end documentation coverage at folder and function level.

Known gaps:
- Backend file scanning route is a placeholder (`501`).
- Some training scripts are research-grade and may need cleanup before production retraining.
- Browser extension still relies on manifest v2, which has ecosystem migration constraints depending on target browser.

## 14) Troubleshooting Quick Checklist

If backend is not returning predictions:
- Check `backend/.env` database and CORS values.
- Confirm ML bridge files exist in `node-ml-bridge/`.
- Check backend logs for fallback mode message.

If Flask login fails repeatedly:
- Verify CSRF token is included from login page form.
- Check `MAX_LOGIN_ATTEMPTS` and `LOGIN_WINDOW_SEC`.
- Confirm password hashes are valid if env-based credentials are used.

If Telegram bot cannot export:
- Verify `SERVER_URL`, `STATUS_URL`, and `EXPORT_URL`.
- Ensure Flask app is running and reachable from bot runtime.

If extension cannot connect to backend:
- Ensure backend CORS allows the required origin.
- Ensure API key headers are provided when backend `API_KEY` is enabled.

## 15) Documentation Index

- API details: `docs/api_documentation.md`
- Architecture: `docs/architecture.md`
- ML model details: `docs/ml_model_details.md`
- Folder/function-level docs: `README.md` files in each directory

## 16) Maintainer Note

The script `scripts/generate_readmes.ps1` is used for folder-level README generation.
Use it when folder contents change, then keep this root guide focused on end-to-end architecture and operations.

## 17) Detailed Module-Level Breakdown

### 17.1 Backend Internal Modules

#### URL Processing Pipeline

* Input sanitation
* Protocol normalization (`http` → `https` fallback handling)
* Domain extraction
* Query parameter analysis
* Entropy calculation for suspicious strings

#### Feature Extraction Includes

* URL length
* Special character ratio
* Subdomain depth
* Presence of IP address instead of domain
* Suspicious keywords (login, verify, secure, update)

#### Heuristics Engine

* Rule-based scoring system
* Weighted signals:

  * Blacklist match → high weight
  * Suspicious TLD → medium weight
  * Random string patterns → medium weight
* Combines with ML output

---

### 17.2 ML Bridge Deep Dive

#### Responsibilities

* Model loading
* Feature scaling
* Prediction inference
* Confidence scoring

#### Failure Handling

* If Python script fails:

  * Return fallback prediction
  * Log error for observability
* Timeout protection implemented

#### Model Types Supported

* Logistic Regression (baseline)
* Random Forest
* Gradient Boosting (future-ready)

---

### 17.3 Flask App Internal Flow

#### Authentication Flow

1. User submits login form
2. CSRF token validated
3. Password hash checked
4. Session created
5. Role assigned (admin/user)

#### File Upload Pipeline

1. File received
2. Filename sanitized
3. Stored in uploads directory
4. Hash (SHA256) generated
5. Sent to VirusTotal
6. Polling loop initiated

---

### 17.4 Telegram Bot Workflow

* Receives file via chat
* Sends to Flask backend
* Polls status endpoint
* Sends result summary to user
* Provides export links

---

## 18) Database Schema Design (PostgreSQL)

### Tables Overview

#### scans

| Column     | Type      | Description    |
| ---------- | --------- | -------------- |
| id         | UUID      | Unique scan ID |
| url        | TEXT      | Submitted URL  |
| verdict    | VARCHAR   | Safe/Malicious |
| score      | FLOAT     | Risk score     |
| created_at | TIMESTAMP | Scan time      |

---

#### features

| Column       | Type  | Description |
| ------------ | ----- | ----------- |
| id           | UUID  | Feature ID  |
| scan_id      | UUID  | Reference   |
| feature_name | TEXT  | Name        |
| value        | FLOAT | Value       |

---

#### logs

| Column    | Type      | Description |
| --------- | --------- | ----------- |
| id        | UUID      | Log ID      |
| message   | TEXT      | Log message |
| level     | VARCHAR   | INFO/ERROR  |
| timestamp | TIMESTAMP | Time        |

---

## 19) API Request/Response Examples

### URL Scan Request

```json
POST /api/scan/url
{
  "url": "http://example.com/login"
}
```

### Response

```json
{
  "verdict": "malicious",
  "score": 0.87,
  "features": {
    "length": 120,
    "entropy": 4.5
  }
}
```

---

## 20) Error Handling Strategy

### Backend Errors

* 400 → Invalid input
* 401 → Unauthorized
* 429 → Rate limit exceeded
* 500 → Internal error

### Flask Errors

* CSRF failure → 403
* Login blocked → 429
* File too large → 413

---

## 21) Logging and Monitoring

### Logging Levels

* INFO → Normal operations
* WARN → Suspicious activity
* ERROR → Failures

### Suggested Tools

* Winston (Node.js logging)
* ELK Stack (future)
* Prometheus + Grafana

---

## 22) Performance Optimization

### Backend

* Caching scan results
* Async processing
* DB indexing on scan_id

### Flask

* Background polling instead of blocking
* File size limits

---

## 23) Security Enhancements (Future Scope)

* JWT-based authentication
* OAuth integration
* File sandbox execution
* Real-time threat intelligence APIs

---

## 24) Browser Extension Future Improvements

* Manifest v3 migration
* Real-time URL blocking
* Phishing page detection overlay
* User feedback loop

---

## 25) ML Improvements Roadmap

* Deep learning models
* NLP-based URL analysis
* Ensemble learning
* Continuous retraining pipeline

---

## 26) Deployment Strategy

### Recommended Setup

* Backend → Docker container
* Flask → Gunicorn + Nginx
* Database → Managed PostgreSQL
* ML → Separate service container

---

## 27) CI/CD Pipeline

Steps:

1. Code push
2. Run tests
3. Build Docker images
4. Deploy to server
5. Health check

---

## 28) Risk Analysis

| Risk             | Mitigation       |
| ---------------- | ---------------- |
| ML model failure | Fallback system  |
| API abuse        | Rate limiting    |
| Data leak        | Secure headers   |
| Bot misuse       | Token validation |

---

## 29) Testing Strategy

### Unit Testing

* Feature extraction
* API endpoints

### Integration Testing

* Backend + ML bridge
* Flask + VirusTotal

### Manual Testing

* Extension UI
* Telegram bot

---

## 30) Real-World Use Cases

* Phishing detection
* Malware file analysis
* Enterprise security dashboards
* Browser protection tools

---

## 31) Advantages of This System

* Modular architecture
* Scalable design
* Multi-platform support
* ML + heuristic hybrid detection

---

## 32) Limitations

* File scan backend not implemented
* ML model accuracy depends on dataset
* Extension limited by browser policies

---

## 33) Future Scope Summary

* Full SIEM integration
* Real-time streaming analysis
* AI-powered threat intelligence
* Cloud-native scaling

---

## 34) Conclusion

SecureSight-AI represents a **complete cybersecurity ecosystem** combining:

* Backend intelligence
* Machine learning
* User-facing tools
* Automation workflows

It is designed to be:

* Scalable
* Secure
* Extensible
