const fs = require('fs');
const path = require('path');
const db = require('./db');

const initializeDatabase = async () => {
  try {
    console.log('🗄️ Initializing database...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await db.query(schema);
    
    console.log('✅ Database initialized successfully');
    
    // Test the connection
    const result = await db.query('SELECT NOW() as current_time');
    console.log('🕐 Database connection test:', result.rows[0].current_time);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Database setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase }; 