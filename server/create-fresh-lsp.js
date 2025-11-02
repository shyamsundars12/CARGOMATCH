#!/usr/bin/env node

/**
 * Create Fresh LSP User with Known Password
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function createFreshLSP() {
  console.log('👤 Creating Fresh LSP User');
  console.log('==========================\n');
  
  const pool = new Pool({
    host: 'ep-green-rice-adtvyi8t-pooler.c-2.us-east-1.aws.neon.tech',
    port: 5432,
    database: 'logisticsdb',
    user: 'neondb_owner',
    password: 'npg_iWdBt3xb2PRq',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000
  });

  try {
    const client = await pool.connect();
    
    // Create a fresh LSP user
    console.log('1️⃣  Creating fresh LSP user...');
    
    const email = 'lsp@cargomatch.com';
    const password = 'LSP123456';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.log('⚠️  LSP user already exists, updating password...');
      
      // Update password
      await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);
      
      console.log('✅ Password updated successfully!');
    } else {
      // Create new user
      const userResult = await client.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, phone_number, company_name, gst_number, pan_number, address, city, state, pincode, country, verification_status, is_active, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
        RETURNING id
      `, [
        email,
        hashedPassword,
        'Logistics',
        'Provider',
        '9876543210',
        'CargoMatch Logistics',
        '22ABCDE1234F1Z5',
        'ABCDE1234F',
        '456 Logistics Park, Mumbai',
        'Mumbai',
        'Maharashtra',
        '400001',
        'India',
        'verified',
        true,
        'lsp'
      ]);
      
      const userId = userResult.rows[0].id;
      
      // Create LSP profile
      await client.query(`
        INSERT INTO lsp_profiles (user_id, company_name, pan_number, gst_number, company_registration, phone, address, business_license, insurance_certificate, is_verified, verification_status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      `, [
        userId,
        'CargoMatch Logistics',
        'ABCDE1234F',
        '22ABCDE1234F1Z5',
        'REG987654321',
        '9876543210',
        '456 Logistics Park, Mumbai',
        'LIC987654321',
        'INS987654321',
        true,
        'verified'
      ]);
      
      console.log('✅ Fresh LSP user created successfully!');
    }
    
    console.log('\n🔐 LSP Login Credentials:');
    console.log('========================');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Name: Logistics Provider`);
    console.log(`🏢 Company: CargoMatch Logistics`);
    console.log(`📞 Phone: 9876543210`);
    console.log(`📍 Address: 456 Logistics Park, Mumbai`);
    console.log(`✅ Status: Active & Verified`);
    
    console.log('\n🌐 How to Login:');
    console.log('================');
    console.log('1. Go to: http://localhost:5173');
    console.log('2. Click "Login as LSP" or go to LSP login page');
    console.log(`3. Enter Email: ${email}`);
    console.log(`4. Enter Password: ${password}`);
    console.log('5. Click Login');
    
    console.log('\n📋 Available LSP Credentials Summary:');
    console.log('=====================================');
    console.log('1. testlsp@example.com (existing user - password unknown)');
    console.log(`2. ${email} (fresh user - password: ${password})`);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    await pool.end();
  }
}

createFreshLSP().catch(console.error);
