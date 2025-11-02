#!/usr/bin/env node

/**
 * Neon Database Status Checker
 * Helps diagnose connection issues
 */

console.log('🔍 Neon Database Connection Diagnostics');
console.log('========================================\n');

console.log('📋 Step-by-Step Troubleshooting:');
console.log('===============================\n');

console.log('1️⃣  Check Neon Dashboard:');
console.log('   • Go to: https://console.neon.tech');
console.log('   • Select your project');
console.log('   • Look for "Paused" or "Suspended" status');
console.log('   • If paused, click "Resume" or "Start"\n');

console.log('2️⃣  Verify Connection Details:');
console.log('   • In Neon dashboard, go to "Connection Details"');
console.log('   • Copy the connection string or individual values');
console.log('   • Current credentials being used:');
console.log('     Host: ep-green-rice-adtvyi8t-pooler.c-2.us-east-1.aws.neon.tech');
console.log('     Database: logisticsdb');
console.log('     User: neondb_owner\n');

console.log('3️⃣  Test Network Connectivity:');
console.log('   • Check if you can access other websites');
console.log('   • Try from a different network (mobile hotspot)');
console.log('   • Check if your firewall blocks port 5432\n');

console.log('4️⃣  Alternative Solutions:');
console.log('   • Use local PostgreSQL temporarily');
console.log('   • Create a new Neon project');
console.log('   • Contact Neon support\n');

console.log('💡 Quick Fix Options:');
console.log('====================');
console.log('A) Switch to local database: node switch-to-local.js');
console.log('B) Create new Neon project and migrate');
console.log('C) Check Neon status page: https://status.neon.tech\n');

console.log('🎯 Recommended Action:');
console.log('====================');
console.log('1. First, check your Neon dashboard');
console.log('2. If project is paused, resume it');
console.log('3. If still failing, switch to local database temporarily');
console.log('4. Once local works, we can troubleshoot Neon again');
