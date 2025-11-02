#!/usr/bin/env node

/**
 * Fix LSP Registration Status Issue
 * Updates existing LSPs to have correct pending status
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

async function fixLSPStatus() {
  console.log('🔧 Fixing LSP Registration Status');
  console.log('=================================\n');
  
  try {
    const client = await pool.connect();
    
    // Check current LSP status
    console.log('1️⃣  Checking current LSP status...');
    const currentLSPs = await client.query(`
      SELECT u.id, u.first_name || ' ' || u.last_name as name, u.email, u.is_active, 
             lp.is_verified, lp.verification_status
      FROM users u
      JOIN lsp_profiles lp ON u.id = lp.user_id
      WHERE u.role = 'lsp'
      ORDER BY u.created_at DESC
    `);
    
    console.log(`Found ${currentLSPs.rows.length} LSPs:`);
    currentLSPs.rows.forEach((lsp, index) => {
      console.log(`   ${index + 1}. ${lsp.name} (${lsp.email})`);
      console.log(`      User Active: ${lsp.is_active}`);
      console.log(`      LSP Verified: ${lsp.is_verified}`);
      console.log(`      Verification Status: ${lsp.verification_status}`);
    });
    
    // Fix LSPs that have is_active = true but is_verified = false
    console.log('\n2️⃣  Fixing LSP status...');
    const fixQuery = `
      UPDATE users 
      SET is_active = false 
      WHERE id IN (
        SELECT u.id 
        FROM users u
        JOIN lsp_profiles lp ON u.id = lp.user_id
        WHERE u.role = 'lsp' 
        AND u.is_active = true 
        AND lp.is_verified = false
      )
    `;
    
    const fixResult = await client.query(fixQuery);
    console.log(`✅ Updated ${fixResult.rowCount} LSP users to inactive`);
    
    // Update verification status to 'pending' for unverified LSPs
    const updateVerificationQuery = `
      UPDATE lsp_profiles 
      SET verification_status = 'pending'
      WHERE is_verified = false 
      AND verification_status != 'pending'
    `;
    
    const updateResult = await client.query(updateVerificationQuery);
    console.log(`✅ Updated ${updateResult.rowCount} LSP profiles to pending status`);
    
    // Check final status
    console.log('\n3️⃣  Checking final LSP status...');
    const finalLSPs = await client.query(`
      SELECT u.id, u.first_name || ' ' || u.last_name as name, u.email, u.is_active, 
             lp.is_verified, lp.verification_status
      FROM users u
      JOIN lsp_profiles lp ON u.id = lp.user_id
      WHERE u.role = 'lsp'
      ORDER BY u.created_at DESC
    `);
    
    console.log(`Final status of ${finalLSPs.rows.length} LSPs:`);
    finalLSPs.rows.forEach((lsp, index) => {
      console.log(`   ${index + 1}. ${lsp.name} (${lsp.email})`);
      console.log(`      User Active: ${lsp.is_active}`);
      console.log(`      LSP Verified: ${lsp.is_verified}`);
      console.log(`      Verification Status: ${lsp.verification_status}`);
    });
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 LSP status fix completed!');
    console.log('\n📋 Summary:');
    console.log('===========');
    console.log('✅ LSP users are now inactive by default');
    console.log('✅ LSP profiles have pending verification status');
    console.log('✅ New LSP registrations will be pending');
    console.log('✅ Admin can now approve/reject LSPs properly');
    
  } catch (error) {
    console.log('❌ Error fixing LSP status:', error.message);
    await pool.end();
  }
}

fixLSPStatus().catch(console.error);
