const db = require('../config/db');

exports.createUser = async ({ name, email, password, role = 'user' }) => {
  try {
    // Split name into first_name and last_name
    const nameParts = name.trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';
    
    // Set initial status based on role
    let isActive, approvalStatus;
    if (role === 'lsp') {
      isActive = false; // LSPs need verification
      approvalStatus = 'pending'; // LSPs also need approval
    } else if (role === 'ADMIN') {
      isActive = true; // Admins are auto-approved
      approvalStatus = 'approved';
    } else {
      isActive = false; // Traders need approval
      approvalStatus = 'pending';
    }
    
    // Insert user with all required fields
    const result = await db.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, is_active, approval_status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
       RETURNING id, first_name, last_name, email, role, is_active, approval_status`,
      [first_name, last_name, email, password, role, isActive, approvalStatus]
    );
    
    // Return with combined name for compatibility
    const user = result.rows[0];
    return {
      ...user,
      name: `${user.first_name} ${user.last_name}`.trim()
    };
  } catch (error) {
    console.error('Error creating user:', error.message);
    throw error;
  }
};

exports.getUserByEmail = (email) =>
  db.query('SELECT * FROM users WHERE email = $1', [email])
    .then(res => res.rows[0]);
