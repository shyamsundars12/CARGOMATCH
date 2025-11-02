#!/usr/bin/env node

/**
 * Database Switcher
 * Helps switch between local and Neon databases
 */

const fs = require('fs');

console.log('🔄 CargoMatch Database Switcher');
console.log('===============================\n');

// Current configuration
const localConfig = `# Local Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=logisticsdb
DB_USER=postgres
DB_PASS="admin123"
DB_SSL=false

# JWT Configuration
JWT_SECRET=Hello@13

# Admin Configuration
ADMIN_EMAIL=admin@cargomatch.in
ADMIN_PASSWORD=adminCargomatch123

# Server Configuration
PORT=5000
NODE_ENV=development`;

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

// Check current configuration
function checkCurrentConfig() {
  if (!fs.existsSync('.env')) {
    console.log('❌ No .env file found!');
    return null;
  }
  
  const content = fs.readFileSync('.env', 'utf8');
  
  if (content.includes('localhost')) {
    return 'local';
  } else if (content.includes('neon.tech')) {
    return 'neon';
  } else {
    return 'unknown';
  }
}

// Switch to local database
function switchToLocal() {
  console.log('🔄 Switching to LOCAL database...');
  fs.writeFileSync('.env', localConfig);
  console.log('✅ Switched to LOCAL database');
  console.log('📝 Configuration:');
  console.log('   - Host: localhost');
  console.log('   - Database: logisticsdb');
  console.log('   - SSL: Disabled');
  console.log('   - Environment: development');
}

// Switch to Neon database
function switchToNeon() {
  console.log('🔄 Switching to NEON cloud database...');
  fs.writeFileSync('.env', neonConfig);
  console.log('✅ Switched to NEON cloud database');
  console.log('📝 Configuration:');
  console.log('   - Host: ep-muddy-bird-adpst8gp-pooler.c-2.us-east-1.aws.neon.tech');
  console.log('   - Database: logisticsdb');
  console.log('   - SSL: Enabled');
  console.log('   - Environment: production');
}

// Main function
function main() {
  const current = checkCurrentConfig();
  
  if (current === 'local') {
    console.log('📍 Current: LOCAL database');
    console.log('\nOptions:');
    console.log('1. Switch to NEON cloud database');
    console.log('2. Stay with LOCAL database');
    console.log('\nTo switch to Neon, run: node switch-to-neon.js');
  } else if (current === 'neon') {
    console.log('📍 Current: NEON cloud database');
    console.log('\nOptions:');
    console.log('1. Switch to LOCAL database');
    console.log('2. Stay with NEON cloud database');
    console.log('\nTo switch to Local, run: node switch-to-local.js');
  } else {
    console.log('📍 Current: Unknown configuration');
    console.log('\nSetting up LOCAL database as default...');
    switchToLocal();
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. Restart your server: node server.js');
  console.log('2. Test the connection');
  console.log('3. Verify your application works');
}

main();
