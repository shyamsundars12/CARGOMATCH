#!/usr/bin/env node

/**
 * Debug JWT Token and Database Schema
 */

const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Test JWT token (you'll need to get a real one)
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsInJvbGUiOiJsc3AiLCJlbWFpbCI6InRlc3RAbHNwLmNvbSIsImlhdCI6MTczOTMzNzEzNn0.example';

async function debugJWTAndSchema() {
  console.log('🔍 Debugging JWT Token and Database Schema');
  console.log('==========================================\n');
  
  // Step 1: Check JWT token structure
  console.log('1️⃣  JWT Token Analysis:');
  try {
    const decoded = jwt.decode(testToken);
    console.log('   Token payload:', decoded);
    console.log(`   User ID type: ${typeof decoded.id}`);
    console.log(`   User ID value: ${decoded.id}`);
  } catch (error) {
    console.log('   ❌ Invalid token format');
  }
  
  // Step 2: Check database schema
  console.log('\n2️⃣  Database Schema Analysis:');
  
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
    
    // Check users table structure
    console.log('   Checking users table...');
    const usersSchema = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('   Users table columns:');
    usersSchema.rows.forEach(row => {
      console.log(`     ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check lsp_profiles table structure
    console.log('\n   Checking lsp_profiles table...');
    const lspSchema = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'lsp_profiles' 
      ORDER BY ordinal_position
    `);
    
    console.log('   LSP profiles table columns:');
    lspSchema.rows.forEach(row => {
      console.log(`     ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check sample data
    console.log('\n   Sample data:');
    const users = await client.query('SELECT id, first_name, last_name, role FROM users LIMIT 3');
    console.log('   Users:', users.rows);
    
    const lspProfiles = await client.query('SELECT user_id, company_name FROM lsp_profiles LIMIT 3');
    console.log('   LSP Profiles:', lspProfiles.rows);
    
    client.release();
    
  } catch (error) {
    console.log('   ❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
  
  console.log('\n3️⃣  Recommendations:');
  console.log('====================');
  console.log('• If users.id is INTEGER, JWT should contain integer IDs');
  console.log('• If users.id is UUID, JWT should contain UUID strings');
  console.log('• Middleware queries should match the data type');
  console.log('• Consider using consistent ID types across all tables');
}

debugJWTAndSchema().catch(console.error);
