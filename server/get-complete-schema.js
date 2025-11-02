const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function getCompleteSchema() {
  try {
    console.log('🔍 Extracting Complete Database Schema from Neon DB...\n');
    
    // Get all tables
    const tablesQuery = `
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    
    console.log('📋 COMPLETE DATABASE SCHEMA');
    console.log('='.repeat(80));
    console.log(`\n📊 Total Tables: ${tablesResult.rows.length}\n`);
    
    for (const table of tablesResult.rows) {
      console.log('\n' + '='.repeat(80));
      console.log(`📊 TABLE: ${table.table_name} (${table.table_type})`);
      console.log('='.repeat(80));
      
      // Get table columns with all details
      const columnsQuery = `
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          is_nullable,
          column_default,
          ordinal_position
        FROM information_schema.columns 
        WHERE table_name = $1 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      
      const columnsResult = await pool.query(columnsQuery, [table.table_name]);
      
      console.log('\n📋 COLUMNS:');
      console.log('-'.repeat(80));
      for (const column of columnsResult.rows) {
        const nullable = column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const maxLength = column.character_maximum_length ? `(${column.character_maximum_length})` : '';
        const precision = column.numeric_precision ? `(${column.numeric_precision}${column.numeric_scale ? ',' + column.numeric_scale : ''})` : '';
        const defaultValue = column.column_default ? ` DEFAULT ${column.column_default}` : '';
        
        console.log(`   ${column.ordinal_position}. ${column.column_name.padEnd(35)} ${column.data_type.toUpperCase()}${maxLength}${precision} ${nullable}${defaultValue}`);
      }
      
      // Get primary keys
      const pkQuery = `
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_name = $1
        AND tc.table_schema = 'public'
        ORDER BY kcu.ordinal_position;
      `;
      
      const pkResult = await pool.query(pkQuery, [table.table_name]);
      
      if (pkResult.rows.length > 0) {
        console.log('\n🔑 PRIMARY KEY:');
        console.log('-'.repeat(80));
        const pkColumns = pkResult.rows.map(r => r.column_name).join(', ');
        console.log(`   ${pkColumns}`);
      }
      
      // Get foreign keys
      const fkQuery = `
        SELECT 
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule,
          rc.update_rule
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
          AND rc.constraint_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = $1
        AND tc.table_schema = 'public';
      `;
      
      const fkResult = await pool.query(fkQuery, [table.table_name]);
      
      if (fkResult.rows.length > 0) {
        console.log('\n🔗 FOREIGN KEYS:');
        console.log('-'.repeat(80));
        for (const fk of fkResult.rows) {
          console.log(`   ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
          console.log(`     ON DELETE: ${fk.delete_rule} | ON UPDATE: ${fk.update_rule}`);
        }
      }
      
      // Get unique constraints
      const uniqueQuery = `
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_name = $1
        AND tc.table_schema = 'public'
        AND tc.constraint_name NOT IN (
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE constraint_type = 'PRIMARY KEY' 
          AND table_name = $1
        );
      `;
      
      const uniqueResult = await pool.query(uniqueQuery, [table.table_name]);
      
      if (uniqueResult.rows.length > 0) {
        console.log('\n✨ UNIQUE CONSTRAINTS:');
        console.log('-'.repeat(80));
        for (const unique of uniqueResult.rows) {
          console.log(`   ${unique.column_name}`);
        }
      }
      
      // Get check constraints
      const checkQuery = `
        SELECT constraint_name, check_clause
        FROM information_schema.check_constraints
        WHERE constraint_name IN (
          SELECT constraint_name
          FROM information_schema.table_constraints
          WHERE table_name = $1
          AND table_schema = 'public'
          AND constraint_type = 'CHECK'
        );
      `;
      
      const checkResult = await pool.query(checkQuery, [table.table_name]);
      
      if (checkResult.rows.length > 0) {
        console.log('\n✅ CHECK CONSTRAINTS:');
        console.log('-'.repeat(80));
        for (const check of checkResult.rows) {
          console.log(`   ${check.constraint_name}: ${check.check_clause}`);
        }
      }
      
      // Get indexes
      const indexQuery = `
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = $1 
        AND schemaname = 'public';
      `;
      
      const indexResult = await pool.query(indexQuery, [table.table_name]);
      
      if (indexResult.rows.length > 0) {
        console.log('\n📇 INDEXES:');
        console.log('-'.repeat(80));
        for (const index of indexResult.rows) {
          // Skip primary key indexes (already shown)
          if (!index.indexname.includes('_pkey')) {
            console.log(`   ${index.indexname}`);
            if (index.indexdef.length > 100) {
              console.log(`     ${index.indexdef.substring(0, 100)}...`);
            } else {
              console.log(`     ${index.indexdef}`);
            }
          }
        }
      }
      
      // Get row count
      try {
        const countQuery = `SELECT COUNT(*) as count FROM ${table.table_name};`;
        const countResult = await pool.query(countQuery);
        console.log(`\n📊 RECORD COUNT: ${countResult.rows[0].count}`);
      } catch (error) {
        // Ignore count errors for views or special tables
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 Schema Extraction Complete!');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error extracting schema:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

getCompleteSchema();
