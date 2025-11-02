#!/usr/bin/env node

/**
 * Test Neon Cloud Database Connection
 */

const { Pool } = require('pg');

async function testNeonConnection() {
  console.log('☁️  Testing Neon Cloud Database Connection');
  console.log('==========================================\n');
  
  const pool = new Pool({
    host: 'ep-green-rice-adtvyi8t-pooler.c-2.us-east-1.aws.neon.tech',
    port: 5432,
    database: 'logisticsdb',
    user: 'neondb_owner',
    password: 'npg_iWdBt3xb2PRq',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Neon database connection successful!');
    console.log(`   Connected at: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL version: ${result.rows[0].pg_version}`);
    
    // Test if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`   Tables found: ${tablesResult.rows.length}`);
    if (tablesResult.rows.length > 0) {
      console.log('   Table names:', tablesResult.rows.map(r => r.table_name).join(', '));
    }
    
    // Check data counts
    console.log('\n📊 Data counts:');
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
    
    console.log('\n🎉 Neon database is ready!');
    console.log('You can now start your application with cloud database.');
    
    return true;
  } catch (error) {
    console.log('❌ Neon database connection failed!');
    console.log(`   Error: ${error.message}`);
    
    if (error.message.includes('timeout')) {
      console.log('\n🔧 Troubleshooting timeout issues:');
      console.log('1. Check if Neon database is active');
      console.log('2. Verify credentials are correct');
      console.log('3. Check network connectivity');
    }
    
    await pool.end();
    return false;
  }
}

testNeonConnection().catch(console.error);
