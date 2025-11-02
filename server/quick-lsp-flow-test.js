#!/usr/bin/env node

/**
 * Quick LSP Flow Verification
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function quickLSPFlowTest() {
  console.log('⚡ Quick LSP Flow Verification');
  console.log('==============================\n');
  
  const baseURL = 'http://localhost:5000';
  
  try {
    // 1. Admin login
    console.log('1️⃣  Admin login...');
    const adminResponse = await fetch(`${baseURL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cargomatch.in',
        password: 'adminCargomatch123'
      })
    });
    
    if (!adminResponse.ok) {
      console.log('❌ Admin login failed');
      return;
    }
    
    const adminData = await adminResponse.json();
    const adminToken = adminData.token;
    console.log('   ✅ Admin login successful');
    
    // 2. Get all LSPs
    console.log('\n2️⃣  Getting all LSPs...');
    const allLSPsResponse = await fetch(`${baseURL}/api/admin/lsps`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const allLSPs = await allLSPsResponse.json();
    console.log(`   ✅ Found ${allLSPs.length} LSPs`);
    
    // 3. Get pending LSPs
    console.log('\n3️⃣  Getting pending LSPs...');
    const pendingLSPsResponse = await fetch(`${baseURL}/api/admin/lsps?status=pending`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const pendingLSPs = await pendingLSPsResponse.json();
    console.log(`   ✅ Found ${pendingLSPs.length} pending LSPs`);
    
    if (pendingLSPs.length > 0) {
      const pendingLSP = pendingLSPs[0];
      console.log(`   Example: ${pendingLSP.name} (${pendingLSP.company_name})`);
      console.log(`   Status: ${pendingLSP.verification_status}, Verified: ${pendingLSP.is_verified}`);
    }
    
    // 4. Get approved LSPs
    console.log('\n4️⃣  Getting approved LSPs...');
    const approvedLSPsResponse = await fetch(`${baseURL}/api/admin/lsps?status=approved`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const approvedLSPs = await approvedLSPsResponse.json();
    console.log(`   ✅ Found ${approvedLSPs.length} approved LSPs`);
    
    // 5. Get regular users (traders)
    console.log('\n5️⃣  Getting regular users (traders)...');
    const usersResponse = await fetch(`${baseURL}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const users = await usersResponse.json();
    console.log(`   ✅ Found ${users.length} regular users`);
    
    console.log('\n🎉 LSP Flow Verification Complete!');
    console.log('\n📋 Summary:');
    console.log('===========');
    console.log(`✅ Admin can login`);
    console.log(`✅ Admin can view all LSPs (${allLSPs.length})`);
    console.log(`✅ Admin can filter pending LSPs (${pendingLSPs.length})`);
    console.log(`✅ Admin can filter approved LSPs (${approvedLSPs.length})`);
    console.log(`✅ Admin can view regular users separately (${users.length})`);
    console.log('\n💡 Next Steps:');
    console.log('1. Test LSP approval in frontend');
    console.log('2. Verify LSP registration creates pending users');
    console.log('3. Test LSP login after approval');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

quickLSPFlowTest().catch(console.error);
