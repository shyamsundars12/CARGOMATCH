#!/usr/bin/env node

/**
 * Migrate Schema and Data to Neon Database
 */

const { Pool } = require('pg');

async function migrateToNeon() {
  console.log('☁️  Migrating Schema and Data to Neon');
  console.log('=====================================\n');
  
  const neonPool = new Pool({
    host: 'ep-green-rice-adtvyi8t-pooler.c-2.us-east-1.aws.neon.tech',
    port: 5432,
    database: 'logisticsdb',
    user: 'neondb_owner',
    password: 'npg_iWdBt3xb2PRq',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000
  });

  const localPool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'logisticsdb',
    user: 'postgres',
    password: 'admin123',
    ssl: false
  });

  try {
    console.log('1️⃣  Connecting to databases...');
    const neonClient = await neonPool.connect();
    const localClient = await localPool.connect();
    console.log('✅ Connected to both databases');

    // Drop existing tables in Neon (except shipment_events)
    console.log('\n2️⃣  Cleaning Neon database...');
    await neonClient.query('DROP TABLE IF EXISTS complaints CASCADE');
    await neonClient.query('DROP TABLE IF EXISTS shipments CASCADE');
    await neonClient.query('DROP TABLE IF EXISTS bookings CASCADE');
    await neonClient.query('DROP TABLE IF EXISTS containers CASCADE');
    await neonClient.query('DROP TABLE IF EXISTS container_types CASCADE');
    await neonClient.query('DROP TABLE IF EXISTS lsp_profiles CASCADE');
    await neonClient.query('DROP TABLE IF EXISTS users CASCADE');
    await neonClient.query('DROP TABLE IF EXISTS notifications CASCADE');
    await neonClient.query('DROP TABLE IF EXISTS shipment_status_history CASCADE');
    console.log('✅ Cleaned Neon database');

    // Create schema in Neon
    console.log('\n3️⃣  Creating schema in Neon...');
    
    // Users table
    await neonClient.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone_number VARCHAR(20),
        company_name VARCHAR(255),
        gst_number VARCHAR(20),
        pan_number VARCHAR(20),
        company_registration VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(10),
        country VARCHAR(100),
        verification_status VARCHAR(50) DEFAULT 'pending',
        profile_image_url VARCHAR(500),
        fcm_token VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        role VARCHAR(50) DEFAULT 'trader'
      )
    `);

    // LSP Profiles table
    await neonClient.query(`
      CREATE TABLE lsp_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        pan_number VARCHAR(20),
        gst_number VARCHAR(20),
        company_registration VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        business_license VARCHAR(255),
        insurance_certificate VARCHAR(255),
        gst_certificate_path VARCHAR(500),
        company_registration_doc_path VARCHAR(500),
        business_license_doc_path VARCHAR(500),
        insurance_certificate_doc_path VARCHAR(500),
        is_verified BOOLEAN DEFAULT false,
        verification_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Container Types table
    await neonClient.query(`
      CREATE TABLE container_types (
        id SERIAL PRIMARY KEY,
        type_name VARCHAR(100) NOT NULL,
        size VARCHAR(50),
        capacity DECIMAL(10,2),
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Containers table
    await neonClient.query(`
      CREATE TABLE containers (
        id SERIAL PRIMARY KEY,
        lsp_id INTEGER REFERENCES lsp_profiles(id) ON DELETE CASCADE,
        container_type_id INTEGER REFERENCES container_types(id),
        container_number VARCHAR(100) UNIQUE NOT NULL,
        size VARCHAR(50),
        type VARCHAR(100),
        capacity DECIMAL(10,2),
        current_location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'available',
        is_available BOOLEAN DEFAULT true,
        departure_date TIMESTAMP,
        arrival_date TIMESTAMP,
        origin_port VARCHAR(255),
        destination_port VARCHAR(255),
        route_description TEXT,
        price_per_unit DECIMAL(12,2),
        currency VARCHAR(10) DEFAULT 'INR',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Bookings table
    await neonClient.query(`
      CREATE TABLE bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        container_id INTEGER REFERENCES containers(id) ON DELETE CASCADE,
        lsp_id INTEGER REFERENCES lsp_profiles(id) ON DELETE CASCADE,
        weight DECIMAL(10,2),
        volume DECIMAL(10,2),
        booked_units INTEGER DEFAULT 1,
        total_price DECIMAL(12,2),
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_id VARCHAR(255),
        tracking_number VARCHAR(255),
        notes TEXT,
        shipment_details JSONB,
        documents JSONB,
        booking_date TIMESTAMP DEFAULT NOW(),
        departure_date TIMESTAMP,
        arrival_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Shipments table
    await neonClient.query(`
      CREATE TABLE shipments (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        container_id INTEGER REFERENCES containers(id) ON DELETE CASCADE,
        lsp_id INTEGER REFERENCES lsp_profiles(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        tracking_number VARCHAR(255) UNIQUE,
        status VARCHAR(50) DEFAULT 'pending',
        current_status VARCHAR(100),
        current_location VARCHAR(255),
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        last_updated TIMESTAMP DEFAULT NOW(),
        scheduled_departure TIMESTAMP,
        actual_departure TIMESTAMP,
        estimated_arrival TIMESTAMP,
        actual_arrival TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Complaints table
    await neonClient.query(`
      CREATE TABLE complaints (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        lsp_id INTEGER REFERENCES lsp_profiles(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100),
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'open',
        attachments JSONB,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Notifications table
    await neonClient.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        type VARCHAR(100),
        data JSONB,
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP,
        image_url VARCHAR(500),
        action_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Shipment Status History table
    await neonClient.query(`
      CREATE TABLE shipment_status_history (
        id SERIAL PRIMARY KEY,
        shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
        status VARCHAR(100) NOT NULL,
        location VARCHAR(255),
        description TEXT,
        updated_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Schema created in Neon');

    // Migrate data
    console.log('\n4️⃣  Migrating data...');
    
    // Migrate users
    const users = await localClient.query('SELECT * FROM users');
    for (const user of users.rows) {
      await neonClient.query(`
        INSERT INTO users (id, email, password_hash, first_name, last_name, phone_number, company_name, gst_number, pan_number, company_registration, address, city, state, pincode, country, verification_status, profile_image_url, fcm_token, created_at, updated_at, is_active, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      `, [user.id, user.email, user.password_hash, user.first_name, user.last_name, user.phone_number, user.company_name, user.gst_number, user.pan_number, user.company_registration, user.address, user.city, user.state, user.pincode, user.country, user.verification_status, user.profile_image_url, user.fcm_token, user.created_at, user.updated_at, user.is_active, user.role]);
    }
    console.log(`✅ Migrated ${users.rows.length} users`);

    // Migrate LSP profiles
    const lspProfiles = await localClient.query('SELECT * FROM lsp_profiles');
    for (const profile of lspProfiles.rows) {
      await neonClient.query(`
        INSERT INTO lsp_profiles (id, user_id, company_name, pan_number, gst_number, company_registration, phone, address, business_license, insurance_certificate, gst_certificate_path, company_registration_doc_path, business_license_doc_path, insurance_certificate_doc_path, is_verified, verification_status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [profile.id, profile.user_id, profile.company_name, profile.pan_number, profile.gst_number, profile.company_registration, profile.phone, profile.address, profile.business_license, profile.insurance_certificate, profile.gst_certificate_path, profile.company_registration_doc_path, profile.business_license_doc_path, profile.insurance_certificate_doc_path, profile.is_verified, profile.verification_status, profile.created_at, profile.updated_at]);
    }
    console.log(`✅ Migrated ${lspProfiles.rows.length} LSP profiles`);

    // Migrate container types
    const containerTypes = await localClient.query('SELECT * FROM container_types');
    for (const type of containerTypes.rows) {
      await neonClient.query(`
        INSERT INTO container_types (id, type_name, size, capacity, description, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [type.id, type.type_name, type.size, type.capacity, type.description, type.created_at]);
    }
    console.log(`✅ Migrated ${containerTypes.rows.length} container types`);

    // Migrate containers
    const containers = await localClient.query('SELECT * FROM containers');
    for (const container of containers.rows) {
      await neonClient.query(`
        INSERT INTO containers (id, lsp_id, container_type_id, container_number, size, type, capacity, current_location, status, is_available, departure_date, arrival_date, origin_port, destination_port, route_description, price_per_unit, currency, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `, [container.id, container.lsp_id, container.container_type_id, container.container_number, container.size, container.type, container.capacity, container.current_location, container.status, container.is_available, container.departure_date, container.arrival_date, container.origin_port, container.destination_port, container.route_description, container.price_per_unit, container.currency, container.created_at, container.updated_at]);
    }
    console.log(`✅ Migrated ${containers.rows.length} containers`);

    // Migrate bookings
    const bookings = await localClient.query('SELECT * FROM bookings');
    for (const booking of bookings.rows) {
      await neonClient.query(`
        INSERT INTO bookings (id, user_id, container_id, lsp_id, weight, volume, booked_units, total_price, status, payment_status, payment_id, tracking_number, notes, shipment_details, documents, booking_date, departure_date, arrival_date, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `, [booking.id, booking.user_id, booking.container_id, booking.lsp_id, booking.weight, booking.volume, booking.booked_units, booking.total_price, booking.status, booking.payment_status, booking.payment_id, booking.tracking_number, booking.notes, booking.shipment_details, booking.documents, booking.booking_date, booking.departure_date, booking.arrival_date, booking.created_at, booking.updated_at]);
    }
    console.log(`✅ Migrated ${bookings.rows.length} bookings`);

    // Migrate shipments
    const shipments = await localClient.query('SELECT * FROM shipments');
    for (const shipment of shipments.rows) {
      await neonClient.query(`
        INSERT INTO shipments (id, booking_id, container_id, lsp_id, user_id, tracking_number, status, current_status, current_location, latitude, longitude, last_updated, scheduled_departure, actual_departure, estimated_arrival, actual_arrival, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `, [shipment.id, shipment.booking_id, shipment.container_id, shipment.lsp_id, shipment.user_id, shipment.tracking_number, shipment.status, shipment.current_status, shipment.current_location, shipment.latitude, shipment.longitude, shipment.last_updated, shipment.scheduled_departure, shipment.actual_departure, shipment.estimated_arrival, shipment.actual_arrival, shipment.metadata, shipment.created_at, shipment.updated_at]);
    }
    console.log(`✅ Migrated ${shipments.rows.length} shipments`);

    // Migrate complaints
    const complaints = await localClient.query('SELECT * FROM complaints');
    for (const complaint of complaints.rows) {
      await neonClient.query(`
        INSERT INTO complaints (id, user_id, booking_id, lsp_id, title, description, category, priority, status, attachments, resolved_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [complaint.id, complaint.user_id, complaint.booking_id, complaint.lsp_id, complaint.title, complaint.description, complaint.category, complaint.priority, complaint.status, complaint.attachments, complaint.resolved_at, complaint.created_at, complaint.updated_at]);
    }
    console.log(`✅ Migrated ${complaints.rows.length} complaints`);

    // Check final counts
    console.log('\n5️⃣  Final Neon database counts:');
    const counts = await neonClient.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM bookings) as bookings_count,
        (SELECT COUNT(*) FROM shipments) as shipments_count,
        (SELECT COUNT(*) FROM lsp_profiles) as lsp_count,
        (SELECT COUNT(*) FROM containers) as containers_count,
        (SELECT COUNT(*) FROM complaints) as complaints_count
    `);
    
    console.log(`   Users: ${counts.rows[0].users_count}`);
    console.log(`   LSPs: ${counts.rows[0].lsp_count}`);
    console.log(`   Containers: ${counts.rows[0].containers_count}`);
    console.log(`   Bookings: ${counts.rows[0].bookings_count}`);
    console.log(`   Shipments: ${counts.rows[0].shipments_count}`);
    console.log(`   Complaints: ${counts.rows[0].complaints_count}`);
    
    neonClient.release();
    localClient.release();
    await neonPool.end();
    await localPool.end();
    
    console.log('\n🎉 Migration to Neon completed successfully!');
    console.log('Your application is now ready to use the cloud database.');
    
  } catch (error) {
    console.log('❌ Migration failed:', error.message);
    await neonPool.end();
    await localPool.end();
  }
}

migrateToNeon().catch(console.error);
