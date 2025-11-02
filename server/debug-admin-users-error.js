#!/usr/bin/env node

/**
 * Debug Admin Users Endpoint Error
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugAdminUsersError() {
  console.log('🔍 Debugging Admin Users Endpoint Error');
  console.log('======================================\n');
  
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
    
    // 2. Test /api/admin/users (should work)
    console.log('\n2️⃣  Testing /api/admin/users...');
    const usersResponse = await fetch(`${baseURL}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${usersResponse.status}`);
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log(`   ✅ Found ${users.length} users`);
      if (users.length > 0) {
        console.log(`   First user: ${users[0].name} (ID: ${users[0].id})`);
      }
    } else {
      const error = await usersResponse.json();
      console.log(`   ❌ Error: ${error.error}`);
    }
    
    // 3. Test /api/admin/users/undefined (this is the problematic one)
    console.log('\n3️⃣  Testing /api/admin/users/undefined...');
    const undefinedUserResponse = await fetch(`${baseURL}/api/admin/users/undefined`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${undefinedUserResponse.status}`);
    if (!undefinedUserResponse.ok) {
      const error = await undefinedUserResponse.json();
      console.log(`   ❌ Error: ${error.error}`);
      console.log(`   This is expected - undefined is not a valid user ID`);
    }
    
    // 4. Test with a valid user ID
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      if (users.length > 0) {
        const validUserId = users[0].id;
        console.log(`\n4️⃣  Testing /api/admin/users/${validUserId}...`);
        
        const validUserResponse = await fetch(`${baseURL}/api/admin/users/${validUserId}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`   Status: ${validUserResponse.status}`);
        if (validUserResponse.ok) {
          const user = await validUserResponse.json();
          console.log(`   ✅ User found: ${user.name} (${user.email})`);
        } else {
          const error = await validUserResponse.json();
          console.log(`   ❌ Error: ${error.error}`);
        }
      }
    }
    
    console.log('\n🔍 Analysis:');
    console.log('============');
    console.log('The error occurs because the frontend is trying to access:');
    console.log('GET /api/admin/users/undefined');
    console.log('');
    console.log('This suggests:');
    console.log('1. Frontend is passing undefined as user ID');
    console.log('2. Need to check frontend code for undefined variables');
    console.log('3. Backend should handle undefined IDs gracefully');
    
  } catch (error) {
    console.log('❌ Error during debugging:', error.message);
  }
}

debugAdminUsersError().catch(console.error);
