const express = require('express');
const router = express.Router();
const db = require('./database');

// Fetch questions (optionally by topic)
router.get('/questions', (req, res) => {
  const topic = req.query.topic;
  let sql = 'SELECT id, question_text, option_a, option_b, option_c, option_d, topic FROM questions';
  let params = [];
  if (topic) {
    sql += ' WHERE topic = ?';
    params.push(topic);
  }
  sql += ' ORDER BY RANDOM() LIMIT 10'; // fetch 10 random questions

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Fetch questions error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});
// Submit quiz answers
router.post('/submit-quiz', (req, res) => {
  const { userId, answers } = req.body; // answers: [{ questionId, selectedOption }]
  if (!userId || !answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  let score = 0;
  let completed = 0;

  // Fetch correct answers for all questionIds
  const questionIds = answers.map(a => a.questionId);
  const placeholders = questionIds.map(() => '?').join(',');
  db.all(
    `SELECT id, correct_option, topic FROM questions WHERE id IN (${placeholders})`,
    questionIds,
    (err, rows) => {
      if (err) {
        console.error('Submit quiz error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Check answers and calculate score
      const topicPerformance = {};
      answers.forEach(ans => {
        const q = rows.find(row => row.id === ans.questionId);
        if (q) {
          const isCorrect = ans.selectedOption === q.correct_option;
          if (isCorrect) score++;
          completed++;
          // Track performance per topic for adaptive learning
          if (!topicPerformance[q.topic]) topicPerformance[q.topic] = { correct: 0, total: 0 };
          topicPerformance[q.topic].total += 1;
          if (isCorrect) topicPerformance[q.topic].correct += 1;
        }
      });

      // Store attempt
      db.run(
        `INSERT INTO quiz_attempts (user_id, score) VALUES (?, ?)`,
        [userId, score],
        function (err) {
          if (err) {
            console.error('Store attempt error:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          const attemptId = this.lastID;
          // Store each answer
          answers.forEach(ans => {
            const q = rows.find(row => row.id === ans.questionId);
            const isCorrect = q && ans.selectedOption === q.correct_option ? 1 : 0;
            db.run(
              `INSERT INTO attempt_answers (attempt_id, question_id, selected_option, is_correct)
               VALUES (?, ?, ?, ?)`,
              [attemptId, ans.questionId, ans.selectedOption, isCorrect]
            );
          });
          res.json({
            message: 'Quiz submitted',
            score,
            total: completed,
            topicPerformance // For adaptive learning
          });
        }
      );
    }
  );
});
router.get('/user-weak-topics/:userId', (req, res) => {
  const userId = req.params.userId;
  db.all(
    `SELECT q.topic, 
            SUM(a.is_correct) as correct, 
            COUNT(*) as total 
     FROM attempt_answers a 
     JOIN quiz_attempts qa ON a.attempt_id = qa.id 
     JOIN questions q ON a.question_id = q.id 
     WHERE qa.user_id = ? 
     GROUP BY q.topic`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Fetch weak topics error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      // Find topics with lowest accuracy
      const weakTopics = rows.sort((a, b) => (a.correct / a.total) - (b.correct / b.total)).slice(0, 2);
      res.json({ topics: weakTopics });
    }
  );
});
// Get user quiz history
router.get('/user-history/:userId', (req, res) => {
  const userId = req.params.userId;
  db.all(
    'SELECT score, start_time FROM quiz_attempts WHERE user_id = ? ORDER BY start_time DESC LIMIT 10',
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Quiz history error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

module.exports = router;

module.exports = router;
