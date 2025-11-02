#!/usr/bin/env node

/**
 * Debug LSP Approval Logic
 */

const { Pool } = require('pg');

async function debugLSPApprovalLogic() {
  console.log('🔍 Debugging LSP Approval Logic');
  console.log('================================\n');
  
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
    
    console.log('1️⃣  Understanding LSP Approval Fields...');
    
    // Get detailed LSP data
    const lspDetails = await client.query(`
      SELECT 
        u.id, u.first_name, u.last_name, u.email, 
        u.is_active, u.created_at as user_created,
        lp.company_name, lp.is_verified, lp.verification_status, 
        lp.created_at as profile_created
      FROM users u
      JOIN lsp_profiles lp ON u.id = lp.user_id
      WHERE u.role = 'lsp'
      ORDER BY u.created_at DESC
      LIMIT 3
    `);
    
    console.log('   Recent LSPs with all fields:');
    lspDetails.rows.forEach((lsp, index) => {
      console.log(`\n   ${index + 1}. ${lsp.first_name} ${lsp.last_name}`);
      console.log(`      Email: ${lsp.email}`);
      console.log(`      Company: ${lsp.company_name}`);
      console.log(`      User Fields:`);
      console.log(`        - is_active: ${lsp.is_active}`);
      console.log(`        - user_created: ${lsp.user_created}`);
      console.log(`      LSP Profile Fields:`);
      console.log(`        - is_verified: ${lsp.is_verified}`);
      console.log(`        - verification_status: ${lsp.verification_status}`);
      console.log(`        - profile_created: ${lsp.profile_created}`);
    });
    
    console.log('\n2️⃣  Understanding the Logic...');
    console.log('===============================');
    console.log('For LSP approval, we need to understand:');
    console.log('1. user.is_active: Controls if user can login');
    console.log('2. lsp_profiles.is_verified: Controls if LSP profile is verified');
    console.log('3. lsp_profiles.verification_status: Shows the current status');
    console.log('');
    console.log('Expected Flow:');
    console.log('1. Registration: is_active=false, is_verified=false, verification_status=pending');
    console.log('2. Admin Approval: is_active=true, is_verified=true, verification_status=approved');
    console.log('3. Admin Rejection: is_active=false, is_verified=false, verification_status=rejected');
    
    console.log('\n3️⃣  Checking Current Status...');
    
    // Check pending LSPs
    const pendingLSPs = await client.query(`
      SELECT u.first_name, u.last_name, u.is_active, lp.verification_status
      FROM users u
      JOIN lsp_profiles lp ON u.id = lp.user_id
      WHERE lp.verification_status = 'pending'
    `);
    
    console.log(`   Pending LSPs (${pendingLSPs.rows.length}):`);
    pendingLSPs.rows.forEach(lsp => {
      console.log(`     - ${lsp.first_name} ${lsp.last_name}: is_active=${lsp.is_active}, verification_status=${lsp.verification_status}`);
    });
    
    // Check approved LSPs
    const approvedLSPs = await client.query(`
      SELECT u.first_name, u.last_name, u.is_active, lp.verification_status
      FROM users u
      JOIN lsp_profiles lp ON u.id = lp.user_id
      WHERE lp.verification_status = 'approved'
    `);
    
    console.log(`   Approved LSPs (${approvedLSPs.rows.length}):`);
    approvedLSPs.rows.forEach(lsp => {
      console.log(`     - ${lsp.first_name} ${lsp.last_name}: is_active=${lsp.is_active}, verification_status=${lsp.verification_status}`);
    });
    
    console.log('\n4️⃣  Recommendation:');
    console.log('====================');
    console.log('For Approval Status in frontend:');
    console.log('- If verification_status = "pending" → Approval Status = "Pending"');
    console.log('- If verification_status = "approved" AND is_active = true → Approval Status = "Approved"');
    console.log('- If verification_status = "rejected" → Approval Status = "Rejected"');
    console.log('- If verification_status = "approved" BUT is_active = false → Approval Status = "Pending" (needs activation)');
    
    client.release();
    
  } catch (error) {
    console.log('❌ Error during debugging:', error.message);
  } finally {
    await pool.end();
  }
}

debugLSPApprovalLogic().catch(console.error);
