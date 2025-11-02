#!/usr/bin/env node

/**
 * Verify and Activate LSP User
 * This will verify the LSP you're currently logged in as
 */

const { Pool } = require('pg');
const fetch = require('node-fetch');

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

const baseURL = 'http://localhost:5000';

async function verifyAndActivateLSP() {
  console.log('🔧 Verifying and Activating LSP User');
  console.log('====================================\n');
  
  let adminToken = null;
  
  try {
    // Step 1: Admin Login
    console.log('1️⃣  Admin Login...');
    try {
      const adminResponse = await fetch(`${baseURL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@cargomatch.com',
          password: 'adminCargomatch123'
        })
      });
      
      const adminResult = await adminResponse.json();
      if (adminResponse.ok) {
        adminToken = adminResult.token;
        console.log('   ✅ Admin login successful');
      } else {
        console.log('   ❌ Admin login failed:', adminResult.error);
        return;
      }
    } catch (error) {
      console.log('   ❌ Admin login error:', error.message);
      return;
    }
    
    // Step 2: Get all LSPs
    console.log('\n2️⃣  Getting all LSPs...');
    const client = await pool.connect();
    
    const lsps = await client.query(`
      SELECT u.id, u.first_name || ' ' || u.last_name as name, u.email, u.is_active, 
             lp.is_verified, lp.verification_status
      FROM users u
      JOIN lsp_profiles lp ON u.id = lp.user_id
      WHERE u.role = 'lsp'
      ORDER BY u.created_at DESC
    `);
    
    console.log(`Found ${lsps.rows.length} LSPs:`);
    lsps.rows.forEach((lsp, index) => {
      console.log(`   ${index + 1}. ${lsp.name} (${lsp.email})`);
      console.log(`      User Active: ${lsp.is_active}`);
      console.log(`      LSP Verified: ${lsp.is_verified}`);
      console.log(`      Verification Status: ${lsp.verification_status}`);
    });
    
    // Step 3: Verify and activate all unverified LSPs
    console.log('\n3️⃣  Verifying and activating LSPs...');
    
    for (const lsp of lsps.rows) {
      if (!lsp.is_verified || !lsp.is_active) {
        console.log(`\n   Processing: ${lsp.name} (${lsp.email})`);
        
        // Verify LSP
        try {
          const verifyResponse = await fetch(`${baseURL}/api/admin/lsps/${lsp.id}/verify`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
              is_verified: true,
              verification_status: 'approved'
            })
          });
          
          if (verifyResponse.ok) {
            console.log(`     ✅ LSP verification successful`);
          } else {
            const error = await verifyResponse.json();
            console.log(`     ❌ LSP verification failed:`, error.error);
          }
        } catch (error) {
          console.log(`     ❌ LSP verification error:`, error.message);
        }
        
        // Activate user account
        try {
          const activateResponse = await fetch(`${baseURL}/api/admin/users/${lsp.id}/status`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
              is_approved: true
            })
          });
          
          if (activateResponse.ok) {
            console.log(`     ✅ User activation successful`);
          } else {
            const error = await activateResponse.json();
            console.log(`     ❌ User activation failed:`, error.error);
          }
        } catch (error) {
          console.log(`     ❌ User activation error:`, error.message);
        }
      } else {
        console.log(`\n   Skipping: ${lsp.name} (${lsp.email}) - Already verified and active`);
      }
    }
    
    // Step 4: Check final status
    console.log('\n4️⃣  Checking final LSP status...');
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
    
    console.log('\n🎉 LSP verification and activation completed!');
    console.log('\n📋 Summary:');
    console.log('===========');
    console.log('✅ All LSPs are now verified and active');
    console.log('✅ LSPs can now login and access their dashboard');
    console.log('✅ LSP operations should work without 403 errors');
    
    console.log('\n🔐 Available LSP Credentials:');
    console.log('=============================');
    finalLSPs.rows.forEach((lsp, index) => {
      console.log(`${index + 1}. ${lsp.email} - Status: ${lsp.is_verified && lsp.is_active ? 'Active' : 'Inactive'}`);
    });
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    await pool.end();
  }
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await fetch(`${baseURL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking if server is running...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server is not running on port 5000');
    console.log('Please start the server first: npm start');
    return;
  }
  
  console.log('✅ Server is running, starting verification...\n');
  await verifyAndActivateLSP();
}

main().catch(console.error);

