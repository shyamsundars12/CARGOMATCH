#!/usr/bin/env node

/**
 * Environment Setup Script for CargoMatch Migration
 * Helps set up the correct environment variables
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 CargoMatch Environment Setup');
console.log('================================\n');

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('📝 Creating .env file from template...');
  
  // Copy from env-local.txt
  if (fs.existsSync('env-local.txt')) {
    const envContent = fs.readFileSync('env-local.txt', 'utf8');
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env file created from env-local.txt');
  } else {
    // Create default .env
    const defaultEnv = `# Local Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=logisticsdb
DB_USER=postgres
DB_PASS=admin123
DB_SSL=false

# JWT Configuration
JWT_SECRET=Hello@13

# Admin Configuration
ADMIN_EMAIL=admin@cargomatch.in
ADMIN_PASSWORD=adminCargomatch123

# Server Configuration
PORT=5000
NODE_ENV=development
`;
    fs.writeFileSync('.env', defaultEnv);
    console.log('✅ Default .env file created');
  }
} else {
  console.log('✅ .env file already exists');
}

// Verify environment variables
console.log('\n🔍 Verifying environment variables...');
require('dotenv').config();

const requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS'];
const missingVars = [];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    missingVars.push(varName);
    console.log(`❌ Missing: ${varName}`);
  } else {
    console.log(`✅ ${varName}: ${varName === 'DB_PASS' ? '***' : value}`);
  }
});

if (missingVars.length > 0) {
  console.log('\n❌ Missing required environment variables!');
  console.log('Please update your .env file with the missing variables.');
  process.exit(1);
}

// Test database connection
console.log('\n🔌 Testing database connection...');
const { Pool } = require('pg');

const pool = new Pool({
  user: String(process.env.DB_USER || 'postgres'),
  host: String(process.env.DB_HOST || 'localhost'),
  database: String(process.env.DB_NAME || 'logisticsdb'),
  password: String(process.env.DB_PASS || 'admin123'),
  port: parseInt(process.env.DB_PORT) || 5432,
});

pool.query('SELECT NOW() as current_time')
  .then(result => {
    console.log('✅ Database connection successful!');
    console.log(`   Connected at: ${result.rows[0].current_time}`);
    console.log('\n🎉 Environment setup complete!');
    console.log('You can now run the migration:');
    console.log('   node migrate-master.js');
    process.exit(0);
  })
  .catch(error => {
    console.log('❌ Database connection failed!');
    console.log(`   Error: ${error.message}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if PostgreSQL is running');
    console.log('2. Verify database credentials in .env');
    console.log('3. Ensure database "logisticsdb" exists');
    console.log('4. Check if user has proper permissions');
    process.exit(1);
  });
