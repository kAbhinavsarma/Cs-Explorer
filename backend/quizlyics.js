// quizlyics.js - Analytics endpoints for CS Explorer
const express = require('express');
const router = express.Router();
const db = require('./database');

// Example: Get total quizzes taken by all users
router.get('/analytics/total-quizzes', (req, res) => {
  db.get('SELECT COUNT(*) as total FROM quiz_attempts', [], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error', details: err.message });
    res.json({ total_quizzes: row.total });
  });
});

// Example: Get leaderboard (top users by quizzes taken)
router.get('/analytics/leaderboard', (req, res) => {
  db.all(`SELECT u.username, COUNT(q.id) as quizzes_taken
          FROM users u
          LEFT JOIN quiz_attempts q ON u.id = q.user_id
          GROUP BY u.id
          ORDER BY quizzes_taken DESC
          LIMIT 10`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error', details: err.message });
    res.json({ leaderboard: rows });
  });
});

// Add more analytics endpoints as needed

module.exports = router;
