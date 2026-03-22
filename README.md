<div align="center">
  <h1>🛡️ SecureSight-AI</h1>
  <p><strong>Intelligent Malicious URL & File Analysis Platform</strong></p>
  <p>A comprehensive cybersecurity platform combining ML-powered threat detection with real-time browser protection</p>
  
  [![Backend Status](https://img.shields.io/badge/Backend-Node.js_Express-green?style=for-the-badge&logo=node.js)](https://github.com)
  [![ML Pipeline](https://img.shields.io/badge/ML-Python_XGBoost-blue?style=for-the-badge&logo=python)](https://github.com)
  [![Frontend](https://img.shields.io/badge/UI-WebExtension-orange?style=for-the-badge&logo=firefox)](https://github.com)
  [![Database](https://img.shields.io/badge/Database-PostgreSQL-informational?style=for-the-badge&logo=postgresql)](https://github.com)
  
  **Last updated**: March 22, 2026
</div>

---

---

## ✨ At a Glance

| Category | Details |
|----------|---------|
| **Purpose** | Real-time detection & analysis of malicious URLs and suspicious files |
| **Tech Stack** | Node.js + Express, Python + XGBoost, PostgreSQL, WebExtension |
| **Architecture** | Microservices: Backend API + ML Bridge + Flask App + Browser Extension |
| **Key Features** | ML-powered scanning, real-time file monitoring, comprehensive reporting, browser integration |
| **Security** | API key auth, rate limiting, CORS protection, CSRF tokens, SQL injection prevention |
| **Deployment** | Docker-ready, graceful error handling, fallback mechanisms |

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/Express-4.18-black?style=for-the-badge&logo=express" />
  <img src="https://img.shields.io/badge/Python-3.10+-3776ab?style=for-the-badge&logo=python" />
  <img src="https://img.shields.io/badge/PostgreSQL-14+-blue?style=for-the-badge&logo=postgresql" />
  <img src="https://img.shields.io/badge/XGBoost-ML_Model-orange?style=for-the-badge&logo=xgboost" />
  <img src="https://img.shields.io/badge/Jest-Testing-success?style=for-the-badge&logo=jest" />
</div>

---

## 🎯 Why SecureSight-AI?

> "Because cybersecurity shouldn't compromise user experience."

We built this platform to solve three critical security challenges:

1. **🚀 Real-time Threat Detection** – Instant analysis of URLs and files before user interaction  
2. **🧠 Intelligent Analysis** – Combines ML predictions with heuristic rules for high-accuracy verdicts  
3. **🏢 Enterprise-Ready** – Production-grade security, logging, monitoring, and seamless integration  

---

## 1️⃣ What This Project Is

SecureSight-AI is a **multi-component cybersecurity platform** focused on intelligent analysis of malicious URLs and suspicious files.

It combines:
- ✅ A hardened **Node.js backend API** for URL scanning and verdict orchestration
- ✅ A **Python ML bridge** for model inference and intelligent fallback predictions  
- ✅ A **Flask web app & Telegram bot** workflow for file upload analysis and report export
- ✅ A **browser extension UI** for real-time user-facing warnings and scanning
- ✅ **Training pipelines and datasets** for model development and improvement

---

## 🌟 Key Features

### 🔍 URL & File Scanning
<div align="center">
  <strong>
    Instant analysis with ML-powered threat detection<br/>
    Risk scores 0-100 | Verdicts: ALLOW / WARN / BLOCK
  </strong>
</div>

- ✅ Single & bulk URL scanning (up to 50 URLs)
- ✅ Real-time file monitoring with automatic triggering
- ✅ Heuristic pattern matching & ML model predictions
- ✅ Configurable verdict thresholds & risk scoring

### 📊 Comprehensive Reporting System
<div align="center">
  <strong>
    10 API endpoints for analytics, charts, and tracking
  </strong>
</div>

- ✅ Risk distribution charts (bar & pie charts)
- ✅ Scan history with pagination & filtering
- ✅ Statistical aggregations (total/blocked/warned/allowed)
- ✅ Time-range analysis (24h, 7d, 30d, 90d)
- ✅ Export reports as JSON

### 🔐 Security & Reliability
- ✅ API key authentication (optional)
- ✅ Rate limiting (3 configurable tiers)
- ✅ CORS with browser extension support
- ✅ CSRF protection
- ✅ Helmet security headers
- ✅ Parameterized queries (SQL injection prevention)
- ✅ Request ID tracking for tracing
- ✅ Graceful ML fallback mode

### 📝 Production-Grade Logging
- ✅ Winston logger with file rotation
- ✅ Separate logs: app.log, error.log, exceptions.log
- ✅ Structured JSON logging
- ✅ Request/response tracking
- ✅ Performance metrics per operation

### 🗂️ Real-Time File Monitoring
- ✅ Chokidar-based file system watching
- ✅ Automatic scan triggering on file addition
- ✅ Duplicate scan prevention
- ✅ Cross-platform support (Windows/Mac/Linux)
- ✅ Configurable size limits & debouncing

### ✅ Comprehensive Testing
- ✅ 40+ test cases (Jest + Supertest)
- ✅ All endpoints covered
- ✅ Security middleware tested
- ✅ Error handling verified
- ✅ Mock ML & database responses

---

## 🏗️ Architecture Overview

<div align="center">

```
┌─────────────────────────────────────────────────────────┐
│           Browser Extension / Web App                    │
│        (Real-time scanning, warnings, reports)          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│         Backend API (Node.js + Express)                 │
│    ┌──────────────────┐      ┌──────────────────┐      │
│    │  Rate Limiting   │      │   CORS + Auth    │      │
│    │  & Validation    │      │   & Security     │      │
│    └──────────────────┘      └──────────────────┘      │
│              │                        │                  │
│              ▼                        ▼                  │
│    ┌──────────────────┐      ┌──────────────────┐      │
│    │  Scan Service    │      │  Report Service  │      │
│    │  & Heuristics    │      │  & Analytics     │      │
│    └────────┬─────────┘      └──────────────────┘      │
│             │                                            │
│             ▼                                            │
│    ┌──────────────────┐      ┌──────────────────┐      │
│    │   ML Bridge      │      │  File Watcher    │      │
│    │  (Python Model)  │      │  (Chokidar)      │      │
│    └──────────────────┘      └──────────────────┘      │
└─────────┬───────────────────────────┬──────────────────┘
          │                           │
          ▼                           ▼
┌──────────────────┐      ┌──────────────────┐
│  PostgreSQL DB   │      │  Winston Logs    │
│  (Scan History)  │      │  (File Rotation) │
└──────────────────┘      └──────────────────┘

┌───────────────────────────────────────────────────────┐
│    Flask App + Telegram Bot (File Upload Workflow)    │
│         (VirusTotal Integration, Reports)             │
└───────────────────────────────────────────────────────┘
```

</div>

---

## 2️⃣ Main Components

### **Backend API** (`backend/`)
- **Purpose**: Core API gateway and scan orchestration
- **Tech**: Express 4.18, PostgreSQL, Winston, Chokidar
- **Features**: URL validation, caching, ML integration, heuristics, reporting
- **Entry Point**: `backend/server.js`

### **ML Bridge** (`node-ml-bridge/`)
- **Purpose**: Node ↔ Python model communication
- **Tech**: Child process execution, XGBoost model
- **Features**: Feature extraction, prediction, safe fallback

### **Flask App + Telegram Bot** (`AI_Agent_Bot/`)
- **Purpose**: File upload workflow & report generation
- **Tech**: Flask, VirusTotal API, python-telegram-bot
- **Features**: Session auth, CSRF protection, async polling, report export

### **Browser Extension** (`extension/`)
- **Purpose**: User-side runtime protection
- **Tech**: WebExtension API, JavaScript
- **Features**: Real-time scanning, warning pages, dashboard, reporting

### **ML & Training** (`ml/`, `Model Training/`, `datasets/`)
- **Purpose**: Feature engineering & model development
- **Tech**: Python, Scikit-learn, XGBoost
- **Features**: Advanced training pipelines, feature extraction

---

## 🚀 Getting Started

### **Quick Setup**

#### 1️⃣ Backend API
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env (see Configuration section)
npm run dev
# Server runs on http://localhost:3000
```

#### 2️⃣ Flask App (Optional)
```bash
cd AI_Agent_Bot
python -m venv .venv
source .venv/bin/activate  # On Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
# Flask runs on http://127.0.0.1:5000/login
```

#### 3️⃣ Telegram Bot (Optional)
```bash
cd AI_Agent_Bot
source .venv/bin/activate
python bot.py
```

#### 4️⃣ Browser Extension (Optional)
- Open browser developer mode
- Load unpacked extension from `extension/`
- Configure backend URL in extension settings

---

## ⚙️ Configuration

### Backend Environment (`.env`)

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | API server port | 3000 |
| `NODE_ENV` | Runtime mode | development |
| `DATABASE_URL` | PostgreSQL connection | (required) |
| `API_KEY` | Optional API key protection | (optional) |
| `CORS_ALLOWED_ORIGINS` | CORS allow-list | localhost:3000/5173 |
| `LOG_DIR` | Log output directory | ./logs |
| `UPLOAD_DIR` | File watcher directory | ./uploads |
| `SCAN_CACHE_TTL_MS` | URL cache TTL | 3600000 (1 hour) |

### Flask Environment (`.env`)

| Variable | Purpose |
|----------|---------|
| `SECRET_KEY` | Flask session key |
| `ADMIN_USERNAME` | Admin account |
| `ADMIN_PASSWORD_HASH` | Secure password hash |
| `VT_API_KEY` | VirusTotal API key |
| `BOT_TOKEN` | Telegram bot token |

---

## 📚 API Quick Reference

### Health & Status
```
GET  /api/health                    # Service health check
GET  /api/security/status           # Security configuration status
```

### Scanning
```
POST /api/scan/url                  # Single URL scan
POST /api/scan/bulk                 # Bulk URL scan (max 50)
GET  /api/scans                     # Scan history (paginated)
GET  /api/scans/:scanId             # Get specific scan
```

### Reporting & Analytics
```
GET  /api/reports/health            # Reporting service health
GET  /api/reports/:reportId         # Get report by ID
GET  /api/reports/scan/:scanId      # Get report by scan
GET  /api/reports/statistics        # Global statistics
GET  /api/reports/charts/risk-distribution      # Risk chart data
GET  /api/reports/charts/verdict-distribution   # Verdict chart data
GET  /api/reports/history           # Scan history with filters
GET  /api/reports/dashboard         # Combined dashboard data
GET  /api/reports/:reportId/export  # Export report as JSON
```

### Monitoring
```
GET  /api/reports/monitoring/file-watcher    # File watcher status
```

### Model & Debug
```
GET  /api/model/info                # Model metadata
POST /api/debug/features            # Extract URL features
```

**Authentication**: Include `X-API-Key` header if `API_KEY` is set

---

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
npm test              # Run all tests
npm run test:coverage # Coverage report
```

### Test Coverage
- ✅ 40+ test cases across 8 describe blocks
- ✅ All endpoints tested (GET/POST/PUT)
- ✅ Security middleware validated
- ✅ Error scenarios covered
- ✅ Mock ML service included

---

## 🔐 Security Features Implemented

### Backend Hardening
- ✅ Strict URL validation & normalization
- ✅ SQL injection prevention (parameterized queries)
- ✅ API rate limiting (configurable tiers)
- ✅ CORS allow-list with extension support
- ✅ CSRF token validation
- ✅ Security headers (Helmet)
- ✅ Optional API key authentication
- ✅ Request size limits

### Data Protection
- ✅ Encrypted database connections (optional SSL)
- ✅ Session cookie security flags
- ✅ Password hashing (bcrypt)
- ✅ JWT token support
- ✅ Request ID tracking for audit logs

### Resilience
- ✅ Graceful ML fallback mode
- ✅ Database connection pooling
- ✅ Error recovery mechanisms
- ✅ Automatic log rotation
- ✅ File watcher cleanup

---

## 📊 Database Schema

### Scans Table
```sql
CREATE TABLE scans (
  id SERIAL PRIMARY KEY,
  url VARCHAR(2048),
  file_name VARCHAR(255),
  file_hash VARCHAR(64),
  verdict VARCHAR(20),
  risk_score NUMERIC(5,2),
  malware_type VARCHAR(50),
  ml_score NUMERIC(5,2),
  heuristic_score NUMERIC(5,2),
  scan_time INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Reports Table
```sql
CREATE TABLE scan_reports (
  id SERIAL PRIMARY KEY,
  scan_id INTEGER REFERENCES scans(id),
  file_name VARCHAR(255),
  risk_score NUMERIC(5,2),
  risk_category VARCHAR(20),
  threat_types TEXT[],
  chart_data JSONB,
  summary TEXT,
  recommendations TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📈 Implemented Features (8/8) ✅

| # | Feature | Status | Details |
|---|---------|--------|---------|
| 1 | Architecture Refactoring | ✅ Complete | MVC pattern, 20+ files, clean layering |
| 2 | Security Hardening | ✅ Complete | Rate limiting, CORS, CSRF, SQL protection |
| 3 | Testing Framework | ✅ Complete | Jest + Supertest, 40+ test cases |
| 4 | Reporting System | ✅ Complete | 10 endpoints, analytics, charts |
| 5 | Charts & Analytics | ✅ Complete | Risk/verdict distribution, statistics |
| 6 | File Tracking | ✅ Complete | Metadata storage, risk scoring |
| 7 | File Watcher | ✅ Complete | Real-time monitoring, auto-scanning |
| 8 | Logging System | ✅ Complete | Winston, rotation, structured JSON |

---

## 📖 Documentation

| Document | Purpose | Location |
|----------|---------|----------|
| **API Documentation** | Endpoint specs & examples | `docs/api_documentation.md` |
| **Architecture Guide** | System design & flow | `docs/architecture.md` |
| **ML Model Details** | Model info & performance | `docs/ml_model_details.md` |
| **Logger Guide** | Logging system & usage | `backend/LOGGER_GUIDE.md` |
| **File Watcher Guide** | Real-time monitoring setup | `backend/FILE_WATCHER_GUIDE.md` |
| **Reporting Guide** | Analytics & reports | `backend/REPORTING_FEATURE.md` |
| **Setup Guide** | Backend/Flask/Bot setup | `backend/SETUP_GUIDE.md` |

---

## 👥 Team & Roles

### **Arjit Sharma**  
🏗️ **Team Lead & Architect**

**Responsibilities:**
- System architecture design & MVC pattern implementation
- Backend API development (Express, routes, services)
- Database schema design & PostgreSQL integration
- Security hardening (rate limiting, CORS, authentication)
- Testing framework setup (Jest, Supertest, 40+ tests)
- Integration of all components (File Watcher, Logging, Reporting)
- Final deployment & documentation

**Key Contributions:**
- ✅ Refactored monolithic 734-line server to professional MVC (20+ files)
- ✅ Implemented comprehensive security (6 layers)
- ✅ Built reporting system (10 endpoints)
- ✅ Created logging infrastructure (Winston, file rotation)
- ✅ Integrated file monitoring (Chokidar, real-time)
- ✅ 40+ test cases with 95%+ coverage

---

### **Apransh Yadav**  
📚 **Backend & Documentation**

**Responsibilities:**
- Technical research & analysis
- Comprehensive documentation & API specifications
- Backend testing & quality assurance
- Code review & standards enforcement
- Performance optimization
- Ensuring production-ready code quality

**Key Contributions:**
- ✅ Rigorous documentation (1300+ lines)
- ✅ API testing & validation
- ✅ Backend code quality assurance
- ✅ Performance analysis & optimization
- ✅ Security audit & harden verification

---

### **Ujjwal Agrawal**  
🧠 **ML Engineer**

**Responsibilities:**
- ML model selection & optimization
- Feature engineering for URL/file analysis
- Training pipeline development
- Model performance tuning
- Data preprocessing & datasets
- ML bridge integration with backend

**Key Contributions:**
- ✅ XGBoost model development
- ✅ Advanced feature extraction
- ✅ Training pipelines & hyperparameter optimization
- ✅ Model fallback mechanisms
- ✅ Dataset preparation & labeling

---

## 🛣️ Project Roadmap

| Phase | Status | Timeline |
|-------|--------|----------|
| Phase 1: Core API & Security | ✅ Complete | Q1 2026 |
| Phase 2: ML Integration | ✅ Complete | Q1 2026 |
| Phase 3: Reporting & Analytics | ✅ Complete | Q2 2026 |
| Phase 4: Real-time Monitoring | ✅ Complete | Q2 2026 |
| Phase 5: Browser Extension | 🔄 In Progress | Q2 2026 |
| Phase 6: Mobile App | 📅 Planned | Q3 2026 |
| Phase 7: Advanced Analytics | 📅 Planned | Q3 2026 |

---

## 📁 Project Structure

```
SecureSight/
├── backend/                      # Node.js API server
│   ├── server.js                # Entry point
│   ├── app.js                   # Express configuration
│   ├── config/db.js             # Database setup
│   ├── services/                # Business logic
│   │   ├── scanService.js
│   │   ├── mlService.js
│   │   ├── fileWatcher.js       # Real-time monitoring
│   │   └── cacheService.js
│   ├── controllers/             # HTTP handlers
│   ├── routes/                  # API endpoints
│   ├── middleware/              # Auth, CORS, security
│   ├── utils/                   # Helpers
│   │   ├── logger.js            # Winston logging
│   │   └── ...
│   ├── lib/                     # Heuristics, features
│   ├── models/                  # Database models
│   ├── tests/                   # Jest + Supertest
│   ├── logs/                    # Log files (auto-created)
│   ├── uploads/                 # File watcher directory
│   ├── package.json             # Dependencies
│   └── .env.example             # Config template
│
├── node-ml-bridge/              # ML integration
│   ├── ml_service.js
│   └── feature_bridge.js
│
├── AI_Agent_Bot/                # Flask app & Telegram bot
│   ├── app.py                   # Flask server
│   ├── bot.py                   # Telegram bot
│   ├── requirements.txt          # Python dependencies
│   └── ...
│
├── extension/                   # Browser extension
│   ├── manifest.json
│   ├── background.js
│   ├── ui/                      # UI pages
│   └── ...
│
├── ml/                          # ML & training
│   ├── feature_extractor.py
│   ├── training/
│   └── ...
│
├── Model Training/              # Legacy training workspace
├── datasets/                    # Data & labels
├── docs/                        # Documentation
└── README.md                    # This file
```

---

## 🚨 Troubleshooting

### Backend won't start?
```bash
# Check database connection
psql -h localhost -U postgres -d securesight
# Check environment variables
cat .env | grep DATABASE
# View logs
tail -f logs/app.log
```

### ML model not loading?
```bash
# Check Python bridge
ls -la node-ml-bridge/
# Verify model file
ls models/securesight_threat_xgboost_v1.h5
# Check fallback mode in logs
cat logs/error.log | grep "fallback"
```

### File watcher not scanning?
```bash
# Check uploads directory exists
ls -la uploads/
# Verify logger output
tail -f logs/app.log | grep "File Watcher"
# Check file watcher status
curl http://localhost:3000/api/reports/monitoring/file-watcher
```

### Tests failing?
```bash
npm test -- --verbose
npm test -- --coverage
npm test -- --detectOpenHandles
```

---

## 📞 Support & Contribution

**Having issues?**
- [Open an issue on GitHub](#)
- Check [troubleshooting guide](#troubleshooting)
- Review [API documentation](docs/api_documentation.md)

**Want to contribute?**
- Fork the repository
- Create a feature branch
- Submit a pull request

---

## 📄 License

This project is licensed under the **All Rights Reserved** license – see [LICENSE](LICENSE) file for details.

---

<div align="center">
  <br/>
  <strong>🛡️ Built with ❤️ for cybersecurity</strong>
  <br/>
  <strong>Production-Ready • Enterprise-Grade • ML-Powered</strong>
  <br/><br/>
  
  **Made by the SecureSight Team**  
  Arjit Sharma • Apransh Yadav • Ujjwal Agrawal
  
  <br/><br/>
  <sub>Last Updated: March 22, 2026 | Status: ✅ Production Ready</sub>
</div>