# SecureSight AI Architecture

## System Summary

SecureSight AI is a server-based malware detection platform with:

- Node.js/Express API for orchestration
- Python ML runtime for model inference
- Heuristic scoring engine for behavior-based signals
- PostgreSQL for scan history and model metrics
- Flask web dashboard and Telegram bot integration

## Runtime Components

### 1) API Gateway Layer (Node.js)

File: `backend/server.js`

Responsibilities:

- Request validation and normalization
- Authentication gate (`X-API-Key`)
- CORS policy enforcement
- Security headers (`helmet`)
- Rate limiting for global and scan endpoints
- Scan result caching with TTL

### 2) Feature Extraction Layer

File: `backend/lib/featureExtractor.js`

Responsibilities:

- Extract 65+ URL security features
- Entropy and lexical statistics
- Domain/TLD and suspicious pattern signals
- Fallback extraction for malformed inputs

### 3) Inference Layer

File: `node-ml-bridge/ml_service.js`

Responsibilities:

- Load trained model/scaler files
- Execute Python inference subprocess
- Return prediction confidence and top features
- Fall back to heuristic prediction if model is unavailable

### 4) Heuristic Rule Layer

File: `backend/lib/heuristicsManager.js`

Responsibilities:

- Evaluate rule conditions against URL/domain/content context
- Compute suspicion score and status (`safe`, `warning`, `danger`)
- Provide explainable matched-rule output

### 5) Persistence Layer

Database: PostgreSQL

Tables:

- `scans`: scan records and analysis data
- `model_performance`: model accuracy and error trend snapshots

## Request Flow

1. Client submits URL to `POST /api/scan/url`
2. Input is normalized and validated
3. Cached verdict is returned when available
4. Features are extracted
5. ML service predicts malicious probability
6. Heuristic engine computes suspicion score
7. Weighted score is mapped to verdict (`ALLOW`, `WARN`, `BLOCK`)
8. Result is persisted and returned

## Security Controls

- API key enforcement on sensitive routes
- Centralized rate limiting
- CORS allow-list
- Security headers via `helmet`
- Parameterized SQL queries to avoid SQL injection
- Strict URL protocol and length validation

## Known Constraints

- File scanning endpoint is currently placeholder only
- ML model loading depends on local Python + sklearn/joblib environment
- Scan history queries depend on database availability

## Recommended Next Architecture Step

Split the current backend into three deployable services:

1. API gateway service (Express)
2. ML inference worker service (Python)
3. Async queue + storage service (Redis + PostgreSQL)

This reduces coupling and improves horizontal scalability for scan throughput.

