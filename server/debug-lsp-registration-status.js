#!/usr/bin/env node

/**
 * Debug LSP Registration Status Issue
 */

const { Pool } = require('pg');

async function debugLSPRegistrationStatus() {
  console.log('🔍 Debugging LSP Registration Status Issue');
  console.log('==========================================\n');
  
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
    
    console.log('1️⃣  Checking recent LSP registrations...');
    
    // Get recent LSPs with their status
    const recentLSPs = await client.query(`
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.is_active, u.created_at,
        lp.company_name, lp.is_verified, lp.verification_status, lp.created_at as profile_created_at
      FROM users u
      JOIN lsp_profiles lp ON u.id = lp.user_id
      WHERE u.role = 'lsp'
      ORDER BY u.created_at DESC
      LIMIT 5
    `);
    
    console.log(`   Found ${recentLSPs.rows.length} recent LSPs:`);
    recentLSPs.rows.forEach((lsp, index) => {
      console.log(`   ${index + 1}. ${lsp.first_name} ${lsp.last_name} (${lsp.email})`);
      console.log(`      Company: ${lsp.company_name}`);
      console.log(`      User Active: ${lsp.is_active}`);
      console.log(`      LSP Verified: ${lsp.is_verified}`);
      console.log(`      Verification Status: ${lsp.verification_status}`);
      console.log(`      Created: ${lsp.created_at}`);
      console.log('');
    });
    
    console.log('2️⃣  Checking LSP registration process...');
    
    // Check if there are any LSPs with pending status
    const pendingLSPs = await client.query(`
      SELECT COUNT(*) as count
      FROM lsp_profiles 
      WHERE verification_status = 'pending'
    `);
    
    console.log(`   LSPs with pending status: ${pendingLSPs.rows[0].count}`);
    
    // Check if there are any LSPs with rejected status
    const rejectedLSPs = await client.query(`
      SELECT COUNT(*) as count
      FROM lsp_profiles 
      WHERE verification_status = 'rejected'
    `);
    
    console.log(`   LSPs with rejected status: ${rejectedLSPs.rows[0].count}`);
    
    // Check if there are any LSPs with approved status
    const approvedLSPs = await client.query(`
      SELECT COUNT(*) as count
      FROM lsp_profiles 
      WHERE verification_status = 'approved'
    `);
    
    console.log(`   LSPs with approved status: ${approvedLSPs.rows[0].count}`);
    
    console.log('\n3️⃣  Checking user registration process...');
    
    // Check users with different roles
    const userStats = await client.query(`
      SELECT 
        role,
        COUNT(*) as count,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_count
      FROM users 
      GROUP BY role
    `);
    
    console.log('   User statistics by role:');
    userStats.rows.forEach(stat => {
      console.log(`     ${stat.role}: ${stat.count} total (${stat.active_count} active, ${stat.inactive_count} inactive)`);
    });
    
    console.log('\n4️⃣  Analysis:');
    console.log('=============');
    
    if (pendingLSPs.rows[0].count === 0) {
      console.log('❌ No LSPs have pending status - this indicates the issue');
      console.log('   Possible causes:');
      console.log('   1. LSP registration is setting wrong initial status');
      console.log('   2. Some process is automatically rejecting LSPs');
      console.log('   3. Database migration or update changed the logic');
    } else {
      console.log('✅ Some LSPs have pending status - this is correct');
    }
    
    if (rejectedLSPs.rows[0].count > 0) {
      console.log('⚠️  Found rejected LSPs - need to investigate why');
    }
    
    client.release();
    
  } catch (error) {
    console.log('❌ Error during debugging:', error.message);
  } finally {
    await pool.end();
  }
}

debugLSPRegistrationStatus().catch(console.error);
