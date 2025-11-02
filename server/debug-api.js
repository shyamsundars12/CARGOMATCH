#!/usr/bin/env node

/**
 * Debug API Endpoints
 * Tests the specific endpoints that are returning 500 errors
 */

const fetch = require('node-fetch').default || require('node-fetch');

async function debugAPI() {
  console.log('🔍 Debugging API Endpoints');
  console.log('==========================\n');
  
  const baseUrl = 'http://localhost:5000';
  
  // First, get admin token
  console.log('1️⃣  Getting admin token...');
  let adminToken = null;
  
  try {
    const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cargomatch.in',
        password: 'adminCargomatch123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      adminToken = loginData.token;
      console.log('✅ Admin login successful');
    } else {
      console.log('❌ Admin login failed');
      const errorText = await loginResponse.text();
      console.log(`   Error: ${errorText}`);
      return;
    }
  } catch (error) {
    console.log('❌ Login request failed:', error.message);
    return;
  }
  
  // Test endpoints that are failing
  const endpoints = [
    { name: 'Users', url: '/api/admin/users' },
    { name: 'LSPs', url: '/api/admin/lsps' },
    { name: 'Bookings', url: '/api/admin/bookings' },
    { name: 'Shipments', url: '/api/admin/shipments' },
    { name: 'Complaints', url: '/api/admin/complaints' },
    { name: 'Containers', url: '/api/admin/containers' }
  ];
  
  console.log('\n2️⃣  Testing API endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n   Testing ${endpoint.name}...`);
      
      const response = await fetch(`${baseUrl}${endpoint.url}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ ${endpoint.name}: OK`);
        console.log(`      Data type: ${Array.isArray(data) ? 'Array' : typeof data}`);
        console.log(`      Records: ${Array.isArray(data) ? data.length : 'N/A'}`);
      } else {
        console.log(`   ❌ ${endpoint.name}: ${response.status}`);
        const errorText = await response.text();
        console.log(`      Error: ${errorText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: ${error.message}`);
    }
  }
  
  // Test database connection directly
  console.log('\n3️⃣  Testing database connection...');
  try {
    const dbResponse = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (dbResponse.ok) {
      const dbData = await dbResponse.json();
      console.log('✅ Database connection working');
      console.log(`   Users: ${dbData.users}`);
      console.log(`   LSPs: ${dbData.lsps}`);
      console.log(`   Containers: ${dbData.containers}`);
      console.log(`   Bookings: ${dbData.bookings}`);
    } else {
      console.log('❌ Database connection failed');
      const errorText = await dbResponse.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
  }
  
  console.log('\n🎯 Debug Summary:');
  console.log('================');
  console.log('If endpoints are failing with 500 errors, possible causes:');
  console.log('1. Database query issues');
  console.log('2. Missing tables or columns');
  console.log('3. Permission issues');
  console.log('4. Server-side errors in route handlers');
  console.log('\n💡 Next step: Check server logs for detailed error messages');
}

debugAPI().catch(console.error);
