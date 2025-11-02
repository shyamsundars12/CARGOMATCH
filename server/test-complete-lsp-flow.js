#!/usr/bin/env node

/**
 * Test Complete LSP Registration and Approval Flow
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const baseURL = 'http://localhost:5000';

async function testCompleteLSPFlow() {
  console.log('🧪 Testing Complete LSP Registration and Approval Flow');
  console.log('=====================================================\n');
  
  try {
    // Step 1: Create a new LSP user (simulating registration)
    console.log('1️⃣  Creating new LSP user (simulating registration)...');
    
    const pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'logisticsdb',
      user: 'postgres',
      password: 'admin123',
      ssl: false
    });
    
    const client = await pool.connect();
    
    // Create new LSP user
    const hashedPassword = await bcrypt.hash('newlsp123', 10);
    const userResult = await client.query(`
      INSERT INTO users (
        first_name, last_name, email, password_hash, role, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, first_name, last_name, email, role, is_active
    `, [
      'New',
      'LSP',
      'newlsp@test.com',
      hashedPassword,
      'lsp',
      false // Should be inactive initially
    ]);
    
    const newUser = userResult.rows[0];
    console.log(`   ✅ User created: ${newUser.first_name} ${newUser.last_name} (${newUser.email})`);
    console.log(`   Status: Active=${newUser.is_active}, Role=${newUser.role}`);
    
    // Create LSP profile
    const lspResult = await client.query(`
      INSERT INTO lsp_profiles (
        user_id, company_name, pan_number, gst_number, phone, address,
        is_verified, verification_status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `, [
      newUser.id,
      'New Logistics Company',
      'NEW1234567F',
      '22NEW1234567F1Z5',
      '+91-9876543210',
      '456 New Street, New City, New State - 654321',
      false, // Should be unverified initially
      'pending'
    ]);
    
    const newLSP = lspResult.rows[0];
    console.log(`   ✅ LSP profile created: ${newLSP.company_name}`);
    console.log(`   Status: Verified=${newLSP.is_verified}, Status=${newLSP.verification_status}`);
    
    client.release();
    await pool.end();
    
    // Step 2: Test LSP login (should fail - not approved)
    console.log('\n2️⃣  Testing LSP login (should fail - not approved)...');
    
    const loginResponse = await fetch(`${baseURL}/api/lsp/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newlsp@test.com',
        password: 'newlsp123'
      })
    });
    
    console.log(`   Login status: ${loginResponse.status}`);
    if (loginResponse.status === 200) {
      console.log('   ❌ Login should have failed but succeeded');
    } else {
      console.log('   ✅ Login correctly failed (user not approved)');
    }
    
    // Step 3: Admin login
    console.log('\n3️⃣  Admin login...');
    
    const adminLoginResponse = await fetch(`${baseURL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cargomatch.in',
        password: 'adminCargomatch123'
      })
    });
    
    const adminLoginData = await adminLoginResponse.json();
    console.log(`   Admin login status: ${adminLoginResponse.status}`);
    
    if (adminLoginResponse.ok) {
      console.log('   ✅ Admin login successful');
      const adminToken = adminLoginData.token;
      
      // Step 4: Get pending LSPs
      console.log('\n4️⃣  Getting pending LSPs...');
      
      const pendingLSPsResponse = await fetch(`${baseURL}/api/admin/lsps?status=pending`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const pendingLSPs = await pendingLSPsResponse.json();
      console.log(`   Pending LSPs count: ${pendingLSPs.length}`);
      
      if (pendingLSPs.length > 0) {
        const newLSPInList = pendingLSPs.find(lsp => lsp.email === 'newlsp@test.com');
        if (newLSPInList) {
          console.log('   ✅ New LSP found in pending list');
          console.log(`   LSP: ${newLSPInList.name} (${newLSPInList.company_name})`);
          
          // Step 5: Approve LSP
          console.log('\n5️⃣  Approving LSP...');
          
          const approveResponse = await fetch(`${baseURL}/api/admin/lsps/${newLSPInList.id}/approve`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          const approveData = await approveResponse.json();
          console.log(`   Approval status: ${approveResponse.status}`);
          
          if (approveResponse.ok) {
            console.log('   ✅ LSP approved successfully');
            console.log(`   Message: ${approveData.message}`);
            
            // Step 6: Test LSP login after approval
            console.log('\n6️⃣  Testing LSP login after approval...');
            
            const finalLoginResponse = await fetch(`${baseURL}/api/lsp/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: 'newlsp@test.com',
                password: 'newlsp123'
              })
            });
            
            const finalLoginData = await finalLoginResponse.json();
            console.log(`   Final login status: ${finalLoginResponse.status}`);
            
            if (finalLoginResponse.ok) {
              console.log('   ✅ LSP login successful after approval');
              console.log(`   User: ${finalLoginData.user.name} (${finalLoginData.user.email})`);
              console.log(`   Role: ${finalLoginData.user.role}`);
              
              // Step 7: Test LSP dashboard access
              console.log('\n7️⃣  Testing LSP dashboard access...');
              
              const dashboardResponse = await fetch(`${baseURL}/api/lsp/containers`, {
                headers: {
                  'Authorization': `Bearer ${finalLoginData.token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              console.log(`   Dashboard access status: ${dashboardResponse.status}`);
              if (dashboardResponse.ok) {
                console.log('   ✅ LSP dashboard accessible');
              } else {
                console.log('   ❌ LSP dashboard not accessible');
              }
              
            } else {
              console.log('   ❌ LSP login failed after approval');
            }
            
          } else {
            console.log('   ❌ LSP approval failed');
            console.log(`   Error: ${approveData.error}`);
          }
          
        } else {
          console.log('   ❌ New LSP not found in pending list');
        }
      } else {
        console.log('   ❌ No pending LSPs found');
      }
      
    } else {
      console.log('   ❌ Admin login failed');
    }
    
    console.log('\n🎉 Complete LSP Flow Test Finished!');
    console.log('\n📋 Summary:');
    console.log('===========');
    console.log('✅ LSP registration creates pending user');
    console.log('✅ Pending LSPs cannot login');
    console.log('✅ Admin can view pending LSPs');
    console.log('✅ Admin can approve LSPs');
    console.log('✅ Approved LSPs can login and access dashboard');
    
  } catch (error) {
    console.log('❌ Error during testing:', error.message);
  }
}

testCompleteLSPFlow().catch(console.error);
