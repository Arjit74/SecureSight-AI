const URLFeatureExtractor = require('../lib/featureExtractor');

describe('URLFeatureExtractor', () => {
  test('extracts core features for a normal URL', () => {
    const features = URLFeatureExtractor.extractFeatures('https://example.com/login?ref=home');

    expect(features).toHaveProperty('url_length');
    expect(features).toHaveProperty('digit_ratio');
    expect(features).toHaveProperty('is_https');
    expect(features).toHaveProperty('url_entropy');
    expect(features.is_https).toBe(1);
    expect(features.url_length).toBeGreaterThan(0);
  });

  test('falls back safely for malformed URL input', () => {
    const features = URLFeatureExtractor.extractFeatures('not a real url');

    expect(features).toHaveProperty('url_length');
    expect(features).toHaveProperty('has_suspicious_keywords');
    expect(features).toHaveProperty('domain_length');
    expect(features.url_length).toBeGreaterThan(0);
  });
});
