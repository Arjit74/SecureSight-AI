const request = require('supertest');
const {
  app,
  closeResources,
  combineScores,
  determineVerdict,
  validateAndNormalizeUrl
} = require('../server');

describe('URL validation helpers', () => {
  test('normalizes URL without scheme', () => {
    const normalized = validateAndNormalizeUrl('example.com/login');
    expect(normalized).toBe('https://example.com/login');
  });

  test('rejects unsupported protocols', () => {
    expect(() => validateAndNormalizeUrl('ftp://example.com')).toThrow('Only HTTP/HTTPS URLs are supported');
  });

  test('rejects empty URL', () => {
    expect(() => validateAndNormalizeUrl('   ')).toThrow('URL is required');
  });
});

describe('Scoring helpers', () => {
  test('produces high risk for malicious and suspicious signals', () => {
    const score = combineScores(
      { is_malicious: true, confidence: 0.95 },
      { totalSuspicion: 18 }
    );

    expect(score).toBeGreaterThan(80);
  });

  test('produces low risk for clearly benign signals', () => {
    const score = combineScores(
      { is_malicious: false, confidence: 0.95 },
      { totalSuspicion: 0 }
    );

    expect(score).toBeLessThan(10);
  });

  test('maps score and confidence to a verdict', () => {
    expect(determineVerdict(80, 0.9)).toBe('BLOCK');
    expect(determineVerdict(55, 0.7)).toBe('WARN');
    expect(determineVerdict(15, 0.4)).toBe('ALLOW');
  });
});

describe('API safety rails', () => {
  test('returns security status', async () => {
    const response = await request(app).get('/api/security/status');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('rate_limiting');
  });

  test('rejects invalid scan URL input', async () => {
    const response = await request(app)
      .post('/api/scan/url')
      .send({ url: 'ftp://malicious.example' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/HTTP\/HTTPS/);
  });

  test('returns unified contract from /api/scan/url', async () => {
    const response = await request(app)
      .post('/api/scan/url')
      .send({ url: 'https://example.com/login' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'completed');
    expect(response.body).toHaveProperty('scan_id');
    expect(response.body).toHaveProperty('scanId');
    expect(response.body).toHaveProperty('score');
    expect(response.body).toHaveProperty('risk_score');
    expect(response.body).toHaveProperty('verdict');
    expect(response.body).toHaveProperty('phases');
    expect(response.body.scanId).toBe(response.body.scan_id);
  });

  test('supports extension compatibility route /api/scan', async () => {
    const response = await request(app)
      .post('/api/scan')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'completed');
    expect(response.body).toHaveProperty('score');
    expect(response.body).toHaveProperty('verdict');
  });

  test('rejects bulk scans above 50 URLs', async () => {
    const urls = Array.from({ length: 51 }, (_, index) => `https://example${index}.com`);

    const response = await request(app)
      .post('/api/scan/bulk')
      .send({ urls });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toMatch(/Maximum 50 URLs/i);
  });

  test('returns not found or db unavailable for unknown scan result', async () => {
    const response = await request(app).get('/api/scan/result/non-existent-scan-id');

    expect([404, 503]).toContain(response.status);
    expect(response.body).toHaveProperty('error');
  });
});

afterAll(async () => {
  await closeResources();
});
