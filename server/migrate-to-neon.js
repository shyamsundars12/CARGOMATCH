const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Try to load configuration from neon-config.js, fallback to environment variables
let config;
try {
  config = require('./neon-config.js');
} catch (error) {
  console.log('⚠️  neon-config.js not found, using environment variables');
  config = {
    local: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'cargomatch',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    },
    neon: {
      host: process.env.NEON_HOST || 'your-neon-host.neon.tech',
      port: process.env.NEON_PORT || 5432,
      database: process.env.NEON_DATABASE || 'neondb',
      user: process.env.NEON_USER || 'your-username',
      password: process.env.NEON_PASSWORD || 'your-password',
      ssl: { rejectUnauthorized: false }
    }
  };
}

const localConfig = config.local;
const neonConfig = config.neon;

async function migrateToNeon() {
  const localPool = new Pool(localConfig);
  const neonPool = new Pool(neonConfig);

  try {
    console.log('🚀 Starting migration to Neon DB...');
    
    // Test connections
    console.log('📡 Testing local database connection...');
    await localPool.query('SELECT 1');
    console.log('✅ Local database connected');

    console.log('📡 Testing Neon database connection...');
    await neonPool.query('SELECT 1');
    console.log('✅ Neon database connected');

    // Step 1: Create tables in Neon (using our schema)
    console.log('📋 Creating tables in Neon...');
    await createTablesInNeon(neonPool);
    console.log('✅ Tables created successfully');

    // Step 2: Migrate data
    console.log('📦 Migrating data...');
    await migrateData(localPool, neonPool);
    console.log('✅ Data migrated successfully');

    // Step 3: Create indexes and constraints
    console.log('🔗 Creating indexes and constraints...');
    await createIndexesAndConstraints(neonPool);
    console.log('✅ Indexes and constraints created');

    console.log('🎉 Migration completed successfully!');
    console.log('📝 Update your .env file with Neon credentials:');
    console.log(`DB_HOST=${neonConfig.host}`);
    console.log(`DB_PORT=${neonConfig.port}`);
    console.log(`DB_NAME=${neonConfig.database}`);
    console.log(`DB_USER=${neonConfig.user}`);
    console.log(`DB_PASSWORD=${neonConfig.password}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await localPool.end();
    await neonPool.end();
  }
}

async function createTablesInNeon(neonPool) {
  const schemaSQL = `
    -- Drop existing tables if they exist
    DROP TABLE IF EXISTS notifications CASCADE;
    DROP TABLE IF EXISTS complaints CASCADE;
    DROP TABLE IF EXISTS shipments CASCADE;
    DROP TABLE IF EXISTS bookings CASCADE;
    DROP TABLE IF EXISTS containers CASCADE;
    DROP TABLE IF EXISTS container_types CASCADE;
    DROP TABLE IF EXISTS lsp_profiles CASCADE;
    DROP TABLE IF EXISTS users CASCADE;

    -- Create users table
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      phone_number VARCHAR(10),
      company_name VARCHAR(255),
      gst_number VARCHAR(20),
      pan_number VARCHAR(20),
      company_registration VARCHAR(20),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      pincode VARCHAR(10),
      country VARCHAR(100),
      verification_status VARCHAR(20) DEFAULT 'pending',
      profile_image_url TEXT,
      fcm_token TEXT,
      role VARCHAR(20) DEFAULT 'user',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create lsp_profiles table
    CREATE TABLE lsp_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_name VARCHAR(255) NOT NULL,
      pan_number VARCHAR(20),
      gst_number VARCHAR(20),
      company_registration VARCHAR(20),
      phone VARCHAR(15),
      address TEXT,
      business_license VARCHAR(20),
      insurance_certificate VARCHAR(20),
      gst_certificate_path TEXT,
      company_registration_doc_path TEXT,
      business_license_doc_path TEXT,
      insurance_certificate_doc_path TEXT,
      is_verified BOOLEAN DEFAULT false,
      verification_status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create container_types table
    CREATE TABLE container_types (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type_name VARCHAR(100) NOT NULL,
      size VARCHAR(20) NOT NULL,
      capacity DECIMAL(10,2) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(type_name, size)
    );

    -- Create containers table
    CREATE TABLE containers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lsp_id UUID NOT NULL REFERENCES lsp_profiles(id) ON DELETE CASCADE,
      container_type_id UUID REFERENCES container_types(id) ON DELETE CASCADE,
      container_number VARCHAR(50) UNIQUE NOT NULL,
      size VARCHAR(20) NOT NULL,
      type VARCHAR(100) NOT NULL,
      capacity DECIMAL(10,2) NOT NULL,
      current_location VARCHAR(255),
      status VARCHAR(50) DEFAULT 'available',
      is_available BOOLEAN DEFAULT true,
      departure_date DATE,
      arrival_date DATE,
      origin_port VARCHAR(100),
      destination_port VARCHAR(100),
      route_description TEXT,
      price_per_unit DECIMAL(10,2),
      currency VARCHAR(10) DEFAULT 'USD',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create bookings table
    CREATE TABLE bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
      lsp_id UUID NOT NULL REFERENCES lsp_profiles(id) ON DELETE CASCADE,
      weight DECIMAL(10,2),
      volume DECIMAL(10,2),
      booked_units INTEGER DEFAULT 1,
      total_price DECIMAL(10,2),
      status VARCHAR(50) DEFAULT 'pending',
      payment_status VARCHAR(50) DEFAULT 'pending',
      payment_id VARCHAR(100),
      tracking_number VARCHAR(100),
      notes TEXT,
      shipment_details JSONB,
      documents TEXT[],
      booking_date TIMESTAMP,
      departure_date TIMESTAMP,
      arrival_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create shipments table
    CREATE TABLE shipments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
      lsp_id UUID NOT NULL REFERENCES lsp_profiles(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tracking_number VARCHAR(100) UNIQUE NOT NULL,
      status VARCHAR(50) DEFAULT 'scheduled',
      current_status VARCHAR(50),
      current_location VARCHAR(255),
      latitude DECIMAL(10,8),
      longitude DECIMAL(11,8),
      last_updated TIMESTAMP,
      scheduled_departure TIMESTAMP,
      actual_departure TIMESTAMP,
      estimated_arrival TIMESTAMP,
      actual_arrival TIMESTAMP,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create complaints table
    CREATE TABLE complaints (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      lsp_id UUID NOT NULL REFERENCES lsp_profiles(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(100),
      status VARCHAR(50) DEFAULT 'open',
      priority VARCHAR(20) DEFAULT 'medium',
      attachments TEXT[],
      resolution TEXT,
      resolved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create notifications table
    CREATE TABLE notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await neonPool.query(schemaSQL);
}

async function migrateData(localPool, neonPool) {
  // Get all data from local database
  const tables = [
    'users',
    'lsp_profiles', 
    'container_types',
    'containers',
    'bookings',
    'shipments',
    'complaints',
    'notifications'
  ];

  for (const table of tables) {
    console.log(`📦 Migrating ${table}...`);
    
    try {
      const result = await localPool.query(`SELECT * FROM ${table}`);
      
      if (result.rows.length > 0) {
        // Get column names
        const columns = Object.keys(result.rows[0]);
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
        const insertQuery = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        
        // Insert data in batches
        const batchSize = 100;
        for (let i = 0; i < result.rows.length; i += batchSize) {
          const batch = result.rows.slice(i, i + batchSize);
          
          for (const row of batch) {
            const values = columns.map(col => row[col]);
            await neonPool.query(insertQuery, values);
          }
        }
        
        console.log(`✅ Migrated ${result.rows.length} records from ${table}`);
      } else {
        console.log(`ℹ️  No data found in ${table}`);
      }
    } catch (error) {
      console.error(`❌ Error migrating ${table}:`, error.message);
      // Continue with other tables
    }
  }
}

async function createIndexesAndConstraints(neonPool) {
  const indexesSQL = `
    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_lsp_profiles_user_id ON lsp_profiles(user_id);
    CREATE INDEX IF NOT EXISTS idx_containers_lsp_id ON containers(lsp_id);
    CREATE INDEX IF NOT EXISTS idx_containers_status ON containers(status);
    CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_container_id ON bookings(container_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_lsp_id ON bookings(lsp_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_shipments_lsp_id ON shipments(lsp_id);
    CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON shipments(user_id);
    CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
    CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_lsp_id ON complaints(lsp_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
  `;

  await neonPool.query(indexesSQL);
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateToNeon()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToNeon };
