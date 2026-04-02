/**
 * Scan analytics helpers
 * Pure functions used by controllers for aggregation and formatting.
 */

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toPercent(part, total) {
  if (!total) {
    return 0;
  }

  return Number(((part / total) * 100).toFixed(2));
}

function buildRiskDistribution(scans) {
  const buckets = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };

  for (const scan of scans) {
    const risk = toNumber(scan.risk_score, 0);

    if (risk >= 85) {
      buckets.critical += 1;
      continue;
    }

    if (risk >= 65) {
      buckets.high += 1;
      continue;
    }

    if (risk >= 35) {
      buckets.medium += 1;
      continue;
    }

    buckets.low += 1;
  }

  return buckets;
}

function summarizeScans(scans) {
  const total = scans.length;

  const verdictCounts = {
    ALLOW: 0,
    WARN: 0,
    BLOCK: 0,
    UNKNOWN: 0
  };

  let confidenceSum = 0;
  let riskSum = 0;
  let analysisTimeSum = 0;

  for (const scan of scans) {
    const verdict = String(scan.verdict || '').toUpperCase();
    if (verdictCounts[verdict] !== undefined) {
      verdictCounts[verdict] += 1;
    } else {
      verdictCounts.UNKNOWN += 1;
    }

    confidenceSum += toNumber(scan.confidence, 0);
    riskSum += toNumber(scan.risk_score, 0);
    analysisTimeSum += toNumber(scan.analysis_time_ms, 0);
  }

  return {
    total_scans: total,
    verdicts: verdictCounts,
    percentages: {
      allow: toPercent(verdictCounts.ALLOW, total),
      warn: toPercent(verdictCounts.WARN, total),
      block: toPercent(verdictCounts.BLOCK, total)
    },
    avg_confidence: total ? Number((confidenceSum / total).toFixed(4)) : 0,
    avg_risk_score: total ? Number((riskSum / total).toFixed(2)) : 0,
    avg_analysis_time_ms: total ? Number((analysisTimeSum / total).toFixed(2)) : 0,
    risk_distribution: buildRiskDistribution(scans)
  };
}

function buildTimelineRows(rows) {
  return rows.map((row) => ({
    bucket: row.bucket,
    total_scans: toNumber(row.total_scans, 0),
    allow_count: toNumber(row.allow_count, 0),
    warn_count: toNumber(row.warn_count, 0),
    block_count: toNumber(row.block_count, 0),
    avg_risk_score: Number(toNumber(row.avg_risk_score, 0).toFixed(2)),
    avg_confidence: Number(toNumber(row.avg_confidence, 0).toFixed(4))
  }));
}

function compareScans(previousScan, latestScan) {
  const previousRisk = toNumber(previousScan?.risk_score, 0);
  const latestRisk = toNumber(latestScan?.risk_score, 0);

  return {
    previous_scan_id: previousScan?.scan_id || null,
    latest_scan_id: latestScan?.scan_id || null,
    previous_verdict: previousScan?.verdict || null,
    latest_verdict: latestScan?.verdict || null,
    risk_delta: Number((latestRisk - previousRisk).toFixed(2)),
    confidence_delta: Number(
      (toNumber(latestScan?.confidence, 0) - toNumber(previousScan?.confidence, 0)).toFixed(4)
    )
  };
}

module.exports = {
  buildRiskDistribution,
  summarizeScans,
  buildTimelineRows,
  compareScans
};
