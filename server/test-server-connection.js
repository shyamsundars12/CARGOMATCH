#!/usr/bin/env node

/**
 * Test Server Connection
 */

const fetch = require('node-fetch');

async function testServer() {
  console.log('🌐 Testing Server Connection');
  console.log('============================\n');
  
  try {
    console.log('Testing server at http://localhost:5000...');
    const response = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    console.log(`✅ Server is running! Status: ${response.status}`);
    
    if (response.status === 400) {
      console.log('✅ This is expected - server is working but needs proper login data');
    }
    
  } catch (error) {
    console.log('❌ Server not responding:', error.message);
    console.log('\n💡 Solutions:');
    console.log('1. Start server: npm start');
    console.log('2. Check if port 5000 is available');
    console.log('3. Check server logs for errors');
  }
}

testServer();
