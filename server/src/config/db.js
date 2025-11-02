const { Pool } = require('pg');
require('dotenv').config();

// Enhanced database configuration supporting both local and Neon
function createPool() {
  const config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'logisticsdb',
    password: process.env.DB_PASS || 'admin123',
    port: parseInt(process.env.DB_PORT) || 5432,
  };

  // Ensure password is a string
  if (typeof config.password !== 'string') {
    config.password = String(config.password || '');
  }

  // Add SSL configuration for Neon (cloud) databases
  if (process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('neon.tech')) {
    config.ssl = { rejectUnauthorized: false };
    console.log('🔒 SSL enabled for cloud database connection');
  }

  // Connection pooling configuration for better performance
  config.max = 20; // Maximum number of clients in the pool
  config.idleTimeoutMillis = 30000; // Close idle clients after 30 seconds
  config.connectionTimeoutMillis = 10000; // Return an error after 10 seconds if connection could not be established
  config.acquireTimeoutMillis = 10000; // Maximum time to wait for a client from the pool

  return new Pool(config);
}

const pool = createPool();

// Enhanced error handling and connection monitoring
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connect', (client) => {
  console.log('✅ New client connected to database');
});

// Test connection on startup
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    // Don't exit the process, just log the error
    // The server can still start and retry connections later
  }
}

// Test connection if not in test environment - but don't block startup
if (process.env.NODE_ENV !== 'test') {
  // Run connection test in background without blocking
  setTimeout(testConnection, 1000);
}

module.exports = pool;


// PORT=5000
// JWT_SECRET=Hello@13
// DB_NAME=logisticsdb
// DB_USER=postgres
// DB_PASS=admin123
// DB_HOST=localhost
// JWT_SECRET=secret123
