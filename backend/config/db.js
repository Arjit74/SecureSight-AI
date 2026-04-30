/**
 * Database Configuration
 * Initializes PostgreSQL connection pool
 */

const { Pool } = require('pg');

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE || 'securesight'
    };

const pool = new Pool(poolConfig);

/**
 * Initialize database tables
 */
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scans (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        file_name TEXT,
        file_hash TEXT,
        verdict TEXT NOT NULL,
        confidence DECIMAL(4,3),
        risk_score DECIMAL(5,2),
        malware_type TEXT,
        features JSONB,
        model_used TEXT,
        analysis_time_ms INTEGER,
        scan_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS model_performance (
        id SERIAL PRIMARY KEY,
        model_type TEXT NOT NULL,
        accuracy DECIMAL(5,4),
        false_positives INTEGER,
        false_negatives INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS scan_reports (
        id TEXT PRIMARY KEY,
        scan_id TEXT REFERENCES scans(id),
        file_name TEXT,
        risk_score DECIMAL(5,2),
        risk_category TEXT,
        threat_types TEXT[],
        chart_data JSONB,
        summary TEXT,
        recommendations TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error.message);
    return false;
  }
}

/**
 * Close database connection
 */
async function closeDatabase() {
  try {
    await pool.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Database close error:', error.message);
  }
}

module.exports = {
  pool,
  initDatabase,
  closeDatabase
};
