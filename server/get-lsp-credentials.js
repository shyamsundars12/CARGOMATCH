#!/usr/bin/env node

/**
 * Get LSP Credentials from Neon Database
 */

const { Pool } = require('pg');

async function getLSPCredentials() {
  console.log('👤 Getting LSP Credentials');
  console.log('==========================\n');
  
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
    
    // Get LSP users and their profiles
    const lspQuery = `
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone_number,
        u.is_active,
        u.created_at,
        lp.company_name,
        lp.pan_number,
        lp.gst_number,
        lp.phone as lsp_phone,
        lp.address as lsp_address,
        lp.is_verified,
        lp.verification_status
      FROM users u
      JOIN lsp_profiles lp ON u.id = lp.user_id
      WHERE u.role = 'lsp'
      ORDER BY u.created_at DESC
    `;
    
    const result = await client.query(lspQuery);
    
    if (result.rows.length === 0) {
      console.log('❌ No LSP users found in the database');
    } else {
      console.log(`✅ Found ${result.rows.length} LSP user(s):\n`);
      
      result.rows.forEach((lsp, index) => {
        console.log(`📋 LSP #${index + 1}:`);
        console.log(`   ID: ${lsp.id}`);
        console.log(`   Name: ${lsp.first_name} ${lsp.last_name}`);
        console.log(`   Email: ${lsp.email}`);
        console.log(`   Phone: ${lsp.phone_number || lsp.lsp_phone || 'Not provided'}`);
        console.log(`   Company: ${lsp.company_name}`);
        console.log(`   PAN: ${lsp.pan_number || 'Not provided'}`);
        console.log(`   GST: ${lsp.gst_number || 'Not provided'}`);
        console.log(`   Address: ${lsp.lsp_address || 'Not provided'}`);
        console.log(`   Status: ${lsp.is_active ? 'Active' : 'Inactive'}`);
        console.log(`   Verified: ${lsp.is_verified ? 'Yes' : 'No'}`);
        console.log(`   Verification Status: ${lsp.verification_status}`);
        console.log(`   Created: ${lsp.created_at}`);
        console.log('');
      });
      
      console.log('🔐 Login Credentials:');
      console.log('====================');
      result.rows.forEach((lsp, index) => {
        console.log(`LSP #${index + 1}:`);
        console.log(`   Email: ${lsp.email}`);
        console.log(`   Password: [Encrypted - use password reset if needed]`);
        console.log('');
      });
      
      console.log('💡 Note: Passwords are encrypted in the database.');
      console.log('   If you need to reset passwords, you can:');
      console.log('   1. Use the password reset feature in the app');
      console.log('   2. Update passwords directly in the database');
      console.log('   3. Create new LSP accounts');
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.log('❌ Error getting LSP credentials:', error.message);
    await pool.end();
  }
}

getLSPCredentials().catch(console.error);
