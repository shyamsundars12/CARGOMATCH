// Neon Database Configuration
// Copy this file to neon-config.js and update with your actual Neon credentials

module.exports = {
  // Neon connection details (get these from your Neon dashboard)
  neon: {
    host: 'your-neon-host.neon.tech',
    port: 5432,
    database: 'neondb',
    user: 'your-username',
    password: 'your-password',
    ssl: { rejectUnauthorized: false }
  },
  
  // Your current local database (for migration)
  local: {
    host: 'localhost',
    port: 5432,
    database: 'cargomatch',
    user: 'postgres',
    password: 'password'
  }
};
