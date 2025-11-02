#!/usr/bin/env node

/**
 * Check Neon Database Schema
 * Verifies what columns actually exist in the database
 */

const { Pool } = require('pg');

async function checkSchema() {
  console.log('🔍 Checking Neon Database Schema');
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
    
    // Check users table structure
    console.log('1️⃣  Users table structure:');
    const usersColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('   Columns:', usersColumns.rows.map(r => r.column_name).join(', '));
    
    // Check bookings table structure
    console.log('\n2️⃣  Bookings table structure:');
    const bookingsColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      ORDER BY ordinal_position
    `);
    
    console.log('   Columns:', bookingsColumns.rows.map(r => r.column_name).join(', '));
    
    // Check all tables
    console.log('\n3️⃣  All tables and their columns:');
    const allTables = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position
    `);
    
    const tables = {};
    allTables.rows.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push(row.column_name);
    });
    
    Object.keys(tables).forEach(tableName => {
      console.log(`   ${tableName}: ${tables[tableName].join(', ')}`);
    });
    
    // Check if there's any data
    console.log('\n4️⃣  Data counts:');
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM bookings) as bookings_count,
        (SELECT COUNT(*) FROM shipments) as shipments_count,
        (SELECT COUNT(*) FROM lsp_profiles) as lsp_count
    `);
    
    console.log(`   Users: ${counts.rows[0].users_count}`);
    console.log(`   Bookings: ${counts.rows[0].bookings_count}`);
    console.log(`   Shipments: ${counts.rows[0].shipments_count}`);
    console.log(`   LSPs: ${counts.rows[0].lsp_count}`);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.log('❌ Schema check failed:', error.message);
    await pool.end();
  }
}

checkSchema().catch(console.error);
