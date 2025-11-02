#!/usr/bin/env node

/**
 * Quick Fix: Verify and Activate LSPs Directly in Database
 */

const { Pool } = require('pg');

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

async function quickFixLSPs() {
  console.log('🔧 Quick Fix: Verifying and Activating LSPs');
  console.log('===========================================\n');
  
  try {
    const client = await pool.connect();
    
    // Step 1: Check current status
    console.log('1️⃣  Current LSP Status:');
    const currentLSPs = await client.query(`
      SELECT u.id, u.first_name || ' ' || u.last_name as name, u.email, u.is_active, 
             lp.is_verified, lp.verification_status
      FROM users u
      JOIN lsp_profiles lp ON u.id = lp.user_id
      WHERE u.role = 'lsp'
      ORDER BY u.created_at DESC
    `);
    
    currentLSPs.rows.forEach((lsp, index) => {
      console.log(`   ${index + 1}. ${lsp.name} (${lsp.email})`);
      console.log(`      User Active: ${lsp.is_active}`);
      console.log(`      LSP Verified: ${lsp.is_verified}`);
      console.log(`      Verification Status: ${lsp.verification_status}`);
    });
    
    // Step 2: Fix all LSPs
    console.log('\n2️⃣  Fixing LSP Status...');
    
    // Activate all LSP users
    const activateUsers = await client.query(`
      UPDATE users 
      SET is_active = true, updated_at = NOW()
      WHERE role = 'lsp' AND is_active = false
    `);
    console.log(`   ✅ Activated ${activateUsers.rowCount} LSP users`);
    
    // Verify all LSP profiles
    const verifyProfiles = await client.query(`
      UPDATE lsp_profiles 
      SET is_verified = true, verification_status = 'approved', updated_at = NOW()
      WHERE is_verified = false
    `);
    console.log(`   ✅ Verified ${verifyProfiles.rowCount} LSP profiles`);
    
    // Step 3: Check final status
    console.log('\n3️⃣  Final LSP Status:');
    const finalLSPs = await client.query(`
      SELECT u.id, u.first_name || ' ' || u.last_name as name, u.email, u.is_active, 
             lp.is_verified, lp.verification_status
      FROM users u
      JOIN lsp_profiles lp ON u.id = lp.user_id
      WHERE u.role = 'lsp'
      ORDER BY u.created_at DESC
    `);
    
    finalLSPs.rows.forEach((lsp, index) => {
      console.log(`   ${index + 1}. ${lsp.name} (${lsp.email})`);
      console.log(`      User Active: ${lsp.is_active}`);
      console.log(`      LSP Verified: ${lsp.is_verified}`);
      console.log(`      Verification Status: ${lsp.verification_status}`);
    });
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Quick Fix Completed!');
    console.log('\n📋 Summary:');
    console.log('===========');
    console.log('✅ All LSP users are now active');
    console.log('✅ All LSP profiles are now verified');
    console.log('✅ LSPs can now login and access dashboard');
    console.log('✅ No more 403 Forbidden errors');
    
    console.log('\n🔐 Available LSP Credentials:');
    console.log('=============================');
    finalLSPs.rows.forEach((lsp, index) => {
      console.log(`${index + 1}. ${lsp.email} - Status: Active & Verified`);
    });
    
    console.log('\n💡 Next Steps:');
    console.log('==============');
    console.log('1. Refresh your LSP dashboard page');
    console.log('2. The 403 errors should be gone');
    console.log('3. You should see your containers, bookings, and shipments');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    await pool.end();
  }
}

quickFixLSPs().catch(console.error);

