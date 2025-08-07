const db = require('../config/db');

exports.createUser = async ({ name, email, password, role = 'user' }) => {
  try {
    // Try to insert with role column
    const result = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, password, role]
    );
    return result.rows[0];
  } catch (error) {
    // If role column does not exist, insert without it
    if (error.message.includes('column "role" of relation "users" does not exist')) {
      const result = await db.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
        [name, email, password]
      );
      return { ...result.rows[0], role: 'user' };
    }
    throw error;
  }
};

exports.getUserByEmail = (email) =>
  db.query('SELECT * FROM users WHERE email = $1', [email])
    .then(res => res.rows[0]);
