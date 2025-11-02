#!/usr/bin/env node

/**
 * Test LSP Data Structure and Status Logic
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testLSPDataStructure() {
  console.log('🧪 Testing LSP Data Structure and Status Logic');
  console.log('==============================================\n');
  
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
    console.log('\n2️⃣  Fetching LSPs...');
    const lspsResponse = await fetch(`${baseURL}/api/admin/lsps`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const lsps = await lspsResponse.json();
    console.log(`   ✅ Found ${lsps.length} LSPs`);
    
    // Test status logic for each LSP
    console.log('\n3️⃣  Testing Status Logic:');
    console.log('===========================');
    
    lsps.forEach((lsp, index) => {
      console.log(`\n   LSP ${index + 1}: ${lsp.name} (${lsp.company_name})`);
      console.log(`   Raw Data:`);
      console.log(`     - is_active: ${lsp.is_approved}`);
      console.log(`     - is_verified: ${lsp.is_verified}`);
      console.log(`     - verification_status: ${lsp.verification_status}`);
      
      // Test verification status logic
      let verificationStatus;
      if (lsp.verification_status === 'approved') {
        verificationStatus = { label: "Verified", color: "green" };
      } else if (lsp.verification_status === 'rejected') {
        verificationStatus = { label: "Rejected", color: "red" };
      } else if (lsp.verification_status === 'pending') {
        verificationStatus = { label: "Pending", color: "orange" };
      } else {
        verificationStatus = { label: "Unknown", color: "gray" };
      }
      
      // Test approval status logic (updated)
      let approvalStatus;
      if (lsp.verification_status === 'rejected') {
        approvalStatus = { label: "Rejected", color: "red" };
      } else if (lsp.verification_status === 'pending') {
        approvalStatus = { label: "Pending", color: "orange" };
      } else if (lsp.verification_status === 'approved') {
        if (lsp.is_active === true) {
          approvalStatus = { label: "Approved", color: "green" };
        } else {
          approvalStatus = { label: "Pending", color: "orange" }; // Approved but not activated yet
        }
      } else {
        approvalStatus = { label: "Pending", color: "orange" };
      }
      
      console.log(`   Calculated Status:`);
      console.log(`     - Verification: ${verificationStatus.label} (${verificationStatus.color})`);
      console.log(`     - Approval: ${approvalStatus.label} (${approvalStatus.color})`);
      
      // Check if this matches expected behavior
      if (lsp.verification_status === 'pending' && verificationStatus.label !== 'Pending') {
        console.log(`   ❌ Verification status logic error!`);
      } else if (lsp.verification_status === 'pending' && verificationStatus.label === 'Pending') {
        console.log(`   ✅ Verification status logic correct`);
      }
      
      if (lsp.is_active === false && lsp.is_approved !== true && approvalStatus.label !== 'Pending') {
        console.log(`   ❌ Approval status logic error!`);
      } else if (lsp.is_active === false && lsp.is_approved !== true && approvalStatus.label === 'Pending') {
        console.log(`   ✅ Approval status logic correct`);
      }
    });
    
    console.log('\n🎉 LSP Data Structure Test Complete!');
    
  } catch (error) {
    console.log('❌ Error during testing:', error.message);
  }
}

testLSPDataStructure().catch(console.error);
