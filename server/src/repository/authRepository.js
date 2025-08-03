const db = require('../config/db');

exports.createUser = ({ name, email, password }) =>
  db.query(
    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
    [name, email, password]
  ).then(res => res.rows[0]);

exports.getUserByEmail = (email) =>
  db.query('SELECT * FROM users WHERE email = $1', [email])
    .then(res => res.rows[0]);
