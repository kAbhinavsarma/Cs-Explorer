
<div align="center">
  <h1>CS Explorer</h1>
  <p>
    <b>Interactive Computer Science Quiz Platform</b><br>
    Adaptive learning, detailed analytics, achievements, and more.
  </p>
  <p>
    <img src="https://img.shields.io/badge/Node.js-Backend-green?logo=node.js" alt="Node.js">
    <img src="https://img.shields.io/badge/Frontend-HTML%2FCSS%2FJS-blue" alt="Frontend">
    <img src="https://img.shields.io/badge/SQLite-Database-lightgrey?logo=sqlite">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License">
  </p>

<p>
  <a href="https://cs-explorer-yawm.onrender.com/" target="_blank"><b>🚀 Live Demo: cs-explorer-yawm.onrender.com</b></a>
</p>
</div>


## 🚀 Features

### 🔒 Authentication
- Secure JWT-based authentication for user sessions
- Auth endpoints in `backend/auth.js` and `backend/authenticateToken.js`

### 🧠 Quiz Modes (5 Types)
- **Adaptive**: Adjusts question difficulty and topic based on user performance and history
- **All Topics**: Comprehensive quiz covering all topics
- **Weak Areas Combined**: Focuses on your weakest topics
- **Topic-Specific**: Practice on a selected topic
- **Timed Challenge**: 20 questions in 5 minutes

### 🏆 Streaks, Achievements, Badges
- Tracks daily streaks and longest streaks (`streak_days`, `longest_streak`)
- Earn achievements and badges for milestones and high performance
- Backend logic for awarding, checking, and notifying achievements and badges

### 📊 Statistics & Analytics
- Topic-wise performance and mastery endpoints (`/topic-performance-data/:userId`)
- User statistics endpoint (`/user-statistics/:userId`)
- Analytics endpoints for total quizzes and leaderboards (`backend/quizlyics.js`)

### 📈 Scoring & Performance
- Average score and accuracy calculated per topic and overall
- Achievements for perfect and high scores

### ⏱️ Study Time & Progress Tracking
- Study time displayed in the frontend (`dashboard.html`, `results-new.html`, `history-new.html`)
- Progress bars and completion percentages in the quiz interface (`quiz-new.html`, `script.js`)
- No backend tracking of study time; only frontend display and calculation

### 📝 Results Tracking
- Results and statistics stored in the backend and displayed in the frontend

---

## 🗂️ Project Structure

```
cs-explorer/
├── backend/      # Node.js server, authentication, quiz logic, analytics, database access
├── frontend/     # HTML, CSS, JS for user interface, quiz experience, and stats display
├── quizifycs.db  # SQLite database for users, quizzes, attempts, achievements, etc.
```

---


## 🛠️ Getting Started

### 🌐 Online

- Try the app live: [https://cs-explorer-yawm.onrender.com/](https://cs-explorer-yawm.onrender.com/)

### 💻 Local Development

1. Install dependencies:
   ```sh
   npm install
   ```
2. Initialize the database using `init_db.sql` or `init-db-from-sql.js`.
3. Start the project from the root directory:
   ```sh
   npm start
   ```
   This will launch the backend server and serve the frontend at [http://localhost:3000](http://localhost:3000) by default.
4. Alternatively, start the backend server from `backend/index.js` and open `frontend/index.html` manually in your browser.

---

## 📄 Notes
- All features listed above are strictly verified as implemented in the codebase.
- For further details, see the respective files and endpoints.
