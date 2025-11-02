#!/usr/bin/env node

/**
 * Start Server and Test Complete Flow
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting CargoMatch Server and Testing Complete Flow');
console.log('=====================================================\n');

// Start the server
console.log('1️⃣  Starting server...');
const serverProcess = spawn('npm', ['start'], {
  cwd: path.join(__dirname),
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let serverStarted = false;

serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('Server:', output);
  
  if (output.includes('Server running on port 5000') || output.includes('listening on port 5000')) {
    if (!serverStarted) {
      serverStarted = true;
      console.log('\n✅ Server started successfully!');
      
      // Wait a moment for server to fully initialize
      setTimeout(() => {
        console.log('\n2️⃣  Running complete flow test...');
        runFlowTest();
      }, 3000);
    }
  }
});

serverProcess.stderr.on('data', (data) => {
  console.error('Server Error:', data.toString());
});

serverProcess.on('close', (code) => {
  console.log(`\nServer process exited with code ${code}`);
});

function runFlowTest() {
  const testProcess = spawn('node', ['test-complete-flow.js'], {
    cwd: path.join(__dirname),
    stdio: 'inherit',
    shell: true
  });
  
  testProcess.on('close', (code) => {
    console.log(`\n🧪 Flow test completed with code ${code}`);
    console.log('\n🛑 Stopping server...');
    serverProcess.kill();
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  serverProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  serverProcess.kill();
  process.exit(0);
});
