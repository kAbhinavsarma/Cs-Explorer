// Import JWT middleware
const authenticateToken = require('./authenticateToken');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();
const path = require('path');
const dbPath = path.resolve(__dirname, 'quizifycs.db');
console.log('[quiz_new.js] Using database at:', dbPath);
const db = new sqlite3.Database(dbPath);



// --- Topic Mastery Endpoint ---
// Returns topic performance for a user
router.get('/topic-performance-data/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  db.all(
    `SELECT q.topic, COUNT(*) as attempts,
      ROUND(AVG(CASE WHEN aa.is_correct = 1 THEN 100.0 ELSE 0.0 END), 2) as avg_score,
      SUM(CASE WHEN aa.is_correct = 1 THEN 1 ELSE 0 END) as total_correct,
      COUNT(*) as total_questions
     FROM quiz_attempts qa
     JOIN attempt_answers aa ON aa.attempt_id = qa.id
     JOIN questions q ON aa.question_id = q.id
     WHERE qa.user_id = ? AND q.topic IS NOT NULL
     GROUP BY q.topic
     ORDER BY q.topic`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error('topic-performance-data DB error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      // Add a mastery_level field based on avg_score
      const topics = rows.map(topic => ({
        ...topic,
        mastery_level:
          topic.avg_score >= 90 ? 'Mastered' :
          topic.avg_score >= 70 ? 'Proficient' :
          topic.avg_score >= 40 ? 'Learning' :
          'Beginner'
      }));
      // Build topic_performance array
      let topic_performance = rows.map(row => ({
        topic: row.topic,
        avg_score: row.avg_score,
        attempts: row.attempts
      }));
      // Sort by avg_score ascending (weakest first)
      topic_performance = topic_performance.sort((a, b) => {
        // If avg_score is null or undefined, treat as 0
        const aScore = (a.avg_score == null) ? 0 : a.avg_score;
        const bScore = (b.avg_score == null) ? 0 : b.avg_score;
        return aScore - bScore;
      });
      res.json(topics);
    }
  );
});



// --- Next Adaptive Question Endpoint ---
router.post('/next-adaptive-question', authenticateToken, (req, res) => {
  // Adaptive logic: choose next question based on previous answer and difficulty
  const { userId, previousQuestions = [], lastWasCorrect = null, lastDifficulty = null } = req.body;
  // Difficulty levels: 1 (easy), 2 (medium), 3 (hard)
  let targetDifficulty = 2; // default to medium
  if (lastDifficulty !== null && lastWasCorrect !== null) {
    if (lastWasCorrect && lastDifficulty < 3) targetDifficulty = lastDifficulty + 1;
    else if (!lastWasCorrect && lastDifficulty > 1) targetDifficulty = lastDifficulty - 1;
    else targetDifficulty = lastDifficulty;
  }
  // Build query to avoid previous questions and get target difficulty
  let query = 'SELECT * FROM questions WHERE difficulty = ?';
  let params = [targetDifficulty];
  if (previousQuestions.length > 0) {
    query += ` AND id NOT IN (${previousQuestions.map(() => '?').join(',')})`;
    params = [targetDifficulty, ...previousQuestions];
  }
  query += ' ORDER BY RANDOM() LIMIT 1';
  db.get(query, params, (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      // Fallback: try any difficulty not yet seen
      let fallbackQuery = 'SELECT * FROM questions';
      let fallbackParams = [];
      if (previousQuestions.length > 0) {
        fallbackQuery += ` WHERE id NOT IN (${previousQuestions.map(() => '?').join(',')})`;
        fallbackParams = previousQuestions;
      }
      fallbackQuery += ' ORDER BY RANDOM() LIMIT 1';
      db.get(fallbackQuery, fallbackParams, (err2, row2) => {
        if (err2 || !row2) {
          return res.status(404).json({ error: 'No questions found' });
        }
        res.json({ question: row2 });
      });
    } else {
      res.json({ question: row });
    }
  });
});

// --- Helper Functions ---
function awardBadge(userId, badgeName) {
  db.run('INSERT OR IGNORE INTO badges (user_id, badge_name) VALUES (?, ?)', [userId, badgeName]);
}

// --- Achievement and Badge System ---
function createAchievementNotification(userId, achievement) {
  const title = 'New Achievement Unlocked!';
  const message = `Congratulations! You've earned: ${achievement}`;
  // Example: Insert notification into DB (expand as needed)
  db.run(
    'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)', 
    [userId, title, message, 'achievement'],
    function(err) {
      if (err) {
        console.error('Error creating achievement notification:', err);
      }
    }
  );
}

function checkExistingBadge(userId, badgeName, callback) {
  db.get(
    'SELECT COUNT(*) as count FROM badges WHERE user_id = ? AND badge_name = ?',
    [userId, badgeName],
    (err, row) => {
      if (err) {
        console.error('Error checking existing badge:', err);
        callback(err, false);
      } else {
        callback(null, row.count > 0);
      }
    }
  );
}

function awardUniqueAchievements(userId, achievements, callback) {
  if (achievements.length === 0) {
    return callback(null, []);
  }
  const newAchievements = [];
  let processed = 0;
  achievements.forEach(achievement => {
    checkExistingBadge(userId, achievement, (err, exists) => {
      if (!err && !exists) {
        db.run(
          'INSERT INTO badges (user_id, badge_name) VALUES (?, ?)', 
          [userId, achievement],
          (insertErr) => {
            if (!insertErr) {
              newAchievements.push(achievement);
              createAchievementNotification(userId, achievement);
            }
            processed++;
            if (processed === achievements.length) {
              callback(null, newAchievements);
            }
          }
        );
      } else {
        processed++;
        if (processed === achievements.length) {
          callback(null, newAchievements);
        }
      }
    });
  });
}

function calculateAchievements(score, totalAnswered, timeTaken, percentage, topicPerformance, userStats, userId) {
  const achievements = [];
  // Example logic: Add more as needed
  if (percentage === 100) achievements.push('Perfect Score');
  if (percentage >= 90) achievements.push('Excellence Award');
  if (score >= 8) achievements.push('High Achiever');
  if (timeTaken < 400) achievements.push('Speed Demon');
  // Add topic mastery, streaks, etc. as needed
  return [...new Set(achievements)];
}

// --- Endpoints ---
// Create sample quiz attempts for a user
router.post('/create-sample-data/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  const sampleAttempts = [
    { score: 8, total: 10, timeTaken: 480 },
    { score: 6, total: 10, timeTaken: 520 },
    { score: 9, total: 10, timeTaken: 360 },
    { score: 7, total: 10, timeTaken: 600 },
    { score: 10, total: 10, timeTaken: 420 }
  ];
  let completed = 0;
  sampleAttempts.forEach((attempt, idx) => {
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - (sampleAttempts.length - idx - 1));
    // Use system local time and format as 'YYYY-MM-DD HH:MM:SS'
    const pad = n => n.toString().padStart(2, '0');
    const istISOString = `${timestamp.getFullYear()}-${pad(timestamp.getMonth() + 1)}-${pad(timestamp.getDate())} ${pad(timestamp.getHours())}:${pad(timestamp.getMinutes())}:${pad(timestamp.getSeconds())}`;
    db.run(
      'INSERT INTO quiz_attempts (user_id, score, total_questions, start_time, time_taken) VALUES (?, ?, ?, ?, ?)',
      [userId, attempt.score, attempt.total, istISOString, attempt.timeTaken],
      function (err) {
        if (err) return res.status(500).json({ error: 'DB error' });
        // Debug: Log quiz attempt insertion
        console.log(`[DEBUG] Inserted quiz_attempt: userId=${userId}, score=${attempt.score}, total=${attempt.total}, start_time=${istISOString}, timeTaken=${attempt.timeTaken}`);
        completed++;
        if (attempt.score === attempt.total) awardBadge(userId, 'Perfect Score');
        if (attempt.timeTaken < 400) awardBadge(userId, 'Speed Demon');
        if (completed === sampleAttempts.length) {
          res.json({ message: 'Sample data created', attempts: completed });
        }
      }
    );
  });
});

// --- Comprehensive Sample Data Creation ---
router.post('/create-comprehensive-sample-data/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  db.all('SELECT * FROM questions ORDER BY RANDOM() LIMIT 50', [], (err, allQuestions) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (allQuestions.length === 0) return res.status(400).json({ error: 'No questions available to create sample data' });
    const sampleAttempts = [
      { score: 15, total: 20, timeTaken: 480, startIndex: 0 },
      { score: 8, total: 20, timeTaken: 520, startIndex: 10 },
      { score: 12, total: 20, timeTaken: 360, startIndex: 20 },
      { score: 6, total: 20, timeTaken: 600, startIndex: 30 },
      { score: 18, total: 20, timeTaken: 420, startIndex: 40 }
    ];
    let completedAttempts = 0;
    const totalAttempts = sampleAttempts.length;
    sampleAttempts.forEach((attempt, attemptIndex) => {
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - (totalAttempts - attemptIndex - 1));
      // Use system local time and format as 'YYYY-MM-DD HH:MM:SS'
      const pad = n => n.toString().padStart(2, '0');
      const istISOString = `${timestamp.getFullYear()}-${pad(timestamp.getMonth() + 1)}-${pad(timestamp.getDate())} ${pad(timestamp.getHours())}:${pad(timestamp.getMinutes())}:${pad(timestamp.getSeconds())}`;
      db.run(
        'INSERT INTO quiz_attempts (user_id, score, total_questions, start_time, time_taken) VALUES (?, ?, ?, ?, ?)',
        [userId, attempt.score, attempt.total, istISOString, attempt.timeTaken],
        function(err) {
          if (err) {
            completedAttempts++;
            if (completedAttempts === totalAttempts) {
              res.json({ message: 'Partial sample data created', attempts: totalAttempts });
            }
            return;
          }
          const attemptId = this.lastID;
          const questionsForThisAttempt = allQuestions.slice(attempt.startIndex, attempt.startIndex + attempt.total);
          let correctAnswers = 0;
          let answersCreated = 0;
          questionsForThisAttempt.forEach((question, qIndex) => {
            const shouldBeCorrect = correctAnswers < attempt.score;
            const selectedOption = shouldBeCorrect ? question.correct_option : (question.correct_option === 'A' ? 'B' : 'A');
            const isCorrect = selectedOption === question.correct_option ? 1 : 0;
            if (isCorrect) correctAnswers++;
            db.run(
              'INSERT INTO attempt_answers (attempt_id, question_id, selected_option, is_correct) VALUES (?, ?, ?, ?)',
              [attemptId, question.id, selectedOption, isCorrect],
              function(answerErr) {
                answersCreated++;
                if (answersCreated === attempt.total) {
                  if (attempt.score === attempt.total) {
                    db.run('INSERT OR IGNORE INTO badges (user_id, badge_name) VALUES (?, ?)', [userId, '🎯 Perfect Score']);
                  }
                  if (attempt.score >= attempt.total * 0.9) {
                    db.run('INSERT OR IGNORE INTO badges (user_id, badge_name) VALUES (?, ?)', [userId, '⭐ Excellence Award']);
                  }
                  if (attempt.timeTaken < 400) {
                    db.run('INSERT OR IGNORE INTO badges (user_id, badge_name) VALUES (?, ?)', [userId, '⚡ Speed Demon']);
                  }
                  if (attempt.score >= attempt.total * 0.8) {
                    db.run('INSERT OR IGNORE INTO badges (user_id, badge_name) VALUES (?, ?)', [userId, '🏆 High Achiever']);
                  }
                  completedAttempts++;
                  if (completedAttempts === totalAttempts) {
                    res.json({
                      message: 'Comprehensive sample data created successfully',
                      attempts: totalAttempts,
                      totalAnswers: totalAttempts * 20,
                      userId: userId
                    });
                  }
                }
              }
            );
          });
        }
      );
    });
  });
});

// Get user statistics
router.get('/user-statistics/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  // Debug: Log server date/time at start of stats calculation (local time)
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const localISOString = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  console.log(`[DEBUG] /user-statistics/:userId called at local time: ${localISOString}`);
  db.all(
    `SELECT qa.id as attempt_id, qa.start_time, qa.time_taken, qa.completion_status, COUNT(aa.id) as actual_questions,
      SUM(CASE WHEN aa.is_correct = 1 THEN 1 ELSE 0 END) as actual_correct
     FROM quiz_attempts qa
     LEFT JOIN attempt_answers aa ON aa.attempt_id = qa.id
     WHERE qa.user_id = ?
     GROUP BY qa.id, qa.start_time, qa.time_taken, qa.completion_status
     ORDER BY qa.start_time DESC`,
    [userId],
    (err, quizData) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      db.all(
        `SELECT q.topic, COUNT(*) as attempts,
          ROUND(AVG(CASE WHEN aa.is_correct = 1 THEN 100.0 ELSE 0.0 END), 2) as avg_score,
          SUM(CASE WHEN aa.is_correct = 1 THEN 1 ELSE 0 END) as total_correct,
          COUNT(*) as total_questions
         FROM quiz_attempts qa
         JOIN attempt_answers aa ON aa.attempt_id = qa.id
         JOIN questions q ON aa.question_id = q.id
         WHERE qa.user_id = ? AND q.topic IS NOT NULL
         GROUP BY q.topic
         ORDER BY q.topic`,
        [userId],
        (err, topicStats) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          const validQuizzes = quizData.filter(q => q.actual_questions > 0);
          const corruptedQuizzes = quizData.filter(q => q.actual_questions === 0);
          const total_quizzes = validQuizzes.length;
          const total_attempted = validQuizzes.reduce((sum, q) => sum + q.actual_questions, 0);
          const total_correct = validQuizzes.reduce((sum, q) => sum + q.actual_correct, 0);
          const average_score = total_quizzes > 0 ? total_correct / total_attempted * 100 : 0;
          const total_time = validQuizzes.reduce((sum, q) => sum + (q.time_taken || 0), 0);
          // Best score should be the highest percentage score in any quiz
          const best_score = validQuizzes.reduce((max, q) => {
            if (q.actual_questions > 0) {
              const percent = (q.actual_correct / q.actual_questions) * 100;
              return Math.max(max, percent);
            }
            return max;
          }, 0);
          const worst_score = validQuizzes.reduce((min, q) => Math.min(min, q.actual_correct), validQuizzes.length ? validQuizzes[0].actual_correct : 0);
          const recent_performance = validQuizzes.slice(0, 5).map(q => {
            let percentage = 0;
            if (typeof q.actual_questions === 'number' && q.actual_questions > 0) {
              percentage = Math.round((q.actual_correct / q.actual_questions) * 100);
            }
            console.log(`[recent_performance-debug] quiz_id=${q.attempt_id}, correct=${q.actual_correct}, total=${q.actual_questions}, percentage=${percentage}`);
            return {
              date: q.start_time,
              score: q.actual_correct,
              total: q.actual_questions,
              time: q.time_taken,
              completion_status: q.completion_status,
              percentage: percentage
            };
          });
  db.get('SELECT username, last_active, streak_days, longest_streak FROM users WHERE id = ?', [userId], (err, userStreak) => {
    let username = 'Student';
    if (!err && userStreak && userStreak.username) username = userStreak.username;
    // Calculate local date string (YYYY-MM-DD) for 'today' and streak logic
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const todayISO = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    let currentStreak = userStreak && userStreak.streak_days || 0;
    if (userStreak && userStreak.last_active) {
      // Compare last_active and today in local time
      const lastActiveDate = new Date(userStreak.last_active + 'T00:00:00');
      const todayDate = new Date(todayISO + 'T00:00:00');
      const diffDays = Math.floor((todayDate - lastActiveDate) / (24 * 60 * 60 * 1000));
      if (diffDays > 1) currentStreak = 0;
    }
    const todayQuizzes = validQuizzes.filter(quiz => {
      if (!quiz.start_time) return false;
      // start_time is already in IST as 'YYYY-MM-DD HH:MM:SS', so just compare the date part
      const quizDay = quiz.start_time.slice(0, 10);
      return quizDay === todayISO;
    }).length;
    // Debug: Log today_quizzes calculation
    console.log(`[DEBUG] Calculated today_quizzes for userId=${userId}: todayISO=${todayISO}, count=${todayQuizzes}`);
    const result = {
      username: username,
      basic: {
        total_quizzes: total_quizzes,
        average_score: Math.round(average_score),
        total_time: total_time,
        best_score: Math.round(best_score),
        worst_score: Math.round(worst_score),
        total_correct: total_correct,
        total_attempted: total_attempted,
        longest_streak: userStreak && userStreak.longest_streak || 0,
        today_quizzes: todayQuizzes
      },
      streak: {
        current_streak: currentStreak,
        streak_days: userStreak && userStreak.streak_days || 0,
        last_active: userStreak && userStreak.last_active,
        longest_streak: userStreak && userStreak.longest_streak || 0
      },
      recent_performance: recent_performance,
      topic_performance: topicStats
        .map(function(t) {
          return {
            topic: t.topic,
            attempts: t.attempts,
            avg_score: Math.round(t.avg_score || 0),
            total_correct: t.total_correct,
            total_questions: t.total_questions
          };
        })
        .sort((a, b) => {
          // If avg_score is null or undefined, treat as 0
          const aScore = (a.avg_score == null) ? 0 : a.avg_score;
          const bScore = (b.avg_score == null) ? 0 : b.avg_score;
          return aScore - bScore;
        }),
      achievements: [
        ...(total_quizzes >= 1 ? [{ id: 'first_quiz', name: 'First Steps', icon: '🎯' }] : []),
        ...(total_quizzes >= 5 ? [{ id: 'quiz_5', name: 'Quiz Explorer', icon: '🚀' }] : []),
        ...(total_quizzes >= 10 ? [{ id: 'quiz_10', name: 'Quiz Master', icon: '🏆' }] : []),
        ...(average_score >= 80 ? [{ id: 'high_scorer', name: 'High Achiever', icon: '⭐' }] : []),
        ...(currentStreak >= 3 ? [{ id: 'streak_3', name: 'On Fire', icon: '🔥' }] : []),
        ...(userStreak && userStreak.longest_streak >= 7 ? [{ id: 'streak_7', name: 'Dedicated Learner', icon: '📚' }] : [])
      ],
      data_quality: {
        valid_quizzes: validQuizzes.length,
        corrupted_quizzes: corruptedQuizzes.length,
        note: corruptedQuizzes.length > 0 ? `${corruptedQuizzes.length} quiz records had no answer data and were excluded` : "All quiz data is valid"
      }
    };
    res.json(result);
  });
        });
    });
});

// Get user mistakes
router.get('/user-mistakes/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  db.all(
    `SELECT aa.question_id, aa.selected_option, aa.is_correct, qa.start_time
     FROM attempt_answers aa
     JOIN quiz_attempts qa ON aa.attempt_id = qa.id
     WHERE qa.user_id = ? AND aa.is_correct = 0
     ORDER BY qa.start_time DESC LIMIT 20`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ mistakes: rows });
    }
  );
});

// Get available topics
router.get('/topics', (req, res) => {
  db.all(
    'SELECT topic as name, COUNT(*) as questionCount FROM questions GROUP BY topic ORDER BY topic',
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json(rows);
    }
  );
});

// Get user badges
router.get('/badges/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  db.all('SELECT badge_name FROM badges WHERE user_id = ?', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ badges: rows });
  });
});

// --- Debug Endpoint: Database Check ---
router.get('/debug/database-check', (req, res) => {
  const queries = [
    'SELECT COUNT(*) as count FROM users',
    'SELECT COUNT(*) as count FROM questions',
    'SELECT COUNT(*) as count FROM quiz_attempts',
    'SELECT COUNT(*) as count FROM attempt_answers',
    'SELECT COUNT(*) as count FROM badges'
  ];
  const results = {};
  let completed = 0;
  queries.forEach((query, index) => {
    const tableName = query.split(' ')[3];
    db.get(query, [], (err, row) => {
      if (err) {
        results[tableName] = { error: err.message };
      } else {
        results[tableName] = row;
      }
      completed++;
      if (completed === queries.length) {
        res.json(results);
      }
    });
  });
});

// --- Get User Badges ---
router.get('/user-badges/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  db.all(
    'SELECT badge_name as name, badge_name as description, date_awarded FROM badges WHERE user_id = ? ORDER BY date_awarded DESC',
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ badges: rows });
    }
  );
});

// --- Quiz Submission Endpoint ---
router.post('/submit-quiz', authenticateToken, (req, res) => {
  const { userId, answers, timeTaken } = req.body;
  console.log('[submit-quiz] called:', { userId, answers, timeTaken });
  if (!userId || !answers || !Array.isArray(answers)) {
    console.log('[submit-quiz] Invalid request:', req.body);
    return res.status(400).json({ error: 'Invalid request' });
  }

  let score = 0;
  let totalAnswered = 0;
  // Support both questionId and question_id from frontend
  // Fix: Always support both questionId and question_id, and selectedOption/selected_option
  const questionIds = answers.map(a => (a.questionId !== undefined ? a.questionId : a.question_id));
  const placeholders = questionIds.length > 0 ? questionIds.map(() => '?').join(',') : '';
  console.log('[submit-quiz] questionIds:', questionIds);

  if (!placeholders) {
    console.log('[submit-quiz] No valid questionIds found.');
    return res.status(400).json({ error: 'No valid questionIds in answers.' });
  }
  db.all(
    `SELECT id, correct_option FROM questions WHERE id IN (${placeholders})`,
    questionIds,
    (err, questions) => {
      if (err) {
        console.log('[submit-quiz] DB error on select questions:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      answers.forEach(ans => {
        const qid = ans.questionId !== undefined ? ans.questionId : ans.question_id;
        const selectedOption = ans.selectedOption !== undefined ? ans.selectedOption : ans.selected_option;
        const q = questions.find(q => q.id === qid);
        if (q) {
          totalAnswered++;
          if (selectedOption === q.correct_option) score++;
        }
      });
      // Fix: Prevent undefined percentage by ensuring totalAnswered is never zero
      let percentage = 0;
      if (typeof totalAnswered === 'number' && totalAnswered > 0) {
        percentage = Math.round((score / totalAnswered) * 100);
      }
      console.log('[submit-quiz] Calculated score:', { score, totalAnswered, percentage });
      // Use system local time and format as 'YYYY-MM-DD HH:MM:SS'
      const now = new Date();
      const pad = n => n.toString().padStart(2, '0');
      const istISOString = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      db.run(
        'INSERT INTO quiz_attempts (user_id, score, total_questions, start_time, time_taken) VALUES (?, ?, ?, ?, ?)',
        [userId, score, totalAnswered, istISOString, timeTaken || 600],
        function (err) {
          if (err) {
            console.log('[submit-quiz] DB error on insert quiz_attempts:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          const attemptId = this.lastID;
          console.log('[submit-quiz] Inserted quiz_attempts with id:', attemptId);
          // Insert each answer into attempt_answers
          let inserted = 0;
          if (answers.length === 0) {
            console.log('[submit-quiz] No answers to insert.');
            return res.json({ score, total: totalAnswered, percentage });
          }
          answers.forEach(ans => {
            const qid = ans.questionId !== undefined ? ans.questionId : ans.question_id;
            const selectedOption = ans.selectedOption !== undefined ? ans.selectedOption : ans.selected_option;
            const q = questions.find(q => q.id === qid);
            if (!q) {
              console.warn('[submit-quiz] Skipping answer: question not found for questionId', qid, ans);
              inserted++;
              if (inserted === answers.length) {
                console.log('[submit-quiz] All answers processed (some missing questions).');
                return res.json({ score, total: totalAnswered, percentage });
              }
              return;
            }
            // Only insert if correct_option is present
            if (q.correct_option === undefined || q.correct_option === null) {
              console.warn('[submit-quiz] Skipping answer: correct_option missing for questionId', qid, ans);
              inserted++;
              if (inserted === answers.length) {
                console.log('[submit-quiz] All answers processed (some missing correct_option).');
                return res.json({ score, total: totalAnswered, percentage });
              }
              return;
            }
            db.run(
              'INSERT INTO attempt_answers (attempt_id, question_id, selected_option, is_correct, correct_option) VALUES (?, ?, ?, ?, ?)',
              [attemptId, qid, selectedOption, selectedOption === q.correct_option ? 1 : 0, q.correct_option],
              function (err2) {
                if (err2) {
                  console.log('[submit-quiz] DB error on insert attempt_answers:', err2, { attemptId, ans });
                } else {
                  console.log('[submit-quiz] Inserted attempt_answer:', { attemptId, questionId: qid, selectedOption, isCorrect: selectedOption === q.correct_option ? 1 : 0, correctOption: q.correct_option });
                }
                inserted++;
                if (inserted === answers.length) {
                  // Mark the attempt as completed
                  db.run('UPDATE quiz_attempts SET completion_status = ? WHERE id = ?', ['completed', attemptId], function (err3) {
                    if (err3) {
                      console.warn('[submit-quiz] Failed to update completion_status:', err3);
                    } else {
                      console.log('[submit-quiz] Marked attempt as completed:', attemptId);
                    }
                    // Fetch the latest attempt data to return in the response
                    db.get('SELECT * FROM quiz_attempts WHERE id = ?', [attemptId], function (err4, attemptRow) {
                      if (err4) {
                        console.warn('[submit-quiz] Failed to fetch latest attempt:', err4);
                        return res.json({ score, total: totalAnswered, percentage, attemptId });
                      }
                      console.log('[submit-quiz] All answers inserted. Returning response with attempt data.');
                      // --- Streak Logic ---
                      db.get('SELECT last_active, streak_days, longest_streak FROM users WHERE id = ?', [userId], (err, user) => {
                        if (!err && user) {
                          const today = new Date();
                          const todayISO = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
                          let newStreak = 1;
                          let newLongest = user.longest_streak || 1;
                          let updateStreak = true;
                          if (!user.last_active || !user.streak_days || user.streak_days === 0) {
                            // New user or never played before
                            newStreak = 1;
                          } else {
                            const last = new Date(user.last_active + 'T00:00:00');
                            const todayDate = new Date(todayISO + 'T00:00:00');
                            const diffDays = Math.floor((todayDate - last) / (24*60*60*1000));
                            if (diffDays === 1) {
                              newStreak = user.streak_days + 1;
                            } else if (diffDays === 0) {
                              newStreak = user.streak_days;
                              updateStreak = false; // Already updated today
                            } else {
                              newStreak = 1; // Missed a day or more
                            }
                          }
                          if (newStreak > newLongest) newLongest = newStreak;
                          if (updateStreak) {
                            db.run('UPDATE users SET last_active = ?, streak_days = ?, longest_streak = ? WHERE id = ?',
                              [todayISO, newStreak, newLongest, userId],
                              (updateErr) => {
                                if (updateErr) {
                                  console.error('Error updating user streak:', updateErr);
                                } else {
                                  console.log(`[streak update] Updated user ${userId}: last_active=${todayISO}, streak_days=${newStreak}, longest_streak=${newLongest}`);
                                }
                              }
                            );
                          }
                        }

                        // --- Achievement Logic ---
                        // Optionally, you can add topicPerformance and userStats if available
                        const achievements = calculateAchievements(score, totalAnswered, timeTaken, percentage, null, null, userId);
                        console.log('[achievement-debug] Calculated achievements:', achievements);
                        awardUniqueAchievements(userId, achievements, (errAch, newAchievements) => {
                          if (errAch) {
                            console.error('Error awarding achievements:', errAch);
                          } else {
                            console.log(`[achievement-debug] Awarded to user ${userId}:`, newAchievements);
                          }
                          // Always send response after streak and achievement logic
                          return res.json({
                            score,
                            total: totalAnswered,
                            percentage,
                            attemptId,
                            completion_status: attemptRow ? attemptRow.completion_status : 'completed',
                            start_time: attemptRow ? attemptRow.start_time : null,
                            time_taken: attemptRow ? attemptRow.time_taken : null,
                            new_achievements: Array.isArray(newAchievements) ? newAchievements : []
                          });
                        });
                      });
                    });
                  });
                }
              }
            );
          });
        }
      );
    }
  );
});


// --- Get Learning Recommendations ---
router.get('/learning-recommendations/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  db.all(
    `SELECT q.topic, COUNT(*) as total_questions, SUM(CASE WHEN aa.is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
      (SUM(CASE WHEN aa.is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as accuracy
     FROM attempt_answers aa
     JOIN quiz_attempts qa ON aa.attempt_id = qa.id
     JOIN questions q ON aa.question_id = q.id
     WHERE qa.user_id = ? AND q.topic IS NOT NULL
     GROUP BY q.topic
     HAVING accuracy < 70
     ORDER BY accuracy ASC`,
    [userId],
    (err, weakTopics) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      const recommendations = weakTopics.map(topic => ({
        topic: topic.topic,
        current_accuracy: Math.round(topic.accuracy),
        total_attempts: topic.total_questions,
        priority: topic.accuracy < 50 ? 'High' : topic.accuracy < 65 ? 'Medium' : 'Low',
        suggested_action: topic.accuracy < 50 ? 'Review fundamentals' : 'Practice more questions',
        target_accuracy: 75
      }));
      res.json({
        weak_topics: recommendations,
        total_weak_areas: recommendations.length,
        overall_recommendation: recommendations.length > 3 ?
          'Focus on top 3 weakest topics first' :
          'Work on all identified weak areas'
      });
    }
  );
});

// --- Get User Streak Data ---
router.get('/userStreak/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  db.get('SELECT last_active, streak_days, longest_streak FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const today = new Date();
    const todayISO = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    let currentStreak = user.streak_days || 0;
    if (user.last_active) {
      const lastActiveISO = user.last_active;
      const todayDate = new Date(todayISO + 'T00:00:00');
      const lastActiveDate = new Date(lastActiveISO + 'T00:00:00');
      const diffDays = Math.floor((todayDate - lastActiveDate) / (24 * 60 * 60 * 1000));
      if (diffDays > 1) {
        currentStreak = 0;
      }
    }
    res.json({
      current_streak: currentStreak,
      last_active: user.last_active,
      streak_days: user.streak_days,
      longest_streak: user.longest_streak || 0
    });
  });
});

// --- Get Latest Quiz Result ---
router.get('/latest-quiz-result/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  db.get(
    'SELECT id, score, total_questions, start_time, time_taken FROM quiz_attempts WHERE user_id = ? ORDER BY start_time DESC LIMIT 1',
    [userId],
    (err, latestAttempt) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      if (!latestAttempt) {
        return res.json(null);
      }
      db.all(
        `SELECT aa.question_id, aa.selected_option, aa.is_correct,
                q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
                q.correct_option, q.topic, q.explanation
         FROM attempt_answers aa
         JOIN questions q ON aa.question_id = q.id
         WHERE aa.attempt_id = ?
         ORDER BY aa.question_id`,
        [latestAttempt.id],
        (err, answers) => {
          if (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
          }
          if (!answers || answers.length === 0) {
            return res.json({
              score: latestAttempt.score,
              total: latestAttempt.total_questions,
              percentage: Math.round((latestAttempt.score / latestAttempt.total_questions) * 100),
              completedAt: latestAttempt.start_time,
              topicPerformance: {},
              timeAnalysis: {
                "Total Time": `${Math.floor((latestAttempt.time_taken || 0) / 60).toString().padStart(2, '0')}:${((latestAttempt.time_taken || 0) % 60).toString().padStart(2, '0')}`
              },
              achievements: [],
              questionReview: [],
              learningPath: []
            });
          }
          const topicPerformance = {};
          const questionReview = [];
          answers.forEach((answer, index) => {
            if (!topicPerformance[answer.topic]) {
              topicPerformance[answer.topic] = { correct: 0, total: 0 };
            }
            topicPerformance[answer.topic].total++;
            if (answer.is_correct) {
              topicPerformance[answer.topic].correct++;
            }
            questionReview.push({
              number: index + 1,
              question: answer.question_text,
              yourAnswer: answer.selected_option || 'No answer',
              isCorrect: answer.is_correct === 1,
              correctAnswer: answer.correct_option,
              explanation: answer.explanation || 'No explanation available'
            });
          });
          const totalTime = latestAttempt.time_taken || 0;
          const avgTimePerQuestion = Math.round(totalTime / latestAttempt.total_questions);
          const timeAnalysis = {
            "Total Time": `${Math.floor(totalTime / 60).toString().padStart(2, '0')}:${(totalTime % 60).toString().padStart(2, '0')}`,
            "Average Time Per Question": `${Math.floor(avgTimePerQuestion / 60).toString().padStart(2, '0')}:${(avgTimePerQuestion % 60).toString().padStart(2, '0')}`
          };
          const achievements = [];
          let percentage = 0;
          if (typeof latestAttempt.total_questions === 'number' && latestAttempt.total_questions > 0) {
            percentage = (latestAttempt.score / latestAttempt.total_questions) * 100;
          }
          if (percentage === 100) achievements.push("Perfect Score!");
          if (percentage >= 90) achievements.push("Excellent Performance");
          if (avgTimePerQuestion < 30) achievements.push("Speed Demon");
          const learningPath = Object.entries(topicPerformance).map(([topic, stats]) => ({
            topic,
            completed: (stats.correct / stats.total) >= 0.7
          }));
          const result = {
            score: latestAttempt.score,
            total: latestAttempt.total_questions,
            percentage: Math.round(percentage),
            completedAt: latestAttempt.start_time,
            topicPerformance,
            timeAnalysis,
            achievements,
            questionReview,
            learningPath
          };
          res.json(result);
        }
      );
    }
  );
});

// --- Adaptive Quiz Endpoints and Handlers ---
router.post('/adaptive-questions', authenticateToken, (req, res) => {
  const { userId, mode = 'adaptive', selectedTopic = null } = req.body;
  console.log('[API] /api/adaptive-questions called with:', req.body);
  const finalMode = selectedTopic && mode === 'adaptive' ? 'topic-specific' : mode;
  console.log('[API] /api/adaptive-questions using finalMode:', finalMode);
  switch (finalMode) {
    case 'all-topics':
      return handleAllTopicsQuiz(res);
    case 'weak-areas-combined':
      return handleWeakAreasCombined(userId, res);
    case 'topic-specific':
      return handleTopicSpecific(selectedTopic, res);
    case 'timed-challenge':
      return handleTimedChallenge(res);
    case 'adaptive':
    default:
      return handleAdaptiveQuiz(userId, res);
  }
});

function handleAllTopicsQuiz(res) {
  db.all(
    'SELECT topic, COUNT(*) as count FROM questions GROUP BY topic',
    [],
    (err, topicCounts) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      const totalTopics = topicCounts.length;
      const baseQuestionsPerTopic = Math.floor(20 / totalTopics);
      const extraQuestions = 20 % totalTopics;
      const queries = topicCounts.map((topicInfo, index) => {
        const questionsForThisTopic = baseQuestionsPerTopic + (index < extraQuestions ? 1 : 0);
        return new Promise((resolve, reject) => {
          db.all(
            'SELECT * FROM questions WHERE topic = ? ORDER BY RANDOM() LIMIT ?',
            [topicInfo.topic, Math.min(questionsForThisTopic, topicInfo.count)],
            (err, questions) => {
              if (err) reject(err);
              else resolve(questions);
            }
          );
        });
      });
      Promise.all(queries)
        .then(results => {
          let allQuestions = results.flat();
          if (allQuestions.length < 20) {
            const existingIds = allQuestions.map(q => q.id);
            const existingIdsPlaceholder = existingIds.length > 0 ? existingIds.map(() => '?').join(',') : '';
            const additionalNeeded = 20 - allQuestions.length;
            const excludeClause = existingIds.length > 0 ? `WHERE id NOT IN (${existingIdsPlaceholder})` : '';
            db.all(
              `SELECT * FROM questions ${excludeClause} ORDER BY RANDOM() LIMIT ?`,
              existingIds.length > 0 ? [...existingIds, additionalNeeded] : [additionalNeeded],
              (err, additionalQuestions) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                allQuestions = allQuestions.concat(additionalQuestions);
                for (let i = allQuestions.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
                }
                const finalQuestions = allQuestions.slice(0, 20);
                res.json({
                  questions: finalQuestions,
                  mode: 'all-topics',
                  message: `Comprehensive quiz covering all topics (${finalQuestions.length} questions)`
                });
              }
            );
          } else {
            for (let i = allQuestions.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
            }
            const finalQuestions = allQuestions.slice(0, 20);
            res.json({
              questions: finalQuestions,
              mode: 'all-topics',
              message: `Comprehensive quiz covering all topics (${finalQuestions.length} questions)`
            });
          }
        })
        .catch(err => {
          db.all(
            'SELECT * FROM questions ORDER BY RANDOM() LIMIT 20',
            [],
            (fallbackErr, fallbackQuestions) => {
              if (fallbackErr) return res.status(500).json({ error: 'Database error' });
              res.json({
                questions: fallbackQuestions,
                mode: 'all-topics',
                message: `Comprehensive quiz covering all topics (${fallbackQuestions.length} questions)`
              });
            }
          );
        });
    }
  );
}

function handleWeakAreasCombined(userId, res) {
  db.all(
    `SELECT q.topic, SUM(a.is_correct) as correct, COUNT(*) as total, ROUND((SUM(a.is_correct) * 100.0 / COUNT(*)), 2) as percentage
     FROM attempt_answers a
     JOIN quiz_attempts qa ON a.attempt_id = qa.id
     JOIN questions q ON a.question_id = q.id
     WHERE qa.user_id = ?
     GROUP BY q.topic
     HAVING COUNT(*) >= 2 AND percentage < 70
     ORDER BY percentage ASC`,
    [userId],
    (err, weakTopics) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (weakTopics.length === 0) return handleAllTopicsQuiz(res);
      const weakTopicNames = weakTopics.map(topic => topic.topic);
      const placeholders = weakTopicNames.map(() => '?').join(',');
      db.all(
        `SELECT * FROM questions WHERE topic IN (${placeholders}) ORDER BY RANDOM() LIMIT 12`,
        weakTopicNames,
        (err, questions) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          res.json({
            questions: questions,
            mode: 'weak-areas-combined',
            weakTopics: weakTopics,
            message: `Focusing on your weak areas: ${weakTopicNames.join(', ')}`
          });
        }
      );
    }
  );
}

function handleTopicSpecific(selectedTopic, res) {
  if (!selectedTopic) return res.status(400).json({ error: 'Topic must be specified for topic-specific quiz' });
  db.all(
    'SELECT * FROM questions WHERE topic = ? ORDER BY RANDOM()',
    [selectedTopic],
    (err, questions) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (questions.length === 0) return res.status(404).json({ error: 'No questions found for this topic' });
      // Return all questions for the topic, no repetition, even if less than 12
      res.json({
        questions: questions,
        mode: 'topic-specific',
        selectedTopic: selectedTopic,
        message: `Focused practice on ${selectedTopic} (${questions.length} questions)`
      });
    }
  );
}

function handleTimedChallenge(res) {
  db.all(
    'SELECT * FROM questions ORDER BY RANDOM() LIMIT 20',
    [],
    (err, questions) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({
        questions: questions,
        mode: 'timed-challenge',
        timeLimit: 300,
        message: 'Speed challenge! 20 questions in 5 minutes. Can you handle the pressure?'
      });
    }
  );
}

function handleAdaptiveQuiz(userId, res) {
  db.all(
    `SELECT q.topic, SUM(a.is_correct) as correct, COUNT(*) as total, ROUND((SUM(a.is_correct) * 100.0 / COUNT(*)), 2) as percentage
     FROM attempt_answers a
     JOIN quiz_attempts qa ON a.attempt_id = qa.id
     JOIN questions q ON a.question_id = q.id
     WHERE qa.user_id = ?
     GROUP BY q.topic
     HAVING COUNT(*) >= 2
     ORDER BY percentage ASC`,
    [userId],
    (err, userTopics) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      // Categorize topics
      const weakTopics = userTopics.filter(topic => topic.percentage < 70);
      const mediumTopics = userTopics.filter(topic => topic.percentage >= 70 && topic.percentage < 90);
      const strongTopics = userTopics.filter(topic => topic.percentage >= 90);
      const weakTopicNames = weakTopics.map(topic => topic.topic);
      const mediumTopicNames = mediumTopics.map(topic => topic.topic);
      const strongTopicNames = strongTopics.map(topic => topic.topic);
      // How many from each
      const weakCount = Math.min(5, weakTopicNames.length);
      const mediumCount = Math.min(3, mediumTopicNames.length);
      const strongCount = Math.min(2, strongTopicNames.length);
      let total = weakCount + mediumCount + strongCount;
      let queries = [];
      // Weak
      if (weakCount > 0) {
        const placeholders = weakTopicNames.map(() => '?').join(',');
        queries.push(new Promise((resolve, reject) => {
          db.all(
            `SELECT * FROM questions WHERE topic IN (${placeholders}) ORDER BY RANDOM() LIMIT ?`,
            [...weakTopicNames, weakCount],
            (err, rows) => err ? reject(err) : resolve(rows)
          );
        }));
      }
      // Medium
      if (mediumCount > 0) {
        const placeholders = mediumTopicNames.map(() => '?').join(',');
        queries.push(new Promise((resolve, reject) => {
          db.all(
            `SELECT * FROM questions WHERE topic IN (${placeholders}) ORDER BY RANDOM() LIMIT ?`,
            [...mediumTopicNames, mediumCount],
            (err, rows) => err ? reject(err) : resolve(rows)
          );
        }));
      }
      // Strong
      if (strongCount > 0) {
        const placeholders = strongTopicNames.map(() => '?').join(',');
        queries.push(new Promise((resolve, reject) => {
          db.all(
            `SELECT * FROM questions WHERE topic IN (${placeholders}) ORDER BY RANDOM() LIMIT ?`,
            [...strongTopicNames, strongCount],
            (err, rows) => err ? reject(err) : resolve(rows)
          );
        }));
      }
      // If not enough, fill with random
      if (total < 10) {
        queries.push(new Promise((resolve, reject) => {
          db.all(
            'SELECT * FROM questions ORDER BY RANDOM() LIMIT ?',
            [10 - total],
            (err, rows) => err ? reject(err) : resolve(rows)
          );
        }));
      }
      // If no user history, fallback to random
      if (queries.length === 0) {
        queries.push(new Promise((resolve, reject) => {
          db.all(
            'SELECT * FROM questions ORDER BY RANDOM() LIMIT 10',
            [],
            (err, rows) => err ? reject(err) : resolve(rows)
          );
        }));
      }
      Promise.all(queries)
        .then(results => {
          const questions = results.flat();
          for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
          }
          res.json({
            questions: questions.slice(0, 10),
            mode: 'adaptive',
            weakTopics,
            mediumTopics,
            strongTopics,
            distribution: {
              weak: weakCount,
              medium: mediumCount,
              strong: strongCount,
              random: 10 - total > 0 ? 10 - total : 0
            },
            message:
              weakTopicNames.length > 0
                ? `Focusing on your weak areas: ${weakTopicNames.join(', ')}`
                : mediumTopicNames.length > 0
                  ? `Balanced quiz with some focus on: ${mediumTopicNames.join(', ')}`
                  : strongTopicNames.length > 0
                    ? `Great job! Testing your strong areas: ${strongTopicNames.join(', ')}`
                    : 'Balanced quiz across all topics - keep practicing!'
          });
        })
        .catch(err => {
          res.status(500).json({ error: 'Database error' });
        });
    }
  );
}

// --- Utility: Time Format ---
function toHHMMSS(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => v < 10 ? '0' + v : v).filter((v, i) => v !== '00' || i > 0).join(':');
}

module.exports = router;
// End of file
