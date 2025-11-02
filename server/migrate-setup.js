#!/usr/bin/env node

/**
 * CargoMatch Migration Setup Script
 * Interactive setup for Neon database migration
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

class MigrationSetup {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.config = {};
  }

  async question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  async setup() {
    console.log('🎯 CargoMatch Neon Migration Setup');
    console.log('===================================\n');
    
    console.log('This script will help you configure the migration from local PostgreSQL to Neon cloud database.\n');
    
    // Get Neon credentials
    console.log('📡 Neon Database Configuration:');
    this.config.neonHost = await this.question('Neon Host (e.g., ep-xxx.aws.neon.tech): ');
    this.config.neonPort = await this.question('Neon Port (default: 5432): ') || '5432';
    this.config.neonDatabase = await this.question('Neon Database Name: ');
    this.config.neonUser = await this.question('Neon Username: ');
    this.config.neonPassword = await this.question('Neon Password: ');
    
    // Get local database info
    console.log('\n💾 Local Database Configuration:');
    this.config.localHost = await this.question('Local Host (default: localhost): ') || 'localhost';
    this.config.localPort = await this.question('Local Port (default: 5432): ') || '5432';
    this.config.localDatabase = await this.question('Local Database Name: ');
    this.config.localUser = await this.question('Local Username: ');
    this.config.localPassword = await this.question('Local Password: ');
    
    // Get other configuration
    console.log('\n⚙️  Additional Configuration:');
    this.config.jwtSecret = await this.question('JWT Secret (default: Hello@13): ') || 'Hello@13';
    this.config.adminEmail = await this.question('Admin Email (default: admin@cargomatch.in): ') || 'admin@cargomatch.in';
    this.config.adminPassword = await this.question('Admin Password (default: adminCargomatch123): ') || 'adminCargomatch123';
    this.config.serverPort = await this.question('Server Port (default: 5000): ') || '5000';
    
    // Confirm configuration
    console.log('\n📋 Configuration Summary:');
    console.log('========================');
    console.log(`Neon Host: ${this.config.neonHost}`);
    console.log(`Neon Database: ${this.config.neonDatabase}`);
    console.log(`Neon User: ${this.config.neonUser}`);
    console.log(`Local Host: ${this.config.localHost}`);
    console.log(`Local Database: ${this.config.localDatabase}`);
    console.log(`Local User: ${this.config.localUser}`);
    console.log(`JWT Secret: ${this.config.jwtSecret}`);
    console.log(`Admin Email: ${this.config.adminEmail}`);
    console.log(`Server Port: ${this.config.serverPort}`);
    
    const confirm = await this.question('\nIs this configuration correct? (y/n): ');
    
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ Configuration cancelled');
      this.rl.close();
      return;
    }
    
    // Generate configuration files
    await this.generateConfigFiles();
    
    console.log('\n✅ Setup completed successfully!');
    console.log('\n📝 Generated files:');
    console.log('- .env.local (for local development)');
    console.log('- .env.neon (for Neon deployment)');
    console.log('- migrate-config.js (migration configuration)');
    
    console.log('\n🚀 Next steps:');
    console.log('1. Run: node migrate-master.js');
    console.log('2. Follow the migration process');
    console.log('3. Update your .env file with Neon credentials');
    console.log('4. Deploy your application');
    
    this.rl.close();
  }

  async generateConfigFiles() {
    // Generate local environment file
    const localEnv = `# Local Database Configuration
DB_HOST=${this.config.localHost}
DB_PORT=${this.config.localPort}
DB_NAME=${this.config.localDatabase}
DB_USER=${this.config.localUser}
DB_PASS=${this.config.localPassword}
DB_SSL=false

# JWT Configuration
JWT_SECRET=${this.config.jwtSecret}

# Admin Configuration
ADMIN_EMAIL=${this.config.adminEmail}
ADMIN_PASSWORD=${this.config.adminPassword}

# Server Configuration
PORT=${this.config.serverPort}
NODE_ENV=development
`;

    fs.writeFileSync('.env.local', localEnv);
    
    // Generate Neon environment file
    const neonEnv = `# Neon Database Configuration
DB_HOST=${this.config.neonHost}
DB_PORT=${this.config.neonPort}
DB_NAME=${this.config.neonDatabase}
DB_USER=${this.config.neonUser}
DB_PASS=${this.config.neonPassword}
DB_SSL=true

# JWT Configuration
JWT_SECRET=${this.config.jwtSecret}

# Admin Configuration
ADMIN_EMAIL=${this.config.adminEmail}
ADMIN_PASSWORD=${this.config.adminPassword}

# Server Configuration
PORT=${this.config.serverPort}
NODE_ENV=production
`;

    fs.writeFileSync('.env.neon', neonEnv);
    
    // Generate migration configuration
    const migrationConfig = `// Migration Configuration
// Generated by setup script

module.exports = {
  local: {
    host: '${this.config.localHost}',
    port: ${this.config.localPort},
    database: '${this.config.localDatabase}',
    user: '${this.config.localUser}',
    password: '${this.config.localPassword}'
  },
  neon: {
    host: '${this.config.neonHost}',
    port: ${this.config.neonPort},
    database: '${this.config.neonDatabase}',
    user: '${this.config.neonUser}',
    password: '${this.config.neonPassword}',
    ssl: { rejectUnauthorized: false }
  }
};
`;

    fs.writeFileSync('migrate-config.js', migrationConfig);
    
    // Generate package.json script
    const packageJsonPath = 'package.json';
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }
      
      packageJson.scripts['migrate:setup'] = 'node migrate-setup.js';
      packageJson.scripts['migrate:run'] = 'node migrate-master.js';
      packageJson.scripts['migrate:validate'] = 'node validate-workflows.js';
      packageJson.scripts['migrate:test'] = 'node test-api-endpoints.js';
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  const setup = new MigrationSetup();
  setup.setup()
    .then(() => {
      console.log('\n✅ Setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = { MigrationSetup };
