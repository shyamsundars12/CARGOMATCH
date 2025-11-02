#!/usr/bin/env node

/**
 * Simple Migration to Neon Database
 * Migrates data without preserving IDs
 */

const { Pool } = require('pg');

async function simpleMigrateToNeon() {
  console.log('☁️  Simple Migration to Neon Database');
  console.log('====================================\n');
  
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

    // Clear existing data
    console.log('\n2️⃣  Clearing existing data...');
    await neonClient.query('DELETE FROM complaints');
    await neonClient.query('DELETE FROM shipments');
    await neonClient.query('DELETE FROM bookings');
    await neonClient.query('DELETE FROM containers');
    await neonClient.query('DELETE FROM container_types');
    await neonClient.query('DELETE FROM lsp_profiles');
    await neonClient.query('DELETE FROM users');
    console.log('✅ Cleared existing data');

    // Migrate users (without preserving IDs)
    console.log('\n3️⃣  Migrating users...');
    const users = await localClient.query('SELECT * FROM users');
    const userMap = new Map(); // Map old ID to new ID
    
    for (const user of users.rows) {
      const result = await neonClient.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, phone_number, company_name, gst_number, pan_number, company_registration, address, city, state, pincode, country, verification_status, profile_image_url, fcm_token, created_at, updated_at, is_active, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING id
      `, [user.email, user.password_hash, user.first_name, user.last_name, user.phone_number, user.company_name, user.gst_number, user.pan_number, user.company_registration, user.address, user.city, user.state, user.pincode, user.country, user.verification_status, user.profile_image_url, user.fcm_token, user.created_at, user.updated_at, user.is_active, user.role]);
      
      userMap.set(user.id, result.rows[0].id);
    }
    console.log(`✅ Migrated ${users.rows.length} users`);

    // Migrate LSP profiles
    console.log('\n4️⃣  Migrating LSP profiles...');
    const lspProfiles = await localClient.query('SELECT * FROM lsp_profiles');
    const lspMap = new Map();
    
    for (const profile of lspProfiles.rows) {
      const newUserId = userMap.get(profile.user_id);
      if (newUserId) {
        const result = await neonClient.query(`
          INSERT INTO lsp_profiles (user_id, company_name, pan_number, gst_number, company_registration, phone, address, business_license, insurance_certificate, gst_certificate_path, company_registration_doc_path, business_license_doc_path, insurance_certificate_doc_path, is_verified, verification_status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          RETURNING id
        `, [newUserId, profile.company_name, profile.pan_number, profile.gst_number, profile.company_registration, profile.phone, profile.address, profile.business_license, profile.insurance_certificate, profile.gst_certificate_path, profile.company_registration_doc_path, profile.business_license_doc_path, profile.insurance_certificate_doc_path, profile.is_verified, profile.verification_status, profile.created_at, profile.updated_at]);
        
        lspMap.set(profile.id, result.rows[0].id);
      }
    }
    console.log(`✅ Migrated ${lspProfiles.rows.length} LSP profiles`);

    // Migrate container types
    console.log('\n5️⃣  Migrating container types...');
    const containerTypes = await localClient.query('SELECT * FROM container_types');
    const containerTypeMap = new Map();
    
    for (const type of containerTypes.rows) {
      const result = await neonClient.query(`
        INSERT INTO container_types (type_name, size, capacity, description, created_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [type.type_name, type.size, type.capacity, type.description, type.created_at]);
      
      containerTypeMap.set(type.id, result.rows[0].id);
    }
    console.log(`✅ Migrated ${containerTypes.rows.length} container types`);

    // Migrate containers
    console.log('\n6️⃣  Migrating containers...');
    const containers = await localClient.query('SELECT * FROM containers');
    const containerMap = new Map();
    
    for (const container of containers.rows) {
      const newLspId = lspMap.get(container.lsp_id);
      const newContainerTypeId = containerTypeMap.get(container.container_type_id);
      
      if (newLspId && newContainerTypeId) {
        const result = await neonClient.query(`
          INSERT INTO containers (lsp_id, container_type_id, container_number, size, type, capacity, current_location, status, is_available, departure_date, arrival_date, origin_port, destination_port, route_description, price_per_unit, currency, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          RETURNING id
        `, [newLspId, newContainerTypeId, container.container_number, container.size, container.type, container.capacity, container.current_location, container.status, container.is_available, container.departure_date, container.arrival_date, container.origin_port, container.destination_port, container.route_description, container.price_per_unit, container.currency, container.created_at, container.updated_at]);
        
        containerMap.set(container.id, result.rows[0].id);
      }
    }
    console.log(`✅ Migrated ${containers.rows.length} containers`);

    // Migrate bookings
    console.log('\n7️⃣  Migrating bookings...');
    const bookings = await localClient.query('SELECT * FROM bookings');
    const bookingMap = new Map();
    
    for (const booking of bookings.rows) {
      const newUserId = userMap.get(booking.user_id);
      const newContainerId = containerMap.get(booking.container_id);
      const newLspId = lspMap.get(booking.lsp_id);
      
      if (newUserId && newContainerId && newLspId) {
        const result = await neonClient.query(`
          INSERT INTO bookings (user_id, container_id, lsp_id, weight, volume, booked_units, total_price, status, payment_status, payment_id, tracking_number, notes, shipment_details, documents, booking_date, departure_date, arrival_date, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          RETURNING id
        `, [newUserId, newContainerId, newLspId, booking.weight, booking.volume, booking.booked_units, booking.total_price, booking.status, booking.payment_status, booking.payment_id, booking.tracking_number, booking.notes, JSON.stringify(booking.shipment_details || {}), JSON.stringify(booking.documents || {}), booking.booking_date, booking.departure_date, booking.arrival_date, booking.created_at, booking.updated_at]);
        
        bookingMap.set(booking.id, result.rows[0].id);
      }
    }
    console.log(`✅ Migrated ${bookings.rows.length} bookings`);

    // Migrate shipments
    console.log('\n8️⃣  Migrating shipments...');
    const shipments = await localClient.query('SELECT * FROM shipments');
    
    for (const shipment of shipments.rows) {
      const newBookingId = bookingMap.get(shipment.booking_id);
      const newContainerId = containerMap.get(shipment.container_id);
      const newLspId = lspMap.get(shipment.lsp_id);
      const newUserId = userMap.get(shipment.user_id);
      
      if (newBookingId && newContainerId && newLspId && newUserId) {
        await neonClient.query(`
          INSERT INTO shipments (booking_id, container_id, lsp_id, user_id, tracking_number, status, current_status, current_location, latitude, longitude, last_updated, scheduled_departure, actual_departure, estimated_arrival, actual_arrival, metadata, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        `, [newBookingId, newContainerId, newLspId, newUserId, shipment.tracking_number, shipment.status, shipment.current_status, shipment.current_location, shipment.latitude, shipment.longitude, shipment.last_updated, shipment.scheduled_departure, shipment.actual_departure, shipment.estimated_arrival, shipment.actual_arrival, JSON.stringify(shipment.metadata || {}), shipment.created_at, shipment.updated_at]);
      }
    }
    console.log(`✅ Migrated ${shipments.rows.length} shipments`);

    // Migrate complaints
    console.log('\n9️⃣  Migrating complaints...');
    const complaints = await localClient.query('SELECT * FROM complaints');
    
    for (const complaint of complaints.rows) {
      const newUserId = userMap.get(complaint.user_id);
      const newBookingId = bookingMap.get(complaint.booking_id);
      const newLspId = lspMap.get(complaint.lsp_id);
      
      if (newUserId && newBookingId && newLspId) {
        await neonClient.query(`
          INSERT INTO complaints (user_id, booking_id, lsp_id, title, description, category, priority, status, attachments, resolved_at, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [newUserId, newBookingId, newLspId, complaint.title, complaint.description, complaint.category, complaint.priority, complaint.status, JSON.stringify(complaint.attachments || {}), complaint.resolved_at, complaint.created_at, complaint.updated_at]);
      }
    }
    console.log(`✅ Migrated ${complaints.rows.length} complaints`);

    // Check final counts
    console.log('\n🔟 Final Neon database counts:');
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

simpleMigrateToNeon().catch(console.error);
