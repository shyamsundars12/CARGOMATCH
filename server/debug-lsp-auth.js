#!/usr/bin/env node

/**
 * Debug LSP Authentication Flow
 * Tests the complete LSP login and verification process
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugLSPAuth() {
  console.log('🔍 Debugging LSP Authentication Flow');
  console.log('====================================\n');
  
  const baseURL = 'http://localhost:5000';
  
  try {
    console.log('1️⃣  Testing Server Connection...');
    const serverTest = await fetch(`${baseURL}/api/lsp/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (serverTest.status === 400) {
      console.log('   ✅ Server is running (400 is expected for empty login)');
    } else {
      console.log(`   ⚠️  Server responded with status: ${serverTest.status}`);
    }
    
    console.log('\n2️⃣  Testing LSP Login...');
    
    // Test with known LSP credentials
    const loginData = {
      email: 'test@lsp.com',
      password: 'password123'
    };
    
    console.log(`   Attempting login with: ${loginData.email}`);
    const loginResponse = await fetch(`${baseURL}/api/lsp/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });
    
    const loginResult = await loginResponse.json();
    console.log(`   Login status: ${loginResponse.status}`);
    console.log(`   Login response:`, loginResult);
    
    if (loginResponse.ok && loginResult.token) {
      console.log('   ✅ Login successful!');
      
      console.log('\n3️⃣  Testing LSP Dashboard Access...');
      
      const token = loginResult.token;
      console.log(`   Token: ${token.substring(0, 50)}...`);
      
      // Test containers endpoint
      const containersResponse = await fetch(`${baseURL}/api/lsp/containers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   Containers endpoint status: ${containersResponse.status}`);
      
      if (containersResponse.status === 403) {
        const errorData = await containersResponse.json();
        console.log(`   ❌ 403 Error:`, errorData);
        
        console.log('\n4️⃣  Debugging JWT Token...');
        
        // Decode JWT token to see what's inside
        const jwt = require('jsonwebtoken');
        try {
          const decoded = jwt.decode(token);
          console.log('   JWT Payload:', decoded);
          console.log(`   User ID: ${decoded.id} (type: ${typeof decoded.id})`);
          console.log(`   User Role: ${decoded.role}`);
          console.log(`   User Email: ${decoded.email}`);
        } catch (error) {
          console.log('   ❌ Failed to decode JWT:', error.message);
        }
        
        console.log('\n5️⃣  Checking LSP Profile Status...');
        
        // Check if LSP profile exists and is verified
        const { Pool } = require('pg');
        const pool = new Pool({
          host: 'localhost',
          port: 5432,
          database: 'logisticsdb',
          user: 'postgres',
          password: 'admin123',
          ssl: false
        });
        
        try {
          const client = await pool.connect();
          
          // Check user status
          const userResult = await client.query(
            'SELECT id, first_name, last_name, email, role, is_active FROM users WHERE email = $1',
            [loginData.email]
          );
          
          if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            console.log('   User found:', user);
            
            // Check LSP profile
            const lspResult = await client.query(
              'SELECT * FROM lsp_profiles WHERE user_id = $1',
              [user.id]
            );
            
            if (lspResult.rows.length > 0) {
              const lspProfile = lspResult.rows[0];
              console.log('   LSP Profile:', lspProfile);
              console.log(`   Is Verified: ${lspProfile.is_verified}`);
              console.log(`   Verification Status: ${lspProfile.verification_status}`);
            } else {
              console.log('   ❌ No LSP profile found');
            }
          } else {
            console.log('   ❌ User not found');
          }
          
          client.release();
          await pool.end();
          
        } catch (dbError) {
          console.log('   ❌ Database error:', dbError.message);
        }
        
      } else if (containersResponse.ok) {
        console.log('   ✅ Containers endpoint accessible!');
        const containersData = await containersResponse.json();
        console.log(`   Containers count: ${containersData.length}`);
      }
      
    } else {
      console.log('   ❌ Login failed');
      console.log('   Possible reasons:');
      console.log('   - User does not exist');
      console.log('   - Wrong password');
      console.log('   - User is not an LSP');
    }
    
  } catch (error) {
    console.log('❌ Error during debugging:', error.message);
    console.log('\n💡 Possible solutions:');
    console.log('1. Make sure backend server is running: npm start');
    console.log('2. Check if database is connected');
    console.log('3. Verify LSP user exists and is verified');
  }
}

debugLSPAuth().catch(console.error);
