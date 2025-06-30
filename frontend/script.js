// Configuration for API URLs
const API_CONFIG = {
  baseURL: window.location.origin,
  endpoints: {
    login: '/api/login',
    register: '/api/register',
    questions: '/api/questions',
    adaptiveQuestions: '/api/adaptive-questions',
    submitQuiz: '/api/submit-quiz',
    userWeakTopics: '/api/user-weak-topics',
    userHistory: '/api/user-history',
    userBadges: '/api/user-badges',
    createSampleData: '/api/create-sample-data'
  }
};

// Helper function to build full API URL
function getApiUrl(endpoint, params = '') {
  return `${API_CONFIG.baseURL}${API_CONFIG.endpoints[endpoint]}${params}`;
}

document.addEventListener('DOMContentLoaded', function() {
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      console.log('Login form submitted');
      
      const usernameField = document.getElementById('loginUsername');
      const passwordField = document.getElementById('loginPassword');
      
      if (!usernameField || !passwordField) {
        console.error('Login form fields not found');
        alert('Login form error. Please refresh the page.');
        return;
      }
      
      const username = usernameField.value.trim();
      const password = passwordField.value.trim();
      
      if (!username || !password) {
        alert('Please enter both username and password');
        return;
      }
      
      showLoading();
      
      console.log('Username:', username);
      console.log('Attempting login...');
      
      try {
        const response = await fetch(getApiUrl('login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok) {
          console.log('Login successful, preparing redirect...');
          
          // Store userId and username immediately
          localStorage.setItem('userId', data.userId);
          localStorage.setItem('username', data.username);
          localStorage.setItem('streak', data.streak || 0);
          
          console.log('Data stored in localStorage');
          console.log('Stored userId:', localStorage.getItem('userId'));
          console.log('Stored username:', localStorage.getItem('username'));
          
          // Hide loading immediately
          hideLoading();
          
          // Show success message
          showFeedback('Login successful! Redirecting...', false);
          
          // Show redirect message
          const redirectMessage = document.createElement('div');
          redirectMessage.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #28a745;
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            z-index: 10000;
            font-weight: bold;
          `;
          redirectMessage.textContent = 'Login Successful! Redirecting to dashboard...';
          document.body.appendChild(redirectMessage);
          
          console.log('About to redirect to dashboard...');
          
          // Immediate redirect without setTimeout
          console.log('Executing immediate redirect...');
          console.log('Current location:', window.location.href);
          
          try {
            // Disable the form to prevent further submissions
            const form = e.target;
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) submitButton.disabled = true;
            
            // Force immediate redirect
            window.location.replace('dashboard.html');
            
          } catch (error) {
            console.error('Immediate redirect failed, trying alternative methods:', error);
            
            // Try with a minimal delay
            setTimeout(() => {
              try {
                window.location.href = 'dashboard.html';
              } catch (e2) {
                console.error('All redirect methods failed:', e2);
                alert('Please click OK to go to dashboard');
                window.open('dashboard.html', '_self');
              }
            }, 100);
          }
          
          // Ensure function returns early to prevent further execution
          return;
        } else {
          showFeedback(data.error || 'Login failed', true);
          console.error('Login failed:', data.error);
          hideLoading();
        }
      } catch (error) {
        console.error('Network error:', error);
        showFeedback('Network error. Please check if the server is running.', true);
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
        const response = await fetch(getApiUrl('register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (response.ok) {
          showFeedback('Signup successful! Please log in.', false);
          // Switch to login tab and fill username
          const loginTabBtn = document.querySelector('.auth-tab[data-tab="login"]');
          if (loginTabBtn) loginTabBtn.click();
          setTimeout(() => {
            document.getElementById('loginUsername').value = username;
            document.getElementById('loginPassword').value = password;
          }, 100);
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

  // Auth tab switching functionality
  const authTabs = document.querySelectorAll('.auth-tab');
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  
  if (authTabs.length > 0) {
    authTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const tabType = this.getAttribute('data-tab');
        
        // Remove active class from all tabs
        authTabs.forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        this.classList.add('active');
        
        // Hide all tab content
        if (loginTab) loginTab.classList.add('hidden');
        if (signupTab) signupTab.classList.add('hidden');
        
        // Show selected tab content
        if (tabType === 'login' && loginTab) {
          loginTab.classList.remove('hidden');
        } else if (tabType === 'signup' && signupTab) {
          signupTab.classList.remove('hidden');
        }
      });
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
      response = await fetch(getApiUrl('adaptiveQuestions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
    } else {
      // Fetch random questions for guests
      response = await fetch(getApiUrl('questions'));
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

    // Enhanced quiz functionality
    function updateProgress() {
      const answered = Object.keys(userAnswers).length;
      const progress = (answered / questions.length) * 100;
      const overallProgress = document.getElementById('overallProgress');
      const progressPercentage = document.getElementById('progressPercentage');
      
      if (overallProgress) {
        overallProgress.style.width = `${progress}%`;
      }
      if (progressPercentage) {
        progressPercentage.textContent = `${Math.round(progress)}%`;
      }
      
      // Update shortcut button states
      Array.from(questionShortcuts.children).forEach((btn, i) => {
        btn.classList.toggle('answered', userAnswers[i] !== undefined);
      });
    }

    function updateTimerDisplay() {
      const timerFill = document.querySelector('.timer-fill');
      if (timerFill) {
        const progress = (timeLeft / 600) * 100;
        timerFill.style.width = `${progress}%`;
        
        // Color changes based on time remaining
        if (timeLeft < 60) {
          timerFill.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
          quizTimer.style.color = '#e74c3c';
        } else if (timeLeft < 120) {
          timerFill.style.background = 'linear-gradient(45deg, #f39c12, #e67e22)';
          quizTimer.style.color = '#f39c12';
        } else {
          timerFill.style.background = 'linear-gradient(45deg, #2ecc71, #27ae60)';
          quizTimer.style.color = 'white';
        }
      }
    }

    // Enhanced display question function
    function enhancedDisplayQuestion(idx) {
      if (idx < 0 || idx >= questions.length) return;
      currentQuestion = idx;
      
      // Update progress indicator
      const currentQuestionSpan = document.getElementById('currentQuestion');
      if (currentQuestionSpan) {
        currentQuestionSpan.textContent = idx + 1;
      }
      
      const q = questions[idx];
      
      // Highlight active shortcut
      Array.from(questionShortcuts.children).forEach((btn, i) => {
        btn.classList.toggle('active', i === idx);
      });
      
      // Update nav buttons
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');
      if (prevBtn) prevBtn.disabled = idx === 0;
      if (nextBtn) nextBtn.disabled = idx === questions.length - 1;
      
      // Enhanced question rendering with animations
      quizContent.innerHTML = `
        <div class="quiz-question">
          <div class="question-number">Question ${idx + 1}</div>
          <div class="question-text">${q.question_text}</div>
        </div>
        <div class="options">
          ${['A', 'B', 'C', 'D'].map(opt => `
            <label class="option-label ${userAnswers[idx] === opt ? 'selected' : ''}">
              <input type="radio" name="answer" value="${opt}" ${userAnswers[idx] === opt ? 'checked' : ''}>
              <span class="option-letter">${opt}</span>
              <span class="option-text">${q[`option_${opt.toLowerCase()}`]}</span>
              <span class="option-check">
                <i class="fas fa-check"></i>
              </span>
            </label>
          `).join('')}
        </div>
      `;
      
      // Add animation class
      quizContent.classList.add('question-enter');
      setTimeout(() => {
        quizContent.classList.remove('question-enter');
      }, 300);
      
      updateProgress();
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
        const response = await fetch(getApiUrl('submitQuiz'), {
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
    console.log('Dashboard page detected, loading dashboard...');
    try {
      updateDashboard();
    } catch (error) {
      console.error('Error loading dashboard:', error);
      alert('Error loading dashboard. Please check the console for details.');
    }
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
  console.log('UpdateDashboard called');
  const userId = localStorage.getItem('userId');
  if (!userId) {
    console.error('No userId found in localStorage');
    document.getElementById('topicMastery').innerHTML = '<p>Please log in to view your dashboard.</p>';
    return;
  }
  
  console.log('Found userId:', userId);
  
  // Update username display
  const username = localStorage.getItem('username') || 'Student';
  const sidebarUsernameEl = document.getElementById('sidebarUsername');
  if (sidebarUsernameEl) {
    sidebarUsernameEl.textContent = username;
    console.log('Updated sidebar username to:', username);
  }
  
  try {
    // Fetch weak topics with error handling
    console.log('Fetching weak topics...');
    const weakRes = await fetch(getApiUrl('userWeakTopics', `/${userId}`));
    const weakData = await weakRes.json();
    console.log('Weak topics data:', weakData);
    
    // Fetch quiz history with error handling
    let quizHistory = [];
    try {
      console.log('Fetching quiz history...');
      const histRes = await fetch(getApiUrl('userHistory', `/${userId}`));
      quizHistory = await histRes.json();
      console.log('Quiz history:', quizHistory);
    } catch (e) {
      console.error('Failed to fetch quiz history:', e);
      quizHistory = []; // Default to empty array
    }
    
    // Fetch badges with error handling
    let badgesData = { badges: [] };
    try {
      console.log('Fetching badges...');
      const badgesRes = await fetch(getApiUrl('userBadges', `/${userId}`));
      badgesData = await badgesRes.json();
      console.log('Badges data:', badgesData);
    } catch (e) {
      console.error('Failed to fetch badges:', e);
      badgesData = { badges: [] }; // Default structure
    }
    
    // Update stats with error handling
    const quizzesCompletedEl = document.getElementById('quizzesCompleted');
    if (quizzesCompletedEl) {
      quizzesCompletedEl.textContent = quizHistory.length || 0;
      console.log('Updated quizzes completed:', quizHistory.length);
    }
    
    // Calculate average score
    let totalScore = 0, totalQuestions = 0;
    quizHistory.forEach(attempt => {
      totalScore += attempt.score || 0;
      totalQuestions += attempt.total_questions || 0;
    });
    const averageScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    
    const averageScoreEl = document.getElementById('averageScore');
    if (averageScoreEl) {
      averageScoreEl.textContent = `${averageScore}%`;
      console.log('Updated average score:', averageScore);
    }
    
    const badgesEarnedEl = document.getElementById('badgesEarned');
    if (badgesEarnedEl) {
      badgesEarnedEl.textContent = badgesData.badges?.length || '0';
      console.log('Updated badges earned:', badgesData.badges?.length || 0);
    }
    
    // Initialize notification system
    try {
      createProgressNotifications(userId);
      updateNotificationBadge();
    } catch (e) {
      console.error('Error with notifications:', e);
    }
    
    // Calculate total time practiced
    let totalTime = 0;
    quizHistory.forEach(attempt => {
      totalTime += attempt.time_taken || 0;
    });
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    
    const timePracticedEl = document.getElementById('timePracticed');
    if (timePracticedEl) {
      timePracticedEl.textContent = timeStr;
      console.log('Updated time practiced:', timeStr);
    }
    
    // Update streak displays
    const currentStreak = calculateCurrentStreak();
    const sidebarStreakEl = document.getElementById('sidebarStreak');
    const headerStreakEl = document.getElementById('headerStreak');
    if (sidebarStreakEl) sidebarStreakEl.textContent = currentStreak;
    if (headerStreakEl) headerStreakEl.textContent = currentStreak;
    console.log('Updated streak displays:', currentStreak);
    
    // Update topic mastery with new design
    const topicMasteryEl = document.getElementById('topicMastery');
    if (topicMasteryEl) {
      if (quizHistory.length === 0) {
        topicMasteryEl.innerHTML = '<div class="topic-item"><div class="topic-name">No mastery data yet</div><div class="topic-progress"><span>Take a quiz to get started!</span></div></div>';
      } else if (weakData.topics && weakData.topics.length > 0) {
        topicMasteryEl.innerHTML = weakData.topics.map(topic => {
          const percentage = Math.round((topic.correct / topic.total) * 100);
          return `
            <div class="topic-item">
              <div class="topic-name">${topic.topic}</div>
              <div class="topic-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="progress-text">${percentage}%</span>
              </div>
            </div>
          `;
        }).join('');
      } else {
        topicMasteryEl.innerHTML = '<div class="topic-item"><div class="topic-name">No weak topics detected</div><div class="topic-progress"><span>Keep practicing!</span></div></div>';
      }
      console.log('Updated topic mastery display');
    }
    
    // Update focus areas (recommendations)
    const recommendationsEl = document.getElementById('recommendations');
    if (recommendationsEl) {
      if (weakData.topics && weakData.topics.length > 0) {
        const weakTopics = weakData.topics
          .filter(topic => (topic.correct / topic.total) < 0.7)
          .map(topic => topic.topic);
          
        if (weakTopics.length > 0) {
          recommendationsEl.innerHTML = weakTopics.map(topic => `
            <div class="focus-item">
              <div class="focus-title">${topic}</div>
              <div class="focus-desc">This topic needs more practice based on your performance.</div>
            </div>
          `).join('');
        } else {
          recommendationsEl.innerHTML = '<div class="focus-item" style="background: linear-gradient(135deg, #f0fff4, #e0ffe0); border-left-color: #2ecc71;"><div class="focus-title" style="color: #27ae60;">Great job!</div><div class="focus-desc">You have no weak areas. Keep up the good work!</div></div>';
        }
      } else {
        recommendationsEl.innerHTML = '<div class="focus-item"><div class="focus-title">No focus areas identified yet</div><div class="focus-desc">Complete a quiz to get personalized recommendations.</div></div>';
      }
      console.log('Updated recommendations');
    }
    
    // Update recent activity
    const recentActivityEl = document.getElementById('recentActivity');
    if (recentActivityEl) {
      if (quizHistory.length > 0) {
        const recentQuizzes = quizHistory.slice(-5).reverse(); // Last 5 quizzes, most recent first
        recentActivityEl.innerHTML = recentQuizzes.map(quiz => {
          const date = new Date(quiz.completed_at || Date.now()).toLocaleDateString();
          const score = quiz.score || 0;
          const total = quiz.total_questions || 0;
          const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
          return `
            <div class="activity-item">
              <div class="activity-icon">
                <i class="fas fa-brain" style="color: ${percentage >= 70 ? '#2ecc71' : percentage >= 50 ? '#f39c12' : '#e74c3c'};"></i>
              </div>
              <div class="activity-content">
                <div class="activity-title">Quiz Completed</div>
                <div class="activity-desc">Score: ${score}/${total} (${percentage}%)</div>
                <div class="activity-time">${date}</div>
              </div>
            </div>
          `;
        }).join('');
      } else {
        recentActivityEl.innerHTML = '<div class="activity-item"><div class="activity-content"><div class="activity-title">No recent activity</div><div class="activity-desc">Take your first quiz to see activity here!</div></div></div>';
      }
      console.log('Updated recent activity');
    }
    
    // Update recent achievements
    const recentAchievementsEl = document.getElementById('recentAchievements');
    if (recentAchievementsEl) {
      if (badgesData.badges && badgesData.badges.length > 0) {
        const recentBadges = badgesData.badges.slice(-3); // Show last 3 badges
        recentAchievementsEl.innerHTML = recentBadges.map(badge => `
          <div class="achievement-item">
            <div class="achievement-icon">
              <i class="fas fa-medal" style="color: #f39c12;"></i>
            </div>
            <div class="achievement-content">
              <div class="achievement-title">${badge.name || 'Achievement'}</div>
              <div class="achievement-desc">${badge.description || 'Great job!'}</div>
            </div>
          </div>
        `).join('');
      } else {
        recentAchievementsEl.innerHTML = '<div class="achievement-item"><div class="achievement-content"><div class="achievement-title">No achievements yet</div><div class="achievement-desc">Complete quizzes to earn your first badge!</div></div></div>';
      }
      console.log('Updated recent achievements');
    }
    
    // Update streak container
    const streakContainerEl = document.getElementById('streakContainer');
    if (streakContainerEl) {
      const currentStreak = calculateCurrentStreak();
      streakContainerEl.innerHTML = `
        <div class="streak-display">
          <div class="streak-number">${currentStreak}</div>
          <div class="streak-label">Day${currentStreak !== 1 ? 's' : ''}</div>
          <div class="streak-fire">🔥</div>
        </div>
        <div class="streak-message">
          ${currentStreak === 0 ? 'Start your learning streak today!' : 
            currentStreak === 1 ? 'Great start! Keep it going tomorrow!' :
            currentStreak < 7 ? 'Building momentum! Keep it up!' :
            currentStreak < 30 ? 'Amazing streak! You\'re on fire!' :
            'Incredible dedication! You\'re a learning legend!'}
        </div>
      `;
      console.log('Updated streak container');
    }
    
    // Add button event listeners
    setupDashboardButtons();
    
  } catch (error) {
    console.error('Error in updateDashboard:', error);
    // Show fallback content
    const topicMasteryEl = document.getElementById('topicMastery');
    if (topicMasteryEl) {
      topicMasteryEl.innerHTML = '<div class="topic-item"><div class="topic-name">Error loading data</div><div class="topic-progress"><span>Please refresh the page</span></div></div>';
    }
  }
}

// Setup dashboard button event listeners
function setupDashboardButtons() {
  console.log('Setting up dashboard buttons...');
  
  // Notification bell event listener
  const notificationBell = document.querySelector('.notification-bell');
  if (notificationBell) {
    notificationBell.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Notification bell clicked');
      showNotificationsModal();
    });
  }
  
  // Quick action buttons
  const startQuizBtn = document.querySelector('a[href="quiz.html"]');
  if (startQuizBtn) {
    startQuizBtn.addEventListener('click', function(e) {
      console.log('Start Quiz button clicked');
    });
  }
  
  const practiceWeakBtn = document.getElementById('practiceWeakBtn');
  if (practiceWeakBtn) {
    practiceWeakBtn.addEventListener('click', function() {
      console.log('Practice Weak Areas button clicked');
      window.location.href = 'quiz.html';
    });
  }
  
  const reviewBtn = document.getElementById('reviewBtn');
  if (reviewBtn) {
    reviewBtn.addEventListener('click', function() {
      console.log('Review Mistakes button clicked');
      window.location.href = 'results.html';
    });
  }
  
  // Sidebar menu items
  const takeQuizLink = document.querySelector('a[href="quiz.html"]');
  if (takeQuizLink) {
    takeQuizLink.addEventListener('click', function(e) {
      console.log('Take Quiz sidebar link clicked');
    });
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      console.log('Logout button clicked');
      localStorage.clear();
      window.location.href = 'index.html';
    });
  }
  
  // Dropdown toggles
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Dropdown toggle clicked:', this.getAttribute('data-dropdown'));
      
      const dropdownId = this.getAttribute('data-dropdown');
      const dropdown = document.getElementById(dropdownId + 'Dropdown');
      const parentMenuItem = this.parentElement;
      
      // Close all other dropdowns and remove active state
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu !== dropdown) {
          menu.classList.remove('show');
        }
      });
      document.querySelectorAll('.menu-item.dropdown').forEach(item => {
        if (item !== parentMenuItem) {
          item.classList.remove('active');
        }
      });
      
      if (dropdown) {
        const isShowing = dropdown.classList.contains('show');
        dropdown.classList.toggle('show');
        parentMenuItem.classList.toggle('active', !isShowing);
        console.log('Dropdown toggled:', dropdown.classList.contains('show'));
      }
    });
  });
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
      });
      document.querySelectorAll('.menu-item.dropdown').forEach(item => {
        item.classList.remove('active');
      });
    }
  });
  
  // Practice dropdown options
  const practiceWeakTopics = document.getElementById('practiceWeakTopics');
  if (practiceWeakTopics) {
    practiceWeakTopics.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Practice weak topics clicked');
      window.location.href = 'quiz.html';
    });
  }
  
  const practiceByTopic = document.getElementById('practiceByTopic');
  if (practiceByTopic) {
    practiceByTopic.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Practice by topic clicked');
      window.location.href = 'quiz.html';
    });
  }
  
  const practiceRandom = document.getElementById('practiceRandom');
  if (practiceRandom) {
    practiceRandom.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Practice random clicked');
      window.location.href = 'quiz.html';
    });
  }
  
  // Progress dropdown options
  const viewBadges = document.getElementById('viewBadges');
  if (viewBadges) {
    viewBadges.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('View badges clicked');
      showBadgesModal();
    });
  }
  
  const viewStats = document.getElementById('viewStats');
  if (viewStats) {
    viewStats.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('View stats clicked');
      showStatsModal();
    });
  }
  
  console.log('Dashboard buttons setup complete');
}

// Calculate current learning streak
function calculateCurrentStreak() {
  const streak = localStorage.getItem('streak') || 0;
  console.log('Retrieved streak from localStorage:', streak);
  return parseInt(streak);
}

// Helper function to get achievement name
function getAchievementName(achievementId) {
  const achievementNames = {
    'first_quiz': 'First Steps',
    'quiz_streak_3': '3-Day Streak',
    'quiz_streak_7': 'Week Warrior',
    'quiz_streak_30': 'Month Master',
    'perfect_score': 'Perfect Score',
    'quiz_master': 'Quiz Master',
    'algorithm_expert': 'Algorithm Expert',
    'data_structure_pro': 'Data Structure Pro',
    'quick_learner': 'Quick Learner',
    'dedicated_learner': 'Dedicated Learner'
  };
  return achievementNames[achievementId] || 'Achievement';
}

// Utility functions for UI feedback and loading states
function showLoading() {
  // Remove existing loading overlay if any
  const existingOverlay = document.querySelector('.loading-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }
  
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div class="loader">
      <div class="loader-circle"></div>
      <div class="loader-text">Loading...</div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function hideLoading() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) {
    overlay.remove();
  }
}

function showFeedback(message, isError = false) {
  // Remove existing feedback
  const existingFeedback = document.querySelector('.feedback');
  if (existingFeedback) {
    existingFeedback.remove();
  }
  
  const feedback = document.createElement('div');
  feedback.className = `feedback ${isError ? 'error' : 'success'}`;
  feedback.innerHTML = `
    <div class="feedback-content">
      <i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
      <span class="feedback-message">${message}</span>
    </div>
  `;
  
  document.body.appendChild(feedback);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    if (feedback && feedback.parentNode) {
      feedback.remove();
    }
  }, 3000);
}

// Function to create progress notifications
function createProgressNotifications(userId) {
  const achievements = achievementSystem.getProgress(userId);
  const streak = calculateCurrentStreak();
  const storedNotifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
  let newNotifications = [];
  
  // Create streak notifications
  if (streak >= 7) {
    const streakNotificationExists = storedNotifications.some(n => n.type === 'streak' && n.message.includes(`${streak}-day`));
    if (!streakNotificationExists) {
      newNotifications.push({
        id: Date.now() + Math.random(),
        icon: 'fa-fire',
        type: 'streak',
        title: 'Streak Milestone!',
        message: `Amazing! You're on a ${streak}-day learning streak! Keep it up!`,
        time: 'Today',
        action: 'Take Quiz',
        actionFn: 'goToQuiz',
        read: false
      });
    }
  } else if (streak === 0) {
    const reminderExists = storedNotifications.some(n => n.type === 'reminder' && n.title === 'Daily Learning Reminder');
    if (!reminderExists) {
      newNotifications.push({
        id: Date.now() + Math.random(),
        icon: 'fa-calendar-check',
        type: 'reminder',
        title: 'Daily Learning Reminder',
        message: 'Start or continue your learning streak today!',
        time: 'Today',
        action: 'Take Quiz',
        actionFn: 'goToQuiz',
        read: false
      });
    }
  }
  
  // Create progress notifications for achievements close to completion
  Object.entries(achievements).forEach(([id, achievement]) => {
    if (achievement.current > 0 && achievement.current < achievement.target) {
      const progressPercent = (achievement.current / achievement.target) * 100;
      if (progressPercent >= 75) {
        const progressNotificationExists = storedNotifications.some(n => 
          n.type === 'progress' && n.message.includes(getAchievementName(id))
        );
        if (!progressNotificationExists) {
          newNotifications.push({
            id: Date.now() + Math.random(),
            icon: 'fa-chart-line',
            type: 'progress',
            title: 'Almost There!',
            message: `You're ${achievement.target - achievement.current} steps away from earning "${getAchievementName(id)}"!`,
            time: 'Today',
            action: 'View Progress',
            actionFn: 'viewBadges',
            read: false
          });
        }
      }
    }
  });
  
  // Add welcome notification for new users
  if (storedNotifications.length === 0) {
    newNotifications.push(
      {
        id: Date.now() + Math.random(),
        icon: 'fa-hand-wave',
        type: 'welcome',
        title: 'Welcome to CS Explorer!',
        message: 'Start your journey by taking your first quiz and earning achievements!',
        time: 'Just now',
        action: 'Take Quiz',
        actionFn: 'goToQuiz',
        read: false
      },
      {
        id: Date.now() + Math.random() + 1,
        icon: 'fa-target',
        type: 'tip',
        title: 'Learning Tip',
        message: 'Set a daily learning goal and maintain your streak for better retention!',
        time: '2 minutes ago',
        action: 'View Tips',
        actionFn: 'viewTips',
        read: false
      },
      {
        id: Date.now() + Math.random() + 2,
        icon: 'fa-trophy',
        type: 'challenge',
        title: 'Weekly Challenge',
        message: 'Complete 5 quizzes this week to earn the "Dedicated Learner" badge!',
        time: '1 hour ago',
        action: 'Start Challenge',
        actionFn: 'goToQuiz',
        read: false
      }
    );
  }
  
  // Add new notifications to stored ones
  if (newNotifications.length > 0) {
    const updatedNotifications = [...newNotifications, ...storedNotifications];
    // Keep only last 20 notifications
    if (updatedNotifications.length > 20) {
      updatedNotifications.splice(20);
    }
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(updatedNotifications));
  }
  
  return newNotifications.length > 0;
}

// Function to add a notification when achievements are earned
function addAchievementNotification(userId, achievementId) {
  const storedNotifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
  
  // Check if notification already exists
  const notificationExists = storedNotifications.some(n => 
    n.type === 'achievement' && n.message.includes(getAchievementName(achievementId))
  );
  
  if (!notificationExists) {
    storedNotifications.unshift({
      id: Date.now(),
      icon: 'fa-trophy',
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: `You earned the "${getAchievementName(achievementId)}" badge!`,
      time: 'Just now',
      action: 'View Badge',
      actionFn: 'viewBadges',
      read: false
    });
    
    // Keep only last 20 notifications
    if (storedNotifications.length > 20) {
      storedNotifications.splice(20);
    }
    
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(storedNotifications));
    updateNotificationBadge();
  }
}

// Function to add a streak notification
function addStreakNotification(userId, streak) {
  if (streak < 3) return; // Only notify for streaks of 3 or more
  
  const storedNotifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
  
  // Check if similar streak notification already exists
  const streakNotificationExists = storedNotifications.some(n => 
    n.type === 'streak' && n.message.includes(`${streak}-day`)
  );
  
  if (!streakNotificationExists) {
    storedNotifications.unshift({
      id: Date.now(),
      icon: 'fa-fire',
      type: 'streak',
      title: 'Streak Achievement!',
      message: `Congratulations! You've maintained a ${streak}-day learning streak!`,
      time: 'Just now',
      action: 'Keep Going',
      actionFn: 'goToQuiz',
      read: false
    });
    
    // Keep only last 20 notifications
    if (storedNotifications.length > 20) {
      storedNotifications.splice(20);
    }
    
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(storedNotifications));
    updateNotificationBadge();
  }
}

// Notification functions
function showNotificationsModal() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  
  // Create modal if it doesn't exist
  let modal = document.getElementById('notificationsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'notificationsModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Notifications</h3>
          <div class="modal-header-actions">
            <button class="mark-all-read-btn" onclick="markAllNotificationsRead()">Mark All Read</button>
            <button class="modal-close" onclick="hideNotificationsModal()">&times;</button>
          </div>
        </div>
        <div class="modal-body">
          <div id="notificationsList">
            <!-- Notifications will be populated here -->
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Add click outside to close functionality
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        hideNotificationsModal();
      }
    });
  }
  
  // Load and display notifications
  loadNotifications();
  modal.style.display = 'flex';
}

function hideNotificationsModal() {
  const modal = document.getElementById('notificationsModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function loadNotifications() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  
  const notifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
  const notificationsList = document.getElementById('notificationsList');
  
  if (!notificationsList) return;
  
  if (notifications.length === 0) {
    notificationsList.innerHTML = `
      <div class="no-notifications">
        <i class="fas fa-bell-slash"></i>
        <p>No notifications yet</p>
        <small>Complete activities to receive notifications</small>
      </div>
    `;
    return;
  }
  
  notificationsList.innerHTML = notifications.map((notification, index) => `
    <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-index="${index}">
      <div class="notification-icon">
        <i class="fas ${getNotificationIcon(notification.type)}"></i>
      </div>
      <div class="notification-content">
        <div class="notification-title">${notification.title}</div>
        <div class="notification-text">${notification.message}</div>
        <div class="notification-time">${notification.time}</div>
      </div>
      <div class="notification-actions">
        ${!notification.read ? `<button class="mark-read-btn" onclick="markNotificationRead(${index})" title="Mark as read"><i class="fas fa-check"></i></button>` : ''}
        <button class="delete-notification-btn" onclick="deleteNotification(${index})" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function getNotificationIcon(type) {
  switch(type) {
    case 'streak': return 'fa-fire';
    case 'achievement': return 'fa-trophy';
    case 'reminder': return 'fa-clock';
    case 'progress': return 'fa-chart-line';
    case 'welcome': return 'fa-hand-wave';
    default: return 'fa-info-circle';
  }
}

function markNotificationRead(index) {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  
  const notifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
  if (notifications[index]) {
    notifications[index].read = true;
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
    loadNotifications();
    updateNotificationBadge();
  }
}

function markAllNotificationsRead() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  
  const notifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
  notifications.forEach(notification => notification.read = true);
  localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
  loadNotifications();
  updateNotificationBadge();
}

function deleteNotification(index) {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  
  const notifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
  notifications.splice(index, 1);
  localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
  loadNotifications();
  updateNotificationBadge();
}

function updateNotificationBadge() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  
  const badge = document.querySelector('.notification-badge');
  if (!badge) return;
  
  const notifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
  const unreadCount = notifications.filter(n => !n.read).length;
  
  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.style.display = 'inline';
  } else {
    badge.style.display = 'none';
  }
}

// Function to show badges modal
function showBadgesModal() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  
  // Create modal if it doesn't exist
  let modal = document.getElementById('badgesModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'badgesModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Your Badges & Achievements</h3>
          <button class="modal-close" onclick="hideBadgesModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div id="badgesList">
            <div class="loading">Loading your badges...</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Add click outside to close functionality
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        hideBadgesModal();
      }
    });
  }
  
  // Load and display badges
  loadUserBadges();
  modal.style.display = 'flex';
}

function hideBadgesModal() {
  const modal = document.getElementById('badgesModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

async function loadUserBadges() {
  const userId = localStorage.getItem('userId');
  const badgesList = document.getElementById('badgesList');
  
  if (!badgesList) return;
  
  try {
    const response = await fetch(getApiUrl('userBadges', `/${userId}`));
    const data = await response.json();
    
    if (data.badges && data.badges.length > 0) {
      badgesList.innerHTML = `
        <div class="badges-grid">
          ${data.badges.map(badge => `
            <div class="badge-card earned">
              <div class="badge-icon">
                <i class="fas fa-medal"></i>
              </div>
              <div class="badge-info">
                <h4>${badge.name || 'Achievement'}</h4>
                <p>${badge.description || 'Great accomplishment!'}</p>
                <small>Earned: ${new Date(badge.earned_at || Date.now()).toLocaleDateString()}</small>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="badge-stats">
          <div class="stat-item">
            <span class="stat-number">${data.badges.length}</span>
            <span class="stat-label">Badges Earned</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${Math.max(0, 10 - data.badges.length)}</span>
            <span class="stat-label">To Unlock</span>
          </div>
        </div>
      `;
    } else {
      badgesList.innerHTML = `
        <div class="no-badges">
          <i class="fas fa-medal"></i>
          <h4>No badges yet</h4>
          <p>Complete quizzes and maintain streaks to earn your first badge!</p>
          <button onclick="hideBadgesModal(); window.location.href='quiz.html'" class="btn btn-primary">
            Take Your First Quiz
          </button>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading badges:', error);
    badgesList.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Failed to load badges. Please try again later.</p>
      </div>
    `;
  }
}

// Function to show stats modal
function showStatsModal() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  
  // Create modal if it doesn't exist
  let modal = document.getElementById('statsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'statsModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Your Learning Statistics</h3>
          <button class="modal-close" onclick="hideStatsModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div id="statsList">
            <div class="loading">Loading your statistics...</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Add click outside to close functionality
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        hideStatsModal();
      }
    });
  }
  
  // Load and display stats
  loadUserStats();
  modal.style.display = 'flex';
}

function hideStatsModal() {
  const modal = document.getElementById('statsModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

async function loadUserStats() {
  const userId = localStorage.getItem('userId');
  const statsList = document.getElementById('statsList');
  
  if (!statsList) return;
  
  try {
    // Fetch user quiz history
    const historyResponse = await fetch(getApiUrl('userHistory', `/${userId}`));
    const quizHistory = await historyResponse.json();
    
    // Fetch weak topics
    const weakResponse = await fetch(getApiUrl('userWeakTopics', `/${userId}`));
    const weakData = await weakResponse.json();
    
    // Calculate statistics
    const totalQuizzes = quizHistory.length;
    const totalScore = quizHistory.reduce((sum, quiz) => sum + (quiz.score || 0), 0);
    const totalQuestions = quizHistory.reduce((sum, quiz) => sum + (quiz.total_questions || 0), 0);
    const averageScore = totalQuestions > 0 ? ((totalScore / totalQuestions) * 100).toFixed(1) : 0;
    const totalTime = quizHistory.reduce((sum, quiz) => sum + (quiz.time_taken || 0), 0);
    const perfectScores = quizHistory.filter(quiz => quiz.score === quiz.total_questions).length;
    const currentStreak = calculateCurrentStreak();
    
    // Format time
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    
    statsList.innerHTML = `
      <div class="stats-grid">
        <div class="stat-category">
          <h4>Quiz Performance</h4>
          <div class="stat-items">
            <div class="stat-item">
              <div class="stat-icon"><i class="fas fa-clipboard-check"></i></div>
              <div class="stat-details">
                <span class="stat-value">${totalQuizzes}</span>
                <span class="stat-label">Total Quizzes</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon"><i class="fas fa-percentage"></i></div>
              <div class="stat-details">
                <span class="stat-value">${averageScore}%</span>
                <span class="stat-label">Average Score</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon"><i class="fas fa-star"></i></div>
              <div class="stat-details">
                <span class="stat-value">${perfectScores}</span>
                <span class="stat-label">Perfect Scores</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="stat-category">
          <h4>Learning Progress</h4>
          <div class="stat-items">
            <div class="stat-item">
              <div class="stat-icon"><i class="fas fa-fire"></i></div>
              <div class="stat-details">
                <span class="stat-value">${currentStreak}</span>
                <span class="stat-label">Current Streak</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon"><i class="fas fa-clock"></i></div>
              <div class="stat-details">
                <span class="stat-value">${timeStr}</span>
                <span class="stat-label">Time Practiced</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon"><i class="fas fa-target"></i></div>
              <div class="stat-details">
                <span class="stat-value">${weakData.topics ? weakData.topics.length : 0}</span>
                <span class="stat-label">Focus Areas</span>
              </div>
            </div>
          </div>
        </div>
        
        ${weakData.topics && weakData.topics.length > 0 ? `
          <div class="stat-category">
            <h4>Topic Performance</h4>
            <div class="topic-performance-list">
              ${weakData.topics.map(topic => {
                const percentage = Math.round((topic.correct / topic.total) * 100);
                return `
                  <div class="topic-performance-item">
                    <div class="topic-name">${topic.topic}</div>
                    <div class="topic-score">
                      <span>${topic.correct}/${topic.total}</span>
                      <div class="topic-progress-bar">
                        <div class="topic-progress-fill" style="width: ${percentage}%"></div>
                      </div>
                      <span>${percentage}%</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  } catch (error) {
    console.error('Error loading stats:', error);
    statsList.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Failed to load statistics. Please try again later.</p>
      </div>
    `;
  }
}

// Achievement system placeholder
const achievementSystem = {
  getProgress: function(userId) {
    // Return mock achievement progress for now
    return {
      'first_quiz': { current: 1, target: 1 },
      'quiz_streak_3': { current: calculateCurrentStreak(), target: 3 },
      'quiz_streak_7': { current: calculateCurrentStreak(), target: 7 },
      'quiz_streak_30': { current: calculateCurrentStreak(), target: 30 },
      'perfect_score': { current: 0, target: 1 },
      'quiz_master': { current: 0, target: 10 },
      'algorithm_expert': { current: 0, target: 5 },
      'data_structure_pro': { current: 0, target: 5 },
      'quick_learner': { current: 0, target: 1 },
      'dedicated_learner': { current: 0, target: 5 }
    };
  }
};