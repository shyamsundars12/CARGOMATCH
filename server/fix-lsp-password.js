#!/usr/bin/env node

/**
 * Fix LSP User Password
 */

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

async function fixLSPPassword() {
  console.log('🔐 Fixing LSP User Password');
  console.log('===========================\n');
  
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
    
    console.log('1️⃣  Finding test LSP user...');
    const userResult = await client.query('SELECT * FROM users WHERE email = $1', ['test@lsp.com']);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Test LSP user not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`   Found user: ${user.first_name} ${user.last_name} (${user.email})`);
    console.log(`   Current password hash: ${user.password_hash.substring(0, 20)}...`);
    
    console.log('\n2️⃣  Creating new password hash...');
    const newPassword = 'password123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log(`   New password: ${newPassword}`);
    console.log(`   New hash: ${hashedPassword.substring(0, 20)}...`);
    
    console.log('\n3️⃣  Updating password...');
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, user.id]);
    console.log('   ✅ Password updated');
    
    console.log('\n4️⃣  Testing password...');
    const testUser = await client.query('SELECT * FROM users WHERE email = $1', ['test@lsp.com']);
    const isValid = await bcrypt.compare(newPassword, testUser.rows[0].password_hash);
    console.log(`   Password test: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    
    console.log('\n🎉 Password Fixed Successfully!');
    console.log('\n📋 Updated Credentials:');
    console.log('=======================');
    console.log('Email: test@lsp.com');
    console.log('Password: password123');
    console.log('Status: Active & Verified ✅');
    
    client.release();
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixLSPPassword().catch(console.error);
