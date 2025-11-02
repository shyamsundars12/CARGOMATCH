#!/usr/bin/env node

/**
 * Quick Fix for Password String Issue
 * Ensures all environment variables are properly formatted
 */

const fs = require('fs');

console.log('🔧 Fixing Password String Issue');
console.log('===============================\n');

// Read current .env file
let envContent = '';
if (fs.existsSync('.env')) {
  envContent = fs.readFileSync('.env', 'utf8');
  console.log('✅ Found existing .env file');
} else if (fs.existsSync('env-local.txt')) {
  envContent = fs.readFileSync('env-local.txt', 'utf8');
  console.log('✅ Using env-local.txt as template');
} else {
  console.log('❌ No environment file found!');
  process.exit(1);
}

// Ensure password is properly quoted
const fixedContent = envContent
  .split('\n')
  .map(line => {
    if (line.startsWith('DB_PASS=')) {
      const password = line.split('=')[1];
      if (password && !password.startsWith('"') && !password.startsWith("'")) {
        return `DB_PASS="${password.trim()}"`;
      }
    }
    return line;
  })
  .join('\n');

// Write fixed .env file
fs.writeFileSync('.env', fixedContent);
console.log('✅ Fixed password formatting in .env');

// Test the fix
console.log('\n🔍 Testing the fix...');
require('dotenv').config();

const password = process.env.DB_PASS;
console.log(`Password type: ${typeof password}`);
console.log(`Password value: ${password ? '***' : 'undefined'}`);

if (typeof password === 'string' && password.length > 0) {
  console.log('✅ Password is now properly formatted as string');
  
  // Test database connection
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
      console.log('✅ Database connection test successful!');
      console.log(`   Connected at: ${result.rows[0].current_time}`);
      console.log('\n🎉 Fix applied successfully!');
      console.log('You can now run the migration:');
      console.log('   node migrate-master.js');
      process.exit(0);
    })
    .catch(error => {
      console.log('❌ Database connection still failing:');
      console.log(`   Error: ${error.message}`);
      console.log('\n🔧 Additional troubleshooting needed:');
      console.log('1. Check if PostgreSQL is running');
      console.log('2. Verify database exists');
      console.log('3. Check user permissions');
      process.exit(1);
    });
} else {
  console.log('❌ Password is still not properly formatted');
  console.log('Please check your .env file manually');
  process.exit(1);
}
