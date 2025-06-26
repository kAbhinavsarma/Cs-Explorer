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
        
        // Insert user into DB
        db.run(
          'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
          [username, email, password_hash],
          function (err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            const userId = this.lastID;
            userWeakTopics[userId] = []; // Initialize for new user
            res.json({ message: 'User registered successfully' });
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
        const lastActive = user.last_active ? new Date(user.last_active) : today;
        lastActive.setHours(0, 0, 0, 0);
        
        let streak = user.streak_days || 0;
        const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
        
        // Calculate day difference
        const diffDays = Math.round(Math.abs((today - lastActive) / oneDay));
        
        if (diffDays === 0) {
          // Already active today, streak remains the same
        } else if (diffDays === 1) {
          streak += 1;
        } else {
          streak = 1; // Reset streak if not consecutive
        }

        // Initialize weak topics if needed
        if (!userWeakTopics[user.id]) {
          userWeakTopics[user.id] = [];
        }

        // Update user's streak and last active
        const todayISO = today.toISOString().split('T')[0];
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