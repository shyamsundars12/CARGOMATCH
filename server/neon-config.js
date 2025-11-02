// Neon Database Configuration
// Updated with your actual Neon credentials

module.exports = {
  // Neon connection details (from your Neon dashboard)
  neon: {
    host: 'ep-green-rice-adtvyi8t-pooler.c-2.us-east-1.aws.neon.tech',
    port: 5432,
    database: 'logisticsdb',
    user: 'neondb_owner',
    password: 'npg_iWdBt3xb2PRq', // Replace with the password you get from Neon
    ssl: { rejectUnauthorized: false }
  },
  
  // Your current local database (for migration)
  local: {
    host: 'localhost',
    port: 5432,
    database: 'logisticsdb',
    user: 'postgres',
    password: 'admin123' // Updated to match your .env
  }
};