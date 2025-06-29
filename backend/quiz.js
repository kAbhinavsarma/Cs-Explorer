const express = require('express');
const router = express.Router();
const db = require('./database');
const { userWeakTopics } = require('./sharedData'); // Use shared import
router.post('/submit-quiz', (req, res) => {
  const { userId, answers } = req.body;
  if (!userId || !answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  let score = 0;
  let totalAnswered = 0;
  const questionIds = answers.map(a => a.questionId);
  const placeholders = questionIds.map(() => '?').join(',');

  db.all(
    `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option, topic, explanation FROM questions WHERE id IN (${placeholders})`,
    questionIds,
    (err, questions) => {
      if (err) {
        console.error('Submit quiz error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const topicPerformance = {};
      const questionReview = [];
      answers.forEach((ans, index) => {
        const q = questions.find(q => q.id === ans.questionId);
        if (q) {
          totalAnswered++;
          const isCorrect = ans.selectedOption === q.correct_option;
          if (isCorrect) score++;

          // Track topic performance
          if (!topicPerformance[q.topic]) {
            topicPerformance[q.topic] = { correct: 0, total: 0 };
          }
          topicPerformance[q.topic].total++;
          if (isCorrect) topicPerformance[q.topic].correct++;

          // Build question review
          questionReview.push({
            number: index + 1,
            question: q.question_text,
            yourAnswer: ans.selectedOption || 'No answer',
            isCorrect,
            correctAnswer: q.correct_option,
            explanation: q.explanation || 'No explanation available'
          });
        }
      });

      // Calculate time taken
      const timeTaken = 600; // 10 minutes in seconds
      const percentage = Math.round((score / totalAnswered) * 100);

      // Determine achievements
      const achievements = [];
      if (percentage >= 100) achievements.push('Perfect Score');
      if (timeTaken < 300) achievements.push('Speed Demon');
      if (Object.keys(topicPerformance).length >= 3) achievements.push('Multi-Topic Master');
      if (score >= totalAnswered * 0.9) achievements.push('Top Performer');

      // Update weak topics tracking
      userWeakTopics[userId] = Object.entries(topicPerformance)
        .filter(([_, stats]) => (stats.correct / stats.total) < 0.7)
        .map(([topic]) => topic);

      // Store attempt
      db.run(
        `INSERT INTO quiz_attempts (user_id, score, total_questions, start_time, end_time, time_taken) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`,
        [userId, score, totalAnswered, timeTaken],
        function (err) {
          if (err) {
            console.error('Store attempt error:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          const attemptId = this.lastID;
          
          // Store answers
          answers.forEach(ans => {
            const q = questions.find(q => q.id === ans.questionId);
            const isCorrect = q && ans.selectedOption === q.correct_option ? 1 : 0;
            db.run(
              `INSERT INTO attempt_answers (attempt_id, question_id, selected_option, is_correct) VALUES (?, ?, ?, ?)`,
              [attemptId, ans.questionId, ans.selectedOption, isCorrect]
            );
          });

          // Insert earned badges
          achievements.forEach(badge => {
            db.run(
              `INSERT INTO badges (user_id, badge_name) VALUES (?, ?)`,
              [userId, badge]
            );
          });

          // Prepare results
          res.json({
            score,
            total: totalAnswered,
            topicPerformance,
            timeAnalysis: {
              'Total Time': toHHMMSS(timeTaken),
              'Average Time Per Question': toHHMMSS(Math.round(timeTaken / totalAnswered))
            },
            achievements,
            questionReview,
            learningPath: Object.keys(topicPerformance)
              .sort((a, b) => (topicPerformance[a].correct / topicPerformance[a].total) - (topicPerformance[b].correct / topicPerformance[b].total))
              .slice(0, 4)
              .map(topic => ({
                topic,
                completed: (topicPerformance[topic].correct / topicPerformance[topic].total) >= 0.7
              }))
          });
        }
      );
    }
  );
});

// Adaptive questioning endpoint
router.post('/adaptive-questions', (req, res) => {
  const { userId } = req.body;
  
  // Get weak topics for this user
  const weakTopics = userWeakTopics[userId] || [];
  
  // How many questions from weak topics (60%)
  const weakTopicCount = Math.min(6, weakTopics.length);
  const otherTopicCount = 10 - weakTopicCount;
  
  let queries = [];
  
  // Query for weak topics
  if (weakTopicCount > 0) {
    const weakPlaceholders = weakTopics.map(() => '?').join(',');
    queries.push(
      new Promise((resolve, reject) => {
        db.all(
          `SELECT * FROM questions 
           WHERE topic IN (${weakPlaceholders}) 
           ORDER BY RANDOM() 
           LIMIT ?`,
          [...weakTopics, weakTopicCount],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      })
    );
  }
  
  // Query for other topics
  if (otherTopicCount > 0) {
    queries.push(
      new Promise((resolve, reject) => {
        db.all(
          `SELECT * FROM questions 
           ${weakTopics.length > 0 ? `WHERE topic NOT IN (${weakTopics.map(() => '?').join(',')})` : ''}
           ORDER BY RANDOM() 
           LIMIT ?`,
          [...weakTopics, otherTopicCount],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      })
    );
  }
  
  // Combine results
  Promise.all(queries)
    .then(results => {
      const questions = results.flat();
      // Shuffle the combined questions
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
      res.json(questions.slice(0, 10));
    })
    .catch(err => {
      console.error('Adaptive questions error:', err);
      res.status(500).json({ error: 'Database error' });
    });
});

function toHHMMSS(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => v < 10 ? '0' + v : v).filter((v, i) => v !== '00' || i > 0).join(':');
}

// Get questions
router.get('/questions', (req, res) => {
  const topic = req.query.topic;
  let sql = 'SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option, topic, explanation FROM questions';
  let params = [];
  if (topic) {
    sql += ' WHERE topic = ?';
    params.push(topic);
  }
  sql += ' ORDER BY RANDOM() LIMIT 10';
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Fetch questions error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get user weak topics
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
     GROUP BY q.topic
     HAVING COUNT(*) > 0`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Fetch weak topics error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ topics: rows });
    }
  );
});

// Get user quiz history
router.get('/user-history/:userId', (req, res) => {
  const userId = req.params.userId;
  db.all(
    'SELECT id, score, total_questions, start_time as completed_at, time_taken FROM quiz_attempts WHERE user_id = ? ORDER BY start_time DESC LIMIT 10',
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

// Award welcome badge to new users
function awardWelcomeBadge(userId) {
  // Check if user already has any badges
  db.get(
    'SELECT COUNT(*) as count FROM badges WHERE user_id = ?',
    [userId],
    (err, row) => {
      if (err) {
        console.error('Error checking badges:', err);
        return;
      }
      
      // If user has no badges, award welcome badge
      if (row.count === 0) {
        db.run(
          'INSERT INTO badges (user_id, badge_name) VALUES (?, ?)',
          [userId, 'Welcome to CS Explorer!'],
          (err) => {
            if (err) {
              console.error('Error awarding welcome badge:', err);
            } else {
              console.log('Welcome badge awarded to user:', userId);
            }
          }
        );
      }
    }
  );
}

// Get user badges
router.get('/user-badges/:userId', (req, res) => {
  const userId = req.params.userId;
  
  // Award welcome badge if needed
  awardWelcomeBadge(userId);
  
  db.all(
    'SELECT badge_name as name, badge_name as description, date_awarded FROM badges WHERE user_id = ? ORDER BY date_awarded DESC',
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Badges error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ badges: rows });
    }
  );
});

// Create sample data for testing (development only)
router.post('/create-sample-data/:userId', (req, res) => {
  const userId = req.params.userId;
  
  // Create some sample quiz attempts
  const sampleAttempts = [
    { score: 8, total: 10, timeTaken: 480 },
    { score: 6, total: 10, timeTaken: 520 },
    { score: 9, total: 10, timeTaken: 360 },
    { score: 7, total: 10, timeTaken: 600 },
    { score: 10, total: 10, timeTaken: 420 }
  ];
  
  let completed = 0;
  const total = sampleAttempts.length;
  
  sampleAttempts.forEach((attempt, index) => {
    // Insert with different timestamps (spread over last few days)
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - (total - index - 1));
    
    db.run(
      'INSERT INTO quiz_attempts (user_id, score, total_questions, start_time, time_taken) VALUES (?, ?, ?, ?, ?)',
      [userId, attempt.score, attempt.total, timestamp.toISOString(), attempt.timeTaken],
      function(err) {
        if (err) {
          console.error('Error creating sample attempt:', err);
        } else {
          completed++;
          // Award some sample badges based on performance
          if (attempt.score === attempt.total) {
            db.run('INSERT INTO badges (user_id, badge_name) VALUES (?, ?)', [userId, 'Perfect Score']);
          }
          if (attempt.timeTaken < 400) {
            db.run('INSERT INTO badges (user_id, badge_name) VALUES (?, ?)', [userId, 'Speed Demon']);
          }
          
          if (completed === total) {
            res.json({ message: 'Sample data created successfully', attempts: total });
          }
        }
      }
    );
  });
});

module.exports = router;