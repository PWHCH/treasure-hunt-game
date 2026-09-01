const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

const insertScoreStmt = db.prepare(
  'INSERT INTO scores (user_id, score) VALUES (?, ?)'
);
const getScoreStmt = db.prepare('SELECT id, score, played_at FROM scores WHERE id = ?');
const listScoresStmt = db.prepare(
  'SELECT id, score, played_at FROM scores WHERE user_id = ? ORDER BY played_at DESC LIMIT 20'
);
const bestScoreStmt = db.prepare('SELECT MAX(score) AS best FROM scores WHERE user_id = ?');

router.post('/', requireAuth, (req, res) => {
  const { score } = req.body ?? {};
  if (typeof score !== 'number' || !Number.isFinite(score) || !Number.isInteger(score)) {
    return res.status(400).json({ error: 'score must be an integer' });
  }

  const result = insertScoreStmt.run(req.user.id, score);
  const saved = getScoreStmt.get(Number(result.lastInsertRowid));
  res.status(201).json({ ok: true, score: saved });
});

router.get('/me', requireAuth, (req, res) => {
  const scores = listScoresStmt.all(req.user.id);
  const bestRow = bestScoreStmt.get(req.user.id);
  res.status(200).json({ scores, best: bestRow?.best ?? null });
});

module.exports = router;
