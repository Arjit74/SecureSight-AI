# 📚 Swagger API Documentation Setup

## Overview

Complete OpenAPI 3.0 documentation for SecureSight-AI Backend. Interactive API explorer with request/response examples, authentication, and schema validation.

## 🚀 Features

✅ **Interactive API Explorer** - Try all endpoints directly from browser  
✅ **Complete OpenAPI 3.0 Spec** - Industry-standard API documentation  
✅ **All 20+ Endpoints** - Fully documented with examples  
✅ **Authentication** - JWT Bearer token support  
✅ **Request/Response Schemas** - Full JSON schema validation  
✅ **Error Handling** - Documented error responses  
✅ **Rate Limiting** - Documented limits and headers  

## 📖 Quick Start

### 1. Start the Backend Server

```bash
cd e:\gardian_link\SecureSight\backend
npm start
```

### 2. Access Swagger UI

Open in browser:
```
http://localhost:5000/api-docs
```

You'll see the interactive API documentation with all endpoints.

### 3. Raw Swagger JSON

Access the OpenAPI spec directly:
```
http://localhost:5000/api-docs/swagger.json
```

## 🔑 Authentication

### Getting a Token

1. **Register a new user**
   - Endpoint: `POST /api/auth/register`
   - Body:
     ```json
     {
       "email": "user@example.com",
       "password": "SecurePass123!",
       "username": "john_doe"
     }
     ```

2. **Login**
   - Endpoint: `POST /api/auth/login`
   - Body:
     ```json
     {
       "email": "user@example.com",
       "password": "SecurePass123!"
     }
     ```
   - Response includes `token` field

3. **Use in Swagger UI**
   - Click the "Authorize" button (top right)
   - Paste your token in the modal: `Bearer YOUR_TOKEN_HERE`
   - All authenticated endpoints will now work

## 📋 API Endpoints Overview

### Authentication (5 endpoints)
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `GET /api/auth/admin/users` - List users (admin only)

### Scanning (6 endpoints)
- `POST /api/scan/url` - Scan single URL
- `POST /api/scan/bulk` - Scan multiple URLs
- `GET /api/scan/history` - Get scan history
- `GET /api/scan/history/{scanId}` - Get specific scan
- `GET /api/scan/model/info` - Get model information
- `POST /api/scan/debug/features` - Extract URL features

### Reporting (10 endpoints)
- `GET /api/reports/health` - Service health check
- `GET /api/reports/{reportId}` - Get report by ID
- `GET /api/reports/scan/{scanId}` - Get report by scan
- `GET /api/reports/history` - Get scan history
- `GET /api/reports/statistics` - Get statistics
- `GET /api/reports/charts/risk-distribution` - Risk chart
- `GET /api/reports/charts/verdict-distribution` - Verdict chart
- `GET /api/reports/dashboard` - Complete dashboard
- `GET /api/reports/{reportId}/export` - Export report
- `PUT /api/reports/scan/{scanId}` - Update scan
- `GET /api/reports/monitoring/file-watcher` - File watcher status

## 🎯 Testing Endpoints

### 1. Health Check (No Auth Required)

```bash
curl -X GET http://localhost:5000/api/health
```

### 2. Scan a URL

```bash
curl -X POST http://localhost:5000/api/scan/url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### 3. Get Dashboard

```bash
curl -X GET http://localhost:5000/api/reports/dashboard
```

### 4. Get Authenticated Endpoint

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📊 Schema Definitions

### User

```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "john_doe",
  "role": "user",
  "createdAt": "2024-03-22T10:00:00Z"
}
```

### ScanResult

```json
{
  "id": 1,
  "url": "https://example.com",
  "verdict": "safe",
  "score": 85.5,
  "threats": ["phishing"],
  "ml_verdict": "benign",
  "confidence": 0.95,
  "scanTimestamp": "2024-03-22T10:00:00Z"
}
```

### Report

```json
{
  "id": 1,
  "user_id": 1,
  "title": "Weekly Scan Report",
  "description": "Summary of scans",
  "total_scans": 100,
  "malicious_count": 5,
  "suspicious_count": 10,
  "safe_count": 85,
  "average_score": 82.5,
  "created_at": "2024-03-22T10:00:00Z"
}
```

## 🔐 Security

### Rate Limiting

- **General API**: 120 requests/minute
- **Scan Endpoint**: 30 requests/minute

Headers returned:
- `RateLimit-Limit` - Maximum requests
- `RateLimit-Remaining` - Requests remaining
- `RateLimit-Reset` - Reset time

### API Key (Optional)

If `API_KEY` environment variable is set, include:
```
x-api-key: YOUR_API_KEY
```

## 🛠️ Configuration

### Environment Variables

```bash
# Server
PORT=5000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@localhost/securesight
DB_POOL_SIZE=10

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# API
API_KEY=your-optional-api-key
RATE_LIMIT_MAX=120
SCAN_RATE_LIMIT_MAX=30
REQUEST_SIZE_LIMIT=1mb

# File Watcher
FILE_WATCHER_ENABLED=true
WATCH_DIRECTORY=./uploads
```

## 📝 Using Swagger Definitions

### In Your Code

```javascript
// Example: Using Swagger spec in tests
const swaggerSpec = require('./config/swagger');

// Validate response against schema
const schema = swaggerSpec.components.schemas.ScanResult;
// Use Ajv or similar to validate
```

### Generating Client Code

Use Swagger Codegen:
```bash
# Install swagger-codegen
brew install swagger-codegen

# Generate JavaScript client
swagger-codegen generate \
  -i http://localhost:5000/api-docs/swagger.json \
  -l javascript \
  -o ./generated-client
```

## 🧪 Testing with Swagger

### 1. Try Authentication Flow

1. Go to `POST /api/auth/register`
2. Click "Try it out"
3. Fill in the form with valid data
4. Click "Execute"
5. Copy the returned token
6. Click "Authorize" and paste token
7. Now try authenticated endpoints

### 2. Test Scan Endpoint

1. Scroll to `POST /api/scan/url`
2. Click "Try it out"
3. Enter a URL: `https://example.com`
4. Click "Execute"
5. See the response with scan results

### 3. Generate Dashboard

1. Go to `GET /api/reports/dashboard`
2. Set timeRange: `7d`
3. Click "Execute"
4. View all dashboard data

## 🔍 Troubleshooting

### Swagger UI Not Loading

```bash
# Make sure packages are installed
npm install swagger-ui-express swagger-jsdoc

# Check server is running on correct port
npm start

# Verify at http://localhost:5000/api-docs
```

### Authentication Not Working

```bash
# 1. Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","username":"test"}'

# 2. Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'

# 3. Use token in Swagger "Authorize" button
```

### Schema Not Updating

Swagger spec is generated from JSDoc comments:

1. Check JSDoc format matches template
2. Check `apis` array in `config/swagger.js` includes your route file
3. Restart the server
4. Clear Swagger UI cache (Ctrl+Shift+Delete)
5. Refresh page

## 📚 JSDoc Format Reference

### Basic Endpoint

```javascript
/**
 * @swagger
 * /api/endpoint:
 *   get:
 *     tags:
 *       - Category
 *     summary: Short description
 *     description: Longer description
 *     responses:
 *       200:
 *         description: Success response
 */
router.get('/endpoint', controller.handler);
```

### With Parameters

```javascript
/**
 * @swagger
 * /api/endpoint/{id}:
 *   get:
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 */
```

### With Request Body

```javascript
/**
 * @swagger
 * /api/endpoint:
 *   post:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 */
```

### With Authentication

```javascript
/**
 * @swagger
 * /api/endpoint:
 *   get:
 *     security:
 *       - BearerAuth: []
 */
```

## 📦 Files Modified

- `config/swagger.js` - Swagger configuration
- `routes/authRoutes.js` - Auth endpoints with JSDoc
- `routes/scanRoutes.js` - Scan endpoints with JSDoc
- `routes/reportRoutes.js` - Report endpoints with JSDoc
- `app.js` - Swagger UI middleware integration

## 🎓 Learning Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [JSDoc Swagger Plugin](https://github.com/Surnet/swagger-jsdoc)
- [Swagger Tutorial](https://swagger.io/tools/swagger-ui/build-a-swagger-ui-from-scratch/)

## 🚀 Next Steps

1. ✅ Swagger UI is now running
2. Visit `http://localhost:5000/api-docs`
3. Try different endpoints
4. Test authentication flow
5. Use in client applications
6. Generate client code if needed

---

**Status**: ✅ Complete and Production-Ready  
**Version**: 1.0.0  
**Last Updated**: March 22, 2026
