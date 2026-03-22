/**
 * Report Routes
 * Endpoints for generating and viewing reports, charts, and scan history
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// ============================================
// PUBLIC ENDPOINTS
// ============================================

/**
 * Health check for reporting service
 * GET /api/reports/health
 */
router.get('/health', reportController.healthCheck);

// ============================================
// REPORTING ENDPOINTS
// ============================================

/**
 * Get single report by ID
 * GET /api/reports/:reportId
 */
router.get('/:reportId', reportController.getReport);

/**
 * Get report by scan ID
 * GET /api/reports/scan/:scanId
 */
router.get('/scan/:scanId', reportController.getReportByScan);

/**
 * Get scan history with pagination and filters
 * GET /api/reports/history?limit=50&offset=0&verdict=BLOCK&minRiskScore=50&maxRiskScore=100
 */
router.get('/history', reportController.getScanHistoryData);

/**
 * Get scan statistics
 * GET /api/reports/statistics?timeRange=7d
 */
router.get('/statistics', reportController.getStatistics);

// ============================================
// CHART ENDPOINTS
// ============================================

/**
 * Get risk score distribution chart
 * GET /api/reports/charts/risk-distribution?timeRange=7d
 */
router.get('/charts/risk-distribution', reportController.getRiskChart);

/**
 * Get verdict distribution chart
 * GET /api/reports/charts/verdict-distribution?timeRange=7d
 */
router.get('/charts/verdict-distribution', reportController.getVerdictChart);

/**
 * Get combined dashboard data with all charts and stats
 * GET /api/reports/dashboard?timeRange=7d
 */
router.get('/dashboard', reportController.getDashboard);

// ============================================
// EXPORT ENDPOINTS
// ============================================

/**
 * Export report
 * GET /api/reports/:reportId/export?format=json
 */
router.get('/:reportId/export', reportController.exportReport);

// ============================================
// UPDATE ENDPOINTS (Protected)
// ============================================

/**
 * Update scan with additional report data
 * PUT /api/reports/scan/:scanId
 */
router.put('/scan/:scanId', reportController.updateScan);

// ============================================
// MONITORING ENDPOINTS
// ============================================

/**
 * Get file watcher status
 * GET /api/reports/monitoring/file-watcher
 */
router.get('/monitoring/file-watcher', reportController.getFileWatcherStatus);

module.exports = router;
