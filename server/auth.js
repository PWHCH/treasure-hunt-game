const crypto = require('crypto');
const { db } = require('./db');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const candidate = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, 'hex');
  if (candidate.length !== stored.length) return false;
  return crypto.timingSafeEqual(candidate, stored);
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

const getSessionUserStmt = db.prepare(`
  SELECT users.id AS id, users.username AS username
  FROM sessions
  JOIN users ON users.id = sessions.user_id
  WHERE sessions.token = ?
`);

function getUserForToken(token) {
  if (!token) return null;
  return getSessionUserStmt.get(token) ?? null;
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const user = getUserForToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  req.user = user;
  req.token = token;
  next();
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  getUserForToken,
  requireAuth,
};
