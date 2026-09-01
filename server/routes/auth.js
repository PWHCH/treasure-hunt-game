const express = require('express');
const { db } = require('../db');
const { hashPassword, verifyPassword, generateToken, requireAuth } = require('../auth');

const router = express.Router();

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

function validateCredentials(username, password) {
  if (typeof username !== 'string' || !USERNAME_PATTERN.test(username)) {
    return 'Username must be 3-20 characters (letters, numbers, underscore only)';
  }
  if (typeof password !== 'string' || password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
}

const insertUserStmt = db.prepare(
  'INSERT INTO users (username, password_hash, password_salt) VALUES (?, ?, ?)'
);
const getUserByUsernameStmt = db.prepare('SELECT * FROM users WHERE username = ?');
const insertSessionStmt = db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)');
const deleteSessionStmt = db.prepare('DELETE FROM sessions WHERE token = ?');

router.post('/signup', (req, res) => {
  const { username, password } = req.body ?? {};
  const validationError = validateCredentials(username, password);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { hash, salt } = hashPassword(password);
  let userId;
  try {
    const result = insertUserStmt.run(username, hash, salt);
    userId = Number(result.lastInsertRowid);
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    throw err;
  }

  const token = generateToken();
  insertSessionStmt.run(token, userId);
  res.status(201).json({ user: { id: userId, username }, token });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = getUserByUsernameStmt.get(username);
  if (!user || !verifyPassword(password, user.password_hash, user.password_salt)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = generateToken();
  insertSessionStmt.run(token, user.id);
  res.status(200).json({ user: { id: user.id, username: user.username }, token });
});

router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    deleteSessionStmt.run(token);
  }
  res.status(200).json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports = router;
