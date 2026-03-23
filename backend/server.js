/**
 * SecureSight AI Backend Server Entry Point
 * Starts the Express application
 */

require('dotenv').config();

const { app, bootstrap } = require('./app');
const { closeDatabase } = require('./config/db');
const { stopWatcher } = require('./services/fileWatcher');
const { logger, logServiceInit } = require('./utils/logger');

const PORT = Number(process.env.PORT) || 3000;

/**
 * Start the server
 */
async function startServer() {
  try {
    // Initialize application
    await bootstrap();

    // Start listening
    const server = app.listen(PORT, () => {
      logger.info(`🚀 SecureSight AI Backend Started`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        apiKeyEnabled: !!process.env.API_KEY,
        timestamp: new Date().toISOString()
      });
    });

    return server;
  } catch (error) {
    logger.error('Server startup failed', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully`, { signal });
  try {
    // Stop file watcher
    await stopWatcher();
    logger.info('✅ File watcher stopped');
    
    // Close database
    await closeDatabase();
    logger.info('✅ Database closed');
    process.exit(0);
  } catch (error) {
    logger.error('Shutdown error', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Handle signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server if this is the main module
if (require.main === module) {
  startServer();
}

// Export for testing
module.exports = {
  app,
  startServer,
  shutdown
};
