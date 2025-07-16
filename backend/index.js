// Import JWT middleware for possible use in main app
const authenticateToken = require('./authenticateToken');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Import quiz routes and configurations
const quizRoutes = require('./quiz_new');
let authRoutes;
try {
  authRoutes = require('./auth');
} catch (error) {
  console.error('❌ Error importing auth routes:', error);
}
// const { ACHIEVEMENT_CONFIG } = require('./quiz_new'); // Uncomment if needed elsewhere

// Database setup - Initialize first so API routes can use it
const db = require('./database');

// Middleware
app.use(cors());
app.use(express.json());

// API routes MUST be defined BEFORE the static middleware.
app.use('/api/auth', authRoutes);
app.use('/api', quizRoutes);

// After mounting routes, list all registered routes
('🔍 All registered routes:');
app._router.stack.forEach((layer) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
    (`  ${methods} ${layer.route.path}`);
  }
});

// Static file middleware should come AFTER all API routes.
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback to index.html for single-page application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Note: Database tables are now managed by the optimized schema
// Tables: users, quiz_attempts, attempt_answers, achievements, 
//         user_topic_performance, notifications, user_activity



// Serve frontend files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/quiz-selection', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/quiz-selection-new.html'));
});

app.get('/quiz', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/quiz-new.html'));
});

app.get('/results', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/results-new.html'));
});

app.get('/history', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/history-new.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  ('🚀 CS Explorer server running on port', PORT);
  ('📊 Dashboard: http://localhost:3000/');
});

module.exports = app;