#!/usr/bin/env node

/**
 * Start Both Frontend and Backend
 * Starts both servers properly
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting CargoMatch Application');
console.log('===================================\n');

// Function to start backend
function startBackend() {
  console.log('1️⃣  Starting Backend Server...');
  
  const backend = spawn('node', ['server.js'], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  backend.on('close', (code) => {
    console.log(`\n[BACKEND] Process exited with code ${code}`);
  });
  
  return backend;
}

// Function to start frontend
function startFrontend() {
  console.log('2️⃣  Starting Frontend Server...');
  
  const frontend = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..', 'client')
  });
  
  frontend.on('close', (code) => {
    console.log(`\n[FRONTEND] Process exited with code ${code}`);
  });
  
  return frontend;
}

// Start both servers
const backend = startBackend();

// Wait 3 seconds then start frontend
setTimeout(() => {
  const frontend = startFrontend();
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping servers...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });
}, 3000);

console.log('\n📝 Servers starting...');
console.log('   - Backend: http://localhost:5000');
console.log('   - Frontend: http://localhost:5173');
console.log('\n⏳ Wait for both servers to start, then open:');
console.log('   http://localhost:5173');
