#!/usr/bin/env node

/**
 * Neon Cloud Database Setup
 * Configures and tests Neon database connection
 */

const fs = require('fs');
const { Pool } = require('pg');

console.log('☁️  Neon Cloud Database Setup');
console.log('==============================\n');

// Neon configuration
const neonConfig = `# Neon Cloud Database Configuration
DB_HOST=ep-muddy-bird-adpst8gp-pooler.c-2.us-east-1.aws.neon.tech
DB_PORT=5432
DB_NAME=logisticsdb
DB_USER=neondb_owner
DB_PASS=npg_VFKU7kx4mXnS
DB_SSL=true

# JWT Configuration
JWT_SECRET=Hello@13

# Admin Configuration
ADMIN_EMAIL=admin@cargomatch.in
ADMIN_PASSWORD=adminCargomatch123

# Server Configuration
PORT=5000
NODE_ENV=production`;

// Test Neon connection
async function testNeonConnection() {
  console.log('1️⃣  Testing Neon database connection...');
  
  const pool = new Pool({
    host: 'ep-muddy-bird-adpst8gp-pooler.c-2.us-east-1.aws.neon.tech',
    port: 5432,
    database: 'logisticsdb',
    user: 'neondb_owner',
    password: 'npg_VFKU7kx4mXnS',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000, // 10 second timeout
    idleTimeoutMillis: 30000
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Neon database connection successful!');
    console.log(`   Connected at: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL version: ${result.rows[0].pg_version}`);
    
    // Test if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`   Tables found: ${tablesResult.rows.length}`);
    if (tablesResult.rows.length > 0) {
      console.log('   Table names:', tablesResult.rows.map(r => r.table_name).join(', '));
    }
    
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.log('❌ Neon database connection failed!');
    console.log(`   Error: ${error.message}`);
    
    if (error.message.includes('timeout')) {
      console.log('\n🔧 Troubleshooting timeout issues:');
      console.log('1. Check if Neon database is active');
      console.log('2. Verify credentials are correct');
      console.log('3. Check network connectivity');
      console.log('4. Try connecting from Neon console');
    }
    
    await pool.end();
    return false;
  }
}

// Setup Neon configuration
async function setupNeon() {
  try {
    // Backup current config
    if (fs.existsSync('.env')) {
      fs.copyFileSync('.env', '.env.local.backup');
      console.log('✅ Backed up local config to .env.local.backup');
    }
    
    // Test connection first
    const connectionOk = await testNeonConnection();
    
    if (connectionOk) {
      // Write Neon config
      fs.writeFileSync('.env', neonConfig);
      console.log('\n2️⃣  ✅ Neon configuration saved to .env');
      
      console.log('\n📝 Neon Configuration:');
      console.log('   - Host: ep-muddy-bird-adpst8gp-pooler.c-2.us-east-1.aws.neon.tech');
      console.log('   - Database: logisticsdb');
      console.log('   - SSL: Enabled');
      console.log('   - Environment: production');
      
      console.log('\n🚀 Next steps:');
      console.log('1. Start the server: node server.js');
      console.log('2. Start the frontend: cd ../client && npm run dev');
      console.log('3. Open: http://localhost:5173');
      
      return true;
    } else {
      console.log('\n❌ Cannot setup Neon - connection failed');
      console.log('💡 Suggestion: Use local database for now');
      return false;
    }
  } catch (error) {
    console.log('❌ Setup error:', error.message);
    return false;
  }
}

// Run setup
setupNeon().then(success => {
  if (success) {
    console.log('\n🎉 Neon cloud database setup complete!');
  } else {
    console.log('\n⚠️  Neon setup failed - check connection details');
  }
}).catch(console.error);
