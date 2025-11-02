#!/usr/bin/env node

/**
 * Switch to Neon Cloud Database with New Credentials
 */

const fs = require('fs');

console.log('☁️  Switching to Neon Cloud Database (New Credentials)');
console.log('=====================================================\n');

const neonConfig = `# Neon Cloud Database Configuration
DB_HOST=ep-green-rice-adtvyi8t-pooler.c-2.us-east-1.aws.neon.tech
DB_PORT=5432
DB_NAME=logisticsdb
DB_USER=neondb_owner
DB_PASS=npg_iWdBt3xb2PRq
DB_SSL=true

# JWT Configuration
JWT_SECRET=Hello@13

# Admin Configuration
ADMIN_EMAIL=admin@cargomatch.in
ADMIN_PASSWORD=adminCargomatch123

# Server Configuration
PORT=5000
NODE_ENV=production`;

// Backup current config
if (fs.existsSync('.env')) {
  fs.copyFileSync('.env', '.env.local.backup');
  console.log('✅ Backed up current config to .env.local.backup');
}

// Switch to Neon
fs.writeFileSync('.env', neonConfig);
console.log('✅ Switched to NEON cloud database');

console.log('\n📝 Neon Configuration:');
console.log('   - Host: ep-green-rice-adtvyi8t-pooler.c-2.us-east-1.aws.neon.tech');
console.log('   - Database: logisticsdb');
console.log('   - User: neondb_owner');
console.log('   - SSL: Enabled');
console.log('   - Environment: production');

console.log('\n🔄 Next steps:');
console.log('1. Test the connection: node test-neon-connection.js');
console.log('2. Start your server: node server.js');
console.log('3. Test your application');

console.log('\n⚠️  Note: Make sure your Neon database has the migrated data!');
