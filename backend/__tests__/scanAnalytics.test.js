const {
  buildRiskDistribution,
  summarizeScans,
  buildTimelineRows,
  compareScans
} = require('../lib/scanAnalytics');

describe('scanAnalytics helpers', () => {
  test('buildRiskDistribution creates expected bucket counts', () => {
    const distribution = buildRiskDistribution([
      { risk_score: 10 },
      { risk_score: 45 },
      { risk_score: 75 },
      { risk_score: 92 }
    ]);

    expect(distribution).toEqual({
      low: 1,
      medium: 1,
      high: 1,
      critical: 1
    });
  });

  test('summarizeScans computes averages and verdict percentages', () => {
    const summary = summarizeScans([
      { verdict: 'ALLOW', confidence: 0.9, risk_score: 10, analysis_time_ms: 40 },
      { verdict: 'WARN', confidence: 0.5, risk_score: 55, analysis_time_ms: 70 },
      { verdict: 'BLOCK', confidence: 0.8, risk_score: 90, analysis_time_ms: 90 }
    ]);

    expect(summary.total_scans).toBe(3);
    expect(summary.verdicts.ALLOW).toBe(1);
    expect(summary.verdicts.WARN).toBe(1);
    expect(summary.verdicts.BLOCK).toBe(1);
    expect(summary.percentages.allow).toBeCloseTo(33.33, 2);
    expect(summary.avg_confidence).toBeCloseTo(0.7333, 4);
    expect(summary.avg_risk_score).toBeCloseTo(51.67, 2);
  });

  test('buildTimelineRows normalizes numeric values', () => {
    const rows = buildTimelineRows([
      {
        bucket: '2026-04-02T12:00:00.000Z',
        total_scans: '5',
        allow_count: '1',
        warn_count: '2',
        block_count: '2',
        avg_risk_score: '66.6666',
        avg_confidence: '0.62345'
      }
    ]);

    expect(rows[0].bucket).toBe('2026-04-02T12:00:00.000Z');
    expect(rows[0].total_scans).toBe(5);
    expect(rows[0].allow_count).toBe(1);
    expect(rows[0].warn_count).toBe(2);
    expect(rows[0].block_count).toBe(2);
    expect(rows[0].avg_risk_score).toBeCloseTo(66.67, 2);
    expect(rows[0].avg_confidence).toBeCloseTo(0.6234, 4);
  });

  test('compareScans returns risk and confidence deltas', () => {
    const comparison = compareScans(
      { scan_id: 'a', verdict: 'WARN', confidence: 0.51, risk_score: 54.5 },
      { scan_id: 'b', verdict: 'BLOCK', confidence: 0.92, risk_score: 88.2 }
    );

    expect(comparison.previous_scan_id).toBe('a');
    expect(comparison.latest_scan_id).toBe('b');
    expect(comparison.risk_delta).toBeCloseTo(33.7, 1);
    expect(comparison.confidence_delta).toBeCloseTo(0.41, 2);
  });
});
