#!/usr/bin/env node

/**
 * Complete LSP Flow Fix and Test
 * 1. Fix existing LSP status
 * 2. Start server
 * 3. Test complete flow
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Complete LSP Flow Fix and Test');
console.log('=================================\n');

async function runFixAndTest() {
  try {
    // Step 1: Fix existing LSP status
    console.log('1️⃣  Fixing existing LSP status...');
    const fixProcess = spawn('node', ['fix-lsp-status.js'], {
      cwd: path.join(__dirname),
      stdio: 'inherit',
      shell: true
    });
    
    await new Promise((resolve, reject) => {
      fixProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ LSP status fix completed\n');
          resolve();
        } else {
          reject(new Error(`Fix process exited with code ${code}`));
        }
      });
    });
    
    // Step 2: Start server
    console.log('2️⃣  Starting server...');
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
            console.log('\n3️⃣  Running complete flow test...');
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
      const testProcess = spawn('node', ['test-lsp-flow-fixed.js'], {
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
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runFixAndTest().catch(console.error);
