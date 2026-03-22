/**
 * Scan Routes
 * URL scanning endpoints
 */

const express = require('express');
const scanController = require('../controllers/scanController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Scan Routes
 * POST /api/scan/url       - Scan single URL
 * POST /api/scan/bulk      - Scan multiple URLs
 * GET  /api/scans          - Get scan history
 * GET  /api/scans/:scanId  - Get specific scan
 * GET  /api/model/info     - Get model information
 * POST /api/debug/features - Get features for URL (debug)
 */

// Scan endpoints
router.post('/url', scanController.scanUrl);
router.post('/bulk', scanController.scanBulk);

// Scan history (requires auth)
router.get('/history', authMiddleware, scanController.getScanHistory);
router.get('/history/:scanId', authMiddleware, scanController.getScanById);

// Model info
router.get('/model/info', authMiddleware, scanController.getModelInfo);

// Debug endpoint
router.post('/debug/features', authMiddleware, scanController.debugFeatures);

module.exports = router;
