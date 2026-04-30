# 🛠️ GuardianLink - Tech Stack Overview

## Executive Summary

GuardianLink is a **full-stack security application** combining:
- **Browser Extension** (Firefox/Chrome compatible)
- **React-based Web Dashboard**
- **Node.js Backend API**
- **PostgreSQL Database**

---

## 📱 FRONTEND STACK

### Browser Extension (Client-Side Security)

#### 1. **Firefox WebExtension API** (Core Framework)
- **Version**: Manifest V2 (Firefox 140+)
- **Role**: Enables low-level browser integration
  - Intercepts all URL navigation (`webNavigation` API)
  - Manages browser tabs and permissions
  - Shows browser notifications
  - Access to storage and context menus
- **Key Features**:
  - Content scripts run on every website
  - Background service worker persists across sessions
  - Sandbox security model prevents XSS attacks

#### 2. **JavaScript (ES6+)**
- **Role**: Core scripting language for extension logic
- **Files**: 
  - `background.js` - Main service worker (931 lines)
  - `content.js` - Page-level security checks
  - `notification-config.js` - Settings management
  - UI scripts in `/ui` folder
- **Key Libraries**:
  - **DOMPurify** (v2.x) - XSS protection for HTML rendering

#### 3. **HTML5 & CSS3**
- **UI Pages**:
  - `dashboard.html` - Extension popup (statistics, logs, settings)
  - `scanner.html` - Real-time scan progress viewer
  - `warning.html` - Malicious URL warning page
- **Purpose**: User interface for threat warnings and statistics

#### 4. **Browser Storage API**
- **Role**: Persistent data storage
- **Stores**:
  - User settings and preferences
  - Notification configuration
  - Scan history/logs
  - Whitelisted/blacklisted URLs
  - Bypass decisions (5-minute duration)

---

### Web Dashboard (Frontend)

#### 1. **React 18** (UI Framework)
- **Role**: Modern component-based UI architecture
- **Files**: `/website/src` directory
- **Key Components**:
  - `App.tsx` - Root application component
  - `URLScanner.tsx` - Main scanning interface
  - `ScanPhase.tsx` - Real-time progress tracking
  - `RiskScore.tsx` - Threat level visualization

#### 2. **TypeScript**
- **Role**: Type-safe JavaScript superset
- **Files**: All `.tsx` files use strict typing
- **Benefits**: Prevents runtime errors, better IDE support

#### 3. **Vite** (Build Tool)
- **Version**: Latest (vite.config.ts configured)
- **Role**: Fast development server and optimized builds
- **Commands**:
  - `npm run dev` - Development mode with HMR
  - `npm run build` - Production bundle
- **Output**: Optimized static files for deployment

#### 4. **Tailwind CSS** (Styling Framework)
- **Version**: Latest (tailwind.config.js configured)
- **Role**: Utility-first CSS for rapid UI development
- **Features**:
  - Responsive design
  - Dark mode support
  - Custom theme configuration
  - PostCSS integration (postcss.config.js)

#### 5. **Shadcn/UI** (Component Library)
- **Role**: Pre-built, accessible React components
- **Components Used**:
  - Accordion, Dialog, Button, Card, Badge
  - Form elements (Input, Select, Checkbox, Toggle)
  - Navigation components
  - Data display (Table, Progress, Chart)
- **Built On**: Radix UI + Tailwind CSS

#### 6. **Radix UI** (Headless Components)
- **Role**: Unstyled, accessible component primitives
- **Provides**: Alert Dialog, Context Menu, Popover, Tabs, etc.
- **Benefit**: Full accessibility (ARIA attributes)

#### 7. **React Hook Form**
- **Role**: Efficient form state management
- **Purpose**: Handle scan parameters and user input
- **Benefits**: Low re-renders, minimal bundle size

---

## 🔙 BACKEND STACK

### Server Framework

#### 1. **Node.js** (Runtime)
- **Version**: LTS (18.x or higher recommended)
- **Role**: JavaScript runtime for server-side logic
- **Deployment**: Render.com (cloud hosting)

#### 2. **Express.js** (Web Framework)
- **Version**: 4.18.2
- **Role**: HTTP server and routing
- **Features**:
  - RESTful API endpoints (`/api/scan`, `/api/scan/result/:id`)
  - Middleware pipeline (CORS, rate limiting, authentication)
  - Static file serving
- **Key Endpoints**:
  - `POST /api/scan` - Initiate URL scan
  - `GET /api/scan/result/:scanId` - Poll scan results
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/login` - User authentication

#### 3. **CORS** (Cross-Origin Resource Sharing)
- **Version**: 2.8.5
- **Role**: Safely allow requests from extension
- **Security**: Whitelist specific origins

#### 4. **Express Rate Limit**
- **Version**: 6.7.0
- **Role**: DDoS protection and API abuse prevention
- **Applied To**: Scan endpoint (prevents spam scanning)

---

### Data & Authentication

#### 1. **PostgreSQL** (Database)
- **Version**: 12+
- **Role**: Persistent data storage
- **Tables**:
  - `users` - User accounts and authentication
  - `scans` - Historical URL scans
  - `blacklist` - Known malicious domains
  - `rules` - Custom detection rules
  - `heuristics` - ML-based threat patterns
- **Features**: ACID compliance, JSON support, full-text search

#### 2. **node-postgres (pg)** (Database Driver)
- **Version**: 8.11.3
- **Role**: Connect Node.js to PostgreSQL
- **Features**: Connection pooling, parameterized queries (SQL injection protection)

#### 3. **JWT (JSON Web Tokens)** (Authentication)
- **Library**: jsonwebtoken 9.0.2
- **Role**: Stateless user authentication
- **Flow**:
  - User logs in → JWT token issued
  - Extension includes token in API requests
  - Backend validates token signature
  - Protected endpoints verify token

#### 4. **dotenv** (Environment Configuration)
- **Version**: 16.3.1
- **Role**: Manage sensitive configuration
- **Stores**: API keys, database URLs, JWT secrets
- **Security**: `.env` not committed to git

---

### Security & Analysis

#### 1. **DOMPurify** (XSS Protection)
- **Version**: Latest
- **Role**: Sanitize HTML before rendering
- **Used In**: Warning pages, dashboard
- **Prevents**: Script injection attacks

#### 2. **VirusTotal API Integration**
- **Role**: Cloud antivirus scanning
- **Purpose**: Check URL against 90+ antivirus engines
- **Data Points**: Malicious vote counts, last analysis date

#### 3. **AbuseIPDB Integration**
- **Role**: IP reputation database
- **Purpose**: Check if IP address is reported for malicious activity

#### 4. **Custom Heuristics Engine** (RulesManager)
- **File**: `/backend/lib/heuristicsManager.js`
- **Role**: Offline URL pattern analysis
- **Detects**:
  - Phishing keywords (login, verify, password, etc.)
  - Typosquatting (g00gle, amaz0n, etc.)
  - URL obfuscation (encoding, punycode)
  - Suspicious domain structure
  - IP addresses instead of domains
  - Suspicious TLDs

#### 5. **URL Rules Engine** (URLRules)
- **File**: `/extension/rules/urlRules.js`
- **Role**: Client-side pattern matching
- **Purpose**: Fast local detection before backend call

#### 6. **Domain Reputation System**
- **File**: `/extension/reputation/domainReputation.js`
- **Role**: Maintains blacklist of known malicious domains
- **Data**: Local `blacklist.json` file

---

## 🔄 ARCHITECTURE FLOW

### Data Flow: User Navigation to Threat Verdict

```
┌─────────────────────────────────────────────────────────┐
│ 1. USER NAVIGATES TO URL                               │
│    (Firefox navigation event)                           │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ 2. CONTENT SCRIPT (content.js)                         │
│    - Shows loading overlay                             │
│    - Blocks all interactions                           │
│    - Extracts URL from navigation event                │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ 3. BACKGROUND WORKER (background.js)                   │
│    - Checks browser storage for whitelisted URL        │
│    - Runs local analysis (RuleEngine)                  │
│    - Checks domain reputation (blacklist.json)         │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ 4. BACKEND API (Express.js)                            │
│    POST /api/scan → server.js                          │
│    - Receives URL scan request                         │
│    - Calls VirusTotal API                              │
│    - Queries PostgreSQL for history                    │
│    - Runs Heuristics Engine                            │
│    - Returns scanId for polling                        │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ 5. EXTERNAL APIS                                       │
│    - VirusTotal (antivirus database)                   │
│    - AbuseIPDB (IP reputation)                         │
│    - SSL/TLS certificate validation                    │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ 6. DECISION ENGINE (decisionEngine.js)                 │
│    - Combines all threat factors                       │
│    - Calculates risk score (0-100)                     │
│    - Determines verdict:                               │
│      • BLOCK (>75 risk score)                          │
│      • WARN (35-75 risk score)                         │
│      • ALLOW (<35 risk score)                          │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ 7. NOTIFICATION SYSTEM (notification-config.js)        │
│    - Shows Firefox desktop notification                │
│    - 🛑 Red popup for BLOCK                            │
│    - ⚠️  Orange popup for WARN                         │
│    - ✅ Green popup for ALLOW (optional)               │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ 8. USER DECISION                                       │
│    - ALLOW: Navigate to URL / Remove overlay           │
│    - WARN: Show warning page / Allow bypass            │
│    - BLOCK: Prevent navigation / Show decision page    │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Extension Sandbox** | Firefox WebExtension | Isolated execution environment |
| **Content Script Isolation** | Browser Content Scripts | Separate from page JavaScript |
| **Storage Encryption** | browser.storage.local | Persistent encrypted data |
| **HTTPS Communication** | TLS 1.3 | Encrypted API calls |
| **JWT Tokens** | RS256 (RSA) | Tamper-proof authentication |
| **SQL Injection Prevention** | Parameterized Queries | Prevent database attacks |
| **XSS Protection** | DOMPurify Library | Sanitize HTML rendering |
| **CORS Policy** | Express CORS Middleware | Cross-origin request control |
| **Rate Limiting** | express-rate-limit | DDoS/brute-force protection |

---

## 📊 Development & Deployment

### Development Environment
- **Package Manager**: npm
- **Node Version**: 18.x LTS
- **Development Server**: Vite dev server with HMR
- **Linting**: ESLint (configured in website)

### Build Tools
```json
{
  "Frontend Extension": "JavaScript (ES6+) + HTML/CSS",
  "Frontend Dashboard": "React + TypeScript + Vite + Tailwind",
  "Backend": "Node.js + Express + PostgreSQL"
}
```

### Deployment
- **Extension**: Packaged as `.xpi` file (GuardianLink-v2.0.0.xpi)
- **Backend**: Deployed on Render.com cloud platform
- **Database**: PostgreSQL (cloud-hosted)
- **Frontend**: Static assets served by Express.js backend

---

## 🎯 Key Technology Choices & Rationale

### Why Firefox WebExtension API?
- **Cross-browser compatibility** - Works on Chrome, Firefox, Edge
- **Low-level browser access** - Full navigation interception
- **Privacy-focused** - No tracking, data stays local by default
- **Performance** - Direct browser integration, no overhead

### Why React + TypeScript for Dashboard?
- **Type Safety** - Catch errors at compile time
- **Component Reusability** - Build complex UIs from simple pieces
- **Developer Experience** - Fast development with HMR
- **Modern Tooling** - Vite provides instant bundling

### Why Node.js + Express Backend?
- **JavaScript Everywhere** - Unified language across stack
- **Fast Development** - Rapid API prototyping
- **Scalability** - Event-driven, non-blocking I/O
- **Ecosystem** - Rich npm package ecosystem

### Why PostgreSQL?
- **ACID Compliance** - Data integrity guaranteed
- **JSON Support** - Store complex threat data
- **Scalability** - Handles millions of scan records
- **Security** - Built-in encryption options

---

## 📈 Performance Considerations

| Layer | Optimization |
|-------|-------------|
| **Extension** | Content script runs at `document_start` for early interception |
| **API** | Caching of scan results to avoid duplicate backend calls |
| **Database** | Indexed queries on frequently searched fields (domain, hash) |
| **Frontend** | Vite bundles for optimal code splitting and lazy loading |
| **Build** | Minification, tree-shaking, asset compression |

---

## 🔄 Version Control & Deployment

- **Version**: 2.0.0 (manifest.json)
- **Git**: Standard GitHub workflow
- **CI/CD**: Render.com auto-deploy on push
- **Rollback**: Previous versions available on Render dashboard

---

## 📚 Summary Table

| Category | Technology | Version | Role |
|----------|-----------|---------|------|
| **Browser** | Firefox WebExtension API | MV2 | Extension framework |
| **Frontend Ext.** | JavaScript | ES6+ | Extension logic |
| **Frontend Dash.** | React | 18.x | Web UI |
| **Language** | TypeScript | 5.x | Type safety |
| **Build Tool** | Vite | Latest | Fast bundling |
| **Styling** | Tailwind CSS | Latest | Responsive design |
| **UI Components** | Shadcn/UI | Latest | Accessible components |
| **Runtime** | Node.js | 18+ | Server runtime |
| **Server** | Express.js | 4.18.2 | HTTP framework |
| **Database** | PostgreSQL | 12+ | Data persistence |
| **DB Driver** | pg | 8.11.3 | Database connection |
| **Auth** | JWT | RS256 | Authentication |
| **XSS Protection** | DOMPurify | Latest | HTML sanitization |
| **External APIs** | VirusTotal, AbuseIPDB | Latest | Threat intelligence |

---

**This is a professional, production-grade tech stack combining client-side browser security with cloud-based threat intelligence and analytics.**
