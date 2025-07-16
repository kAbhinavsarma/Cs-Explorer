const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
const { userWeakTopics } = require('./sharedData'); // Added shared import

const JWT_SECRET = process.env.JWT_SECRET;

// Register route
router.post('/register', async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing' });
    }

    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Check if user exists
    db.get(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email],
      async (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        if (row) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Insert user into DB with enhanced schema fields
        const today = new Date();
        // Use local date to avoid timezone issues (consistent with login logic)
        const todayISO = today.getFullYear() + '-' + 
                        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(today.getDate()).padStart(2, '0');
        db.run(
          `INSERT INTO users (
            username, email, password, last_active, streak_days, longest_streak
          ) VALUES (?, ?, ?, ?, 0, 0)`,
          [username, email, hashedPassword, todayISO],
          function (err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            const userId = this.lastID;
            userWeakTopics[userId] = [];
            res.json({ message: 'User registered successfully', userId: userId });
          }
        );
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  ('🔐 Auth login request received:', req.body);
  try {
    if (!req.body) {
      ('❌ No request body');
      return res.status(400).json({ error: 'Request body is missing' });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    db.get(
      'SELECT * FROM users WHERE username = ?',
      [username],
      async (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Update streak logic - only update if different day
        const today = new Date();
        // Use local date to avoid timezone issues
        const todayISO = today.getFullYear() + '-' + 
                        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(today.getDate()).padStart(2, '0');
        
        let streak = user.streak_days || 0;
        let shouldUpdateStreak = false;
        
        if (user.last_active) {
          const lastActiveISO = user.last_active; // Already in YYYY-MM-DD format
          
          // Parse dates correctly without timezone issues
          const todayDate = new Date(todayISO + 'T00:00:00');
          const lastActiveDate = new Date(lastActiveISO + 'T00:00:00');
          
          // Calculate day difference using local dates
          const diffDays = Math.floor((todayDate - lastActiveDate) / (24 * 60 * 60 * 1000));
          
          ('Streak calculation:', {
            today: todayISO,
            lastActive: lastActiveISO,
            diffDays: diffDays
          });
          
          if (diffDays === 0) {
            // Already active today, streak remains the same
            ('User already active today, streak remains:', streak);
            shouldUpdateStreak = false;
          } else if (diffDays === 1) {
            // Consecutive day, only increment if user hasn't been active today
            streak += 1;
            ('Consecutive day, streak increased to:', streak);
            shouldUpdateStreak = true;
          } else if (diffDays > 1) {
            // Missed days, reset streak to 1 for today
            streak = 1;
            ('Missed days, streak reset to:', streak);
            shouldUpdateStreak = true;
          } else {
            // This shouldn't happen (negative days), but reset to be safe
            streak = 1;
            ('Unexpected date difference, streak reset to:', streak);
            shouldUpdateStreak = true;
          }
        } else {
          // First time user or no last_active date
          streak = 1;
          ('First time user, streak set to:', streak);
          shouldUpdateStreak = true;
        }

        // Initialize weak topics if needed
        if (!userWeakTopics[user.id]) {
          userWeakTopics[user.id] = [];
        }

        // Update user's streak and last active only if needed
        if (shouldUpdateStreak) {
          ('Updating user streak in database to:', streak);
          
          // Get current longest streak to compare
          db.get('SELECT longest_streak FROM users WHERE id = ?', [user.id], (err, row) => {
            if (err) {
              console.error('Error fetching longest streak:', err);
            }
            
            const currentLongestStreak = row?.longest_streak || 0;
            const newLongestStreak = Math.max(currentLongestStreak, streak);
            
            // Update both current streak and longest streak if needed
            db.run(
              'UPDATE users SET last_active = ?, streak_days = ?, longest_streak = ? WHERE id = ?',
              [todayISO, streak, newLongestStreak, user.id],
              (err) => {
                if (err) {
                  console.error('Update streak error:', err);
                }
                (`Updated streak: current=${streak}, longest=${newLongestStreak}`);
                
                // Generate JWT token
                const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
                
                res.json({ 
                  message: 'Login successful', 
                  token,
                  userId: user.id, 
                  username: user.username,
                  streak,
                  longestStreak: newLongestStreak
                });
              }
            );
          });
        } else {
          // No need to update database, just return current data
          // Generate JWT token
          const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
          
          res.json({ 
            message: 'Login successful', 
            token,
            userId: user.id, 
            username: user.username,
            streak
          });
        }
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;