const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('./database');

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
        userWeakTopics[userId] = [];
        // Insert user into DB
        db.run(
          'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
          [username, email, password_hash],
          function (err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Database error' });
            }
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
        const today = new Date().toISOString().split('T')[0];
        const lastActive = user.last_active || today;
        let streak = user.streak_days || 0;
        
        if (lastActive === today) {
          // Already active today, streak remains the same
        } else {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (lastActive === yesterdayStr) {
            streak = streak + 1;
          } else {
            streak = 1; // Reset streak if not consecutive
          }
        }
         if (!userWeakTopics[user.id]) {
          userWeakTopics[user.id] = [];
        }

        // Update user's streak and last active
        db.run(
          'UPDATE users SET last_active = ?, streak_days = ? WHERE id = ?',
          [today, streak, user.id],
          (err) => {
            if (err) {
              console.error('Update streak error:', err);
              // We still log in the user even if streak update fails
            }
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