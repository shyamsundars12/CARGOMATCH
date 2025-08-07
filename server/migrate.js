const db = require('./src/config/db');
require('dotenv').config();

async function runMigration() {
  try {
    console.log('Running migration to add PDF file path columns...');
    
    // Add new columns for PDF file paths
    const alterQuery = `
      ALTER TABLE lsp_profiles 
      ADD COLUMN IF NOT EXISTS gst_certificate_path TEXT,
      ADD COLUMN IF NOT EXISTS company_registration_doc_path TEXT,
      ADD COLUMN IF NOT EXISTS business_license_doc_path TEXT,
      ADD COLUMN IF NOT EXISTS insurance_certificate_doc_path TEXT;
    `;
    
    await db.query(alterQuery);
    console.log('✅ Migration completed successfully!');
    console.log('Added columns:');
    console.log('- gst_certificate_path');
    console.log('- company_registration_doc_path');
    console.log('- business_license_doc_path');
    console.log('- insurance_certificate_doc_path');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await db.end();
  }
}

runMigration();
