#!/usr/bin/env node

/**
 * Test LSP Verification/Approval Process
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testLSPVerificationProcess() {
  console.log('🧪 Testing LSP Verification/Approval Process');
  console.log('============================================\n');
  
  const baseURL = 'http://localhost:5000';
  
  try {
    // Admin login
    console.log('1️⃣  Admin login...');
    const adminResponse = await fetch(`${baseURL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cargomatch.in',
        password: 'adminCargomatch123'
      })
    });
    
    const adminData = await adminResponse.json();
    const adminToken = adminData.token;
    console.log('   ✅ Admin login successful');
    
    // Get LSPs
    console.log('\n2️⃣  Getting LSPs...');
    const lspsResponse = await fetch(`${baseURL}/api/admin/lsps`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const lsps = await lspsResponse.json();
    console.log(`   ✅ Found ${lsps.length} LSPs`);
    
    // Find a pending LSP to test with
    const pendingLSP = lsps.find(lsp => lsp.verification_status === 'pending');
    
    if (!pendingLSP) {
      console.log('   ⚠️  No pending LSPs found for testing');
      console.log('   Current LSPs:');
      lsps.forEach((lsp, index) => {
        console.log(`     ${index + 1}. ${lsp.name}: ${lsp.verification_status} (is_active: ${lsp.is_active})`);
      });
      return;
    }
    
    console.log(`   🎯 Testing with LSP: ${pendingLSP.name} (${pendingLSP.email})`);
    console.log(`   Current status: verification_status=${pendingLSP.verification_status}, is_active=${pendingLSP.is_active}`);
    
    // Test approval process
    console.log('\n3️⃣  Testing LSP Approval...');
    const approvalResponse = await fetch(`${baseURL}/api/admin/lsps/${pendingLSP.id}/verify`, {
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
    
    console.log(`   Approval API status: ${approvalResponse.status}`);
    
    if (approvalResponse.ok) {
      const updatedLSP = await approvalResponse.json();
      console.log('   ✅ LSP approval successful!');
      console.log(`   Updated status: verification_status=${updatedLSP.verification_status}, is_active=${updatedLSP.is_active}`);
      
      // Verify the changes
      if (updatedLSP.verification_status === 'approved' && updatedLSP.is_active === true) {
        console.log('   ✅ Both verification_status and is_active updated correctly!');
      } else {
        console.log('   ❌ Status update incomplete');
      }
    } else {
      const error = await approvalResponse.json();
      console.log(`   ❌ Approval failed: ${error.error}`);
    }
    
    // Test rejection process
    console.log('\n4️⃣  Testing LSP Rejection...');
    const rejectionResponse = await fetch(`${baseURL}/api/admin/lsps/${pendingLSP.id}/verify`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        is_verified: false,
        verification_status: 'rejected'
      })
    });
    
    console.log(`   Rejection API status: ${rejectionResponse.status}`);
    
    if (rejectionResponse.ok) {
      const updatedLSP = await rejectionResponse.json();
      console.log('   ✅ LSP rejection successful!');
      console.log(`   Updated status: verification_status=${updatedLSP.verification_status}, is_active=${updatedLSP.is_active}`);
      
      // Verify the changes
      if (updatedLSP.verification_status === 'rejected' && updatedLSP.is_active === false) {
        console.log('   ✅ Both verification_status and is_active updated correctly!');
      } else {
        console.log('   ❌ Status update incomplete');
      }
    } else {
      const error = await rejectionResponse.json();
      console.log(`   ❌ Rejection failed: ${error.error}`);
    }
    
    console.log('\n🎉 LSP Verification Process Test Complete!');
    
  } catch (error) {
    console.log('❌ Error during testing:', error.message);
  }
}

testLSPVerificationProcess().catch(console.error);
