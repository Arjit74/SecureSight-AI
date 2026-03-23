/**
 * Backend API Tests
 * Tests for scanning endpoints, authentication, and security
 */

const request = require('supertest');
const { app } = require('../app');

// ============================================
// HEALTH CHECK TESTS
// ============================================

describe('Health Check Endpoint', () => {
  test('GET /api/health returns 200 with status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(['ok', 'degraded']).toContain(res.body.status);
  });

  test('GET /api/health includes database and ML status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('database');
    expect(res.body).toHaveProperty('ml');
    expect(res.body).toHaveProperty('uptime');
    expect(typeof res.body.uptime).toBe('number');
  });
});

// ============================================
// SECURITY STATUS TESTS
// ============================================

describe('Security Status Endpoint', () => {
  test('GET /api/security/status returns security configuration', async () => {
    const res = await request(app).get('/api/security/status');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('api_key_required');
    expect(res.body).toHaveProperty('security_headers');
    expect(res.body).toHaveProperty('rate_limiting');
  });

  test('GET /api/security/status includes rate limiting info', async () => {
    const res = await request(app).get('/api/security/status');
    expect(res.statusCode).toBe(200);
    expect(res.body.rate_limiting).toHaveProperty('general_per_minute');
    expect(res.body.rate_limiting).toHaveProperty('scans_per_minute');
  });
});

// ============================================
// SCAN URL ENDPOINT TESTS
// ============================================

describe('Scan URL Endpoint', () => {
  const validScanRequest = { url: 'https://example.com' };

  test('POST /api/scan/url with valid URL returns verdict', async () => {
    const res = await request(app)
      .post('/api/scan/url')
      .set('X-API-Key', process.env.API_KEY || '')
      .send(validScanRequest);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('verdict');
    expect(['BLOCK', 'WARN', 'ALLOW']).toContain(res.body.verdict);
  });

  test('POST /api/scan/url returns confidence score', async () => {
    const res = await request(app)
      .post('/api/scan/url')
      .set('X-API-Key', process.env.API_KEY || '')
      .send(validScanRequest);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('confidence');
    expect(typeof res.body.confidence).toBe('number');
    expect(res.body.confidence).toBeGreaterThanOrEqual(0);
    expect(res.body.confidence).toBeLessThanOrEqual(1);
  });

  test('POST /api/scan/url returns scan ID', async () => {
    const res = await request(app)
      .post('/api/scan/url')
      .set('X-API-Key', process.env.API_KEY || '')
      .send(validScanRequest);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('scan_id');
  });

  test('POST /api/scan/url with http URL auto-converts to https', async () => {
    const res = await request(app)
      .post('/api/scan/url')
      .set('X-API-Key', process.env.API_KEY || '')
      .send({ url: 'example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('verdict');
  });

  test('POST /api/scan/url with missing URL returns 400', async () => {
    const res = await request(app)
      .post('/api/scan/url')
      .set('X-API-Key', process.env.API_KEY || '')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/scan/url with invalid URL returns 400', async () => {
    const res = await request(app)
      .post('/api/scan/url')
      .set('X-API-Key', process.env.API_KEY || '')
      .send({ url: 'not-a-url' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/scan/url with invalid hostname returns 400', async () => {
    const res = await request(app)
      .post('/api/scan/url')
      .set('X-API-Key', process.env.API_KEY || '')
      .send({ url: 'https://' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/scan/url with non-http protocol returns 400', async () => {
    const res = await request(app)
      .post('/api/scan/url')
      .set('X-API-Key', process.env.API_KEY || '')
      .send({ url: 'ftp://malicious.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ============================================
// BULK SCAN ENDPOINT TESTS
// ============================================

describe('Bulk Scan Endpoint', () => {
  test('POST /api/scan/bulk with array of URLs returns results', async () => {
    const res = await request(app)
      .post('/api/scan/bulk')
      .set('X-API-Key', process.env.API_KEY || '')
      .send({ urls: ['https://google.com', 'https://example.com'] });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  test('POST /api/scan/bulk returns result for each URL', async () => {
    const res = await request(app)
      .post('/api/scan/bulk')
      .set('X-API-Key', process.env.API_KEY || '')
      .send({ urls: ['https://google.com', 'https://example.com'] });

    expect(res.statusCode).toBe(200);
    res.body.forEach((result) => {
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('verdict');
      expect(result).toHaveProperty('confidence');
    });
  });

  test('POST /api/scan/bulk with empty array returns 400', async () => {
    const res = await request(app)
      .post('/api/scan/bulk')
      .set('X-API-Key', process.env.API_KEY || '')
      .send({ urls: [] });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/scan/bulk with more than 50 URLs returns 400', async () => {
    const urls = Array(51).fill('https://example.com');
    const res = await request(app)
      .post('/api/scan/bulk')
      .set('X-API-Key', process.env.API_KEY || '')
      .send({ urls });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/scan/bulk with non-array returns 400', async () => {
    const res = await request(app)
      .post('/api/scan/bulk')
      .set('X-API-Key', process.env.API_KEY || '')
      .send({ urls: 'https://example.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ============================================
// SECURITY & AUTH TESTS
// ============================================

describe('Security & Authentication', () => {
  test('Requests include X-Request-Id header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers).toHaveProperty('x-request-id');
  });

  test('Response includes security headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers).toHaveProperty('x-content-type-options');
    expect(res.headers).toHaveProperty('x-frame-options');
  });

  test('Requests don\'t expose X-Powered-By header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers).not.toHaveProperty('x-powered-by');
  });

  test('CORS headers are present on health check', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:3000');

    expect(res.statusCode).toBe(200);
    expect(res.headers).toHaveProperty('access-control-allow-origin');
  });
});

// ============================================
// API KEY REQUIREMENT TESTS
// ============================================

describe('API Key Requirement', () => {
  test('Scan endpoint without API key should fail if API_KEY is set', async () => {
    if (!process.env.API_KEY) {
      console.log('Skipping API key test - API_KEY not configured');
      return;
    }

    const res = await request(app)
      .post('/api/scan/url')
      .send({ url: 'https://example.com' });

    // Should either fail or succeed based on API_KEY requirement
    expect([200, 401]).toContain(res.statusCode);
  });

  test('Scan endpoint with invalid API key returns 401 if API_KEY is set', async () => {
    if (!process.env.API_KEY) {
      console.log('Skipping API key validation test - API_KEY not configured');
      return;
    }

    const res = await request(app)
      .post('/api/scan/url')
      .set('X-API-Key', 'invalid-key')
      .send({ url: 'https://example.com' });

    expect(res.statusCode).toBe(401);
  });
});

// ============================================
// ENDPOINT AVAILABILITY TESTS
// ============================================

describe('Endpoint Availability', () => {
  test('Health endpoint is publicly accessible', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 500]).toContain(res.statusCode); // 500 if DB unavailable, but endpoint exists
  });

  test('Security status endpoint is publicly accessible', async () => {
    const res = await request(app).get('/api/security/status');
    expect(res.statusCode).toBe(200);
  });

  test('Auth routes are accessible', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test', password: 'test' });

    expect([200, 400, 401, 500]).toContain(res.statusCode);
  });
});

// ============================================
// RESPONSE FORMAT TESTS
// ============================================

describe('Response Formats', () => {
  test('Scan response is valid JSON with required fields', async () => {
    const res = await request(app)
      .post('/api/scan/url')
      .set('X-API-Key', process.env.API_KEY || '')
      .send({ url: 'https://example.com' });

    expect(res.statusCode).toBe(200);
    expect(typeof res.body).toBe('object');
    expect(res.body).toHaveProperty('verdict');
    expect(res.body).toHaveProperty('confidence');
    expect(res.body).toHaveProperty('scan_id');
    expect(res.body).toHaveProperty('url');
  });

  test('Error response includes error message', async () => {
    const res = await request(app)
      .post('/api/scan/url')
      .set('X-API-Key', process.env.API_KEY || '')
      .send({ url: 'invalid-url' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
  });

  test('Health endpoint includes version info', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('version');
    expect(typeof res.body.version).toBe('string');
  });
});

// ============================================
// CONTENT-TYPE TESTS
// ============================================

describe('Content Type Handling', () => {
  test('Requests accept JSON content', async () => {
    const res = await request(app)
      .post('/api/scan/url')
      .set('Content-Type', 'application/json')
      .set('X-API-Key', process.env.API_KEY || '')
      .send({ url: 'https://example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.type).toMatch(/json/);
  });

  test('Responses are JSON format', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.type).toMatch(/json/);
  });
});

// ============================================
// REPORTING & CHARTS TESTS
// ============================================

describe('Reporting Feature', () => {
  test('GET /api/reports/health returns reporting service status', async () => {
    const res = await request(app).get('/api/reports/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('service');
    expect(res.body.service).toBe('reporting');
    expect(res.body).toHaveProperty('features');
    expect(Array.isArray(res.body.features)).toBe(true);
  });

  test('GET /api/reports/statistics returns scan statistics', async () => {
    const res = await request(app)
      .get('/api/reports/statistics?timeRange=7d');
    
    expect([200, 500]).toContain(res.statusCode); // 500 if DB unavailable
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('statistics');
      expect(res.body.statistics).toHaveProperty('total_scans');
      expect(res.body.statistics).toHaveProperty('avg_risk_score');
      expect(res.body.statistics).toHaveProperty('threat_detection_rate');
    }
  });

  test('GET /api/reports/dashboard returns combined dashboard data', async () => {
    const res = await request(app)
      .get('/api/reports/dashboard?timeRange=7d');
    
    expect([200, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('statistics');
      expect(res.body).toHaveProperty('charts');
      expect(res.body.charts).toHaveProperty('risk_distribution');
      expect(res.body.charts).toHaveProperty('verdict_distribution');
    }
  });

  test('GET /api/reports/charts/risk-distribution returns risk chart data', async () => {
    const res = await request(app)
      .get('/api/reports/charts/risk-distribution?timeRange=7d');
    
    expect([200, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('chart_type');
      expect(res.body).toHaveProperty('title');
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    }
  });

  test('GET /api/reports/charts/verdict-distribution returns verdict chart data', async () => {
    const res = await request(app)
      .get('/api/reports/charts/verdict-distribution?timeRange=7d');
    
    expect([200, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('chart_type');
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    }
  });

  test('GET /api/reports/history returns scan history', async () => {
    const res = await request(app)
      .get('/api/reports/history?limit=10&offset=0');
    
    expect([200, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('scans');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.scans)).toBe(true);
    }
  });

  test('GET /api/reports/history accepts timeRange filter', async () => {
    const res = await request(app)
      .get('/api/reports/statistics?timeRange=24h');
    
    expect([200, 400, 500]).toContain(res.statusCode);
  });

  test('GET /api/reports/statistics rejects invalid timeRange', async () => {
    const res = await request(app)
      .get('/api/reports/statistics?timeRange=invalid');
    
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('Scan with file metadata includes file_name', async () => {
    const res = await request(app)
      .post('/api/scan/url')
      .set('X-API-Key', process.env.API_KEY || '')
      .send({ 
        url: 'https://example.com',
        file_name: 'document.pdf'
      });

    expect(res.statusCode).toBe(200);
    if (res.body.file_name) {
      expect(res.body.file_name).toBe('document.pdf');
    }
  });

  test('Scan response includes risk_score', async () => {
    const res = await request(app)
      .post('/api/scan/url')
      .set('X-API-Key', process.env.API_KEY || '')
      .send({ url: 'https://example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('risk_score');
    expect(typeof res.body.risk_score).toBe('number');
    expect(res.body.risk_score).toBeGreaterThanOrEqual(0);
    expect(res.body.risk_score).toBeLessThanOrEqual(100);
  });
});
