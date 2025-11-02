#!/usr/bin/env node

/**
 * Check Users and Create LSP User
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function checkAndCreateLSP() {
  console.log('👤 Checking Users and Creating LSP');
  console.log('==================================\n');
  
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
    
    // Check all users
    console.log('1️⃣  Checking all users...');
    const allUsers = await client.query('SELECT id, email, first_name, last_name, role, is_active FROM users ORDER BY created_at');
    
    console.log(`Found ${allUsers.rows.length} users:`);
    allUsers.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.first_name} ${user.last_name} (${user.email}) - Role: ${user.role} - Active: ${user.is_active}`);
    });
    
    // Check LSP profiles
    console.log('\n2️⃣  Checking LSP profiles...');
    const lspProfiles = await client.query(`
      SELECT lp.id, lp.company_name, u.email, u.first_name, u.last_name, u.role
      FROM lsp_profiles lp
      JOIN users u ON lp.user_id = u.id
    `);
    
    console.log(`Found ${lspProfiles.rows.length} LSP profiles:`);
    lspProfiles.rows.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.first_name} ${profile.last_name} (${profile.email}) - Company: ${profile.company_name} - Role: ${profile.role}`);
    });
    
    // Create a new LSP user if none exists
    if (lspProfiles.rows.length === 0) {
      console.log('\n3️⃣  Creating new LSP user...');
      
      // Hash password
      const password = 'lsp123456';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const userResult = await client.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, phone_number, company_name, gst_number, pan_number, address, city, state, pincode, country, verification_status, is_active, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
        RETURNING id
      `, [
        'lsp@logistics.com',
        hashedPassword,
        'John',
        'Logistics',
        '9876543210',
        'Logistics Solutions Ltd',
        '22ABCDE1234F1Z5',
        'ABCDE1234F',
        '123 Business Street, Mumbai',
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
        'Logistics Solutions Ltd',
        'ABCDE1234F',
        '22ABCDE1234F1Z5',
        'REG123456789',
        '9876543210',
        '123 Business Street, Mumbai',
        'LIC123456789',
        'INS123456789',
        true,
        'verified'
      ]);
      
      console.log('✅ LSP user created successfully!');
      console.log('\n🔐 LSP Login Credentials:');
      console.log('========================');
      console.log(`Email: lsp@logistics.com`);
      console.log(`Password: ${password}`);
      console.log(`Name: John Logistics`);
      console.log(`Company: Logistics Solutions Ltd`);
      console.log(`Phone: 9876543210`);
      console.log(`Status: Active & Verified`);
      
    } else {
      console.log('\n3️⃣  LSP users already exist');
      console.log('\n🔐 Available LSP Credentials:');
      console.log('=============================');
      
      for (const profile of lspProfiles.rows) {
        console.log(`Name: ${profile.first_name} ${profile.last_name}`);
        console.log(`Email: ${profile.email}`);
        console.log(`Company: ${profile.company_name}`);
        console.log(`Password: [Encrypted - contact admin for reset]`);
        console.log('');
      }
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    await pool.end();
  }
}

checkAndCreateLSP().catch(console.error);
