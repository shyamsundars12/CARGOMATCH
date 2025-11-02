#!/usr/bin/env node

/**
 * CargoMatch Neon Migration Master Script
 * Orchestrates the complete migration process from local PostgreSQL to Neon cloud
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class MigrationMaster {
  constructor() {
    this.startTime = new Date();
    this.logFile = `migration-${this.startTime.getTime()}.log`;
    this.results = {
      steps: [],
      success: false,
      duration: 0
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logEntry);
    
    // Also write to log file
    fs.appendFileSync(this.logFile, logEntry + '\n');
  }

  async executeStep(stepName, stepFunction) {
    this.log(`🔄 Starting: ${stepName}`);
    const stepStart = Date.now();
    
    try {
      await stepFunction();
      const duration = Date.now() - stepStart;
      this.log(`✅ Completed: ${stepName} (${duration}ms)`);
      
      this.results.steps.push({
        name: stepName,
        success: true,
        duration: duration
      });
      
      return true;
    } catch (error) {
      const duration = Date.now() - stepStart;
      this.log(`❌ Failed: ${stepName} - ${error.message}`, 'error');
      
      this.results.steps.push({
        name: stepName,
        success: false,
        duration: duration,
        error: error.message
      });
      
      return false;
    }
  }

  async checkPrerequisites() {
    this.log('🔍 Checking prerequisites...');
    
    // Check if Node.js is available
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      this.log(`✅ Node.js version: ${nodeVersion}`);
    } catch (error) {
      throw new Error('Node.js is not installed or not in PATH');
    }

    // Check if npm is available
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.log(`✅ npm version: ${npmVersion}`);
    } catch (error) {
      throw new Error('npm is not installed or not in PATH');
    }

    // Check if required files exist
    const requiredFiles = [
      'src/config/db.js',
      'src/config/schema.sql',
      'package.json'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required file not found: ${file}`);
      }
    }
    this.log('✅ All required files present');

    // Check environment variables
    const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }
    this.log('✅ Environment variables configured');
  }

  async backupLocalDatabase() {
    this.log('💾 Creating local database backup...');
    
    const backupFile = `backup-${Date.now()}.sql`;
    const backupCommand = `pg_dump -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} > ${backupFile}`;
    
    try {
      execSync(backupCommand, { stdio: 'pipe' });
      this.log(`✅ Database backup created: ${backupFile}`);
      return backupFile;
    } catch (error) {
      throw new Error(`Database backup failed: ${error.message}`);
    }
  }

  async runMigration() {
    this.log('🚀 Running comprehensive migration...');
    
    // Import and run the comprehensive migration
    const { NeonMigration } = require('./migrate-to-neon-comprehensive.js');
    
    const config = {
      local: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS
      },
      neon: {
        host: process.env.NEON_HOST || 'ep-muddy-bird-adpst8gp-pooler.c-2.us-east-1.aws.neon.tech',
        port: process.env.NEON_PORT || 5432,
        database: process.env.NEON_DATABASE || process.env.DB_NAME,
        user: process.env.NEON_USER || 'neondb_owner',
        password: process.env.NEON_PASSWORD || 'npg_VFKU7kx4mXnS',
        ssl: { rejectUnauthorized: false }
      }
    };

    const migration = new NeonMigration(config.local, config.neon);
    await migration.run();
  }

  async runAdvancedDataMigration() {
    this.log('📦 Running advanced data migration with foreign key handling...');
    
    const { DataMigrationManager } = require('./migrate-data-advanced.js');
    
    const config = {
      local: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS
      },
      neon: {
        host: process.env.NEON_HOST || 'ep-muddy-bird-adpst8gp-pooler.c-2.us-east-1.aws.neon.tech',
        port: process.env.NEON_PORT || 5432,
        database: process.env.NEON_DATABASE || process.env.DB_NAME,
        user: process.env.NEON_USER || 'neondb_owner',
        password: process.env.NEON_PASSWORD || 'npg_VFKU7kx4mXnS',
        ssl: { rejectUnauthorized: false }
      }
    };

    const migrationManager = new DataMigrationManager(config.local, config.neon);
    await migrationManager.migrateWithForeignKeyHandling();
    await migrationManager.generateMigrationReport();
  }

  async validateWorkflows() {
    this.log('🔍 Validating all workflows...');
    
    const { WorkflowValidator } = require('./validate-workflows.js');
    const validator = new WorkflowValidator();
    await validator.run();
  }

  async testAPIEndpoints() {
    this.log('🧪 Testing all API endpoints...');
    
    const { APIEndpointTester } = require('./test-api-endpoints.js');
    const tester = new APIEndpointTester();
    await tester.run();
  }

  async runFinalSystemTest() {
    this.log('🎯 Running final system test...');
    
    try {
      execSync('node test-final-system.js', { stdio: 'pipe' });
      this.log('✅ Final system test passed');
    } catch (error) {
      throw new Error(`Final system test failed: ${error.message}`);
    }
  }

  async generateEnvironmentConfig() {
    this.log('📝 Generating environment configuration...');
    
    const envConfig = `# Neon Database Configuration
# Generated after successful migration

# Database Configuration
DB_HOST=${process.env.NEON_HOST || 'ep-muddy-bird-adpst8gp-pooler.c-2.us-east-1.aws.neon.tech'}
DB_PORT=${process.env.NEON_PORT || 5432}
DB_NAME=${process.env.NEON_DATABASE || process.env.DB_NAME}
DB_USER=${process.env.NEON_USER || 'neondb_owner'}
DB_PASS=${process.env.NEON_PASSWORD || 'npg_VFKU7kx4mXnS'}
DB_SSL=true

# JWT Configuration
JWT_SECRET=${process.env.JWT_SECRET || 'Hello@13'}

# Admin Configuration
ADMIN_EMAIL=${process.env.ADMIN_EMAIL || 'admin@cargomatch.in'}
ADMIN_PASSWORD=${process.env.ADMIN_PASSWORD || 'adminCargomatch123'}

# Server Configuration
PORT=${process.env.PORT || 5000}
NODE_ENV=production
`;

    fs.writeFileSync('.env.neon', envConfig);
    this.log('✅ Environment configuration saved to .env.neon');
  }

  async generateMigrationReport() {
    this.log('📊 Generating migration report...');
    
    const endTime = new Date();
    this.results.duration = endTime - this.startTime;
    this.results.success = this.results.steps.every(step => step.success);
    
    const report = {
      migration: {
        startTime: this.startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: this.results.duration,
        success: this.results.success
      },
      steps: this.results.steps,
      summary: {
        totalSteps: this.results.steps.length,
        successfulSteps: this.results.steps.filter(step => step.success).length,
        failedSteps: this.results.steps.filter(step => !step.success).length,
        successRate: Math.round((this.results.steps.filter(step => step.success).length / this.results.steps.length) * 100)
      },
      recommendations: this.generateRecommendations()
    };

    fs.writeFileSync('migration-report.json', JSON.stringify(report, null, 2));
    this.log('✅ Migration report saved to migration-report.json');
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.success) {
      recommendations.push('✅ Migration completed successfully');
      recommendations.push('📝 Update your .env file with Neon credentials');
      recommendations.push('🚀 Deploy your application to production');
      recommendations.push('📊 Monitor application performance in Neon dashboard');
    } else {
      recommendations.push('❌ Migration had failures - review the log');
      recommendations.push('🔧 Fix any issues before proceeding to production');
      recommendations.push('🔄 Consider running migration again after fixes');
    }
    
    recommendations.push('💾 Keep local database backup for rollback if needed');
    recommendations.push('📈 Set up monitoring and alerting for production');
    
    return recommendations;
  }

  async run() {
    console.log('🎯 CargoMatch Neon Migration Master Script');
    console.log('==========================================\n');
    
    try {
      // Step 1: Check prerequisites
      await this.executeStep('Prerequisites Check', () => this.checkPrerequisites());
      
      // Step 2: Backup local database
      await this.executeStep('Local Database Backup', () => this.backupLocalDatabase());
      
      // Step 3: Run comprehensive migration
      await this.executeStep('Comprehensive Migration', () => this.runMigration());
      
      // Step 4: Run advanced data migration
      await this.executeStep('Advanced Data Migration', () => this.runAdvancedDataMigration());
      
      // Step 5: Validate workflows
      await this.executeStep('Workflow Validation', () => this.validateWorkflows());
      
      // Step 6: Test API endpoints
      await this.executeStep('API Endpoint Testing', () => this.testAPIEndpoints());
      
      // Step 7: Run final system test
      await this.executeStep('Final System Test', () => this.runFinalSystemTest());
      
      // Step 8: Generate environment config
      await this.executeStep('Environment Configuration', () => this.generateEnvironmentConfig());
      
      // Step 9: Generate migration report
      await this.executeStep('Migration Report', () => this.generateMigrationReport());
      
      // Final summary
      this.generateFinalSummary();
      
    } catch (error) {
      this.log(`❌ Migration master script failed: ${error.message}`, 'error');
      await this.generateMigrationReport();
      process.exit(1);
    }
  }

  generateFinalSummary() {
    const duration = Math.round(this.results.duration / 1000);
    const successfulSteps = this.results.steps.filter(step => step.success).length;
    const totalSteps = this.results.steps.length;
    
    console.log('\n🎉 Migration Master Script Summary');
    console.log('===================================');
    console.log(`⏱️  Total Duration: ${duration} seconds`);
    console.log(`✅ Successful Steps: ${successfulSteps}/${totalSteps}`);
    console.log(`📈 Success Rate: ${Math.round((successfulSteps / totalSteps) * 100)}%`);
    
    if (this.results.success) {
      console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('✅ All workflows validated and functional');
      console.log('✅ API endpoints tested and working');
      console.log('✅ Database migration successful');
      console.log('\n📝 Next Steps:');
      console.log('1. Copy .env.neon to .env');
      console.log('2. Deploy your application');
      console.log('3. Monitor performance in Neon dashboard');
    } else {
      console.log('\n⚠️  MIGRATION HAD ISSUES');
      console.log('❌ Some steps failed - please review the log');
      console.log('🔧 Fix issues and re-run migration if needed');
    }
    
    console.log(`\n📄 Detailed log saved to: ${this.logFile}`);
    console.log('📊 Migration report saved to: migration-report.json');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  const migrationMaster = new MigrationMaster();
  migrationMaster.run()
    .then(() => {
      console.log('\n✅ Migration master script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration master script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { MigrationMaster };
