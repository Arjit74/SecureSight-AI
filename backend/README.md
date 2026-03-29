🚀 Backend Service (backend/)
📌 Overview

The backend is the core orchestration layer of SecureSight-AI.
It handles:

Incoming scan requests (URL analysis)

Feature extraction and heuristic evaluation

ML model inference via bridge (with fallback)

Risk scoring, verdict generation, and recommendations

Persistence and retrieval of scan history

Security enforcement (rate limiting, API keys, CORS, headers)

🧱 Tech Stack

Runtime: Node.js (v18+)

Framework: Express.js

Database: PostgreSQL (pg)

Security:

helmet → secure headers

cors → origin control

express-rate-limit → abuse protection

Utilities:

crypto → secure comparisons

path → file resolution

📂 Folder Structure
backend/
│
├── __tests__/         # Unit + integration tests
├── lib/               # Core logic (feature extraction, heuristics)
│
├── server.js          # Main application entry point
├── package.json       # Dependencies + scripts
├── package-lock.json  # Dependency lock
├── .env.example       # Environment template


⚙️ Core Responsibilities
1. Request Lifecycle
Client Request
   ↓
Validation + Normalization
   ↓
Cache Check
   ↓
Feature Extraction (lib/)
   ↓
ML Prediction (Bridge / Fallback)
   ↓
Heuristic Analysis
   ↓
Score Combination
   ↓
Verdict + Recommendations
   ↓
Database Storage
   ↓
Response

📄 server.js – Deep Dive
🔹 ML Service Layer
buildFallbackMLService()

Creates a safe fallback ML service

Used when:

Python bridge fails

Model unavailable

Ensures zero downtime

Methods:

initialize() → prepares fallback service

predictUrl() → returns safe default predictions

getModelInfo() → returns metadata

🔹 ML Bridge Resolver
getMLService()

Dynamically loads:

Real ML bridge (node-ml-bridge)

OR fallback service

Handles:

Errors

Missing files

Runtime failures

🔹 CORS & Origin Security
parseAllowedOrigins()

Reads allowed origins from .env

Supports:

Multiple domains

Comma-separated values

isExtensionOrigin(origin)

Special handling for browser extension origins

Prevents unauthorized extension spoofing

origin(origin, callback)

Custom CORS validator

Allows:

Whitelisted domains

Extension origins

Rejects:

Unknown/malicious origins

🔹 Caching Layer
cacheGet(key)

Retrieves cached scan result

Reduces:

ML calls

DB hits

cacheSet(key, data)

Stores scan results

Controlled via:

TTL

Max entries

🔹 Utility & Validation
parsePositiveInt(value, fallback, min, max)

Safe integer parsing with bounds

Prevents:

Misconfig

Overflow issues

timingSafeEqual(a, b)

Prevents timing attacks

Used in:

API key comparison

🔹 URL Processing
validateAndNormalizeUrl(input)

Ensures:

Valid protocol (http/https)

Proper formatting

Normalizes:

Case

Structure

Rejects:

Invalid/malformed URLs

🔹 Scoring Engine
combineScores(mlResult, heuristicResult)

Combines:

ML probability

Heuristic score

Produces:

Unified risk score

determineVerdict(riskScore, confidence)

Converts score → verdict:

SAFE

SUSPICIOUS

MALICIOUS

generateRecommendations(verdict, mlResult)

Generates:

Actionable advice

User guidance

Example:

“Avoid visiting this URL”

“Proceed with caution”

🗄️ Database Layer
initDatabase()

Initializes PostgreSQL connection

Creates tables if needed

storeScanInDatabase(scanData)

Stores:

URL

Features

Score

Verdict

Metadata

Enables:

History

Analytics

🔐 Authentication & Security
requireApiKey(req, res, next)

Middleware for protected routes

Uses:

X-API-Key header

Enforced when:

API_KEY is set in .env

🚀 Server Lifecycle
bootstrap()

Initializes:

DB

ML service

Cache

Middleware

startServer()

Starts Express server

Binds port

closeResources()

Graceful shutdown:

DB connections

ML processes

🌐 API Endpoints
Public / Core

| Method | Route                  | Description            |
| ------ | ---------------------- | ---------------------- |
| GET    | `/api/health`          | Service health         |
| GET    | `/api/security/status` | Active security config |


🔍 Scanning
| Method | Route            | Description                 |
| ------ | ---------------- | --------------------------- |
| POST   | `/api/scan`      | Compatibility alias for extension clients |
| POST   | `/api/scan/url`  | Analyze single URL          |
| POST   | `/api/scan/bulk` | Analyze multiple URLs (≤50) |
| POST   | `/api/scan/file` | ⚠️ Placeholder (501)        |
| GET    | `/api/scan/result/:scanId` | Compatibility lookup by scan id |

Unified response contract (`/api/scan`, `/api/scan/url`, `/api/scan/result/:scanId`):

- `status`: `completed`
- `scan_id` and `scanId` (same value)
- `url`, `verdict`
- `score` (safety score 0-100)
- `risk_score` and `riskScore` (risk score 0-100)
- `riskLevel` (`LOW`, `LOW-MEDIUM`, `MEDIUM`, `HIGH`, `CRITICAL`)
- `confidence`, `confidence_percent`
- `phases` object for UI rendering
- `recommendations`, `reasoning`


📊 Data & Insights
| Method | Route                 | Description              |
| ------ | --------------------- | ------------------------ |
| GET    | `/api/scans`          | Paginated history        |
| GET    | `/api/scans/:scanId`  | Scan details             |
| GET    | `/api/model/info`     | Model metadata           |
| POST   | `/api/debug/features` | Feature extraction debug |

🔒 Security Features
✅ Implemented

API rate limiting (global + scan-specific)

Request size limiting

CORS allow-list enforcement

API key authentication (optional)

Secure headers via helmet

Timing-safe comparisons

Input validation & normalization

Graceful ML fallback

⚡ Performance Optimizations

In-memory caching (TTL-based)

Reduced ML calls via cache hits

Bulk scan support

Efficient DB writes

🧪 Testing

Located in:backend/__tests__/

Covers:

URL validation

Feature extraction

Scoring logic

Security behaviors

Run:
npm test
npm run test:coverage

Use .env.example as base.

Key configs:

PORT

API_KEY

CORS_ALLOWED_ORIGINS

RATE_LIMIT_MAX

SCAN_RATE_LIMIT_MAX

SCAN_CACHE_TTL_MS

DATABASE_URL or PG configs

⚠️ Known Limitations

File scanning endpoint not implemented

Cache is in-memory (not distributed)

No queue system (sync processing)

🚀 Future Improvements

Add /api/scan/file with sandboxing

Redis-based distributed cache

Job queue (BullMQ / RabbitMQ)

ML model versioning + A/B testing

Graph-based threat intelligence