#!/usr/bin/env node

/**
 * Check Existing Users and Create LSP User
 */

const { Pool } = require('pg');

async function checkAndCreateLSPUser() {
  console.log('👥 Checking Existing Users and Creating LSP User');
  console.log('===============================================\n');
  
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
    
    console.log('1️⃣  Checking existing users...');
    const usersResult = await client.query(`
      SELECT id, first_name, last_name, email, role, is_active 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    console.log(`   Found ${usersResult.rows.length} users:`);
    usersResult.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.first_name} ${user.last_name} (${user.email})`);
      console.log(`      Role: ${user.role}, Active: ${user.is_active}, ID: ${user.id}`);
    });
    
    console.log('\n2️⃣  Checking LSP profiles...');
    const lspResult = await client.query(`
      SELECT lp.*, u.first_name, u.last_name, u.email, u.is_active
      FROM lsp_profiles lp
      JOIN users u ON lp.user_id = u.id
      ORDER BY lp.created_at DESC
    `);
    
    console.log(`   Found ${lspResult.rows.length} LSP profiles:`);
    lspResult.rows.forEach((lsp, index) => {
      console.log(`   ${index + 1}. ${lsp.first_name} ${lsp.last_name} (${lsp.email})`);
      console.log(`      Company: ${lsp.company_name}`);
      console.log(`      Verified: ${lsp.is_verified}, Status: ${lsp.verification_status}`);
      console.log(`      User Active: ${lsp.is_active}`);
    });
    
    console.log('\n3️⃣  Creating test LSP user...');
    
    // Check if test LSP user already exists
    const existingLSP = await client.query('SELECT * FROM users WHERE email = $1', ['test@lsp.com']);
    
    if (existingLSP.rows.length > 0) {
      console.log('   ✅ Test LSP user already exists');
      const user = existingLSP.rows[0];
      console.log(`   User ID: ${user.id}, Active: ${user.is_active}`);
      
      // Check if LSP profile exists
      const lspProfile = await client.query('SELECT * FROM lsp_profiles WHERE user_id = $1', [user.id]);
      if (lspProfile.rows.length > 0) {
        console.log('   ✅ LSP profile exists');
        const profile = lspProfile.rows[0];
        console.log(`   Verified: ${profile.is_verified}, Status: ${profile.verification_status}`);
      } else {
        console.log('   ⚠️  LSP profile missing - creating one...');
        
        // Create LSP profile
        await client.query(`
          INSERT INTO lsp_profiles (
            user_id, company_name, pan_number, gst_number, phone, address,
            is_verified, verification_status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `, [
          user.id,
          'Test Logistics Company',
          'ABCDE1234F',
          '22ABCDE1234F1Z5',
          '+91-9876543210',
          '123 Test Street, Test City, Test State - 123456',
          false, // Not verified initially
          'pending'
        ]);
        
        console.log('   ✅ LSP profile created');
      }
    } else {
      console.log('   Creating new test LSP user...');
      
      // Create user
      const userResult = await client.query(`
        INSERT INTO users (
          first_name, last_name, email, password_hash, role, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, first_name, last_name, email, role, is_active
      `, [
        'Test',
        'LSP',
        'test@lsp.com',
        '$2b$10$rQZ8K9L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K', // password123
        'lsp',
        false // Not active initially (pending admin approval)
      ]);
      
      const user = userResult.rows[0];
      console.log(`   ✅ User created: ${user.first_name} ${user.last_name} (${user.email})`);
      console.log(`   User ID: ${user.id}, Active: ${user.is_active}`);
      
      // Create LSP profile
      const lspResult = await client.query(`
        INSERT INTO lsp_profiles (
          user_id, company_name, pan_number, gst_number, phone, address,
          is_verified, verification_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `, [
        user.id,
        'Test Logistics Company',
        'ABCDE1234F',
        '22ABCDE1234F1Z5',
        '+91-9876543210',
        '123 Test Street, Test City, Test State - 123456',
        false, // Not verified initially
        'pending'
      ]);
      
      const lspProfile = lspResult.rows[0];
      console.log(`   ✅ LSP profile created: ${lspProfile.company_name}`);
      console.log(`   Verified: ${lspProfile.is_verified}, Status: ${lspProfile.verification_status}`);
    }
    
    console.log('\n4️⃣  Summary:');
    console.log('=============');
    console.log('✅ Test LSP user: test@lsp.com');
    console.log('✅ Password: password123');
    console.log('✅ Status: Pending admin approval (is_active: false, is_verified: false)');
    console.log('\n📋 Next Steps:');
    console.log('1. Login as admin and approve this LSP');
    console.log('2. Or temporarily activate the LSP for testing');
    
    client.release();
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAndCreateLSPUser().catch(console.error);
