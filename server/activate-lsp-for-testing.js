#!/usr/bin/env node

/**
 * Activate LSP User for Testing
 */

const { Pool } = require('pg');

async function activateLSPForTesting() {
  console.log('🔓 Activating LSP User for Testing');
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
    
    console.log('1️⃣  Finding test LSP user...');
    const userResult = await client.query('SELECT * FROM users WHERE email = $1', ['test@lsp.com']);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Test LSP user not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`   Found user: ${user.first_name} ${user.last_name} (${user.email})`);
    console.log(`   Current status: Active=${user.is_active}, Role=${user.role}`);
    
    console.log('\n2️⃣  Activating user...');
    await client.query('UPDATE users SET is_active = true WHERE id = $1', [user.id]);
    console.log('   ✅ User activated');
    
    console.log('\n3️⃣  Finding LSP profile...');
    const lspResult = await client.query('SELECT * FROM lsp_profiles WHERE user_id = $1', [user.id]);
    
    if (lspResult.rows.length === 0) {
      console.log('❌ LSP profile not found');
      return;
    }
    
    const lspProfile = lspResult.rows[0];
    console.log(`   Found LSP profile: ${lspProfile.company_name}`);
    console.log(`   Current status: Verified=${lspProfile.is_verified}, Status=${lspProfile.verification_status}`);
    
    console.log('\n4️⃣  Verifying LSP profile...');
    await client.query(`
      UPDATE lsp_profiles 
      SET is_verified = true, verification_status = 'approved', updated_at = NOW()
      WHERE user_id = $1
    `, [user.id]);
    console.log('   ✅ LSP profile verified');
    
    console.log('\n5️⃣  Verifying final status...');
    const finalUser = await client.query('SELECT * FROM users WHERE id = $1', [user.id]);
    const finalLSP = await client.query('SELECT * FROM lsp_profiles WHERE user_id = $1', [user.id]);
    
    console.log('   Final User Status:');
    console.log(`     Active: ${finalUser.rows[0].is_active}`);
    console.log(`     Role: ${finalUser.rows[0].role}`);
    
    console.log('   Final LSP Status:');
    console.log(`     Verified: ${finalLSP.rows[0].is_verified}`);
    console.log(`     Status: ${finalLSP.rows[0].verification_status}`);
    
    console.log('\n🎉 LSP User Activated Successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('===================');
    console.log('Email: test@lsp.com');
    console.log('Password: password123');
    console.log('Status: Active & Verified ✅');
    
    console.log('\n💡 Next Steps:');
    console.log('1. Test LSP login in your frontend');
    console.log('2. Verify dashboard loads without 403 errors');
    console.log('3. Test LSP functionality');
    
    client.release();
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

activateLSPForTesting().catch(console.error);
