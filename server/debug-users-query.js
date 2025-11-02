#!/usr/bin/env node

/**
 * Debug Users Query - Check why only 3 users are showing
 */

const db = require('./src/config/db');

async function debugUsersQuery() {
  console.log('🔍 Debugging Users Query Issue');
  console.log('================================\n');
  
  try {
    // 1. Check total users in database
    const totalResult = await db.query('SELECT COUNT(*) as total_users FROM users');
    console.log(`📊 Total users in database: ${totalResult.rows[0].total_users}`);
    
    // 2. Check all users with their roles
    const allUsersResult = await db.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.is_active,
             CASE WHEN lp.id IS NOT NULL THEN 'LSP' ELSE 'Regular User' END as user_type
      FROM users u
      LEFT JOIN lsp_profiles lp ON u.id = lp.user_id
      ORDER BY u.created_at DESC
    `);
    
    console.log(`\n👥 All users in database (${allUsersResult.rows.length}):`);
    allUsersResult.rows.forEach((user, i) => {
      console.log(`${i+1}. ${user.first_name} ${user.last_name} (${user.email}) - Role: ${user.role} - Type: ${user.user_type} - Active: ${user.is_active}`);
    });
    
    // 3. Check current admin query (what's being used)
    const adminQueryResult = await db.query(`
      SELECT u.id, u.first_name || ' ' || u.last_name as name, u.email, 
             'trader' as role,
             u.is_active as is_approved, u.created_at,
             u.company_name
      FROM users u
      LEFT JOIN lsp_profiles lp ON u.id = lp.user_id
      WHERE lp.id IS NULL AND u.role != 'ADMIN'
      ORDER BY u.created_at DESC
    `);
    
    console.log(`\n🔍 Current admin query returns (${adminQueryResult.rows.length}):`);
    adminQueryResult.rows.forEach((user, i) => {
      console.log(`${i+1}. ${user.name} (${user.email}) - Role: ${user.role} - Approved: ${user.is_approved}`);
    });
    
    // 4. Check LSP profiles
    const lspResult = await db.query('SELECT COUNT(*) as lsp_count FROM lsp_profiles');
    console.log(`\n🚛 LSP profiles count: ${lspResult.rows[0].lsp_count}`);
    
    // 5. Check users with LSP profiles
    const usersWithLSP = await db.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.role
      FROM users u
      INNER JOIN lsp_profiles lp ON u.id = lp.user_id
    `);
    
    console.log(`\n🚛 Users with LSP profiles (${usersWithLSP.rows.length}):`);
    usersWithLSP.rows.forEach((user, i) => {
      console.log(`${i+1}. ${user.first_name} ${user.last_name} (${user.email}) - Role: ${user.role}`);
    });
    
    // 6. Check admin users
    const adminUsers = await db.query("SELECT COUNT(*) as admin_count FROM users WHERE role = 'ADMIN'");
    console.log(`\n👑 Admin users count: ${adminUsers.rows[0].admin_count}`);
    
    console.log('\n✅ Debug complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
}

debugUsersQuery().catch(console.error);
