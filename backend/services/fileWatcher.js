/**
 * File Watcher Service
 * Real-time monitoring of uploaded files for automatic scanning
 * Uses chokidar for cross-platform file system monitoring
 */

const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs').promises;
const { scanURL } = require('./scanService');
const { logFileWatcher, logError, logPerformance, logger } = require('../utils/logger');

// Track watcher instance and scanned files
let watcher = null;
let isInitialized = false;
const scannedFiles = new Set(); // Track recently scanned files to avoid duplicates

const WATCH_PATH = process.env.UPLOAD_DIR || './uploads';
const SCAN_DEBOUNCE_MS = 1000; // Wait 1s after file creation before scanning
const MAX_FILE_AGE_MB = 100; // Max file size in MB

/**
 * Initialize file watcher
 * @returns {Promise<boolean>} - True if watcher initialized, false if path doesn't exist
 */
async function initializeWatcher() {
  try {
    // Check if uploads directory exists
    try {
      await fs.access(WATCH_PATH);
    } catch {
      logFileWatcher('directory-creating', WATCH_PATH);
      await fs.mkdir(WATCH_PATH, { recursive: true });
    }

    watcher = chokidar.watch(WATCH_PATH, {
      persistent: true,
      ignored: /(^|[\/\\])\.|node_modules/,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      },
      ignoreInitial: true,
      followSymlinks: false
    });

    // File added event
    watcher.on('add', (filePath) => {
      handleFileAdd(filePath);
    });

    // File modified event (re-scan if needed)
    watcher.on('change', (filePath) => {
      handleFileChange(filePath);
    });

    // Error handling
    watcher.on('error', (error) => {
      logError(error, 'File watcher error', { watchPath: WATCH_PATH });
    });

    // Ready event
    watcher.on('ready', () => {
      isInitialized = true;
      logger.info('File watcher initialized', { watchPath: WATCH_PATH });
    });

    return true;
  } catch (error) {
    logError(error, 'Failed to initialize file watcher');
    isInitialized = false;
    return false;
  }
}

/**
 * Handle file addition
 * @param {string} filePath - Path to added file
 */
async function handleFileAdd(filePath) {
  // Avoid duplicate scanning
  if (scannedFiles.has(filePath)) {
    logFileWatcher('duplicate-detected', path.basename(filePath));
    return;
  }

  try {
    // Get file info
    const stats = await fs.stat(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);

    // Check file size
    if (fileSizeMB > MAX_FILE_AGE_MB) {
      logFileWatcher('file-size-exceeded', path.basename(filePath), {
        sizeMB: fileSizeMB.toFixed(2),
        maxMB: MAX_FILE_AGE_MB
      });
      return;
    }

    // Mark as scanned
    scannedFiles.add(filePath);

    // Remove from set after 5 minutes (prevent memory leak)
    setTimeout(() => {
      scannedFiles.delete(filePath);
    }, 300000);

    logFileWatcher('file-added', path.basename(filePath), {
      sizeMB: fileSizeMB.toFixed(2)
    });

    // Debounce scan to ensure file is fully written
    await new Promise((resolve) => {
      setTimeout(resolve, SCAN_DEBOUNCE_MS);
    });

    // Trigger scan
    await triggerFileScan(filePath);
  } catch (error) {
    logError(error, 'Error processing file', { filePath });
  }
}

/**
 * Handle file modification
 * @param {string} filePath - Path to modified file
 */
async function handleFileChange(filePath) {
  // Debounce to avoid multiple scans
  if (!scannedFiles.has(`${filePath}_changing`)) {
    logFileWatcher('file-changed', path.basename(filePath));

    scannedFiles.add(`${filePath}_changing`);

    setTimeout(() => {
      scannedFiles.delete(`${filePath}_changing`);
    }, 60000);

    await triggerFileScan(filePath);
  }
}

/**
 * Trigger security scan for file
 * @param {string} filePath - Path to file to scan
 */
async function triggerFileScan(filePath) {
  try {
    const fileName = path.basename(filePath);
    const fileHash = require('crypto')
      .createHash('sha256')
      .update(fileName + Date.now())
      .digest('hex')
      .substring(0, 16);

    const startTime = Date.now();
    logFileWatcher('scan-triggered', fileName);

    // Use scanService to perform security scan
    // This integrates with the existing ML and heuristics engine
    const result = await scanURL(filePath, {
      file_name: fileName,
      file_hash: fileHash,
      source: 'file_watcher'
    });

    const duration = Date.now() - startTime;
    logPerformance(`File scan: ${fileName}`, duration, { 
      verdict: result.verdict,
      riskScore: result.riskScore
    });

    logFileWatcher('scan-complete', fileName, {
      verdict: result.verdict,
      riskScore: result.riskScore,
      durationMs: duration
    });

    // Log security event for suspicious files
    if (result.verdict === 'BLOCK' || result.verdict === 'WARN') {
      logger.warn('Suspicious file detected via file watcher', {
        fileName,
        fileHash,
        verdict: result.verdict,
        riskScore: result.riskScore,
        filePath
      });
    }

    return result;
  } catch (error) {
    logError(error, 'File scan failed', { filePath });
  }
}

/**
 * Stop the file watcher
 * @returns {Promise<boolean>} - True if watcher stopped successfully
 */
async function stopWatcher() {
  try {
    if (watcher) {
      await watcher.close();
      watcher = null;
      isInitialized = false;
      logger.info('File watcher stopped');
      return true;
    }
    return false;
  } catch (error) {
    logError(error, 'Error stopping file watcher');
    return false;
  }
}

/**
 * Get watcher status
 * @returns {object} - Status information
 */
function getStatus() {
  return {
    initialized: isInitialized,
    watching: !!watcher,
    watchPath: WATCH_PATH,
    scannedFilesInMemory: scannedFiles.size,
    debounceMs: SCAN_DEBOUNCE_MS,
    maxFileSizeMB: MAX_FILE_AGE_MB
  };
}

module.exports = {
  initializeWatcher,
  stopWatcher,
  getStatus,
  triggerFileScan
};
