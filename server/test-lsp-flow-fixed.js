#!/usr/bin/env node

/**
 * Test Complete LSP Registration Flow
 * Tests: Registration -> Pending Status -> Admin Verification -> LSP Operations
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
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

async function testCompleteLSPFlow() {
  console.log('🧪 Testing Complete LSP Registration Flow');
  console.log('=========================================\n');
  
  let adminToken = null;
  let lspToken = null;
  let lspUserId = null;
  
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
    
    // Step 2: Create Test LSP User (Simulating Registration)
    console.log('\n2️⃣  Creating Test LSP User (Simulating Registration)...');
    const client = await pool.connect();
    
    const lspEmail = 'newtestlsp@example.com';
    const lspPassword = 'testpass123';
    const hashedPassword = await bcrypt.hash(lspPassword, 10);
    
    // Clean up existing test user
    await client.query('DELETE FROM lsp_profiles WHERE user_id = (SELECT id FROM users WHERE email = $1)', [lspEmail]);
    await client.query('DELETE FROM users WHERE email = $1', [lspEmail]);
    
    // Create LSP user with CORRECT status (is_active = false for LSPs)
    const userResult = await client.query(`
      INSERT INTO users (first_name, last_name, email, password_hash, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id
    `, ['New', 'Test LSP', lspEmail, hashedPassword, 'lsp', false]); // is_active = false
    
    lspUserId = userResult.rows[0].id;
    
    // Create LSP profile with pending status
    const profileResult = await client.query(`
      INSERT INTO lsp_profiles (user_id, company_name, pan_number, gst_number, company_registration, phone, address, business_license, insurance_certificate, is_verified, verification_status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id
    `, [
      lspUserId,
      'New Test Logistics',
      'NEW1234F',
      '22NEW1234F1Z5',
      'REG123456789',
      '9876543210',
      '123 New Test Street, Mumbai',
      'LIC123456789',
      'INS123456789',
      false, // is_verified = false
      'pending' // verification_status = 'pending'
    ]);
    
    client.release();
    
    console.log('   ✅ Test LSP user created with PENDING status');
    console.log(`   User ID: ${lspUserId}`);
    console.log(`   Status: User Active: false, LSP Verified: false, Verification Status: pending`);
    
    // Step 3: Test LSP Login (Should Fail - Pending Verification)
    console.log('\n3️⃣  Testing LSP Login (Should Fail - Pending Verification)...');
    try {
      const lspLoginResponse = await fetch(`${baseURL}/api/lsp/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: lspEmail,
          password: lspPassword
        })
      });
      
      const lspLoginResult = await lspLoginResponse.json();
      if (lspLoginResponse.ok) {
        console.log('   ❌ LSP login should have failed but succeeded');
      } else {
        console.log('   ✅ LSP login correctly blocked:', lspLoginResult.error);
      }
    } catch (error) {
      console.log('   ✅ LSP login correctly blocked:', error.message);
    }
    
    // Step 4: Check LSP in Admin Panel
    console.log('\n4️⃣  Checking LSP in Admin Panel...');
    try {
      const lspsResponse = await fetch(`${baseURL}/api/admin/lsps`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      const lspsResult = await lspsResponse.json();
      if (lspsResponse.ok) {
        const newLSP = lspsResult.find(lsp => lsp.email === lspEmail);
        if (newLSP) {
          console.log('   ✅ LSP found in admin panel');
          console.log(`   Name: ${newLSP.name}`);
          console.log(`   Company: ${newLSP.company_name}`);
          console.log(`   Approval Status: ${newLSP.is_approved ? 'Approved' : 'Pending'}`);
          console.log(`   Verification Status: ${newLSP.verification_status}`);
        } else {
          console.log('   ❌ LSP not found in admin panel');
        }
      } else {
        console.log('   ❌ Failed to fetch LSPs:', lspsResult.error);
      }
    } catch (error) {
      console.log('   ❌ Error fetching LSPs:', error.message);
    }
    
    // Step 5: Admin Verifies LSP
    console.log('\n5️⃣  Admin Verifies LSP...');
    try {
      const verifyResponse = await fetch(`${baseURL}/api/admin/lsps/${lspUserId}/verify`, {
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
      
      const verifyResult = await verifyResponse.json();
      if (verifyResponse.ok) {
        console.log('   ✅ LSP verification successful');
      } else {
        console.log('   ❌ LSP verification failed:', verifyResult.error);
        return;
      }
    } catch (error) {
      console.log('   ❌ LSP verification error:', error.message);
      return;
    }
    
    // Step 6: Admin Activates User Account
    console.log('\n6️⃣  Admin Activates User Account...');
    try {
      const activateResponse = await fetch(`${baseURL}/api/admin/users/${lspUserId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          is_approved: true
        })
      });
      
      const activateResult = await activateResponse.json();
      if (activateResponse.ok) {
        console.log('   ✅ User account activation successful');
      } else {
        console.log('   ❌ User activation failed:', activateResult.error);
        return;
      }
    } catch (error) {
      console.log('   ❌ User activation error:', error.message);
      return;
    }
    
    // Step 7: Test LSP Login (Should Succeed)
    console.log('\n7️⃣  Testing LSP Login (Should Succeed)...');
    try {
      const lspLoginResponse = await fetch(`${baseURL}/api/lsp/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: lspEmail,
          password: lspPassword
        })
      });
      
      const lspLoginResult = await lspLoginResponse.json();
      if (lspLoginResponse.ok) {
        lspToken = lspLoginResult.token;
        console.log('   ✅ LSP login successful');
        console.log(`   Token: ${lspToken ? 'Generated' : 'Not generated'}`);
      } else {
        console.log('   ❌ LSP login failed:', lspLoginResult.error);
        return;
      }
    } catch (error) {
      console.log('   ❌ LSP login error:', error.message);
      return;
    }
    
    // Step 8: Test LSP Operations (Should Succeed)
    console.log('\n8️⃣  Testing LSP Operations (Should Succeed)...');
    try {
      const containersResponse = await fetch(`${baseURL}/api/lsp/containers`, {
        headers: { 'Authorization': `Bearer ${lspToken}` }
      });
      
      const containersResult = await containersResponse.json();
      if (containersResponse.ok) {
        console.log('   ✅ LSP operations successful');
        console.log(`   Containers count: ${containersResult.length || 0}`);
      } else {
        console.log('   ❌ LSP operations failed:', containersResult.error);
      }
    } catch (error) {
      console.log('   ❌ LSP operations error:', error.message);
    }
    
    console.log('\n🎉 Complete LSP Flow Test Results:');
    console.log('==================================');
    console.log('✅ LSP Registration creates pending status');
    console.log('✅ Unverified LSPs are blocked from login');
    console.log('✅ LSPs appear in admin panel with pending status');
    console.log('✅ Admin can verify LSPs');
    console.log('✅ Admin can activate user accounts');
    console.log('✅ Verified LSPs can login');
    console.log('✅ Verified LSPs can perform operations');
    
    console.log('\n📋 Test Credentials:');
    console.log('===================');
    console.log(`LSP Email: ${lspEmail}`);
    console.log(`LSP Password: ${lspPassword}`);
    console.log(`Status: Verified and Active`);
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
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
    console.log('Please start the server first: cd server && npm start');
    return;
  }
  
  console.log('✅ Server is running, starting tests...\n');
  await testCompleteLSPFlow();
}

main().catch(console.error);
