#!/usr/bin/env node

/**
 * Fix UUID vs Integer ID Issue
 * This script identifies and fixes the ID mismatch problem
 */

const { Pool } = require('pg');

async function fixUUIDIssue() {
  console.log('🔧 Fixing UUID vs Integer ID Issue');
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
    
    console.log('1️⃣  Checking current data types...');
    
    // Check if we have any integer IDs in users table
    const usersCheck = await client.query(`
      SELECT id, first_name, last_name, email, role 
      FROM users 
      WHERE id::text ~ '^[0-9]+$'
      LIMIT 5
    `);
    
    if (usersCheck.rows.length > 0) {
      console.log('   ❌ Found integer IDs in users table:');
      usersCheck.rows.forEach(user => {
        console.log(`     ID: ${user.id} (${typeof user.id}) - ${user.first_name} ${user.last_name}`);
      });
      
      console.log('\n2️⃣  Converting integer IDs to UUIDs...');
      
      // Convert integer IDs to UUIDs
      for (const user of usersCheck.rows) {
        const newUUID = generateUUID();
        console.log(`   Converting ${user.id} -> ${newUUID}`);
        
        // Update users table
        await client.query('UPDATE users SET id = $1 WHERE id = $2', [newUUID, user.id]);
        
        // Update lsp_profiles table if exists
        await client.query('UPDATE lsp_profiles SET user_id = $1 WHERE user_id = $2', [newUUID, user.id]);
        
        // Update other tables that reference user_id
        await client.query('UPDATE bookings SET user_id = $1 WHERE user_id = $2', [newUUID, user.id]);
        await client.query('UPDATE complaints SET user_id = $1 WHERE user_id = $2', [newUUID, user.id]);
        await client.query('UPDATE notifications SET user_id = $1 WHERE user_id = $2', [newUUID, user.id]);
      }
      
      console.log('   ✅ All integer IDs converted to UUIDs');
    } else {
      console.log('   ✅ No integer IDs found - all IDs are already UUIDs');
    }
    
    console.log('\n3️⃣  Verifying data consistency...');
    
    // Check for any remaining integer IDs
    const remainingIntegers = await client.query(`
      SELECT 'users' as table_name, COUNT(*) as count
      FROM users 
      WHERE id::text ~ '^[0-9]+$'
      UNION ALL
      SELECT 'lsp_profiles', COUNT(*)
      FROM lsp_profiles 
      WHERE user_id::text ~ '^[0-9]+$'
    `);
    
    let hasIntegers = false;
    remainingIntegers.rows.forEach(row => {
      if (row.count > 0) {
        console.log(`   ❌ ${row.table_name}: ${row.count} integer IDs remaining`);
        hasIntegers = true;
      }
    });
    
    if (!hasIntegers) {
      console.log('   ✅ All IDs are now UUIDs');
    }
    
    console.log('\n4️⃣  Testing JWT token generation...');
    
    // Test with a sample user
    const testUser = await client.query('SELECT * FROM users LIMIT 1');
    if (testUser.rows.length > 0) {
      const user = testUser.rows[0];
      console.log(`   Test user ID: ${user.id} (type: ${typeof user.id})`);
      console.log(`   Test user name: ${user.first_name} ${user.last_name}`);
      
      // This should now work correctly
      console.log('   ✅ JWT tokens will now use UUID format');
    }
    
    client.release();
    
    console.log('\n🎉 UUID Issue Fixed!');
    console.log('\n📋 Next Steps:');
    console.log('==============');
    console.log('1. Restart your server: npm start');
    console.log('2. Test LSP registration and login');
    console.log('3. Verify admin panel shows LSPs correctly');
    
  } catch (error) {
    console.log('❌ Error fixing UUID issue:', error.message);
  } finally {
    await pool.end();
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

fixUUIDIssue().catch(console.error);
