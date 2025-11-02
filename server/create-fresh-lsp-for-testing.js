#!/usr/bin/env node

/**
 * Create Fresh LSP for Testing Approval Process
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function createFreshLSP() {
  console.log('🆕 Creating Fresh LSP for Testing');
  console.log('==================================\n');
  
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
    
    // Create a fresh LSP user
    const email = 'freshlsp@test.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('1️⃣  Creating LSP user...');
    
    // Check if user already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.log('   ⚠️  User already exists, deleting...');
      await client.query('DELETE FROM users WHERE email = $1', [email]);
    }
    
    // Create new user
    const userResult = await client.query(`
      INSERT INTO users (first_name, last_name, email, password_hash, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, first_name, last_name, email, role, is_active
    `, ['Fresh', 'LSP', email, hashedPassword, 'lsp', false]);
    
    const user = userResult.rows[0];
    console.log(`   ✅ User created: ${user.first_name} ${user.last_name} (${user.email})`);
    console.log(`   User ID: ${user.id}, is_active: ${user.is_active}`);
    
    console.log('\n2️⃣  Creating LSP profile...');
    
    // Create LSP profile
    const lspResult = await client.query(`
      INSERT INTO lsp_profiles (
        user_id, company_name, pan_number, gst_number, phone, address,
        is_verified, verification_status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `, [
      user.id,
      'Fresh Logistics Company',
      'FRESH1234G',
      'GST123456789',
      '9876543210',
      'Fresh Address, City',
      false,
      'pending'
    ]);
    
    const lspProfile = lspResult.rows[0];
    console.log(`   ✅ LSP profile created: ${lspProfile.company_name}`);
    console.log(`   Profile ID: ${lspProfile.id}, verification_status: ${lspProfile.verification_status}`);
    
    console.log('\n3️⃣  Verification...');
    
    // Verify the created LSP
    const verifyResult = await client.query(`
      SELECT u.id, u.first_name || ' ' || u.last_name as name, u.email, 'lsp' as role, 
             u.is_active, u.is_active as is_approved, u.created_at,
             lp.company_name, lp.is_verified, lp.verification_status
      FROM users u
      JOIN lsp_profiles lp ON u.id = lp.user_id
      WHERE u.id = $1
    `, [user.id]);
    
    const lspData = verifyResult.rows[0];
    console.log('   ✅ LSP data verification:');
    console.log(`     - Name: ${lspData.name}`);
    console.log(`     - Email: ${lspData.email}`);
    console.log(`     - Company: ${lspData.company_name}`);
    console.log(`     - is_active: ${lspData.is_active}`);
    console.log(`     - is_verified: ${lspData.is_verified}`);
    console.log(`     - verification_status: ${lspData.verification_status}`);
    
    console.log('\n🎉 Fresh LSP Created Successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('====================');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Status: PENDING (ready for admin approval)`);
    
    client.release();
    
  } catch (error) {
    console.log('❌ Error creating fresh LSP:', error.message);
  } finally {
    await pool.end();
  }
}

createFreshLSP().catch(console.error);
