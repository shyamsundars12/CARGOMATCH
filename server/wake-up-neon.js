#!/usr/bin/env node

/**
 * Wake up Neon Database and Test Connection
 */

const { Pool } = require('pg');

async function wakeUpNeon() {
  console.log('☁️  Waking up Neon Database');
  console.log('===========================\n');
  
  const pool = new Pool({
    host: 'ep-green-rice-adtvyi8t-pooler.c-2.us-east-1.aws.neon.tech',
    port: 5432,
    database: 'logisticsdb',
    user: 'neondb_owner',
    password: 'npg_iWdBt3xb2PRq',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000, // 30 second timeout
    idleTimeoutMillis: 30000
  });

  try {
    console.log('1️⃣  Attempting to connect to Neon database...');
    const client = await pool.connect();
    
    console.log('✅ Connected successfully!');
    
    // Wake up the database with a simple query
    console.log('\n2️⃣  Waking up database...');
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`   Database time: ${result.rows[0].current_time}`);
    
    // Test if tables exist
    console.log('\n3️⃣  Checking database schema...');
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
    
    // Check if we have data
    console.log('\n4️⃣  Checking data...');
    try {
      const counts = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as users_count,
          (SELECT COUNT(*) FROM lsp_profiles) as lsp_count
      `);
      
      console.log(`   Users: ${counts.rows[0].users_count}`);
      console.log(`   LSPs: ${counts.rows[0].lsp_count}`);
      
      if (counts.rows[0].users_count === 0) {
        console.log('\n⚠️  Database is empty - you may need to migrate data');
      } else {
        console.log('\n✅ Database has data - ready to use!');
      }
    } catch (error) {
      console.log('   Tables might not exist yet');
    }
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Neon database is now awake and ready!');
    console.log('You can now start your application.');
    
    return true;
  } catch (error) {
    console.log('❌ Failed to connect to Neon database');
    console.log(`   Error: ${error.message}`);
    
    if (error.message.includes('timeout')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Neon database might be sleeping - try again in a few seconds');
      console.log('2. Check if your Neon project is active');
      console.log('3. Verify credentials are correct');
      console.log('4. Check network connectivity');
    } else if (error.message.includes('password')) {
      console.log('\n🔧 Password issue:');
      console.log('1. Check if password is correct');
      console.log('2. Try resetting password in Neon console');
    }
    
    await pool.end();
    return false;
  }
}

wakeUpNeon().catch(console.error);
