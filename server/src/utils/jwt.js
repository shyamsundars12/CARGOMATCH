const jwt = require('jsonwebtoken');
const config = require('config');

const generateToken = (uid, role) => {
    return jwt.sign({ uid, role }, process.env.JWT_SECRET || config.get('jwtSecret'), { expiresIn: '7d' });
};
module.exports = {
    generateToken,
};