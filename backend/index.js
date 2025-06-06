const express = require('express');
const cors = require('cors');
const app = express();

const db = require('./database'); // your SQLite connection module

// MIDDLEWARE: Always add these before your routes!
app.use(cors());
app.use(express.json()); // Parses JSON bodies

const quizRoutes = require('./quiz');
app.use('/api', quizRoutes);

const authRoutes = require('./auth');
app.use('/api', authRoutes);

app.get('/', (req, res) => {
  res.send('CS Explorer backend running!');
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
