# SecureSight AI API Documentation

## Overview

This document covers the Node.js backend API in `backend/server.js`.

- Base URL: `http://localhost:3000`
- Content type: `application/json`
- Authentication: optional API key via `X-API-Key` header (required only when `API_KEY` is configured)

## Security and Limits

- Global rate limit: 120 requests/minute (configurable)
- Scan rate limit: 30 requests/minute (configurable)
- Request body size limit: 1 MB by default
- CORS allow-list configured via `CORS_ALLOWED_ORIGINS`

## Endpoints

### GET /api/health

Returns service health, ML status, and DB state.

Example response:

```json
{
	"status": "ok",
	"timestamp": "2026-03-19T10:10:10.000Z",
	"version": "2.1.0",
	"database": "connected",
	"uptime": 312.25
}
```

### GET /api/security/status

Returns current runtime security settings.

### POST /api/scan/url

Scans one URL and returns AI + heuristic verdict.

Request body:

```json
{
	"url": "https://example.com/login"
}
```

Success response:

```json
{
	"scan_id": "7a56d86f-0f6e-4dbf-bf64-3b71d66770fa",
	"url": "https://example.com/login",
	"verdict": "WARN",
	"confidence": 0.81,
	"risk_score": 61.5,
	"model_used": "RandomForest",
	"analysis_time_ms": 12
}
```

Validation rules:

- URL must be a non-empty string
- URL length must be <= 2048
- Only `http` and `https` protocols are accepted

### POST /api/scan/bulk

Scans up to 50 URLs in one call.

Request body:

```json
{
	"urls": ["https://example.com", "https://phish.example"]
}
```

### POST /api/scan/file

Reserved endpoint for file model integration.

- Current status: `501 Not Implemented`

### GET /api/scans

Returns scan history from PostgreSQL.

Query params:

- `limit`: default 50, max 200
- `offset`: default 0, max 100000

### GET /api/scans/:scanId

Returns full details for a specific scan ID.

### GET /api/model/info

Returns model metadata and recent model performance rows.

### POST /api/debug/features

Returns extracted URL features for debugging and model analysis.

## Error Responses

Common format:

```json
{
	"error": "Human-readable message"
}
```

Common status codes:

- `400` invalid input
- `401` missing/invalid API key
- `403` blocked by CORS
- `404` resource not found
- `429` rate limit exceeded
- `500` internal server error

