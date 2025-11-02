#!/usr/bin/env node

/**
 * Debug LSP API Response
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugLSPAPIResponse() {
  console.log('🔍 Debugging LSP API Response');
  console.log('=============================\n');
  
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
    
    // Get LSPs
    const lspsResponse = await fetch(`${baseURL}/api/admin/lsps`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const lsps = await lspsResponse.json();
    console.log('📋 Raw LSP API Response:');
    console.log('========================');
    
    lsps.forEach((lsp, index) => {
      console.log(`\nLSP ${index + 1}: ${lsp.name}`);
      console.log('Raw response object:');
      console.log(JSON.stringify(lsp, null, 2));
    });
    
    // Test verification API
    const freshLSP = lsps.find(lsp => lsp.email === 'freshlsp@test.com');
    if (freshLSP) {
      console.log('\n🧪 Testing Verification API Response:');
      console.log('=====================================');
      
      const verifyResponse = await fetch(`${baseURL}/api/admin/lsps/${freshLSP.id}/verify`, {
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
      
      const verifyData = await verifyResponse.json();
      console.log('Verification API response:');
      console.log(JSON.stringify(verifyData, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

debugLSPAPIResponse().catch(console.error);
