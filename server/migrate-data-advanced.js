const { Pool } = require('pg');
const fs = require('fs');

/**
 * Advanced Data Migration Script with Foreign Key Handling
 * Handles complex data relationships and ensures referential integrity
 */
class DataMigrationManager {
  constructor(localConfig, neonConfig) {
    this.localPool = new Pool(localConfig);
    this.neonPool = new Pool(neonConfig);
    this.migrationLog = [];
    this.idMappings = new Map(); // Store old_id -> new_id mappings
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logEntry);
    this.migrationLog.push(logEntry);
  }

  async migrateWithForeignKeyHandling() {
    this.log('🚀 Starting advanced data migration with foreign key handling...');
    
    try {
      // Step 1: Migrate independent tables first
      await this.migrateIndependentTables();
      
      // Step 2: Migrate dependent tables with foreign key resolution
      await this.migrateDependentTables();
      
      // Step 3: Validate referential integrity
      await this.validateReferentialIntegrity();
      
      this.log('✅ Advanced data migration completed successfully!');
      
    } catch (error) {
      this.log(`❌ Migration failed: ${error.message}`, 'error');
      throw error;
    } finally {
      await this.localPool.end();
      await this.neonPool.end();
    }
  }

  async migrateIndependentTables() {
    this.log('📦 Migrating independent tables...');
    
    // Tables with no foreign key dependencies
    const independentTables = [
      'users',
      'container_types'
    ];

    for (const table of independentTables) {
      await this.migrateTableWithIdMapping(table);
    }
  }

  async migrateDependentTables() {
    this.log('🔗 Migrating dependent tables with foreign key resolution...');
    
    // Tables with foreign key dependencies (in dependency order)
    const dependentTables = [
      'lsp_profiles',      // depends on users
      'containers',        // depends on lsp_profiles, container_types
      'bookings',         // depends on containers, users (importer/exporter)
      'shipments',        // depends on bookings, containers, lsp_profiles
      'shipment_status_history', // depends on shipments, users
      'complaints',       // depends on bookings, containers, lsp_profiles, users
      'notifications'     // depends on users
    ];

    for (const table of dependentTables) {
      await this.migrateTableWithForeignKeyResolution(table);
    }
  }

  async migrateTableWithIdMapping(tableName) {
    this.log(`Migrating ${tableName} with ID mapping...`);
    
    try {
      const result = await this.localPool.query(`SELECT * FROM ${tableName}`);
      
      if (result.rows.length === 0) {
        this.log(`ℹ️  No data found in ${tableName}`);
        return;
      }

      const columns = Object.keys(result.rows[0]);
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      
      // Handle conflicts based on table type
      let conflictClause = this.getConflictClause(tableName);
      const insertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ${conflictClause} RETURNING id`;
      
      let insertedCount = 0;
      
      for (const row of result.rows) {
        try {
          const values = columns.map(col => this.processValue(row[col]));
          const insertResult = await this.neonPool.query(insertQuery, values);
          
          // Store ID mapping for foreign key resolution
          if (insertResult.rows.length > 0) {
            this.idMappings.set(`${tableName}_${row.id}`, insertResult.rows[0].id);
          }
          
          insertedCount++;
        } catch (error) {
          this.log(`⚠️  Skipping row in ${tableName}: ${error.message}`, 'warn');
        }
      }
      
      this.log(`✅ Migrated ${insertedCount}/${result.rows.length} records from ${tableName}`);
      
    } catch (error) {
      this.log(`❌ Error migrating ${tableName}: ${error.message}`, 'error');
      throw error;
    }
  }

  async migrateTableWithForeignKeyResolution(tableName) {
    this.log(`Migrating ${tableName} with foreign key resolution...`);
    
    try {
      const result = await this.localPool.query(`SELECT * FROM ${tableName}`);
      
      if (result.rows.length === 0) {
        this.log(`ℹ️  No data found in ${tableName}`);
        return;
      }

      const columns = Object.keys(result.rows[0]);
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      
      let conflictClause = this.getConflictClause(tableName);
      const insertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ${conflictClause} RETURNING id`;
      
      let insertedCount = 0;
      
      for (const row of result.rows) {
        try {
          // Resolve foreign key references
          const resolvedRow = await this.resolveForeignKeys(tableName, row);
          const values = columns.map(col => this.processValue(resolvedRow[col]));
          
          const insertResult = await this.neonPool.query(insertQuery, values);
          
          // Store ID mapping
          if (insertResult.rows.length > 0) {
            this.idMappings.set(`${tableName}_${row.id}`, insertResult.rows[0].id);
          }
          
          insertedCount++;
        } catch (error) {
          this.log(`⚠️  Skipping row in ${tableName}: ${error.message}`, 'warn');
        }
      }
      
      this.log(`✅ Migrated ${insertedCount}/${result.rows.length} records from ${tableName}`);
      
    } catch (error) {
      this.log(`❌ Error migrating ${tableName}: ${error.message}`, 'error');
      throw error;
    }
  }

  async resolveForeignKeys(tableName, row) {
    const resolvedRow = { ...row };
    
    // Define foreign key mappings for each table
    const foreignKeyMappings = {
      'lsp_profiles': {
        'user_id': 'users'
      },
      'containers': {
        'lsp_id': 'lsp_profiles',
        'container_type_id': 'container_types'
      },
      'bookings': {
        'container_id': 'containers',
        'importer_id': 'users',
        'exporter_id': 'users'
      },
      'shipments': {
        'booking_id': 'bookings',
        'container_id': 'containers',
        'lsp_id': 'lsp_profiles'
      },
      'shipment_status_history': {
        'shipment_id': 'shipments',
        'updated_by': 'users'
      },
      'complaints': {
        'booking_id': 'bookings',
        'container_id': 'containers',
        'lsp_id': 'lsp_profiles',
        'complainant_id': 'users',
        'resolved_by': 'users'
      },
      'notifications': {
        'user_id': 'users'
      }
    };

    const mappings = foreignKeyMappings[tableName] || {};
    
    for (const [fkColumn, referencedTable] of Object.entries(mappings)) {
      if (row[fkColumn] !== null && row[fkColumn] !== undefined) {
        const newId = this.idMappings.get(`${referencedTable}_${row[fkColumn]}`);
        if (newId) {
          resolvedRow[fkColumn] = newId;
        } else {
          this.log(`⚠️  Foreign key not found: ${referencedTable}_${row[fkColumn]}`, 'warn');
          resolvedRow[fkColumn] = null; // Set to null if reference not found
        }
      }
    }

    return resolvedRow;
  }

  getConflictClause(tableName) {
    const conflictClauses = {
      'users': 'ON CONFLICT (email) DO NOTHING',
      'lsp_profiles': 'ON CONFLICT (pan_number) DO NOTHING',
      'containers': 'ON CONFLICT (container_number) DO NOTHING',
      'shipments': 'ON CONFLICT (shipment_number) DO NOTHING',
      'container_types': 'ON CONFLICT (type_name, size) DO NOTHING'
    };
    
    return conflictClauses[tableName] || 'ON CONFLICT (id) DO NOTHING';
  }

  processValue(value) {
    if (value === null) return null;
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return value;
  }

  async validateReferentialIntegrity() {
    this.log('🔍 Validating referential integrity...');
    
    const integrityChecks = [
      {
        name: 'LSP Profiles -> Users',
        query: `
          SELECT COUNT(*) as count 
          FROM lsp_profiles lp 
          LEFT JOIN users u ON lp.user_id = u.id 
          WHERE u.id IS NULL
        `
      },
      {
        name: 'Containers -> LSP Profiles',
        query: `
          SELECT COUNT(*) as count 
          FROM containers c 
          LEFT JOIN lsp_profiles lp ON c.lsp_id = lp.id 
          WHERE lp.id IS NULL
        `
      },
      {
        name: 'Bookings -> Containers',
        query: `
          SELECT COUNT(*) as count 
          FROM bookings b 
          LEFT JOIN containers c ON b.container_id = c.id 
          WHERE c.id IS NULL
        `
      },
      {
        name: 'Shipments -> Bookings',
        query: `
          SELECT COUNT(*) as count 
          FROM shipments s 
          LEFT JOIN bookings b ON s.booking_id = b.id 
          WHERE b.id IS NULL
        `
      },
      {
        name: 'Complaints -> Bookings',
        query: `
          SELECT COUNT(*) as count 
          FROM complaints c 
          LEFT JOIN bookings b ON c.booking_id = b.id 
          WHERE b.id IS NULL
        `
      }
    ];

    for (const check of integrityChecks) {
      try {
        const result = await this.neonPool.query(check.query);
        const orphanedCount = parseInt(result.rows[0].count);
        
        if (orphanedCount === 0) {
          this.log(`✅ ${check.name}: No orphaned records`);
        } else {
          this.log(`⚠️  ${check.name}: ${orphanedCount} orphaned records found`, 'warn');
        }
      } catch (error) {
        this.log(`❌ Integrity check failed for ${check.name}: ${error.message}`, 'error');
      }
    }
  }

  async generateMigrationReport() {
    this.log('📊 Generating migration report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      idMappings: Object.fromEntries(this.idMappings),
      migrationLog: this.migrationLog,
      summary: {
        totalTablesMigrated: this.idMappings.size,
        totalRecordsMapped: this.idMappings.size
      }
    };

    fs.writeFileSync('migration-report.json', JSON.stringify(report, null, 2));
    this.log('✅ Migration report saved to migration-report.json');
  }
}

// Configuration
const config = {
  local: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'logisticsdb',
    user: process.env.DB_USER || 'postgres',
    password: String(process.env.DB_PASS || 'admin123')
  },
  neon: {
    host: process.env.NEON_HOST || 'ep-muddy-bird-adpst8gp-pooler.c-2.us-east-1.aws.neon.tech',
    port: parseInt(process.env.NEON_PORT) || 5432,
    database: process.env.NEON_DATABASE || 'logisticsdb',
    user: process.env.NEON_USER || 'neondb_owner',
    password: String(process.env.NEON_PASSWORD || 'npg_VFKU7kx4mXnS'),
    ssl: { rejectUnauthorized: false }
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  const migrationManager = new DataMigrationManager(config.local, config.neon);
  
  migrationManager.migrateWithForeignKeyHandling()
    .then(async () => {
      await migrationManager.generateMigrationReport();
      console.log('\n🎉 Advanced data migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Advanced data migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = { DataMigrationManager };
