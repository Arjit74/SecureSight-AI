/**
 * Scan Routes
 * URL scanning endpoints
 */

const express = require('express');
const scanController = require('../controllers/scanController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/scan/url:
 *   post:
 *     tags:
 *       - Scanning
 *     summary: Scan a single URL
 *     description: |
 *       Performs comprehensive scan on a single URL to detect malware, phishing, 
 *       and other security threats using ML-powered analysis.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com
 *     responses:
 *       200:
 *         description: Scan completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScanResult'
 *       400:
 *         description: Invalid URL format
 *       500:
 *         description: Scan failed
 */
router.post('/url', scanController.scanUrl);

/**
 * @swagger
 * /api/scan/bulk:
 *   post:
 *     tags:
 *       - Scanning
 *     summary: Scan multiple URLs
 *     description: |
 *       Batch scan multiple URLs. Each URL is scanned independently.
 *       Returns array of scan results.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - urls
 *             properties:
 *               urls:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *                 items:
 *                   type: string
 *                   format: uri
 *                 example: ["https://example.com", "https://google.com"]
 *     responses:
 *       200:
 *         description: Bulk scan completed
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ScanResult'
 *       400:
 *         description: Invalid request format
 *       500:
 *         description: Bulk scan failed
 */
router.post('/bulk', scanController.scanBulk);

/**
 * @swagger
 * /api/scan/history:
 *   get:
 *     tags:
 *       - Scanning
 *     summary: Get scan history
 *     description: Retrieve paginated list of past scans for authenticated user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results per page
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: Scan history retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scans:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ScanResult'
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/history', authMiddleware, scanController.getScanHistory);

/**
 * @swagger
 * /api/scan/history/{scanId}:
 *   get:
 *     tags:
 *       - Scanning
 *     summary: Get specific scan details
 *     description: Retrieve detailed information about a specific scan
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: scanId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Scan ID
 *     responses:
 *       200:
 *         description: Scan details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScanResult'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Scan not found
 *       500:
 *         description: Server error
 */
router.get('/history/:scanId', authMiddleware, scanController.getScanById);

/**
 * @swagger
 * /api/scan/model/info:
 *   get:
 *     tags:
 *       - Scanning
 *     summary: Get ML model information
 *     description: Retrieve information about the deployed ML model
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Model information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 model_name:
 *                   type: string
 *                 model_version:
 *                   type: string
 *                 accuracy:
 *                   type: number
 *                 training_date:
 *                   type: string
 *                   format: date
 *                 input_features:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/model/info', authMiddleware, scanController.getModelInfo);

/**
 * @swagger
 * /api/scan/debug/features:
 *   post:
 *     tags:
 *       - Scanning
 *     summary: Debug - Extract URL features
 *     description: Extract and return features for a URL (debugging purposes)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com
 *     responses:
 *       200:
 *         description: Features extracted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                 features:
 *                   type: array
 *                   items:
 *                     type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Feature extraction failed
 */
router.post('/debug/features', authMiddleware, scanController.debugFeatures);

module.exports = router;
