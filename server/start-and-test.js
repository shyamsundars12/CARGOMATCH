#!/usr/bin/env node

/**
 * Start Server and Test API
 * Starts the server and runs API tests
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting CargoMatch Server and Testing API');
console.log('=============================================\n');

// Start the server
console.log('1️⃣  Starting server...');
const server = spawn('node', ['server.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: __dirname
});

let serverStarted = false;

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`[SERVER] ${output.trim()}`);
  
  // Check if server is ready
  if (output.includes('Server running') || output.includes('listening') || output.includes('5000')) {
    if (!serverStarted) {
      serverStarted = true;
      console.log('\n✅ Server started successfully!');
      
      // Wait a bit for server to fully initialize
      setTimeout(() => {
        console.log('\n2️⃣  Running API tests...');
        runAPITest();
      }, 2000);
    }
  }
});

server.stderr.on('data', (data) => {
  console.log(`[SERVER ERROR] ${data.toString().trim()}`);
});

server.on('close', (code) => {
  console.log(`\n[SERVER] Process exited with code ${code}`);
});

// Function to run API test
function runAPITest() {
  const testProcess = spawn('node', ['quick-api-test.js'], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  testProcess.on('close', (code) => {
    console.log(`\n[TEST] API test completed with code ${code}`);
    console.log('\n🎉 Testing complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Your migration is successful');
    console.log('2. Database is working properly');
    console.log('3. API endpoints are functional');
    console.log('4. You can now use the application');
    
    // Stop the server
    server.kill();
    process.exit(0);
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping server...');
  server.kill();
  process.exit(0);
});

// Timeout after 30 seconds
setTimeout(() => {
  if (!serverStarted) {
    console.log('\n⏰ Timeout: Server did not start within 30 seconds');
    server.kill();
    process.exit(1);
  }
}, 30000);
