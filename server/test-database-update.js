#!/usr/bin/env node

/**
 * Test Database Update Directly
 */

const { Pool } = require('pg');

async function testDatabaseUpdate() {
  console.log('🧪 Testing Database Update Directly');
  console.log('====================================\n');
  
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'logisticsdb',
    user: 'postgres',
    password: 'admin123',
    ssl: false
  });
  
  try {
    const client = await pool.connect();
    
    // Find a pending LSP
    const pendingLSP = await client.query(`
      SELECT u.id, u.first_name || ' ' || u.last_name as name, u.email, 
             u.is_active, lp.verification_status
      FROM users u
      JOIN lsp_profiles lp ON u.id = lp.user_id
      WHERE lp.verification_status = 'pending'
      LIMIT 1
    `);
    
    if (pendingLSP.rows.length === 0) {
      console.log('No pending LSPs found');
      return;
    }
    
    const lsp = pendingLSP.rows[0];
    console.log(`Testing with LSP: ${lsp.name} (${lsp.email})`);
    console.log(`Current: is_active=${lsp.is_active}, verification_status=${lsp.verification_status}`);
    
    // Test the exact query from verifyLSP function
    console.log('\n1️⃣  Testing LSP profile update...');
    await client.query('BEGIN');
    
    const lspQuery = `
      UPDATE lsp_profiles 
      SET is_verified = $1, verification_status = $2, updated_at = NOW()
      WHERE user_id = $3
      RETURNING *
    `;
    const lspResult = await client.query(lspQuery, [true, 'approved', lsp.id]);
    console.log('LSP profile updated:', lspResult.rows[0].verification_status);
    
    console.log('\n2️⃣  Testing user is_active update...');
    const userQuery = `
      UPDATE users 
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const userResult = await client.query(userQuery, [true, lsp.id]);
    console.log('User is_active updated:', userResult.rows[0].is_active);
    
    console.log('\n3️⃣  Testing combined query...');
    const combinedResult = await client.query(`
      SELECT u.id, u.first_name || ' ' || u.last_name as name, u.email, 'lsp' as role, 
             u.is_active, u.is_active as is_approved, u.created_at,
             lp.company_name, lp.pan_number, lp.gst_number, lp.phone, lp.address,
             lp.is_verified, lp.verification_status, lp.created_at as profile_created_at
      FROM users u
      JOIN lsp_profiles lp ON u.id = lp.user_id
      WHERE u.id = $1
    `, [lsp.id]);
    
    const combinedData = combinedResult.rows[0];
    console.log('Combined data:');
    console.log(`  - Name: ${combinedData.name}`);
    console.log(`  - Email: ${combinedData.email}`);
    console.log(`  - is_active: ${combinedData.is_active}`);
    console.log(`  - is_approved: ${combinedData.is_approved}`);
    console.log(`  - verification_status: ${combinedData.verification_status}`);
    console.log(`  - is_verified: ${combinedData.is_verified}`);
    
    await client.query('COMMIT');
    
    console.log('\n✅ Database update test successful!');
    
    client.release();
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabaseUpdate().catch(console.error);
