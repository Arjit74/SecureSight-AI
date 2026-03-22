/**
 * Report Controller
 * Handles all report-related HTTP requests
 */

const {
  createReport,
  getReportById,
  getReportByScanId,
  getScanHistory,
  getScanStatistics,
  getRiskDistribution,
  getVerdictDistribution,
  updateScanReport,
  deletOldScans
} = require('../models/reportModel');
const { parsePositiveInt } = require('../utils/security');

/**
 * Get scan report by ID
 * GET /api/reports/:reportId
 */
exports.getReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      return res.status(400).json({ error: 'Report ID required' });
    }

    const report = await getReportById(reportId);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    return res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch report',
      message: error.message
    });
  }
};

/**
 * Get report by scan ID
 * GET /api/reports/scan/:scanId
 */
exports.getReportByScan = async (req, res) => {
  try {
    const { scanId } = req.params;

    if (!scanId) {
      return res.status(400).json({ error: 'Scan ID required' });
    }

    const report = await getReportByScanId(scanId);

    if (!report) {
      return res.status(404).json({ error: 'No report found for this scan' });
    }

    return res.json(report);
  } catch (error) {
    console.error('Error fetching report by scan:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch report',
      message: error.message
    });
  }
};

/**
 * Get scan history
 * GET /api/reports/history
 */
exports.getScanHistoryData = async (req, res) => {
  try {
    const limit = parsePositiveInt(req.query.limit, 50, 1, 200);
    const offset = parsePositiveInt(req.query.offset, 0, 0, 100000);
    
    const filters = {};
    
    if (req.query.verdict) {
      filters.verdict = req.query.verdict.toUpperCase();
    }
    
    if (req.query.minRiskScore) {
      filters.minRiskScore = parseFloat(req.query.minRiskScore);
    }
    
    if (req.query.maxRiskScore) {
      filters.maxRiskScore = parseFloat(req.query.maxRiskScore);
    }

    const history = await getScanHistory(limit, offset, filters);

    return res.json({
      scans: history.scans,
      pagination: {
        limit: history.limit,
        offset: history.offset,
        total: history.total
      }
    });
  } catch (error) {
    console.error('Error fetching history:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch scan history',
      message: error.message
    });
  }
};

/**
 * Get scan statistics
 * GET /api/reports/statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const validRanges = ['24h', '7d', '30d', '90d'];

    if (!validRanges.includes(timeRange)) {
      return res.status(400).json({
        error: 'Invalid time range',
        valid_ranges: validRanges
      });
    }

    const stats = await getScanStatistics(timeRange);

    return res.json({
      time_range: timeRange,
      statistics: {
        total_scans: parseInt(stats.total_scans) || 0,
        blocked_count: parseInt(stats.blocked_count) || 0,
        warned_count: parseInt(stats.warned_count) || 0,
        allowed_count: parseInt(stats.allowed_count) || 0,
        avg_risk_score: parseFloat(stats.avg_risk_score) || 0,
        max_risk_score: parseFloat(stats.max_risk_score) || 0,
        min_risk_score: parseFloat(stats.min_risk_score) || 0,
        avg_analysis_time_ms: parseFloat(stats.avg_analysis_time) || 0,
        avg_confidence: parseFloat(stats.avg_confidence) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
};

/**
 * Get risk score distribution chart data
 * GET /api/reports/charts/risk-distribution
 */
exports.getRiskChart = async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const distribution = await getRiskDistribution(timeRange);

    return res.json({
      chart_type: 'bar',
      title: 'Risk Score Distribution',
      time_range: timeRange,
      data: distribution.map(item => ({
        label: item.risk_level,
        value: parseInt(item.count),
        percentage: 0 // Calculated by frontend
      }))
    });
  } catch (error) {
    console.error('Error fetching risk chart:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch risk chart data',
      message: error.message
    });
  }
};

/**
 * Get verdict distribution chart data
 * GET /api/reports/charts/verdict-distribution
 */
exports.getVerdictChart = async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const distribution = await getVerdictDistribution(timeRange);

    const colors = {
      BLOCK: '#dc2626',
      WARN: '#f59e0b',
      ALLOW: '#10b981'
    };

    return res.json({
      chart_type: 'pie',
      title: 'Verdict Distribution',
      time_range: timeRange,
      data: distribution.map(item => ({
        label: item.verdict,
        value: parseInt(item.count),
        color: colors[item.verdict] || '#6b7280'
      }))
    });
  } catch (error) {
    console.error('Error fetching verdict chart:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch verdict chart data',
      message: error.message
    });
  }
};

/**
 * Get combined dashboard data
 * GET /api/reports/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';

    const [stats, riskDist, verdictDist] = await Promise.all([
      getScanStatistics(timeRange),
      getRiskDistribution(timeRange),
      getVerdictDistribution(timeRange)
    ]);

    return res.json({
      time_range: timeRange,
      statistics: {
        total_scans: parseInt(stats.total_scans) || 0,
        blocked_count: parseInt(stats.blocked_count) || 0,
        warned_count: parseInt(stats.warned_count) || 0,
        allowed_count: parseInt(stats.allowed_count) || 0,
        avg_risk_score: parseFloat(stats.avg_risk_score) || 0,
        threat_detection_rate: stats.total_scans > 0 
          ? ((parseInt(stats.blocked_count) + parseInt(stats.warned_count)) / parseInt(stats.total_scans) * 100).toFixed(2)
          : 0
      },
      charts: {
        risk_distribution: riskDist.map(item => ({
          label: item.risk_level,
          value: parseInt(item.count)
        })),
        verdict_distribution: verdictDist.map(item => ({
          label: item.verdict,
          value: parseInt(item.count)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
};

/**
 * Update scan with report data
 * PUT /api/reports/scan/:scanId
 */
exports.updateScan = async (req, res) => {
  try {
    const { scanId } = req.params;
    const updateData = req.body;

    if (!scanId) {
      return res.status(400).json({ error: 'Scan ID required' });
    }

    // Validate update data
    if (updateData.file_name && typeof updateData.file_name !== 'string') {
      return res.status(400).json({ error: 'file_name must be a string' });
    }

    if (updateData.risk_score !== undefined) {
      const riskScore = parseFloat(updateData.risk_score);
      if (isNaN(riskScore) || riskScore < 0 || riskScore > 100) {
        return res.status(400).json({ error: 'risk_score must be between 0 and 100' });
      }
      updateData.risk_score = riskScore;
    }

    const updated = await updateScanReport(scanId, updateData);

    if (!updated) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    return res.json({
      message: 'Scan report updated',
      scan: updated
    });
  } catch (error) {
    console.error('Error updating scan:', error.message);
    return res.status(500).json({
      error: 'Failed to update scan',
      message: error.message
    });
  }
};

/**
 * Export report as JSON
 * GET /api/reports/:reportId/export
 */
exports.exportReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const format = req.query.format || 'json';

    if (!reportId) {
      return res.status(400).json({ error: 'Report ID required' });
    }

    const report = await getReportById(reportId);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.json"`);
      return res.json(report);
    }

    return res.status(400).json({
      error: 'Invalid format',
      supported_formats: ['json']
    });
  } catch (error) {
    console.error('Error exporting report:', error.message);
    return res.status(500).json({
      error: 'Failed to export report',
      message: error.message
    });
  }
};

/**
 * Health check for reporting service
 * GET /api/reports/health
 */
exports.healthCheck = (req, res) => {
  res.json({
    status: 'ok',
    service: 'reporting',
    features: [
      'scan-history',
      'statistics',
      'risk-charts',
      'verdict-charts',
      'report-export'
    ]
  });
};

/**
 * Get file watcher status
 * GET /api/reports/monitoring/file-watcher
 */
exports.getFileWatcherStatus = (req, res) => {
  try {
    const { getStatus } = require('../services/fileWatcher');
    const status = getStatus();

    return res.json({
      service: 'file-watcher',
      status: status.initialized ? 'active' : 'inactive',
      details: {
        initialized: status.initialized,
        watching: status.watching,
        watch_path: status.watchPath,
        scanned_files_in_memory: status.scannedFilesInMemory,
        debounce_ms: status.debounceMs,
        max_file_size_mb: status.maxFileSizeMB
      }
    });
  } catch (error) {
    console.error('Error fetching file watcher status:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch file watcher status',
      message: error.message
    });
  }
};
