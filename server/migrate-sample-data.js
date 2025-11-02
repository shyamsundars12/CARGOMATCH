#!/usr/bin/env node

/**
 * Migrate Sample Data to Neon
 * Adds sample data to Neon database for testing
 */

const { Pool } = require('pg');

async function migrateSampleData() {
  console.log('📦 Migrating Sample Data to Neon');
  console.log('================================\n');
  
  const pool = new Pool({
    host: 'ep-muddy-bird-adpst8gp-pooler.c-2.us-east-1.aws.neon.tech',
    port: 5432,
    database: 'logisticsdb',
    user: 'neondb_owner',
    password: 'npg_VFKU7kx4mXnS',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000
  });

  try {
    const client = await pool.connect();
    
    // 1. Create admin user
    console.log('1️⃣  Creating admin user...');
    await client.query(`
      INSERT INTO users (name, email, password, role, is_approved, created_at, updated_at)
      VALUES ('Admin User', 'admin@cargomatch.in', '$2b$10$rQZ8K9mN2pL3vX7wE5tYCOx8vF2nM9qR1sT4uW6yA8bC3dE5gH7iJ9kL2mN4pQ6rS8tU', 'admin', true, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('✅ Admin user created');
    
    // 2. Create sample LSP user
    console.log('\n2️⃣  Creating sample LSP user...');
    let lspUserId;
    const existingLsp = await client.query('SELECT id FROM users WHERE email = $1', ['lsp@example.com']);
    
    if (existingLsp.rows.length > 0) {
      lspUserId = existingLsp.rows[0].id;
      console.log('✅ LSP user already exists');
    } else {
      const lspUserResult = await client.query(`
        INSERT INTO users (name, email, password, role, is_approved, created_at, updated_at)
        VALUES ('John Logistics', 'lsp@example.com', '$2b$10$rQZ8K9mN2pL3vX7wE5tYCOx8vF2nM9qR1sT4uW6yA8bC3dE5gH7iJ9kL2mN4pQ6rS8tU', 'lsp', true, NOW(), NOW())
        RETURNING id
      `);
      lspUserId = lspUserResult.rows[0].id;
      console.log('✅ LSP user created');
    }
    
    // Create LSP profile
    let lspProfileId;
    const existingLspProfile = await client.query('SELECT id FROM lsp_profiles WHERE user_id = $1', [lspUserId]);
    if (existingLspProfile.rows.length === 0) {
      const lspProfileResult = await client.query(`
        INSERT INTO lsp_profiles (user_id, company_name, pan_number, gst_number, phone, address, is_verified, verification_status, created_at, updated_at)
        VALUES ($1, 'Logistics Solutions Ltd', 'ABCDE1234F', '22ABCDE1234F1Z5', '9876543210', '123 Business St, Mumbai', true, 'verified', NOW(), NOW())
        RETURNING id
      `, [lspUserId]);
      lspProfileId = lspProfileResult.rows[0].id;
      console.log('✅ LSP profile created');
    } else {
      lspProfileId = existingLspProfile.rows[0].id;
      console.log('✅ LSP profile already exists');
    }
    
    // 3. Create sample trader user
    console.log('\n3️⃣  Creating sample trader user...');
    let traderUserId;
    const existingTrader = await client.query('SELECT id FROM users WHERE email = $1', ['trader@example.com']);
    
    if (existingTrader.rows.length > 0) {
      traderUserId = existingTrader.rows[0].id;
      console.log('✅ Trader user already exists');
    } else {
      const traderUserResult = await client.query(`
        INSERT INTO users (name, email, password, role, is_approved, created_at, updated_at)
        VALUES ('Jane Trader', 'trader@example.com', '$2b$10$rQZ8K9mN2pL3vX7wE5tYCOx8vF2nM9qR1sT4uW6yA8bC3dE5gH7iJ9kL2mN4pQ6rS8tU', 'trader', true, NOW(), NOW())
        RETURNING id
      `);
      traderUserId = traderUserResult.rows[0].id;
      console.log('✅ Trader user created');
    }
    
    // 4. Create container types
    console.log('\n4️⃣  Creating container types...');
    await client.query(`
      INSERT INTO container_types (type_name, size, capacity, description, created_at)
      VALUES 
        ('Dry Container', '20ft', 33.2, 'Standard dry container for general cargo', NOW()),
        ('Dry Container', '40ft', 67.7, 'Large dry container for bulk cargo', NOW()),
        ('Refrigerated Container', '20ft', 28.3, 'Temperature controlled container', NOW()),
        ('Refrigerated Container', '40ft', 59.3, 'Large temperature controlled container', NOW())
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Container types created');
    
    // 5. Create containers
    console.log('\n5️⃣  Creating containers...');
    const containerTypesResult = await client.query('SELECT id FROM container_types LIMIT 2');
    
    // Check if containers already exist
    const existingContainers = await client.query('SELECT COUNT(*) FROM containers');
    if (existingContainers.rows[0].count > 0) {
      console.log('✅ Containers already exist');
    } else {
      console.log(`   Using LSP Profile ID: ${lspProfileId}`);
      console.log(`   Container types available: ${containerTypesResult.rows.length}`);
      
      for (let i = 0; i < 3; i++) {
        await client.query(`
          INSERT INTO containers (lsp_id, container_type_id, container_number, size, type, capacity, is_available, current_location, origin_port, destination_port, price_per_unit, currency, status, created_at, updated_at)
          VALUES ($1, $2, $3, '20ft', 'Dry Container', 33.2, true, 'Mumbai Port', 'Mumbai', 'Chennai', 50000, 'INR', 'available', NOW(), NOW())
        `, [lspProfileId, containerTypesResult.rows[i % 2].id, `CONT${String(i + 1).padStart(3, '0')}`]);
      }
      console.log('✅ Containers created');
    }
    
    // 6. Create bookings
    console.log('\n6️⃣  Creating bookings...');
    const containersResult = await client.query('SELECT id FROM containers LIMIT 2');
    
    for (let i = 0; i < 2; i++) {
      await client.query(`
        INSERT INTO bookings (container_id, importer_id, exporter_id, booking_date, departure_date, arrival_date, cargo_type, cargo_weight, cargo_volume, special_requirements, status, is_auto_approved, approved_at, created_at, updated_at)
        VALUES ($1, $2, $2, NOW(), NOW() + INTERVAL '2 days', NOW() + INTERVAL '5 days', 'Electronics', 1000, 25, 'Handle with care', 'confirmed', true, NOW(), NOW(), NOW())
      `, [containersResult.rows[i].id, traderUserId]);
    }
    console.log('✅ Bookings created');
    
    // 7. Create shipments
    console.log('\n7️⃣  Creating shipments...');
    const bookingsResult = await client.query('SELECT id FROM bookings LIMIT 2');
    
    for (let i = 0; i < 2; i++) {
      await client.query(`
        INSERT INTO shipments (booking_id, container_id, lsp_id, shipment_number, status, current_location, departure_port, arrival_port, actual_departure_date, estimated_arrival_date, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'in_transit', 'Mumbai Port', 'Mumbai', 'Chennai', NOW(), NOW() + INTERVAL '5 days', NOW(), NOW())
      `, [bookingsResult.rows[i].id, containersResult.rows[i].id, lspProfileId, `SHIP${String(i + 1).padStart(3, '0')}`]);
    }
    console.log('✅ Shipments created');
    
    // 8. Create complaints
    console.log('\n8️⃣  Creating complaints...');
    await client.query(`
      INSERT INTO complaints (booking_id, container_id, lsp_id, complainant_id, complaint_type, title, description, status, priority, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'delay', 'Shipment Delay', 'My shipment is delayed by 2 days', 'open', 'medium', NOW(), NOW())
    `, [bookingsResult.rows[0].id, containersResult.rows[0].id, lspProfileId, traderUserId]);
    console.log('✅ Complaints created');
    
    // Check final counts
    console.log('\n9️⃣  Final data counts:');
    const counts = await client.query(`
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
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Sample data migration completed successfully!');
    console.log('\n📝 You can now test your application with real data.');
    
  } catch (error) {
    console.log('❌ Sample data migration failed:', error.message);
    await pool.end();
  }
}

migrateSampleData().catch(console.error);
