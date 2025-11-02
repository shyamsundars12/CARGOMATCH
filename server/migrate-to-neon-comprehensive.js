const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration - Update these with your actual Neon credentials
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

class NeonMigration {
  constructor() {
    this.localPool = new Pool(config.local);
    this.neonPool = new Pool(config.neon);
    this.migrationLog = [];
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logEntry);
    this.migrationLog.push(logEntry);
  }

  async testConnections() {
    this.log('Testing database connections...');
    
    try {
      await this.localPool.query('SELECT 1');
      this.log('✅ Local database connected successfully');
    } catch (error) {
      throw new Error(`Local database connection failed: ${error.message}`);
    }

    try {
      await this.neonPool.query('SELECT 1');
      this.log('✅ Neon database connected successfully');
    } catch (error) {
      throw new Error(`Neon database connection failed: ${error.message}`);
    }
  }

  async createNeonSchema() {
    this.log('Creating schema in Neon database...');
    
    const schemaSQL = `
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      -- Drop existing tables if they exist (in correct order due to foreign keys)
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS complaints CASCADE;
      DROP TABLE IF EXISTS shipment_status_history CASCADE;
      DROP TABLE IF EXISTS shipments CASCADE;
      DROP TABLE IF EXISTS bookings CASCADE;
      DROP TABLE IF EXISTS containers CASCADE;
      DROP TABLE IF EXISTS container_types CASCADE;
      DROP TABLE IF EXISTS lsp_profiles CASCADE;
      DROP TABLE IF EXISTS users CASCADE;

      -- Create users table (keeping SERIAL for compatibility)
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        is_approved BOOLEAN DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create lsp_profiles table
      CREATE TABLE lsp_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        pan_number VARCHAR(20) UNIQUE NOT NULL,
        gst_number VARCHAR(20) UNIQUE NOT NULL,
        company_registration VARCHAR(50),
        phone VARCHAR(20),
        address TEXT,
        business_license VARCHAR(100),
        insurance_certificate VARCHAR(100),
        gst_certificate_path TEXT,
        company_registration_doc_path TEXT,
        business_license_doc_path TEXT,
        insurance_certificate_doc_path TEXT,
        is_verified BOOLEAN DEFAULT false,
        verification_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create container_types table
      CREATE TABLE container_types (
        id SERIAL PRIMARY KEY,
        type_name VARCHAR(50) NOT NULL,
        size VARCHAR(20) NOT NULL,
        capacity DECIMAL(10,2),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create containers table
      CREATE TABLE containers (
        id SERIAL PRIMARY KEY,
        lsp_id INTEGER REFERENCES lsp_profiles(id) ON DELETE CASCADE,
        container_type_id INTEGER REFERENCES container_types(id),
        container_number VARCHAR(50) UNIQUE NOT NULL,
        size VARCHAR(20) NOT NULL,
        type VARCHAR(50) NOT NULL,
        capacity DECIMAL(10,2),
        is_available BOOLEAN DEFAULT true,
        current_location VARCHAR(255),
        departure_date DATE,
        arrival_date DATE,
        origin_port VARCHAR(100),
        destination_port VARCHAR(100),
        route_description TEXT,
        price_per_unit DECIMAL(10,2),
        currency VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(50) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create bookings table
      CREATE TABLE bookings (
        id SERIAL PRIMARY KEY,
        container_id INTEGER REFERENCES containers(id) ON DELETE CASCADE,
        importer_id INTEGER REFERENCES users(id),
        exporter_id INTEGER REFERENCES users(id),
        booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        departure_date DATE NOT NULL,
        arrival_date DATE NOT NULL,
        cargo_type VARCHAR(100),
        cargo_weight DECIMAL(10,2),
        cargo_volume DECIMAL(10,2),
        special_requirements TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        is_auto_approved BOOLEAN DEFAULT true,
        approved_at TIMESTAMP,
        closed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create shipments table
      CREATE TABLE shipments (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        container_id INTEGER REFERENCES containers(id),
        lsp_id INTEGER REFERENCES lsp_profiles(id),
        shipment_number VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        current_location VARCHAR(255),
        departure_port VARCHAR(100),
        arrival_port VARCHAR(100),
        actual_departure_date TIMESTAMP,
        actual_arrival_date TIMESTAMP,
        estimated_arrival_date TIMESTAMP,
        tracking_updates JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create shipment_status_history table
      CREATE TABLE shipment_status_history (
        id SERIAL PRIMARY KEY,
        shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        location VARCHAR(255),
        description TEXT,
        updated_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create complaints table
      CREATE TABLE complaints (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        container_id INTEGER REFERENCES containers(id),
        lsp_id INTEGER REFERENCES lsp_profiles(id),
        complainant_id INTEGER REFERENCES users(id),
        complaint_type VARCHAR(100),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        priority VARCHAR(20) DEFAULT 'medium',
        resolution TEXT,
        resolved_at TIMESTAMP,
        resolved_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create notifications table
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50),
        is_read BOOLEAN DEFAULT false,
        related_entity_type VARCHAR(50),
        related_entity_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Insert default container types
      INSERT INTO container_types (type_name, size, capacity, description) VALUES
      ('Standard', '20ft', 33.2, 'Standard 20-foot container'),
      ('Standard', '40ft', 67.7, 'Standard 40-foot container'),
      ('High Cube', '40ft', 76.3, 'High cube 40-foot container'),
      ('Refrigerated', '20ft', 30.1, 'Refrigerated 20-foot container'),
      ('Refrigerated', '40ft', 67.5, 'Refrigerated 40-foot container'),
      ('Open Top', '20ft', 32.6, 'Open top 20-foot container'),
      ('Open Top', '40ft', 66.7, 'Open top 40-foot container'),
      ('Flat Rack', '20ft', 28.0, 'Flat rack 20-foot container'),
      ('Flat Rack', '40ft', 40.0, 'Flat rack 40-foot container')
      ON CONFLICT DO NOTHING;
    `;

    await this.neonPool.query(schemaSQL);
    this.log('✅ Schema created successfully in Neon');
  }

  async migrateData() {
    this.log('Starting data migration...');
    
    const tables = [
      'users',
      'lsp_profiles',
      'container_types',
      'containers',
      'bookings',
      'shipments',
      'shipment_status_history',
      'complaints',
      'notifications'
    ];

    for (const table of tables) {
      await this.migrateTable(table);
    }
  }

  async migrateTable(tableName) {
    this.log(`Migrating table: ${tableName}`);
    
    try {
      // Get data from local database
      const result = await this.localPool.query(`SELECT * FROM ${tableName}`);
      
      if (result.rows.length === 0) {
        this.log(`ℹ️  No data found in ${tableName}`);
        return;
      }

      // Get column names
      const columns = Object.keys(result.rows[0]);
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      
      // Handle conflicts based on table type
      let conflictClause = '';
      if (tableName === 'users') {
        conflictClause = 'ON CONFLICT (email) DO NOTHING';
      } else if (tableName === 'lsp_profiles') {
        conflictClause = 'ON CONFLICT (pan_number) DO NOTHING';
      } else if (tableName === 'containers') {
        conflictClause = 'ON CONFLICT (container_number) DO NOTHING';
      } else if (tableName === 'shipments') {
        conflictClause = 'ON CONFLICT (shipment_number) DO NOTHING';
      } else if (tableName === 'container_types') {
        conflictClause = 'ON CONFLICT (type_name, size) DO NOTHING';
      } else {
        conflictClause = 'ON CONFLICT (id) DO NOTHING';
      }

      const insertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ${conflictClause}`;
      
      // Insert data in batches
      const batchSize = 50;
      let insertedCount = 0;
      
      for (let i = 0; i < result.rows.length; i += batchSize) {
        const batch = result.rows.slice(i, i + batchSize);
        
        for (const row of batch) {
          try {
            const values = columns.map(col => {
              // Handle special data types
              if (row[col] === null) return null;
              if (typeof row[col] === 'object' && row[col] !== null) {
                return JSON.stringify(row[col]);
              }
              return row[col];
            });
            
            await this.neonPool.query(insertQuery, values);
            insertedCount++;
          } catch (error) {
            this.log(`⚠️  Skipping row in ${tableName}: ${error.message}`, 'warn');
          }
        }
      }
      
      this.log(`✅ Migrated ${insertedCount}/${result.rows.length} records from ${tableName}`);
      
    } catch (error) {
      this.log(`❌ Error migrating ${tableName}: ${error.message}`, 'error');
      throw error;
    }
  }

  async createIndexes() {
    this.log('Creating indexes and constraints...');
    
    const indexesSQL = `
      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_lsp_profiles_user_id ON lsp_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_lsp_profiles_pan_number ON lsp_profiles(pan_number);
      CREATE INDEX IF NOT EXISTS idx_containers_lsp_id ON containers(lsp_id);
      CREATE INDEX IF NOT EXISTS idx_containers_status ON containers(status);
      CREATE INDEX IF NOT EXISTS idx_containers_container_number ON containers(container_number);
      CREATE INDEX IF NOT EXISTS idx_bookings_container_id ON bookings(container_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_importer_id ON bookings(importer_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_exporter_id ON bookings(exporter_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
      CREATE INDEX IF NOT EXISTS idx_shipments_booking_id ON shipments(booking_id);
      CREATE INDEX IF NOT EXISTS idx_shipments_container_id ON shipments(container_id);
      CREATE INDEX IF NOT EXISTS idx_shipments_lsp_id ON shipments(lsp_id);
      CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
      CREATE INDEX IF NOT EXISTS idx_shipments_shipment_number ON shipments(shipment_number);
      CREATE INDEX IF NOT EXISTS idx_shipment_status_history_shipment_id ON shipment_status_history(shipment_id);
      CREATE INDEX IF NOT EXISTS idx_complaints_booking_id ON complaints(booking_id);
      CREATE INDEX IF NOT EXISTS idx_complaints_container_id ON complaints(container_id);
      CREATE INDEX IF NOT EXISTS idx_complaints_lsp_id ON complaints(lsp_id);
      CREATE INDEX IF NOT EXISTS idx_complaints_complainant_id ON complaints(complainant_id);
      CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
    `;

    await this.neonPool.query(indexesSQL);
    this.log('✅ Indexes created successfully');
  }

  async validateMigration() {
    this.log('Validating migration...');
    
    const validationQueries = [
      { name: 'Users', query: 'SELECT COUNT(*) as count FROM users' },
      { name: 'LSP Profiles', query: 'SELECT COUNT(*) as count FROM lsp_profiles' },
      { name: 'Container Types', query: 'SELECT COUNT(*) as count FROM container_types' },
      { name: 'Containers', query: 'SELECT COUNT(*) as count FROM containers' },
      { name: 'Bookings', query: 'SELECT COUNT(*) as count FROM bookings' },
      { name: 'Shipments', query: 'SELECT COUNT(*) as count FROM shipments' },
      { name: 'Complaints', query: 'SELECT COUNT(*) as count FROM complaints' },
      { name: 'Notifications', query: 'SELECT COUNT(*) as count FROM notifications' }
    ];

    for (const validation of validationQueries) {
      try {
        const result = await this.neonPool.query(validation.query);
        const count = result.rows[0].count;
        this.log(`✅ ${validation.name}: ${count} records`);
      } catch (error) {
        this.log(`❌ Validation failed for ${validation.name}: ${error.message}`, 'error');
      }
    }
  }

  async generateEnvConfig() {
    this.log('Generating environment configuration...');
    
    const envConfig = `# Neon Database Configuration
# Generated after successful migration

# Database Configuration
DB_HOST=${config.neon.host}
DB_PORT=${config.neon.port}
DB_NAME=${config.neon.database}
DB_USER=${config.neon.user}
DB_PASS=${config.neon.password}
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
    
    console.log('\n📝 Next steps:');
    console.log('1. Copy .env.neon to .env');
    console.log('2. Update your application to use the new database configuration');
    console.log('3. Run the validation tests to ensure everything works');
  }

  async run() {
    try {
      this.log('🚀 Starting comprehensive Neon migration...');
      
      await this.testConnections();
      await this.createNeonSchema();
      await this.migrateData();
      await this.createIndexes();
      await this.validateMigration();
      await this.generateEnvConfig();
      
      this.log('🎉 Migration completed successfully!');
      
      // Save migration log
      fs.writeFileSync('migration-log.txt', this.migrationLog.join('\n'));
      this.log('📄 Migration log saved to migration-log.txt');
      
    } catch (error) {
      this.log(`❌ Migration failed: ${error.message}`, 'error');
      throw error;
    } finally {
      await this.localPool.end();
      await this.neonPool.end();
    }
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  const migration = new NeonMigration();
  migration.run()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = { NeonMigration };
