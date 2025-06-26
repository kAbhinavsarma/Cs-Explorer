document.addEventListener('DOMContentLoaded', function() {
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      document.body.classList.toggle('dark-mode');
      const icon = this.querySelector('i');
      if (document.body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('theme', 'dark');
      } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('theme', 'light');
      }
    });
    // Apply saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      themeToggle.querySelector('i').classList.remove('fa-moon');
      themeToggle.querySelector('i').classList.add('fa-sun');
    }
  }

  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      showLoading();
      const username = document.getElementById('loginUsername').value;
      const password = document.getElementById('loginPassword').value;
      try {
        const response = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
  showFeedback('Login successful! Redirecting...', false);
  
  // FIX: Store userId and username
  localStorage.setItem('userId', data.userId);
  localStorage.setItem('username', data.username);
  localStorage.setItem('streak', data.streak);
  
  // Redirect to dashboard
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
} else {
  showFeedback(data.error || 'Login failed', true);
}
      } catch (error) {
        showFeedback('Network error. Please try again.', true);
      } finally {
        hideLoading();
      }
    });
  }

  // Signup form
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      showLoading();
      const username = document.getElementById('signupUsername').value;
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPassword').value;
      try {
        const response = await fetch('http://localhost:5000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (response.ok) {
          showFeedback('Signup successful! Please log in.', false);
          document.getElementById('loginUsername').value = username;
          document.getElementById('loginPassword').value = password;
        } else {
          showFeedback(data.error || 'Signup failed', true);
        }
      } catch (error) {
        showFeedback('Network error. Please try again.', true);
      } finally {
        hideLoading();
      }
    });
  }

  // Quiz logic
  if (window.location.pathname.endsWith('quiz.html')) {
    const quizContent = document.getElementById('quizContent');
    const submitBtn = document.getElementById('submitQuizBtn');
    const quizTimer = document.getElementById('quizTimer');
    const timerProgress = document.querySelector('.timer-progress .progress-fill');
    const questionShortcuts = document.getElementById('questionShortcuts');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const currentQuestionSpan = document.getElementById('currentQuestion');
    const totalQuestionsSpan = document.getElementById('totalQuestions');
    let questions = [];
    let userAnswers = {};
    let currentQuestion = 0;
    let timeLeft = 600; // 10 minutes in seconds
    let timer;

    // Start timer
    timer = setInterval(updateTimer, 1000);

    // Load questions
    loadQuestions();

    async function loadQuestions() {
      quizContent.innerHTML = '<div class="quiz-loading">Loading questions...</div>';
  const userId = localStorage.getItem('userId');
  
  try {
    let response;
    if (userId) {
      // Fetch adaptive questions for logged-in users
      response = await fetch('http://localhost:5000/api/adaptive-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
    } else {
      // Fetch random questions for guests
      response = await fetch('http://localhost:5000/api/questions');
    }
    
    questions = await response.json();
    
    if (questions.length === 0) {
      quizContent.innerHTML = '<div class="quiz-loading">No questions found. Please try again later.</div>';
      return;
    }
    
    displayQuestion(0);
        // Update progress indicator
        currentQuestionSpan.textContent = '1';
        totalQuestionsSpan.textContent = questions.length;
        // Create question shortcuts
        questionShortcuts.innerHTML = '';
        questions.forEach((_, idx) => {
          const btn = document.createElement('button');
          btn.className = 'shortcut-btn';
          btn.textContent = idx + 1;
          btn.addEventListener('click', () => {
            currentQuestion = idx;
            displayQuestion(idx);
          });
          questionShortcuts.appendChild(btn);
        });
        updateProgress();
      } catch (error) {
        quizContent.innerHTML = '<div class="quiz-loading">Failed to load questions. Please try again later.</div>';
        console.error(error);
      }
    }

    function displayQuestion(idx) {
      if (idx < 0 || idx >= questions.length) return;
      currentQuestion = idx;
      // Update progress indicator
      currentQuestionSpan.textContent = idx + 1;
      const q = questions[idx];
      // Highlight active shortcut
      Array.from(questionShortcuts.children).forEach((btn, i) => {
        btn.classList.toggle('active', i === idx);
      });
      // Update nav buttons
      prevBtn.disabled = idx === 0;
      nextBtn.disabled = idx === questions.length - 1;
      // Render question
      quizContent.innerHTML = `
        <div class="quiz-question">
          <strong>Q${idx + 1}:</strong> ${q.question_text}
        </div>
        <div class="options">
          ${['A', 'B', 'C', 'D'].map(opt => `
            <label>
              <input type="radio" name="answer" value="${opt}" ${userAnswers[idx] === opt ? 'checked' : ''}>
              ${opt}. ${q[`option_${opt.toLowerCase()}`]}
            </label>
          `).join('')}
        </div>
      `;
    }

    function updateTimer() {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(timer);
        submitQuiz();
      }
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      quizTimer.textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
      const progress = (timeLeft / 600) * 100;
      timerProgress.style.width = `${progress}%`;
      // Color changes
      if (timeLeft < 60) {
        quizTimer.style.color = '#e74c3c';
        timerProgress.style.background = '#e74c3c';
      }
      else if (timeLeft < 120) {
        quizTimer.style.color = '#f39c12';
        timerProgress.style.background = '#f39c12';
      }
    }

    function updateProgress() {
      const answered = Object.keys(userAnswers).length;
      const progress = (answered / questions.length) * 100;
      // No progress bar in this layout, but you can add one if needed
    }

    // Save answer on option select
    quizContent.addEventListener('change', function(e) {
      if (e.target.name === 'answer') {
        userAnswers[currentQuestion] = e.target.value;
        updateProgress();
      }
    });

    // Navigation
    prevBtn.addEventListener('click', () => {
      if (currentQuestion > 0) displayQuestion(currentQuestion - 1);
    });
    nextBtn.addEventListener('click', () => {
      if (currentQuestion < questions.length - 1) displayQuestion(currentQuestion + 1);
    });

    // Submit quiz
    submitBtn.addEventListener('click', submitQuiz);

    async function submitQuiz() {
      clearInterval(timer);
      const userId = localStorage.getItem('userId');
      if (!userId) {
        showFeedback('Please log in to submit your quiz.', true);
        return;
      }
      const answers = [];
      for (let i = 0; i < questions.length; i++) {
        answers.push({
          questionId: questions[i].id,
          selectedOption: userAnswers[i] || ''
        });
      }
      try {
        const response = await fetch('http://localhost:5000/api/submit-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, answers })
        });
        const result = await response.json();
        localStorage.setItem('lastQuizResult', JSON.stringify(result));
        // Redirect to results or dashboard
        window.location.href = 'results.html';
      } catch (error) {
        showFeedback('Failed to submit quiz. Please try again.', true);
        console.error(error);
      }
    }
  }

  // Dashboard logic
  if (window.location.pathname.endsWith('dashboard.html')) {
    updateDashboard();
  }

  // Results logic
  if (window.location.pathname.endsWith('results.html')) {
    const resultsContent = document.getElementById('resultsContent');
    const lastQuizResult = localStorage.getItem('lastQuizResult');
    if (!lastQuizResult) {
      resultsContent.innerHTML = `
        <div class="no-results">
          <p>No quiz results found. Take a quiz to see your results!</p>
          <a href="quiz.html" class="button">Start First Quiz</a>
        </div>
      `;
    } else {
      const result = JSON.parse(lastQuizResult);
      resultsContent.innerHTML = `
        <div class="result-summary">
          <h2>Quiz Results</h2>
          <p>Score: ${result.score}/${result.total}</p>
          <p>Percentage: ${Math.round((result.score / result.total) * 100)}%</p>
        </div>
      `;
      if (result.topicPerformance) {
      const weakTopics = Object.entries(result.topicPerformance)
        .filter(([_, stats]) => (stats.correct / stats.total) < 0.7)
        .map(([topic]) => topic);
      
      localStorage.setItem('weakTopics', JSON.stringify(weakTopics));
    }
      // Topic performance
      const topicPerformanceEl = document.getElementById('topicPerformance');
      if (result.topicPerformance && Object.keys(result.topicPerformance).length > 0) {
        topicPerformanceEl.innerHTML = Object.entries(result.topicPerformance).map(([topic, stats]) => `
          <div class="topic-stat">
            <strong>${topic}:</strong> ${stats.correct}/${stats.total} correct (${Math.round(stats.correct / stats.total * 100)}%)
          </div>
        `).join('');
      } else {
        topicPerformanceEl.innerHTML = '<p>No topic performance data available.</p>';
      }
      
      // Recommendations
      const recommendationsEl = document.getElementById('recommendations');
      if (result.topicPerformance) {
        const weakTopics = Object.entries(result.topicPerformance)
          .filter(([_, stats]) => (stats.correct / stats.total) < 0.7)
          .map(([topic]) => topic);
          
        if (weakTopics.length > 0) {
          recommendationsEl.innerHTML = `
            <h3>Focus Areas</h3>
            <ul>
              ${weakTopics.map(topic => `<li>${topic}</li>`).join('')}
            </ul>
            <p>Practice these topics to improve your score!</p>
          `;
        } else {
          recommendationsEl.innerHTML = '<p>Great job! You have no weak areas. Keep up the good work!</p>';
        }
      } else {
        recommendationsEl.innerHTML = '<p>No recommendations available.</p>';
      }
      
      // Time analysis
      const timeAnalysisEl = document.getElementById('timeAnalysis');
      if (result.timeAnalysis) {
        timeAnalysisEl.innerHTML = Object.entries(result.timeAnalysis).map(([label, value]) => `
          <div class="time-stat">
            <strong>${label}:</strong> ${value}
          </div>
        `).join('');
      } else {
        timeAnalysisEl.innerHTML = '<p>Time data not available.</p>';
      }
      
      // Achievement progress
      const achievementProgressEl = document.getElementById('achievementProgress');
      if (result.achievements && result.achievements.length > 0) {
        achievementProgressEl.innerHTML = `
          <h3>Earned Achievements</h3>
          <div class="badges-grid">
            ${result.achievements.map(ach => `
              <div class="badge new-badge">
                <i class="fas fa-medal"></i>
                <h4>${ach}</h4>
                <p>Earned just now!</p>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        achievementProgressEl.innerHTML = '<p>No achievements earned this time.</p>';
      }
      
      // Question review
      const questionReviewEl = document.getElementById('questionReview');
      if (result.questionReview && result.questionReview.length > 0) {
        questionReviewEl.innerHTML = `
          <div class="question-review-container">
            ${result.questionReview.map(q => `
              <div class="question-review ${q.isCorrect ? 'correct' : 'incorrect'}">
                <div class="question-header">
                  <strong>Q${q.number}:</strong> ${q.question}
                </div>
                <p class="user-answer">Your answer: ${q.yourAnswer || 'No answer'} 
                  <span class="result-icon">${q.isCorrect ? '✓' : '✗'}</span>
                </p>
                ${!q.isCorrect ? `<p class="correct-answer">Correct answer: ${q.correctAnswer}</p>` : ''}
                <p class="explanation">Explanation: ${q.explanation}</p>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        questionReviewEl.innerHTML = '<p>No question review data available.</p>';
      }
      
      // Learning path
      const learningPathEl = document.getElementById('learningPath');
      if (result.learningPath && result.learningPath.length > 0) {
        learningPathEl.innerHTML = `
          <h3>Recommended Learning Path</h3>
          <div class="path-container">
            ${result.learningPath.map(item => `
              <div class="path-item">
                <i class="fas ${item.completed ? 'fa-check-circle completed' : 'fa-circle not-completed'}"></i>
                <div>
                  <strong>${item.topic}</strong>
                  <p>${item.completed ? 'Completed' : 'Not completed'}</p>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        learningPathEl.innerHTML = '<p>No learning path data available.</p>';
      }
    }
  }
});

async function updateDashboard() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    document.getElementById('topicMastery').innerHTML = '<p>Please log in to view your dashboard.</p>';
    return;
  }
  
  // Fetch weak topics
  const weakRes = await fetch(`http://localhost:5000/api/user-weak-topics/${userId}`);
  const weakData = await weakRes.json();
  
  // Fetch quiz history
  let quizHistory = [];
  try {
    const histRes = await fetch(`http://localhost:5000/api/user-history/${userId}`);
    quizHistory = await histRes.json();
  } catch (e) {
    console.error('Failed to fetch quiz history:', e);
  }
  
  // Fetch badges
  const badgesRes = await fetch(`http://localhost:5000/api/user-badges/${userId}`);
  const badgesData = await badgesRes.json();
  
  // Update stats
  document.getElementById('quizzesCompleted').textContent = quizHistory.length || 0;
  
  // Calculate average score
  let totalScore = 0, totalQuestions = 0;
  quizHistory.forEach(attempt => {
    totalScore += attempt.score;
    totalQuestions += attempt.total_questions;
  });
  const averageScore = quizHistory.length ? Math.round((totalScore / totalQuestions) * 100) : 0;
  document.getElementById('averageScore').textContent = `${averageScore}%`;
  document.getElementById('badgesEarned').textContent = badgesData.badges?.length || '0';
  
  // Calculate total time practiced
  let totalTime = 0;
  quizHistory.forEach(attempt => {
    totalTime += attempt.time_taken || 0;
  });
  const hours = Math.floor(totalTime / 3600);
  const minutes = Math.floor((totalTime % 3600) / 60);
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  document.getElementById('timePracticed').textContent = timeStr;
  
  // Update topic mastery
  const topicMasteryEl = document.getElementById('topicMastery');
  if (quizHistory.length === 0) {
    topicMasteryEl.innerHTML = '<p>No mastery data yet. Take a quiz!</p>';
  } else if (weakData.topics && weakData.topics.length > 0) {
    topicMasteryEl.innerHTML = weakData.topics.map(topic => {
      const percentage = Math.round(topic.correct / topic.total * 100);
      return `
        <div class="topic-mastery">
          <div class="topic-header">
            <span>${topic.topic}</span>
            <span>${percentage}%</span>
          </div>
          <div class="mastery-bar">
            <div class="mastery-progress" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    topicMasteryEl.innerHTML = '<p>No weak topics detected yet. Keep practicing!</p>';
  }
  
  // Update focus areas (recommendations)
  const recommendationsEl = document.getElementById('recommendations');
  if (weakData.topics && weakData.topics.length > 0) {
    const weakTopics = weakData.topics
      .filter(topic => (topic.correct / topic.total) < 0.7)
      .map(topic => topic.topic);
      
    if (weakTopics.length > 0) {
      recommendationsEl.innerHTML = `
        <h3>Focus Areas</h3>
        <ul>
          ${weakTopics.map(topic => `<li>${topic}</li>`).join('')}
        </ul>
        <p>These topics need more practice based on your performance.</p>
      `;
    } else {
      recommendationsEl.innerHTML = '<p>Great job! You have no weak areas. Keep up the good work!</p>';
    }
  } else {
    recommendationsEl.innerHTML = '<p>No focus areas identified yet. Complete a quiz to get recommendations.</p>';
  }
  if (weakData.topics) {
    const weakTopics = weakData.topics
      .filter(topic => (topic.correct / topic.total) < 0.7)
      .map(topic => topic.topic);
    
    localStorage.setItem('weakTopics', JSON.stringify(weakTopics));
  }
  // Update recent activity
  const recentActivityEl = document.getElementById('recentActivity');
  if (quizHistory.length > 0) {
    recentActivityEl.innerHTML = quizHistory.slice(0, 5).map(attempt => `
      <div class="activity-item">
        <i class="fas fa-clipboard-list"></i>
        <div>
          <strong>${new Date(attempt.start_time).toLocaleDateString()}</strong>
          <p>Score: ${attempt.score}/${attempt.total_questions}</p>
        </div>
      </div>
    `).join('');
  } else {
    recentActivityEl.innerHTML = '<p>No recent quiz attempts. Take a quiz!</p>';
  }
  
  // Update recent achievements
  const recentAchievementsEl = document.getElementById('recentAchievements');
  if (badgesData.badges?.length > 0) {
    recentAchievementsEl.innerHTML = badgesData.badges.slice(0, 3).map(badge => `
      <div class="achievement-item">
        <i class="fas fa-medal"></i>
        <div>
          <strong>${badge.badge_name}</strong>
          <p>Earned on ${new Date(badge.date_awarded).toLocaleDateString()}</p>
        </div>
      </div>
    `).join('');
  } else {
    recentAchievementsEl.innerHTML = '<p>No achievements earned yet.</p>';
  }
  
  // Update streak
  const streak = localStorage.getItem('streak') || 0;
  const streakContainer = document.getElementById('streakContainer');
  if (streakContainer) {
    streakContainer.innerHTML = `
      <div class="streak-count">🔥 ${streak} day streak</div>
      <div class="streak-calendar">
        ${renderStreakCalendar(streak)}
      </div>
      <p>Complete a quiz today to keep your streak going!</p>
    `;
  }
}

function renderStreakCalendar(streak) {
  streak = parseInt(streak) || 0;
  return Array(7).fill(0).map((_, i) => {
    const isActive = i < streak;
    return `
      <div class="streak-day ${isActive ? 'active' : ''}">
        ${isActive ? '✓' : i+1}
      </div>
    `;
  }).join('');
}

function showLoading() {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = '<div class="loader"></div>';
  document.body.appendChild(overlay);
}

function hideLoading() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) overlay.remove();
}

function showFeedback(message, isError) {
  const feedback = document.createElement('div');
  feedback.className = `feedback ${isError ? 'error' : ''}`;
  feedback.textContent = message;
  document.body.appendChild(feedback);
  setTimeout(() => feedback.remove(), 3000);
}