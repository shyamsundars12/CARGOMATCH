#!/usr/bin/env node

const db = require('./src/config/db');

async function checkUsers() {
  try {
    const result = await db.query('SELECT id, email, role FROM users ORDER BY id');
    console.log('Users:');
    result.rows.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkUsers().catch(console.error);
