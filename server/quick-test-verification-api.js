#!/usr/bin/env node

/**
 * Quick Test of LSP Verification API
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function quickTestVerificationAPI() {
  console.log('🧪 Quick Test of LSP Verification API');
  console.log('=====================================\n');
  
  const baseURL = 'http://localhost:5000';
  
  try {
    // Admin login
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
    console.log('✅ Admin login successful');
    
    // Get LSPs
    const lspsResponse = await fetch(`${baseURL}/api/admin/lsps`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const lsps = await lspsResponse.json();
    console.log(`✅ Found ${lsps.length} LSPs`);
    
    // Find a LSP with pending approval (verified but not active)
    const pendingLSP = lsps.find(lsp => 
      lsp.verification_status === 'approved' && 
      lsp.is_approved === false
    );
    
    if (!pendingLSP) {
      console.log('⚠️  No LSPs with pending approval found');
      console.log('Current LSPs:');
      lsps.forEach((lsp, index) => {
        console.log(`  ${index + 1}. ${lsp.name}: verification=${lsp.verification_status}, approval=${lsp.is_approved}`);
      });
      return;
    }
    
    console.log(`🎯 Testing with: ${pendingLSP.name}`);
    console.log(`Before: verification_status=${pendingLSP.verification_status}, is_approved=${pendingLSP.is_approved}`);
    
    // Test approval
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
    
    console.log(`\n📡 API Response Status: ${approvalResponse.status}`);
    
    if (approvalResponse.ok) {
      const updatedLSP = await approvalResponse.json();
      console.log('✅ API Response Success!');
      console.log('Updated LSP data:');
      console.log(JSON.stringify(updatedLSP, null, 2));
      
      // Check if the response has the right fields
      if (updatedLSP.is_active !== undefined) {
        console.log(`✅ is_active field present: ${updatedLSP.is_active}`);
      } else {
        console.log('❌ is_active field missing from response');
      }
      
      if (updatedLSP.is_approved !== undefined) {
        console.log(`✅ is_approved field present: ${updatedLSP.is_approved}`);
      } else {
        console.log('❌ is_approved field missing from response');
      }
      
    } else {
      const error = await approvalResponse.json();
      console.log(`❌ API Error: ${error.error}`);
    }
    
  } catch (error) {
    console.log('❌ Test Error:', error.message);
  }
}

quickTestVerificationAPI().catch(console.error);
