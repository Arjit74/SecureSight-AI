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
});

afterAll(async () => {
  await closeResources();
});
