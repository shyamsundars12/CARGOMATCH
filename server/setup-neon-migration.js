#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Neon DB Migration...\n');

// Check if neon-config.js exists
if (fs.existsSync('./neon-config.js')) {
  console.log('✅ neon-config.js already exists');
} else {
  console.log('📝 Creating neon-config.js from template...');
  
  const configTemplate = `// Neon Database Configuration
// Update these values with your actual Neon credentials

module.exports = {
  // Neon connection details (get these from your Neon dashboard)
  neon: {
    host: 'your-neon-host.neon.tech',
    port: 5432,
    database: 'neondb',
    user: 'your-username',
    password: 'your-password',
    ssl: { rejectUnauthorized: false }
  },
  
  // Your current local database (for migration)
  local: {
    host: 'localhost',
    port: 5432,
    database: 'cargomatch',
    user: 'postgres',
    password: 'password'
  }
};`;

  fs.writeFileSync('./neon-config.js', configTemplate);
  console.log('✅ Created neon-config.js');
}

// Check if pg is installed
try {
  require('pg');
  console.log('✅ pg package is installed');
} catch (error) {
  console.log('📦 Installing pg package...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install pg', { stdio: 'inherit' });
    console.log('✅ pg package installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install pg package. Please run: npm install pg');
    process.exit(1);
  }
}

console.log('\n📋 Next Steps:');
console.log('1. Edit neon-config.js with your actual Neon credentials');
console.log('2. Run: node migrate-to-neon.js');
console.log('3. Update your .env file with Neon credentials');
console.log('4. Test your application');

console.log('\n📖 For detailed instructions, see NEON_MIGRATION_GUIDE.md');
