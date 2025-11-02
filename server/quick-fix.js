#!/usr/bin/env node

/**
 * Quick Database Fix
 * Switches to local database to fix connection timeout
 */

const fs = require('fs');

console.log('🔧 Quick Database Fix');
console.log('====================\n');

// Local database configuration
const localConfig = `# Local Database Configuration
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
NODE_ENV=development`;

try {
  // Backup current config
  if (fs.existsSync('.env')) {
    fs.copyFileSync('.env', '.env.backup');
    console.log('✅ Backed up current config to .env.backup');
  }
  
  // Write local config
  fs.writeFileSync('.env', localConfig);
  console.log('✅ Switched to LOCAL database');
  
  console.log('\n📝 Local Configuration:');
  console.log('   - Host: localhost');
  console.log('   - Database: logisticsdb');
  console.log('   - SSL: Disabled');
  console.log('   - Environment: development');
  
  console.log('\n🔄 Next steps:');
  console.log('1. Make sure PostgreSQL is running locally');
  console.log('2. Start the server: node server.js');
  console.log('3. Test the connection');
  
} catch (error) {
  console.log('❌ Error:', error.message);
}
