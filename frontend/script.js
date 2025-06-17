document.addEventListener('DOMContentLoaded', function () {
  // Theme toggle functionality
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
  
  // Login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
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
          localStorage.setItem('userId', data.userId);
          localStorage.setItem('username', data.username);
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1500);
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

  // Signup
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async function (e) {
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
});

// Only run quiz logic on quiz.html
if (window.location.pathname.endsWith('quiz.html')) {
  const quizContent = document.getElementById('quizContent');
  const submitBtn = document.getElementById('submitQuizBtn');
  let questions = [];
  let userAnswers = {};

  // Fetch questions from backend
  async function loadQuestions() {
    showLoading();
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('http://localhost:5000/api/questions');
      questions = await response.json();
      displayQuestions();
    } catch (error) {
      quizContent.innerHTML = '<p class="error">Failed to load questions. Please try again later.</p>';
    } finally {
      hideLoading();
    }
  }

  // Display questions and options
  function displayQuestions() {
    quizContent.innerHTML = '';
    questions.forEach((q, idx) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'quiz-question';
      qDiv.innerHTML = `
        <p><b>Q${idx + 1}:</b> ${q.question_text}</p>
        <label><input type="radio" name="q${q.id}" value="A"> ${q.option_a}</label><br>
        <label><input type="radio" name="q${q.id}" value="B"> ${q.option_b}</label><br>
        <label><input type="radio" name="q${q.id}" value="C"> ${q.option_c}</label><br>
        <label><input type="radio" name="q${q.id}" value="D"> ${q.option_d}</label>
        <hr>
      `;
      quizContent.appendChild(qDiv);
    });
    
    // Show navigation
    document.getElementById('quizNavigation').style.display = 'block';
    
    // Create question indicators
    const indicators = document.getElementById('questionIndicators');
    indicators.innerHTML = '';
    for (let i = 0; i < questions.length; i++) {
      const btn = document.createElement('button');
      btn.className = 'shortcut-btn';
      btn.textContent = i + 1;
      btn.onclick = () => jumpToQuestion(i);
      indicators.appendChild(btn);
    }
    
    // Update progress
    totalQuestionsCount = questions.length;
    document.getElementById('totalQuestions').textContent = totalQuestionsCount;
    updateProgress();
    
    // Start timer
    startTimer();
  }

  // Collect answers and submit
  submitBtn.onclick = async function () {
    showLoading();
    userAnswers = {};
    questions.forEach(q => {
      const selected = document.querySelector(`input[name="q${q.id}"]:checked`);
      userAnswers[q.id] = selected ? selected.value : null;
    });

    // Prepare answer array for backend
    const answersArr = questions.map(q => ({
      questionId: q.id,
      selectedOption: userAnswers[q.id]
    }));

    try {
      // Send to backend
      const response = await fetch('http://localhost:5000/api/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localStorage.getItem('userId'),
          answers: answersArr
        })
      });
      
      const result = await response.json();
      if (response.ok) {
        // Save result for results page
        localStorage.setItem('lastQuizResult', JSON.stringify(result));
        
        // Show confetti for good performance
        if (result.score / result.total >= 0.8) {
          showConfetti();
        }
        
        // Redirect to results page
        window.location.href = 'results.html';
      } else {
        showFeedback('Failed to submit quiz. Please try again.', true);
      }
    } catch (error) {
      showFeedback('Network error. Please try again.', true);
    } finally {
      hideLoading();
    }
  };

  // Load questions on page load
  loadQuestions();
}

// Only run results logic on results.html
if (window.location.pathname.endsWith('results.html')) {
  const resultsContent = document.getElementById('resultsContent');

  // Get last quiz result from localStorage (set after quiz submission)
  const lastQuizResult = localStorage.getItem('lastQuizResult');
  if (!lastQuizResult) {
    resultsContent.innerHTML = '<p>No recent quiz found. <a href="quiz.html">Take a quiz!</a></p>';
  } else {
    const result = JSON.parse(lastQuizResult);

    // Show score and summary
    let html = `<h2>Your Score: ${result.score} / ${result.total}</h2>`;

    // Show topic performance if available
    if (result.topicPerformance) {
      html += '<h3>Performance by Topic:</h3><ul>';
      for (const topic in result.topicPerformance) {
        const perf = result.topicPerformance[topic];
        const percent = ((perf.correct / perf.total) * 100).toFixed(1);
        html += `<li><b>${topic}:</b> ${perf.correct} / ${perf.total} correct (${percent}%)</li>`;
      }
      html += '</ul>';
    }

    // Recommendations (show topics with <70% accuracy)
    if (result.topicPerformance) {
      const weakTopics = Object.entries(result.topicPerformance)
        .filter(([topic, perf]) => perf.correct / perf.total < 0.7)
        .map(([topic]) => topic);
      if (weakTopics.length > 0) {
        html += `<p><b>Recommended for practice:</b> ${weakTopics.join(', ')}</p>`;
      } else {
        html += `<p><b>Great job! No weak topics detected.</b></p>`;
      }
    }

    html += `<button onclick="window.location.href='dashboard.html'">Back to Dashboard</button>
             <button onclick="window.location.href='quiz.html'">Practice Again</button>`;

    resultsContent.innerHTML = html;
  }
}

// Only run dashboard logic on dashboard.html
if (window.location.pathname.endsWith('dashboard.html')) {
  const dashboardContent = document.getElementById('dashboardContent');
  const userId = localStorage.getItem('userId');

  async function loadDashboard() {
    if (!userId) {
      dashboardContent.innerHTML = '<p>Please log in to view your dashboard.</p>';
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
      // If not implemented, skip
    }

    let html = `<h2>Your Dashboard</h2>`;

    // Show weak topics
    if (weakData.topics && weakData.topics.length > 0) {
      html += '<h3>Your Weakest Topics:</h3><ul>';
      weakData.topics.forEach(topic => {
        const percent = ((topic.correct / topic.total) * 100).toFixed(1);
        html += `<li><b>${topic.topic}:</b> ${topic.correct} / ${topic.total} correct (${percent}%)</li>`;
      });
      html += '</ul>';
    } else {
      html += '<p>No weak topics detected yet. Keep practicing!</p>';
    }

    // Show quiz history
    if (quizHistory.length > 0) {
      html += '<h3>Quiz History:</h3><ul>';
      quizHistory.forEach(q => {
        html += `<li>Score: ${q.score}, Date: ${new Date(q.start_time).toLocaleString()}</li>`;
      });
      html += '</ul>';
    }

    html += `<button onclick="window.location.href='quiz.html'">Start New Quiz</button>`;
    
    // Mock badge data
    const mockBadges = [
      { name: "First Quiz", earned: true, description: "Completed your first quiz!" },
      { name: "Topic Master", earned: false, description: "Scored 100% on a topic." },
      { name: "Practice Streak", earned: true, description: "Quizzed 3 days in a row!" },
      { name: "High Score", earned: false, description: "Scored 80% or higher on a quiz." }
    ];

    let badgesHTML = '';
    mockBadges.forEach(badge => {
      badgesHTML += `<div class="badge ${badge.earned ? 'earned' : 'locked'}">
        <span>${badge.earned ? '🏆' : '🔒'}</span>
        <strong>${badge.name}</strong>
        <p>${badge.description}</p>
      </div>`;
    });

    document.getElementById('badgesList').innerHTML = badgesHTML;

    dashboardContent.innerHTML = html;
  }

  loadDashboard();
}

// Utility functions
function showLoading() {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(overlay);
}

function hideLoading() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) overlay.remove();
}

function showFeedback(message, isError = false) {
  const feedback = document.createElement('div');
  feedback.className = isError ? 'feedback error' : 'feedback';
  feedback.textContent = message;
  document.body.appendChild(feedback);
  setTimeout(() => feedback.remove(), 3000);
}

function showConfetti() {
  for (let i = 0; i < 150; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.animationDelay = Math.random() * 2 + 's';
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
    document.body.appendChild(confetti);
    
    setTimeout(() => {
      confetti.remove();
    }, 5000);
  }
}