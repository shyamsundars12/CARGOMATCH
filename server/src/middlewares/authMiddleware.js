const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const db = require('../config/db');

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(403).json({ error: 'Token missing' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

exports.verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  next();
};

exports.verifyLSP = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'lsp') {
      return res.status(403).json({ error: 'Access denied. LSP account required.' });
    }

    // Check if LSP profile exists and is verified
    const lspProfile = await db.query(
      'SELECT is_verified, verification_status FROM lsp_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (!lspProfile.rows.length) {
      return res.status(403).json({ error: 'LSP profile not found.' });
    }

    const profile = lspProfile.rows[0];
    if (!profile.is_verified) {
      return res.status(403).json({ 
        error: 'Account pending verification. Please contact admin for approval.',
        verification_status: profile.verification_status 
      });
    }

    // Check if user account is active
    const user = await db.query(
      'SELECT is_active FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!user.rows.length || !user.rows[0].is_active) {
      return res.status(403).json({ error: 'Account is inactive. Please contact admin.' });
    }

    next();
  } catch (error) {
    console.error('LSP verification middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.verifyTrader = async (req, res, next) => {
  try {
    if (!req.user || (req.user.role !== 'user' && req.user.role !== 'trader')) {
      return res.status(403).json({ error: 'Access denied. Trader account required.' });
    }

    // Check if trader is approved
    const user = await db.query(
      'SELECT approval_status, is_active FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!user.rows.length) {
      return res.status(403).json({ error: 'User not found.' });
    }

    const userData = user.rows[0];
    if (userData.approval_status !== 'approved') {
      return res.status(403).json({ 
        error: 'Account pending approval. Please contact admin for approval.',
        approval_status: userData.approval_status 
      });
    }

    if (!userData.is_active) {
      return res.status(403).json({ error: 'Account is inactive. Please contact admin.' });
    }

    next();
  } catch (error) {
    console.error('Trader verification middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.verifyLSPOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(403).json({ error: 'Authentication required.' });
    }

    // Allow admin access
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // For LSP users, check verification
    if (req.user.role === 'lsp') {
      const lspProfile = await db.query(
        'SELECT is_verified, verification_status FROM lsp_profiles WHERE user_id = $1',
        [req.user.id]
      );

      if (!lspProfile.rows.length) {
        return res.status(403).json({ error: 'LSP profile not found.' });
      }

      const profile = lspProfile.rows[0];
      if (!profile.is_verified) {
        return res.status(403).json({ 
          error: 'Account pending verification. Please contact admin for approval.',
          verification_status: profile.verification_status 
        });
      }

      const user = await db.query(
        'SELECT is_active FROM users WHERE id = $1',
        [req.user.id]
      );

      if (!user.rows.length || !user.rows[0].is_active) {
        return res.status(403).json({ error: 'Account is inactive. Please contact admin.' });
      }
    }

    next();
  } catch (error) {
    console.error('LSP/Admin verification middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};