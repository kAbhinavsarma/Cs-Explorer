const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const db = require('./database');

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// API Routes
const quizRoutes = require('./quiz');
app.use('/api', quizRoutes);

const authRoutes = require('./auth');
app.use('/api', authRoutes);

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Handle all routes, return all requests to the app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});