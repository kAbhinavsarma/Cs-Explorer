const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('./database');
const { userWeakTopics } = require('./sharedData'); // Added shared import

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
        const password_hash = await bcrypt.hash(password, salt);
        
        // Insert user into DB with initial streak values
        const today = new Date().toISOString().split('T')[0];
        try {
          const stmt = db.prepare('INSERT INTO users (username, email, password_hash, last_active, streak_days) VALUES (?, ?, ?, ?, ?)');
          const result = stmt.run(username, email, password_hash, today, 0);
          const userId = result.lastInsertRowid;
          userWeakTopics[userId] = []; // Initialize for new user
          res.json({ message: 'User registered successfully' });
        } catch (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    if (!req.body) {
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

        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Update streak
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString().split('T')[0];
        
        let streak = user.streak_days || 0;
        
        if (user.last_active) {
          const lastActive = new Date(user.last_active);
          lastActive.setHours(0, 0, 0, 0);
          
          // Calculate day difference (today - lastActive)
          const diffDays = Math.floor((today - lastActive) / (24 * 60 * 60 * 1000));
          
          if (diffDays === 0) {
            // Already active today, streak remains the same
            console.log('User already active today, streak remains:', streak);
          } else if (diffDays === 1) {
            // Consecutive day
            streak += 1;
            console.log('Consecutive day, streak increased to:', streak);
          } else if (diffDays > 1) {
            // Missed days, reset streak
            streak = 1;
            console.log('Missed days, streak reset to:', streak);
          } else {
            // This shouldn't happen (negative days), but reset to be safe
            streak = 1;
            console.log('Unexpected date difference, streak reset to:', streak);
          }
        } else {
          // First time user or no last_active date
          streak = 1;
          console.log('First time user, streak set to:', streak);
        }

        // Initialize weak topics if needed
        if (!userWeakTopics[user.id]) {
          userWeakTopics[user.id] = [];
        }

        // Update user's streak and last active
        db.run(
          'UPDATE users SET last_active = ?, streak_days = ? WHERE id = ?',
          [todayISO, streak, user.id],
          (err) => {
            if (err) {
              console.error('Update streak error:', err);
              // Still return success but log the error
            }
            // FIX: Added userId to response
            res.json({ 
              message: 'Login successful', 
              userId: user.id, 
              username: user.username,
              streak
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;