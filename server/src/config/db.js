const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

module.exports = pool;


// PORT=5000
// JWT_SECRET=Hello@13
// DB_NAME=logisticsdb
// DB_USER=postgres
// DB_PASS=admin123
// DB_HOST=localhost
// JWT_SECRET=secret123
