/**
 * Report Routes
 * Endpoints for generating and viewing reports, charts, and scan history
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

/**
 * @swagger
 * /api/reports/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check for reporting service
 *     description: Check if reporting service is operational
 *     responses:
 *       200:
 *         description: Service is operational
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: operational
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', reportController.healthCheck);

// ============================================
// REPORTING ENDPOINTS
// ============================================

/**
 * @swagger
 * /api/reports/{reportId}:
 *   get:
 *     tags:
 *       - Reporting
 *     summary: Get report by ID
 *     description: Retrieve a specific report with all details
 *     parameters:
 *       - name: reportId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */
router.get('/:reportId', reportController.getReport);

/**
 * @swagger
 * /api/reports/scan/{scanId}:
 *   get:
 *     tags:
 *       - Reporting
 *     summary: Get report by scan ID
 *     description: Retrieve report associated with a specific scan
 *     parameters:
 *       - name: scanId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Scan ID
 *     responses:
 *       200:
 *         description: Report retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       404:
 *         description: Scan not found
 *       500:
 *         description: Server error
 */
router.get('/scan/:scanId', reportController.getReportByScan);

/**
 * @swagger
 * /api/reports/history:
 *   get:
 *     tags:
 *       - Reporting
 *     summary: Get scan history with filtering
 *     description: Retrieve paginated scan history with optional filters
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Results per page
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *       - name: verdict
 *         in: query
 *         schema:
 *           type: string
 *           enum: [SAFE, SUSPICIOUS, MALICIOUS]
 *         description: Filter by verdict
 *       - name: minRiskScore
 *         in: query
 *         schema:
 *           type: number
 *           default: 0
 *         description: Minimum risk score
 *       - name: maxRiskScore
 *         in: query
 *         schema:
 *           type: number
 *           default: 100
 *         description: Maximum risk score
 *     responses:
 *       200:
 *         description: Scan history retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 scans:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ScanResult'
 *       500:
 *         description: Server error
 */
router.get('/history', reportController.getScanHistoryData);

/**
 * @swagger
 * /api/reports/statistics:
 *   get:
 *     tags:
 *       - Reporting
 *     summary: Get scan statistics
 *     description: Get aggregated statistics for scans
 *     parameters:
 *       - name: timeRange
 *         in: query
 *         schema:
 *           type: string
 *           enum: [1d, 7d, 30d, all]
 *           default: 7d
 *         description: Time range for statistics
 *     responses:
 *       200:
 *         description: Statistics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalScans:
 *                   type: integer
 *                 maliciousCount:
 *                   type: integer
 *                 suspiciousCount:
 *                   type: integer
 *                 safeCount:
 *                   type: integer
 *                 averageScore:
 *                   type: number
 *       500:
 *         description: Server error
 */
router.get('/statistics', reportController.getStatistics);

// ============================================
// CHART ENDPOINTS
// ============================================

/**
 * @swagger
 * /api/reports/charts/risk-distribution:
 *   get:
 *     tags:
 *       - Reporting
 *     summary: Get risk score distribution chart
 *     description: Get chart data for risk score distribution
 *     parameters:
 *       - name: timeRange
 *         in: query
 *         schema:
 *           type: string
 *           enum: [1d, 7d, 30d, all]
 *           default: 7d
 *     responses:
 *       200:
 *         description: Chart data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 labels:
 *                   type: array
 *                   items:
 *                     type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: integer
 *       500:
 *         description: Server error
 */
router.get('/charts/risk-distribution', reportController.getRiskChart);

/**
 * @swagger
 * /api/reports/charts/verdict-distribution:
 *   get:
 *     tags:
 *       - Reporting
 *     summary: Get verdict distribution chart
 *     description: Get chart data for verdict distribution (SAFE, SUSPICIOUS, MALICIOUS)
 *     parameters:
 *       - name: timeRange
 *         in: query
 *         schema:
 *           type: string
 *           enum: [1d, 7d, 30d, all]
 *           default: 7d
 *     responses:
 *       200:
 *         description: Chart data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 labels:
 *                   type: array
 *                   items:
 *                     type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: integer
 *       500:
 *         description: Server error
 */
router.get('/charts/verdict-distribution', reportController.getVerdictChart);

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     tags:
 *       - Reporting
 *     summary: Get complete dashboard data
 *     description: Get all dashboard data including statistics, charts, and recent scans
 *     parameters:
 *       - name: timeRange
 *         in: query
 *         schema:
 *           type: string
 *           enum: [1d, 7d, 30d, all]
 *           default: 7d
 *     responses:
 *       200:
 *         description: Dashboard data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statistics:
 *                   type: object
 *                 riskChart:
 *                   type: object
 *                 verdictChart:
 *                   type: object
 *                 recentScans:
 *                   type: array
 *       500:
 *         description: Server error
 */
router.get('/dashboard', reportController.getDashboard);

// ============================================
// EXPORT ENDPOINTS
// ============================================

/**
 * @swagger
 * /api/reports/{reportId}/export:
 *   get:
 *     tags:
 *       - Reporting
 *     summary: Export report
 *     description: Export report in specified format
 *     parameters:
 *       - name: reportId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - name: format
 *         in: query
 *         schema:
 *           type: string
 *           enum: [json, csv, pdf]
 *           default: json
 *     responses:
 *       200:
 *         description: Report exported
 *       404:
 *         description: Report not found
 *       500:
 *         description: Export failed
 */
router.get('/:reportId/export', reportController.exportReport);

// ============================================
// UPDATE ENDPOINTS
// ============================================

/**
 * @swagger
 * /api/reports/scan/{scanId}:
 *   put:
 *     tags:
 *       - Reporting
 *     summary: Update scan report
 *     description: Update additional data for a scan
 *     parameters:
 *       - name: scanId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Scan updated
 *       404:
 *         description: Scan not found
 *       500:
 *         description: Server error
 */
router.put('/scan/:scanId', reportController.updateScan);

// ============================================
// MONITORING ENDPOINTS
// ============================================

/**
 * @swagger
 * /api/reports/monitoring/file-watcher:
 *   get:
 *     tags:
 *       - Health
 *     summary: Get file watcher status
 *     description: Get current status of real-time file monitoring service
 *     responses:
 *       200:
 *         description: File watcher status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [active, inactive]
 *                 monitoredDirectory:
 *                   type: string
 *                 filesMonitored:
 *                   type: integer
 *                 lastEventTime:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Server error
 */
router.get('/monitoring/file-watcher', reportController.getFileWatcherStatus);

module.exports = router;
