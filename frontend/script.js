// Configuration for API URLs
const API_CONFIG = {
  baseURL: window.location.origin,
  endpoints: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    dashboardStats: '/api/dashboard/stats',
    questions: '/api/questions',
    adaptiveQuestions: '/api/adaptive-questions',
    nextAdaptiveQuestion: '/api/next-adaptive-question',
    submitQuiz: '/api/submit-quiz',
    userWeakTopics: '/api/user-weak-topics',
    userHistory: '/api/user-history',
    userStatistics: '/api/user-statistics',
    userTopicPerformance: '/api/topic-performance-data',
    userBadges: '/api/user-badges',
    userStreak: '/api/userStreak',
    userStreakStats: '/api/user-streak-stats',
    userMistakes: '/api/user-mistakes',
    learningRecommendations: '/api/learning-recommendations',
    topics: '/api/topics',
    createSampleData: '/api/create-sample-data',
    latestQuizResult: '/api/latest-quiz-result'
  }
};

// Show login required message (reusable)
function showLoginRequiredMessage() {
  const main = document.querySelector('main') || document.body;
  main.innerHTML = `
    <div class="login-required-message" style="max-width: 400px; margin: 80px auto; padding: 32px; background: #fff; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); text-align: center;">
      <h2 style="color: #dc3545; margin-bottom: 16px;">Login Required</h2>
      <p style="margin-bottom: 24px;">You must be logged in to view this content.</p>
      <a href="index.html" class="btn btn-primary" style="padding: 10px 24px; font-size: 1rem;">Go to Login</a>
    </div>
  `;
}

// Helper for authenticated fetch requests
async function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  if (!token) {
    showLoginRequiredMessage();
    throw new Error('Login required');
  }
  const headers = options.headers ? { ...options.headers } : {};
  headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}
// Helper function to build full API URL
function getApiUrl(endpoint, params = '') {
  return `${API_CONFIG.baseURL}${API_CONFIG.endpoints[endpoint]}${params}`;
}

// Placeholder functions to prevent runtime errors
function getAchievementInfo(badgeName) { 
  (`Getting info for ${badgeName}`);
  return { title: badgeName, description: 'Earned this achievement!', rarity: 'Common', category: 'Quiz', tip: 'Keep practicing!' }; 
}
function hideAchievementTooltip() {
  const tooltip = document.getElementById('achievement-tooltip');
  if (tooltip) {
    tooltip.style.opacity = '0';
  }
}
function showBadgesModal() { alert('Badges modal not implemented.'); }
function showStatsModal() { alert('Stats modal not implemented.'); }

// Create tooltip element
function createTooltip() {
  const tooltip = document.createElement('div');
  tooltip.id = 'achievement-tooltip';
  tooltip.className = 'achievement-tooltip';
  tooltip.style.cssText = `
    position: fixed;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 14px;
    max-width: 280px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(10px);
    z-index: 1000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease, transform 0.3s ease;
    transform: translateY(10px);
  `;
  document.body.appendChild(tooltip);
  return tooltip;
}

// Function to show achievement tooltip
function showAchievementTooltip(event, badgeName) {
  const info = getAchievementInfo(badgeName);
  const tooltip = document.getElementById('achievement-tooltip') || createTooltip();
  
  const rarityColors = {
    'Common': '#4ade80',
    'Uncommon': '#3b82f6', 
    'Rare': '#8b5cf6',
    'Epic': '#f59e0b',
    'Legendary': '#ef4444'
  };
  
  tooltip.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 8px;">
      <span style="font-size: 18px; margin-right: 8px;">${badgeName.split(' ')[0]}</span>
      <div>
        <div style="font-weight: bold; font-size: 16px;">${info.title}</div>
        <div style="font-size: 12px; color: ${rarityColors[info.rarity] || '#94a3b8'}; font-weight: 600;">
          ${info.rarity} • ${info.category}
        </div>
      </div>
    </div>
    <div style="margin-bottom: 8px; line-height: 1.4;">${info.description}</div>
    <div style="font-style: italic; font-size: 12px; color: #e2e8f0; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; margin-top: 8px;">
      💡 ${info.tip}
    </div>
  `;
  
  // Position tooltip
  const rect = event.target.closest('.achievement-item').getBoundingClientRect();
  const tooltipHeight = tooltip.offsetHeight || 150; // Estimate if not rendered yet
  
  tooltip.style.left = Math.min(rect.left, window.innerWidth - 300) + 'px';
  tooltip.style.top = Math.max(rect.top - tooltipHeight - 10, 10) + 'px';
  
  // Show tooltip
  tooltip.style.opacity = '1';
  tooltip.style.transform = 'translateY(0)';
}

// Function to display achievements
function displayAchievements(badges) {
  const achievementsContainer = document.getElementById('achievementsContainer');
  const totalBadgesEl = document.getElementById('totalBadges');
  if (!badges) badges = [];
  if (totalBadgesEl) totalBadgesEl.textContent = badges.length;
  if (!achievementsContainer) return;
  if (!badges.length) {
    achievementsContainer.innerHTML = `<div class='empty-state'><i class='fas fa-award'></i><p>No achievements yet. Complete quizzes to earn badges!</p></div>`;
    return;
  }
  achievementsContainer.innerHTML = badges.map(badge => {
    const info = getAchievementInfo(badge.name);
    return `<div class='achievement-item' title='${info?.description || badge.description || badge.name}'>
      <span class='achievement-icon'>🏅</span>
      <span class='achievement-title'>${info?.title || badge.name}</span>
      <span class='achievement-date'>${badge.date_awarded ? new Date(badge.date_awarded).toLocaleDateString() : ''}</span>
    </div>`;
  }).join('');
}

// Loading and feedback utility functions
function showLoading() {
  let loadingEl = document.getElementById('loading-spinner');
  if (!loadingEl) {
    loadingEl = document.createElement('div');
    loadingEl.id = 'loading-spinner';
    loadingEl.innerHTML = '<div class="spinner"></div><span>Loading...</span>';
    loadingEl.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: rgba(255, 255, 255, 0.9); padding: 20px; border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); z-index: 10000;
      display: flex; align-items: center; gap: 10px;
    `;
    const spinnerCSS = `
      .spinner {
        width: 20px; height: 20px; border: 2px solid #f3f3f3;
        border-top: 2px solid #007bff; border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `;
    if (!document.getElementById('spinner-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'spinner-styles';
      styleEl.textContent = spinnerCSS;
      document.head.appendChild(styleEl);
    }
    document.body.appendChild(loadingEl);
  }
  loadingEl.style.display = 'flex';
}

function hideLoading() {
  const loadingEl = document.getElementById('loading-spinner');
  if (loadingEl) {
    loadingEl.style.display = 'none';
  }
}

function showFeedback(message, isError = false) {
  const existingFeedback = document.getElementById('feedback-message');
  if (existingFeedback) {
    existingFeedback.remove();
  }
  const feedbackEl = document.createElement('div');
  feedbackEl.id = 'feedback-message';
  feedbackEl.textContent = message;
  feedbackEl.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    background: ${isError ? '#dc3545' : '#28a745'}; color: white;
    padding: 12px 24px; border-radius: 6px; z-index: 10001;
    font-weight: 500; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideDown 0.3s ease-out;
  `;
  if (!document.getElementById('feedback-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'feedback-styles';
    styleEl.textContent = `@keyframes slideDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }`;
    document.head.appendChild(styleEl);
  }
  document.body.appendChild(feedbackEl);
  setTimeout(() => {
    if (feedbackEl.parentNode) {
      feedbackEl.style.animation = 'slideDown 0.3s ease-out reverse';
      setTimeout(() => feedbackEl.remove(), 300);
    }
  }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in (token exists)
  const token = localStorage.getItem('token');
  const dashboardPage = window.location.pathname.endsWith('dashboard.html');
  if (dashboardPage && !token) {
    showLoginRequiredMessage();
    return;
  }

  // --- Password Strength Meter & Validation for Signup ---
  const signupPasswordInput = document.getElementById('signupPassword');
  if (signupPasswordInput) {
    const passwordStrengthBar = document.getElementById('passwordStrength');
    const passwordStrengthText = document.getElementById('passwordStrengthText');
    const signupPasswordError = document.getElementById('signupPasswordError');
    function getPasswordStrength(password) {
    let score = 0;
    if (!password) return 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }

    function updatePasswordStrengthUI(password) {
    const strength = getPasswordStrength(password);
    let percent = (strength / 5) * 100;
    let color = '#e74c3c', label = 'Very Weak';
    if (strength === 1) { color = '#e67e22'; label = 'Weak'; }
    else if (strength === 2) { color = '#f1c40f'; label = 'Fair'; }
    else if (strength === 3) { color = '#3498db'; label = 'Good'; }
    else if (strength === 4) { color = '#2ecc71'; label = 'Strong'; }
    else if (strength === 5) { color = '#27ae60'; label = 'Very Strong'; }
    if (passwordStrengthBar) {
      passwordStrengthBar.style.width = percent + '%';
      passwordStrengthBar.style.background = color;
    }
    if (passwordStrengthText) {
      passwordStrengthText.textContent = password ? label : 'Password strength';
      passwordStrengthText.style.color = color;
    }
  }
    signupPasswordInput.addEventListener('input', function() {
      updatePasswordStrengthUI(this.value);
      if (signupPasswordError) signupPasswordError.textContent = '';
    });
  }

  // --- Login form ---
  
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const submitButton = loginForm.querySelector('button[type="submit"]');
      const btnLoader = submitButton ? submitButton.querySelector('.btn-loader') : null;
      if (submitButton) submitButton.disabled = true;
      if (btnLoader) btnLoader.style.display = 'block';
      const btnText = submitButton ? submitButton.querySelector('.btn-text') : null;
      if (btnText) btnText.style.opacity = '0.5';
      const usernameField = document.getElementById('loginUsername');
      const passwordField = document.getElementById('loginPassword');
      if (!usernameField || !passwordField) {
        console.error('Login form fields not found');
        alert('Login form error. Please refresh the page.');
        if (submitButton) submitButton.disabled = false;
        if (btnLoader) btnLoader.style.display = 'none';
        if (btnText) btnText.style.opacity = '1';
        return;
      }
      const username = usernameField.value.trim();
      const password = passwordField.value.trim();
      if (!username || !password) {
        alert('Please enter both username and password');
        if (submitButton) submitButton.disabled = false;
        if (btnLoader) btnLoader.style.display = 'none';
        if (btnText) btnText.style.opacity = '1';
        return;
      }
      showLoading();
      try {
        const response = await fetch(getApiUrl('login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('userId', data.userId);
          localStorage.setItem('username', data.username);
          localStorage.setItem('streak', data.streak || 0);
          const userObj = {
            id: data.userId,
            username: data.username,
            streak: data.streak || 0
          };
          localStorage.setItem('user', JSON.stringify(userObj));
          hideLoading();
          showFeedback('Login successful! Redirecting...', false);
          try {
            window.location.replace('dashboard.html');
          } catch (error) {
            setTimeout(() => {
              try {
                window.location.href = 'dashboard.html';
              } catch (e2) {
                alert('Please click OK to go to dashboard');
                window.open('dashboard.html', '_self');
              }
            }, 100);
          }
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
      } finally {
        if (submitButton) submitButton.disabled = false;
        if (btnLoader) btnLoader.style.display = 'none';
        if (btnText) btnText.style.opacity = '1';
      }
    });
  }

  // Signup form
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const submitButton = signupForm.querySelector('button[type="submit"]');
      const btnLoader = submitButton ? submitButton.querySelector('.btn-loader') : null;
      if (submitButton) submitButton.disabled = true;
      if (btnLoader) btnLoader.style.display = 'block';
      const btnText = submitButton ? submitButton.querySelector('.btn-text') : null;
      if (btnText) btnText.style.opacity = '0.5';
      const username = document.getElementById('signupUsername').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;

      // --- Enhanced Validation ---
      let errorMsg = '';
      if (!username) errorMsg = 'Username is required.';
      else if (!email || !/^\S+@\S+\.\S+$/.test(email)) errorMsg = 'Valid email is required.';
      else if (!password) errorMsg = 'Password is required.';
      else if (password.length < 8) errorMsg = 'Password must be at least 8 characters.';
      else if (!/[A-Z]/.test(password)) errorMsg = 'Password must contain an uppercase letter.';
      else if (!/[a-z]/.test(password)) errorMsg = 'Password must contain a lowercase letter.';
      else if (!/[0-9]/.test(password)) errorMsg = 'Password must contain a number.';
      else if (!/[^A-Za-z0-9]/.test(password)) errorMsg = 'Password must contain a special character.';

      if (errorMsg) {
        if (signupPasswordError) signupPasswordError.textContent = errorMsg;
        updatePasswordStrengthUI(password);
        if (submitButton) submitButton.disabled = false;
        if (btnLoader) btnLoader.style.display = 'none';
        if (btnText) btnText.style.opacity = '1';
        return;
      }

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
        if (submitButton) submitButton.disabled = false;
        if (btnLoader) btnLoader.style.display = 'none';
        if (btnText) btnText.style.opacity = '1';
      }
    });
  }

  // --- Auth tab switching ---
  const authTabs = document.querySelectorAll('.auth-tab');
  if (authTabs.length > 0) {
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    authTabs.forEach(tab => {
      if (tab) {
        tab.addEventListener('click', function() {
          const tabType = this.getAttribute('data-tab');
          authTabs.forEach(t => t.classList.remove('active'));
          this.classList.add('active');
          if (loginTab) loginTab.classList.add('hidden');
          if (signupTab) signupTab.classList.add('hidden');
          if (tabType === 'login' && loginTab) {
            loginTab.classList.remove('hidden');
          } else if (tabType === 'signup' && signupTab) {
            signupTab.classList.remove('hidden');
          }
        });
      }
    });
  }

  // --- Quiz logic ---
  if (window.location.pathname.endsWith('quiz.html') || window.location.pathname.endsWith('quiz-new.html')) {
    const quizContent = document.getElementById('quizContent');
    const submitBtn = document.getElementById('submitQuizBtn');
    const quizTimer = document.getElementById('quizTimer');
    const timerProgress = document.querySelector('.timer-progress .progress-fill');
    const questionShortcuts = document.getElementById('questionShortcuts');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const currentQuestionSpan = document.getElementById('currentQuestion');
    const totalQuestionsSpan = document.getElementById('totalQuestions');
    let questions = [], userAnswers = {}, currentQuestion = 0;
    let timeLeft = 600, quizStartTime = Date.now(), timer;

     function formatModeName(mode) {
      switch(mode) {
        case 'all-topics': return 'All Topics';
        case 'weak-areas-combined': return 'Weak Areas';
        case 'topic-specific': return 'Topic Specific';
        case 'adaptive': return 'Adaptive';
        case 'timed-challenge': return 'Timed Challenge';
        default: return mode;
      }
    }
    async function submitQuiz() {
        clearInterval(timer);
        
        const actualTimeTaken = Math.round((Date.now() - quizStartTime) / 1000);
        (`🕒 Quiz timing: Started at ${new Date(quizStartTime).toLocaleTimeString()}, took ${actualTimeTaken} seconds`);
        
        const userId = localStorage.getItem('userId');
        if (!userId) {
          showFeedback('Please log in to submit your quiz.', true);
          return;
        }
        const answers = [];
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const selected = userAnswers[i] || '';
          let is_correct = false;
          if (q.correct_option) {
            is_correct = selected === q.correct_option;
          }
          answers.push({
            question_id: q.id,
            selected_option: selected,
            is_correct: is_correct
          });
        }
        try {
          const response = await authFetch(getApiUrl('submitQuiz'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId, 
              answers,
              timeTaken: actualTimeTaken
            })
          });
          const result = await response.json();
          localStorage.setItem('lastQuizResult', JSON.stringify(result));
          window.location.href = 'results-new.html';
        } catch (error) {
          showFeedback('Failed to submit quiz. Please try again.', true);
          console.error(error);
        }
      }

    function updateTimer() {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(timer);
        submitQuiz();
      }
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      if (quizTimer) {
        quizTimer.textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
      }
      const progress = (timeLeft / 600) * 100;
      if (timerProgress) {
        timerProgress.style.width = `${progress}%`;
      }
      // Color changes
      if (timeLeft < 60) {
        if (quizTimer) {
          quizTimer.style.color = '#e74c3c';
        }
        if (timerProgress) {
          timerProgress.style.background = '#e74c3c';
        }
      }
      else if (timeLeft < 120) {
        quizTimer.style.color = '#f39c12';
        timerProgress.style.background = '#f39c12';
      }
    }
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
        <div class="options-container">
          ${['A', 'B', 'C', 'D'].map(opt => `
            <label class="option-item${userAnswers[idx] === opt ? ' selected' : ''}">
              <input type="radio" name="answer" value="${opt}" ${userAnswers[idx] === opt ? 'checked' : ''}>
              <span class="option-label">${opt}.</span> <span class="option-text">${q[`option_${opt.toLowerCase()}`]}</span>
            </label>
          `).join('')}
        </div>
      `;
      // Update shortcut button states
      updateQuestionShortcuts();
    }
    function updateQuestionShortcuts() {
      // Update active and answered states for shortcut buttons
      const isAdaptive = quizMode === 'adaptive';
      Array.from(questionShortcuts.children).forEach((btn, i) => {
        btn.classList.toggle('active', i === currentQuestion);
        btn.classList.toggle('answered', userAnswers[i] !== undefined);
        if (isAdaptive) {
          btn.disabled = i !== currentQuestion;
        }
      });
    }
    function renderQuestionShortcuts() {
      // Render numbered navigation buttons for all questions
      if (!questionShortcuts) return;
      questionShortcuts.innerHTML = '';
      const isAdaptive = quizMode === 'adaptive';
      for (let i = 0; i < questions.length; i++) {
        const btn = document.createElement('button');
        btn.className = 'shortcut-btn';
        btn.textContent = (i + 1).toString();
        if (isAdaptive) {
          // In adaptive mode, only current and previous questions are clickable
          btn.disabled = i !== currentQuestion;
        }
        if (btn) {
          btn.addEventListener('click', () => {
          if (!isAdaptive || i === currentQuestion) {
            displayQuestion(i);
          }
        });
        questionShortcuts.appendChild(btn);
      }
      updateQuestionShortcuts();
    }
  }
   async function loadQuestions() {
      // Always define isAdaptive at the top
      const isAdaptive = quizMode === 'adaptive';
      // Hide navigation header/subtitle for adaptive mode
      const navHeader = document.querySelector('.quiz-navigation .nav-header');
      if (isAdaptive) {
        if (navHeader) navHeader.style.display = 'none';
      } else {
        if (navHeader) navHeader.style.display = '';
      }
      quizContent.innerHTML = '<div class="quiz-loading">Loading questions...</div>';
      const userId = localStorage.getItem('userId');
      const questionCount = quizConfig.questionCount || 10;
      // Set custom timer based on quiz mode using configuration
      const configuredTime = QUIZ_CONFIG?.timeLimits?.[quizMode] || QUIZ_CONFIG?.timeLimits?.default || 600;
      timeLeft = configuredTime;
      clearInterval(timer);
      timer = setInterval(updateTimer, 1000);

      if (isAdaptive) {
        // Adaptive mode: fetch one question at a time
        questions = [];
        userAnswers = {};
        let previousAnswers = [];
        let currentIdx = 0;
        let nextDifficulty = null;
        async function fetchNextAdaptiveQuestion() {
          quizContent.innerHTML = '<div class="quiz-loading">Loading next question...</div>';
          const res = await authFetch(getApiUrl('nextAdaptiveQuestion'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              previousAnswers,
              mode: quizMode,
              selectedTopic,
              questionCount,
              lastDifficulty: nextDifficulty
            })
          });
          if (!res.ok) {
            quizContent.innerHTML = '<div class="quiz-loading">Failed to fetch next question.</div>';
            return;
          }
          const data = await res.json();
          if (data.done || !data.question) {
            // Quiz complete
            submitQuiz();
            return;
          }
          nextDifficulty = data.nextDifficulty;
          questions.push(data.question);
          displayAdaptiveQuestion(currentIdx);
        }

        // Override displayQuestion for adaptive
        function displayAdaptiveQuestion(idx) {
          if (idx < 0 || idx >= questions.length) return;
          currentQuestion = idx;
          currentQuestionSpan.textContent = idx + 1;
          totalQuestionsSpan.textContent = questionCount;
          const q = questions[idx];
          // Render question
          quizContent.innerHTML = `
            <div class="quiz-question">
              <strong>Q${idx + 1}:</strong> ${q.question_text}
            </div>
            <div class="options-container">
              ${['A', 'B', 'C', 'D'].map(opt => `
                <label class="option-item${userAnswers[idx] === opt ? ' selected' : ''}">
                  <input type="radio" name="answer" value="${opt}" ${userAnswers[idx] === opt ? 'checked' : ''}>
                  <span class="option-label">${opt}.</span> <span class="option-text">${q[`option_${opt.toLowerCase()}`]}</span>
                </label>
              `).join('')}
            </div>
            <button id="nextAdaptiveBtn" class="select-mode-btn" style="margin-top:1.5rem;">${idx === questionCount - 1 ? 'Finish Quiz' : 'Next Question'}</button>
          `;
          document.querySelectorAll('input[name="answer"]').forEach(input => {
            if (input) {
              input.addEventListener('change', function() {
                userAnswers[idx] = this.value;
              });
            }
          });
          document.getElementById('nextAdaptiveBtn').onclick = async function() {
            const selected = userAnswers[idx];
            if (!selected) {
              alert('Please select an answer.');
              return;
            }
            // Prepare answer object
            const is_correct = selected === q.correct_option;
            previousAnswers.push({
              question_id: q.id,
              selected_option: selected,
              is_correct,
              topic: q.topic,
              difficulty: q.difficulty
            });
            currentIdx++;
            if (currentIdx >= questionCount) {
              submitQuiz();
              return;
            }
            await fetchNextAdaptiveQuestion();
          };
        }

        // Start adaptive quiz
        await fetchNextAdaptiveQuestion();
        // Clear quizConfig from localStorage after use
        localStorage.removeItem('quizConfig');
        quizStartTime = Date.now();
        // Hide navigation buttons for adaptive
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        questionShortcuts.innerHTML = '';
        updateProgress();
        // Override submitQuiz to use previousAnswers
        submitQuiz = async function() {
          clearInterval(timer);
          // Prepare answers in the format expected by backend
          const answers = previousAnswers.map((a, i) => ({
            question_id: a.question_id,
            selected_option: a.selected_option,
            is_correct: a.is_correct
          }));
          const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
          const res = await authFetch(getApiUrl('submitQuiz'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              answers,
              startTime: quizStartTime,
              timeTaken,
              totalQuestions: questionCount
            })
          });
          window.location.href = 'results-new.html';
        };
      } else {
        // Non-adaptive modes: fetch all questions at once
        try {
          const res = await authFetch(getApiUrl('adaptiveQuestions'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: quizMode,
              userId,
              selectedTopic,
              questionCount
            })
          });
          if (!res.ok) {
            quizContent.innerHTML = '<div class="quiz-loading">Failed to fetch questions.</div>';
            return;
          }
          const data = await res.json();
          if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
            quizContent.innerHTML = '<div class="quiz-loading">No questions available for this mode.</div>';
            return;
          }
          questions = data.questions;
          userAnswers = {};
          currentQuestion = 0;
          totalQuestionsSpan.textContent = questions.length;
          try {
            displayQuestion(0);
            renderQuestionShortcuts();
          } catch (displayErr) {
            console.error('Error in displayQuestion:', displayErr, questions[0]);
            quizContent.innerHTML = '<div class="quiz-loading">Error displaying question. Check console for details.</div>';
          }
        } catch (err) {
          console.error('Error loading questions:', err);
          quizContent.innerHTML = '<div class="quiz-loading">Error loading questions. Please try again.</div>';
        }
      }
    }
    
    // Read quiz mode and selected topic from localStorage
    let quizConfig = {};
    try {
      quizConfig = JSON.parse(localStorage.getItem('quizConfig')) || {};
    } catch (e) {
      quizConfig = {};
    }
    const quizMode = quizConfig.mode || 'all-topics';
    const selectedTopic = quizConfig.selectedTopic || null;
    const quizModeEl = document.getElementById('quizMode');
    if (quizModeEl) {
      quizModeEl.textContent = formatModeName(quizMode);
    }
    
    // Start timer and load questions
    timer = setInterval(updateTimer, 1000);
    loadQuestions();

    // Event Listeners for Quiz Page
    if (quizContent) {
      quizContent.addEventListener('change', function(e) {
        if (e.target.name === 'answer') {
          userAnswers[currentQuestion] = e.target.value;
          updateProgress();
        }
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentQuestion > 0) displayQuestion(currentQuestion - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentQuestion < questions.length - 1) displayQuestion(currentQuestion + 1);
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', submitQuiz);
    }
  }

  // --- Dashboard Logic ---
  if (window.location.pathname.endsWith('dashboard.html')) {
    try {
      updateDashboard();
    } catch (error) {
      console.error('Error loading dashboard:', error);
      alert('Error loading dashboard. Please check the console for details.');
    }
  }

  // --- Results Page Logic ---
  if (window.location.pathname.endsWith('results.html') || window.location.pathname.endsWith('results-new.html')) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      showLoginRequiredMessage();
      return;
    }
    loadLatestQuizResults(userId);
    try {
      loadQuizHistoryPage();
    } catch (error) {
      console.error('Error loading quiz history page:', error);
    }
    const practiceWeakAreasBtn = document.getElementById('practiceWeakAreasBtn');
    if (practiceWeakAreasBtn) {
        practiceWeakAreasBtn.addEventListener('click', function(e) {
          e.preventDefault();
          localStorage.setItem('quizMode', 'weak-areas-combined');
          localStorage.setItem('quizModeSelected', 'true');
          window.location.href = 'quiz-new.html';
        });
    }
  }
  
  // --- History Page Logic ---
  // Do NOT run loadQuizHistoryPage() for history-new.html. The page now uses its own HistoryPage class for all logic.
  // This avoids double-loading and DOM conflicts.
  // If you add any global logic for history-new.html, do it in the HistoryPage class in the HTML file itself.
}); // <-- This correctly closes the main DOMContentLoaded listener.

// =================================================================
// GLOBAL HELPER FUNCTIONS (must be defined outside DOMContentLoaded)
// =================================================================

let dashboardUpdateInProgress = false;
async function updateDashboard() {
  const callTime = Date.now();
  if (dashboardUpdateInProgress) {
    return;
  }
  
  dashboardUpdateInProgress = true;
  
  // Initialize variables
  let badgesData = {};
  let quizHistory = [];
  let dashboardStats = null;
  
  try {
    const userId = getCurrentUserId(); // Use centralized function instead of direct localStorage access
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error('No valid userId found');
      document.getElementById('topicMastery').innerHTML = '<p>Please log in to view your dashboard.</p>';
      dashboardUpdateInProgress = false; // Reset flag before returning
      return;
    }
    
  
    // Always use API response for username
    let apiData = null;
    let username = 'Student';
    try {
      const fallbackRes = await authFetch(getApiUrl('userStatistics', `/${userId}`));
      apiData = await fallbackRes.json();
      // Debug: Log userId and API response
      ('[DEBUG] Dashboard userId:', userId);
      ('[DEBUG] userStatistics API response:', apiData);
      username = apiData.username || 'Student';
      localStorage.setItem('username', username); // Store for future use (optional)
      dashboardStats = {
        user: { username: username },
        stats: {
          totalQuizzes: apiData.basic?.total_quizzes || 0,
          avgAccuracy: apiData.basic?.average_score || 0,
          totalCorrect: apiData.basic?.total_correct || 0,
          totalQuestions: apiData.basic?.total_attempted || 0,
          streakDays: 0, // Will be updated from streak API
          longestStreak: apiData.streak?.longest_streak || 0,
          totalStudyTime: Math.floor((apiData.basic?.total_time || 0) / 60) || 0,
          badgeCount: 0 // Will be updated from badges API
        },
        recentActivity: apiData.recent_performance || []
      };
    } catch (e) {
      console.error('Failed to fetch dashboard data:', e);
    }
    // Update username display elements
    const sidebarUsernameEl = document.getElementById('sidebarUsername');
    const dashboardUsernameEl = document.getElementById('dashboardUsername');
    const welcomeUsernameEl = document.getElementById('welcomeUsername');
    if (sidebarUsernameEl) sidebarUsernameEl.textContent = username;
    if (dashboardUsernameEl) dashboardUsernameEl.textContent = username;
    if (welcomeUsernameEl) welcomeUsernameEl.textContent = username;
    
    // Dashboard stats already populated above from the API call
    
    // Fetch badges with error handling
    try {
      const badgesRes = await authFetch(getApiUrl('userBadges', `/${userId}`));
      if (badgesRes.ok) {
        badgesData = await badgesRes.json();
      } else {
        console.warn('Could not fetch badges data');
        badgesData = { badges: [] };
      }
    } catch (e) {
      console.warn('Error fetching badges:', e);
      badgesData = { badges: [] };
    }
    
    // Update stats with error handling - Using API data structure correctly
    const stats = {
      totalQuizzes: apiData?.basic?.total_quizzes || 0,
      avgAccuracy: apiData?.basic?.average_score || 0,
      totalCorrect: apiData?.basic?.total_correct || 0,
      totalQuestions: apiData?.basic?.total_attempted || 0,
      streakDays: 0, // Will be updated from streak API
      totalStudyTime: Math.floor((apiData?.basic?.total_time || 0) / 60) || 0,
      badgeCount: 0 // Will be updated from badges API
    };
    
    // Update welcome section stats with proper API data mapping
    const welcomeStatsData = {
      streak: 0, // Will be updated from streak API
      quizzes: stats.totalQuizzes,
      accuracy: Math.round(stats.avgAccuracy)
    };
    
    // Update welcome section displays
    const streakDisplayEl = document.getElementById('streakDisplay');
    const totalQuizzesDisplayEl = document.getElementById('totalQuizzesDisplay');
    const accuracyDisplayEl = document.getElementById('accuracyDisplay');
    
    if (streakDisplayEl) {
      streakDisplayEl.textContent = welcomeStatsData.streak;
    }
    if (totalQuizzesDisplayEl) {
      totalQuizzesDisplayEl.textContent = welcomeStatsData.quizzes;
    }
    if (accuracyDisplayEl) {
      accuracyDisplayEl.textContent = `${welcomeStatsData.accuracy}%`;
    }
    
    // Update dashboard performance cards
    const quizzesCompletedEl = document.getElementById('totalQuizzes');
    if (quizzesCompletedEl) {
      const totalQuizzes = stats.totalQuizzes || welcomeStatsData.quizzes || 0;
      quizzesCompletedEl.textContent = totalQuizzes;
    }
    
    const totalCorrectEl = document.getElementById('totalCorrect');
    if (totalCorrectEl) {
      const totalCorrect = stats.totalCorrect || apiData?.total_correct || 0;
      totalCorrectEl.textContent = totalCorrect;
    }
    
    const totalQuestionsEl = document.getElementById('totalQuestions');
    if (totalQuestionsEl) {
      const totalQuestions = stats.totalQuestions || apiData?.total_questions_attempted || 0; // Use actual total questions
      totalQuestionsEl.textContent = totalQuestions;
    }
    
    // Use average accuracy from optimized API
    const averageScore = Math.round(stats.avgAccuracy || 0);
    
    const averageScoreEl = document.getElementById('avgScore');
    if (averageScoreEl) {
      averageScoreEl.textContent = `${averageScore}%`;
      
      // Update progress bar for average score
      const avgScoreProgressEl = document.getElementById('avgScoreProgress');
      if (avgScoreProgressEl) {
        avgScoreProgressEl.style.width = `${averageScore}%`;
      }
    }
    
    // Update streak days
    const streakDaysEl = document.getElementById('streakDays');
    if (streakDaysEl) {
      streakDaysEl.textContent = stats.streakDays || 0;
    }
    
    // Update study time
    const studyTimeEl = document.getElementById('studyTime');
    if (studyTimeEl) {
      const studyTime = stats.totalStudyTime || 0;
      studyTimeEl.textContent = `${studyTime}m`;
      
      // Update progress bar for study time using configuration
      const maxStudyTime = QUIZ_CONFIG?.progressMaximums?.studyTime || 100;
      const studyTimeProgress = Math.min((studyTime / maxStudyTime) * 100, 100);
      const studyTimeProgressEl = document.getElementById('studyTimeProgress');
      if (studyTimeProgressEl) {
        studyTimeProgressEl.style.width = `${studyTimeProgress}%`;
      }
    }
    
    const badgesEarnedEl = document.getElementById('badgeCount');
    if (badgesEarnedEl) {
      // Use badge count from optimized API or fallback to badges data
      const badgeCount = stats.badgeCount || badgesData.badges?.length || 0;
      badgesEarnedEl.textContent = badgeCount;
      
      // Update progress bar for badges using configuration
      const maxBadges = QUIZ_CONFIG?.progressMaximums?.badges || 20;
      const badgeProgress = Math.min((badgeCount / maxBadges) * 100, 100);
      const badgeProgressEl = document.getElementById('badgeCountProgress');
      if (badgeProgressEl) {
        badgeProgressEl.style.width = `${badgeProgress}%`;
      }
    }
    
    // Calculate and update trends
    updateStatsTrends(stats);
    
    // Fetch and update streak data from API (keep original logic)
    let currentStreak = 0;
    try {
      const streakRes = await authFetch(getApiUrl('userStreak', `/${userId}`));
      const streakData = await streakRes.json();
      
      currentStreak = streakData.current_streak || streakData.currentStreak || 0;
      
      // Update stats object with streak data
      stats.streakDays = currentStreak;
      welcomeStatsData.streak = currentStreak;
      
      // Update localStorage with fresh streak data
      localStorage.setItem('streak', currentStreak);
    } catch (e) {
      console.error('Failed to fetch streak data:', e);
      // Fallback to localStorage
      currentStreak = parseInt(localStorage.getItem('streak')) || 0;
    }
    
    // Update badge count from the badges API response
    if (badgesData && badgesData.badges) {
      stats.badgeCount = badgesData.badges.length;
      
      // Display achievements in the achievements section
      displayAchievements(badgesData.badges);
    } else {
      // Show empty achievements state
      displayAchievements([]);
    }
    
    // Update streak display (only update existing elements)
    // Update all streak displays with currentStreak from streak API
    const mainStreakDisplayEl = document.getElementById('streakDisplay');
    const headerStreakEl = document.getElementById('headerStreak');
    const bestStreakEl = document.getElementById('bestStreak');
    const streakLabel = currentStreak === 1 ? 'day' : 'days';
    if (mainStreakDisplayEl) mainStreakDisplayEl.textContent = `${currentStreak}`;
    if (headerStreakEl) headerStreakEl.textContent = `${currentStreak}`;
    if (bestStreakEl) bestStreakEl.textContent = `${currentStreak}`;
    // Update label elements if present
    const mainStreakLabelEl = document.getElementById('streakLabel');
    const headerStreakLabelEl = document.getElementById('headerStreakLabel');
    const bestStreakLabelEl = document.getElementById('bestStreakLabel');
    if (mainStreakLabelEl) mainStreakLabelEl.textContent = streakLabel;
    if (headerStreakLabelEl) headerStreakLabelEl.textContent = streakLabel;
    if (bestStreakLabelEl) bestStreakLabelEl.textContent = streakLabel;
    window.currentStreak = currentStreak;
    
    // Update focus areas (recommendations)
    const recommendationsEl = document.getElementById('recommendations');
    const recommendationActions = document.getElementById('recommendationActions');
    
    if (recommendationsEl) {
      if (apiData.topic_performance && apiData.topic_performance.length > 0) {
        const weakTopics = apiData.topic_performance.slice(0, 3); // Show top 3 weak areas
        // Use custom recommendation-item structure
        const icons = ["fa-code", "fa-database", "fa-network-wired", "fa-cogs", "fa-brain"];
        const recommendationHTML = weakTopics.map((topicData, index) => {
          const topic = topicData.topic;
          const percentage = Math.round(topicData.avg_score || 0);
          // Pick an icon based on index or topic
          const icon = icons[index % icons.length];
          return `
            <div class="recommendation-item">
              <div class="rec-icon">
                <i class="fas ${icon}"></i>
              </div>
              <div class="rec-content">
                <h4>${topic}</h4>
                <p>Average Score: ${percentage}%</p>
                <a href="quiz-new.html?topic=${encodeURIComponent(topic)}" class="rec-action">Start Practice</a>
              </div>
            </div>
          `;
        }).join('');
        recommendationsEl.innerHTML = recommendationHTML;
        if (recommendationActions) {
          recommendationActions.style.display = 'flex';
        }
      } else if (quizHistory.length > 0) {
        // If user has taken quizzes but no weak areas, suggest exploring new topics
        const suggestedTopics = ['Data Structures', 'Algorithms', 'Object-Oriented Programming', 'Database Systems'];
        const icons = ["fa-code", "fa-database", "fa-cogs", "fa-brain"];
        const randomTopics = suggestedTopics.sort(() => 0.5 - Math.random()).slice(0, 3);
        const explorationHTML = randomTopics.map((topic, idx) => `
          <div class="recommendation-item">
            <div class="rec-icon">
              <i class="fas ${icons[idx % icons.length]}"></i>
            </div>
            <div class="rec-content">
              <h4>${topic}</h4>
              <p>Explore this topic</p>
              <a href="quiz-new.html?topic=${encodeURIComponent(topic)}" class="rec-action">Start Practice</a>
            </div>
          </div>
        `).join('');
        recommendationsEl.innerHTML = explorationHTML;
        if (recommendationActions) {
          recommendationActions.style.display = 'flex';
        }
      } else {
        // New user - suggest getting started
        recommendationsEl.innerHTML = `
          <div class="getting-started">
            <div class="start-message">
              <i class="fas fa-rocket"></i>
              <h4>Ready to start learning?</h4>
              <p>Take your first quiz to get personalized recommendations based on your performance!</p>
            </div>
          </div>
        `;
        if (recommendationActions) {
          recommendationActions.style.display = 'none';
        }
      }
    }
    
    // Update recent activity with actual API data
    const recentActivityEl = document.getElementById('recentActivity');
    if (recentActivityEl) {
      const recentActivities = dashboardStats?.recentActivity || [];
      if (recentActivities.length > 0) {
        const activityHTML = recentActivities.slice(0, 5).map(activity => {
          const date = new Date(activity.date || Date.now()).toLocaleDateString();
          const percentage = activity.accuracy || 0;
          const scoreClass = percentage >= 80 ? 'excellent' : percentage >= 60 ? 'good' : 'needs-improvement';
          
          return `
            <div class="activity-item">
              <div class="activity-icon">
                <i class="fas fa-brain"></i>
              </div>
              <div class="activity-content">
                <div class="activity-title">${activity.type || 'Quiz'} - ${activity.topic || 'General'}</div>
                <div class="activity-details">Score: ${activity.score || 0} (${percentage}% accuracy)</div>
                <div class="activity-time">${date}</div>
              </div>
              <div class="activity-score ${scoreClass}">${percentage}%</div>
            </div>
          `;
        }).join('');
        recentActivityEl.innerHTML = activityHTML;
      } else {
        recentActivityEl.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-clock"></i>
            <h3>No Recent Activity</h3>
            <p>Take your first quiz to see activity here!</p>
          </div>
        `;
      }
    }
    
    // Update recent achievements
    const recentAchievementsEl = document.getElementById('recentAchievements');
    const allRecentAchievements = document.querySelectorAll('#recentAchievements');
    if (allRecentAchievements.length > 1) {
      console.error('DUPLICATE IDs FOUND! Multiple elements with recentAchievements ID');
      allRecentAchievements.forEach((el, index) => {
        // Remove duplicate elements, keep only the first one
        if (index > 0) {
          el.remove();
        }
      });
    }
    if (recentAchievementsEl) {
      
      // Clear any existing content first
      recentAchievementsEl.innerHTML = '';
      
      if (badgesData.badges && badgesData.badges.length > 0) {
        const recentBadges = badgesData.badges.slice(-3); // Show last 3 badges
        const badgeHTML = recentBadges.map(badge => {
          // Extract just the title part without emoji
          const cleanTitle = badge.name.replace(/^[^\w\s]+\s*/, '').trim();
          // Create a proper description based on the achievement
          const description = getAchievementInfo(badge.name).description || 'Achievement earned!';
          
          return `
            <div class="achievement-item" data-badge-name="${badge.name}">
              <div class="achievement-icon">
                <i class="fas fa-medal" style="color: #f39c12;"></i>
              </div>
              <div class="achievement-content">
                <div class="achievement-title">${cleanTitle}</div>
                <div class="achievement-desc">Earned ${new Date(badge.date_awarded).toLocaleDateString()}</div>
              </div>
            </div>
          `;
        }).join('');
        recentAchievementsEl.innerHTML = badgeHTML;
        
        // Add hover event listeners to achievement items
        const achievementItems = recentAchievementsEl.querySelectorAll('.achievement-item');
        achievementItems.forEach(item => {
          const badgeName = item.getAttribute('data-badge-name');
          
          // Add hover cursor style and animations
          item.style.cursor = 'pointer';
          item.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
          
          if (item) {
            item.addEventListener('mouseenter', (e) => {
              showAchievementTooltip(e, badgeName);
              item.style.transform = 'translateY(-2px)';
              item.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            });
            item.addEventListener('mouseleave', () => {
              hideAchievementTooltip();
              item.style.transform = 'translateY(0)';
              item.style.boxShadow = 'none';
            });
          }
        });
        
      } else {
        recentAchievementsEl.innerHTML = '<div class="achievement-item"><div class="achievement-content"><div class="achievement-title">No achievements yet</div><div class="achievement-desc">Complete quizzes to earn your first badge!</div></div></div>';
      }
    }
    
    // Update streak container
    const streakContainerEl = document.getElementById('streakContainer');
    if (streakContainerEl) {
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
    }
    
    // Add button event listeners
    setupDashboardButtons();
    // --- Ensure topic mastery and recent activity are updated ---
    if (dashboard && typeof dashboard.loadTopicMastery === 'function') {
      await dashboard.loadTopicMastery(userId);
    }
    // Fix: Always update recent activity using dashboard method if available
    if (dashboard && typeof dashboard.loadRecentActivity === 'function') {
      await dashboard.loadRecentActivity(userId);
    } else {
      // Fallback: update recentActivity element directly if dashboard method is missing
      const recentActivityEl = document.getElementById('recentActivity');
      if (recentActivityEl && dashboardStats && dashboardStats.recentActivity) {
        const recentActivities = dashboardStats.recentActivity;
        if (recentActivities.length > 0) {
          const activityHTML = recentActivities.slice(0, 5).map(activity => {
            const date = new Date(activity.date || Date.now()).toLocaleDateString();
            const percentage = activity.accuracy || 0;
            const scoreClass = percentage >= 80 ? 'excellent' : percentage >= 60 ? 'good' : 'needs-improvement';
            return `
              <div class="activity-item">
                <div class="activity-icon">
                  <i class="fas fa-brain"></i>
                </div>
                <div class="activity-content">
                  <div class="activity-title">${activity.type || 'Quiz'} - ${activity.topic || 'General'}</div>
                  <div class="activity-details">Score: ${activity.score || 0} (${percentage}% accuracy)</div>
                  <div class="activity-time">${date}</div>
                </div>
                <div class="activity-score ${scoreClass}">${percentage}%</div>
              </div>
            `;
          }).join('');
          recentActivityEl.innerHTML = activityHTML;
        } else {
          recentActivityEl.innerHTML = `
            <div class="empty-state">
              <i class="fas fa-clock"></i>
              <h3>No Recent Activity</h3>
              <p>Take your first quiz to see activity here!</p>
            </div>
          `;
        }
      }
    }
    
  } catch (error) {
    console.error('Error in updateDashboard:', error);
    // Show fallback content
    const topicMasteryEl = document.getElementById('topicMastery');
    if (topicMasteryEl) {
      topicMasteryEl.innerHTML = '<div class="topic-item"><div class="topic-name">Error loading data</div><div class="topic-progress"><span>Please refresh the page</span></div></div>';
    }
  } finally {
    // Reset the flag to allow future updates
    dashboardUpdateInProgress = false;
  }
}
function setupDashboardButtons() { /* ... your full function ... */ }
function setupDashboardButtons() {
  
  // Notification bell event listener
  let notificationBell = document.getElementById('notificationBtn');
  if (!notificationBell) {
    notificationBell = document.querySelector('.notification-btn');
  }
  if (notificationBell) {
    notificationBell.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      showNotificationsModal();
    });
  } else {
    console.error('Notification button not found - tried #notificationBtn and .notification-btn');
  }
  
  // Quick action buttons
  const startQuizBtn = document.querySelector('a[href="quiz-new.html"]');
  if (startQuizBtn) {
    startQuizBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'quiz-selection-new.html';
    });
  }
  
  const practiceWeakBtn = document.getElementById('practiceWeakBtn');
  if (practiceWeakBtn) {
    practiceWeakBtn.addEventListener('click', function() {
      // Store quiz mode in localStorage
      localStorage.setItem('quizMode', 'weak-areas-combined');
      localStorage.setItem('quizModeSelected', 'true');
      window.location.href = 'quiz-new.html';
    });
  }
  
  const reviewBtn = document.getElementById('reviewBtn');
  if (reviewBtn) {
    reviewBtn.addEventListener('click', function() {
      window.location.href = 'results-new.html';
    });
  }
  
  // Sidebar menu items
  const takeQuizLink = document.querySelector('a[href="quiz-new.html"]');
  if (takeQuizLink) {
    takeQuizLink.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'quiz-selection-new.html';
    });
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      // Unified logout: clear all localStorage and redirect
      localStorage.clear();
      window.location.href = 'index.html';
    });
  }
  
  // Dropdown toggles
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      
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
      // Store quiz mode in localStorage
      localStorage.setItem('quizMode', 'weak-areas-combined');
      localStorage.setItem('quizModeSelected', 'true');
      window.location.href = 'quiz-new.html';
    });
  }
  
  const practiceByTopic = document.getElementById('practiceByTopic');
  if (practiceByTopic) {
    practiceByTopic.addEventListener('click', function(e) {
      e.preventDefault();
      // Store quiz mode in localStorage
      localStorage.setItem('quizMode', 'topic-specific');
      localStorage.setItem('quizModeSelected', 'true');
      window.location.href = 'quiz-new.html';
    });
  }
  
  const practiceRandom = document.getElementById('practiceRandom');
  if (practiceRandom) {
    practiceRandom.addEventListener('click', function(e) {
      e.preventDefault();
      // Store quiz mode in localStorage
      localStorage.setItem('quizMode', 'all-topics');
      localStorage.setItem('quizModeSelected', 'true');
      window.location.href = 'quiz-new.html';
    });
  }
  
  // Progress dropdown options
  const viewBadges = document.getElementById('viewBadges');
  if (viewBadges) {
    viewBadges.addEventListener('click', function(e) {
      e.preventDefault();
      showBadgesModal();
    });
  }
  
  const viewStats = document.getElementById('viewStats');
  if (viewStats) {
    viewStats.addEventListener('click', function(e) {
      e.preventDefault();
      showStatsModal();
    });
  }
  
}
function startTopicQuiz(topic) {
  // Store the selected topic and redirect to quiz
  localStorage.setItem('selectedTopic', topic);
  localStorage.setItem('quizMode', 'topic-specific');
  localStorage.setItem('quizModeSelected', 'true');
  window.location.href = 'quiz-new.html';
}

function showDetailedRecommendations() {
  
  // Create modal for detailed recommendations
  const modal = document.createElement('div');
  modal.id = 'recommendationsModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;
  
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 30px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  `;
  
  modalContent.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0; color: #333; font-size: 24px;">
        <i class="fas fa-lightbulb" style="color: #f39c12; margin-right: 10px;"></i>
        Why These Recommendations?
      </h2>
      <button onclick="this.closest('#recommendationsModal').remove()" style="
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
        padding: 5px;
        border-radius: 50%;
        width: 35px;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      " onmouseover="this.style.background='#e9ecef'" onmouseout="this.style.background='none'">
               ✕
      </button>
    </div>
    
    <div style="margin-bottom: 25px;">
      <h3 style="color: #555; margin-bottom: 15px; font-size: 18px;">
        <i class="fas fa-brain" style="color: #3498db; margin-right: 8px;"></i>
        How We Choose Your Focus Areas
      </h3>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db;">
        <p style="margin: 0 0 15px 0; line-height: 1.6; color: #666;">
          Our smart recommendation engine analyzes your quiz performance to identify areas where you need the most improvement:
        </p>
        <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
          <li><strong>Low Performance Topics:</strong> Areas where your average score is below 70%</li>
          <li><strong>Recent Struggles:</strong> Topics you've answered incorrectly in recent quizzes</li>
          <li><strong>Knowledge Gaps:</strong> Fundamental concepts that affect multiple topics</li>
          <li><strong>Trending Difficulty:</strong> Areas where your performance is declining</li>
        </ul>
      </div>
    </div>
    
    <div style="margin-bottom: 25px;">
      <h3 style="color: #555; margin-bottom: 15px; font-size: 18px;">
        <i class="fas fa-target" style="color: #e74c3c; margin-right: 8px;"></i>
        Priority Levels Explained
      </h3>
      <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
        <div style="display: flex; align-items: center; padding: 15px; background: #ffe6e6; border-radius: 8px; border-left: 4px solid #e74c3c;">
          <i class="fas fa-exclamation-triangle" style="color: #e74c3c; margin-right: 12px; font-size: 18px;"></i>
          <div>
            <strong style="color: #c0392b;">High Priority (< 60%):</strong>
            <span style="color: #7f8c8d; margin-left: 8px;">Needs immediate attention</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #f39c12;">
          <i class="fas fa-exclamation-circle" style="color: #f39c12; margin-right: 12px; font-size: 18px;"></i>
          <div>
            <strong style="color: #d68910;">Medium Priority (60-75%):</strong>
            <span style="color: #7f8c8d; margin-left: 8px;">Room for improvement</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; padding: 15px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
          <i class="fas fa-info-circle" style="color: #28a745; margin-right: 12px; font-size: 18px;"></i>
          <div>
            <strong style="color: #1e7e34;">Low Priority (> 75%):</strong>
            <span style="color: #7f8c8d; margin-left: 8px;">Maintenance practice</span>
          </div>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3 style="color: #555; margin-bottom: 15px; font-size: 18px;">
        <i class="fas fa-rocket" style="color: #9b59b6; margin-right:   8px;"></i>
        Tips for Improvement
      </h3>
      <div style="background: #f4f3ff; padding: 20px; border-radius: 8px; border-left: 4px solid #9b59b6;">
        <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
          <li>Focus on your <strong>high-priority topics</strong> first for maximum improvement</li>
          <li>Practice each topic for <strong>10-15 minutes daily</strong> for consistent progress</li>
          <li>Review your <strong>incorrect answers</strong> to understand common mistakes</li>
          <li>Take <strong>mixed-topic quizzes</strong> to test your overall understanding</li>
          <li>Revisit topics periodically to <strong>maintain your knowledge</strong></li>
        </ul>
      </div>
    </div>
    
    <div style="display: flex; gap: 15px; justify-content: center;">
      <button onclick="window.location.href='quiz-selection-new.html'" style="
        background: #3498db;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
               gap: 8px;
      " onmouseover="this.style.background='#2980b9'" onmouseout="this.style.background='#3498db'">
        <i class="fas fa-play"></i>
        Start Practicing
      </button>
      <button onclick="this.closest('#recommendationsModal').remove()" style="
        background: #95a5a6;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      " onmouseover="this.style.background='#7f8c8d'" onmouseout="this.style.background='#95a5a6'">
        Got It
      </button>
    </div>
  `;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}
const dashboard = {
  // Initialize dashboard functionality
  init() {
    this.setupUserMenu();
    this.loadDashboardData();
  },

  // Setup user menu dropdown (hover only, no click logic)
  setupUserMenu() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'index.html';
      });
    }
  },

  // Load all dashboard data
  async loadDashboardData() {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('No user ID found for dashboard');
      return;
    }

    try {
      // Load user stats
      await this.loadUserStats(userId);
      // Load topic mastery
      await this.loadTopicMastery(userId);
      // Load recent activity
      await this.loadRecentActivity(userId);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  },

  // Load user statistics
  async loadUserStats(userId) {
    try {
      const response = await authFetch(getApiUrl('userStatistics', `/${userId}`));
      if (response.ok) {
        const stats = await response.json();
        this.updateUserDisplay(stats);
        this.updateStatsDisplay(stats);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  },

  // Update user display elements
  updateUserDisplay(stats) {
    const welcomeUsername = document.getElementById('welcomeUsername');
    const dashboardUsername = document.getElementById('dashboardUsername');
    // Use top-level username from API response
    const username = stats.username || basic.username || 'Student';
    if (welcomeUsername) welcomeUsername.textContent = username;
    if (dashboardUsername) dashboardUsername.textContent = username;
  },

  // Update statistics display
  updateStatsDisplay(stats) {
    const basic = stats.basic || {};
    // Debug: Log the value received for today_quizzes
    ('[DEBUG] Frontend received today_quizzes:', basic.today_quizzes, 'from API stats:', stats);
    
    // Header and welcome stats
    const headerStreak = document.getElementById('headerStreak');
    const streakDisplay = document.getElementById('streakDisplay');
    const totalQuizzesDisplay = document.getElementById('totalQuizzesDisplay');
    const accuracyDisplay = document.getElementById('accuracyDisplay');
    
    if (headerStreak) headerStreak.textContent = basic.streak_days || 0;
    if (streakDisplay) streakDisplay.textContent = basic.streak_days || 0;
    if (totalQuizzesDisplay) totalQuizzesDisplay.textContent = basic.total_quizzes || 0;
    if (accuracyDisplay) {
      const accuracy = basic.total_attempted > 0 
        ? Math.round((basic.total_correct / basic.total_attempted) * 100)
        : 0;
      accuracyDisplay.textContent = accuracy + '%';
    }

    // Performance overview
    const totalQuizzes = document.getElementById('totalQuizzes');
    const totalCorrect = document.getElementById('totalCorrect');
    const totalQuestions = document.getElementById('totalQuestions');
    const avgScore = document.getElementById('avgScore');
    
    if (totalQuizzes) totalQuizzes.textContent = basic.total_quizzes || 0;
    if (totalCorrect) totalCorrect.textContent = basic.total_correct || 0;
    if (totalQuestions) totalQuestions.textContent = basic.total_attempted || 0;
    if (avgScore) {
      const average = basic.total_attempted > 0 
        ? Math.round((basic.total_correct / basic.total_attempted) * 100)
        : 0;
      avgScore.textContent = average + '%';
    }

    // Quick stats bar
    const todayQuizzes = document.getElementById('todayQuizzes');
    const studyTime = document.getElementById('studyTime');
    const bestStreak = document.getElementById('bestStreak');
    const achievementCount = document.getElementById('achievementCount');
    
    if (todayQuizzes) {
      // Only update the number and label, never replace the element with id
      todayQuizzes.textContent = basic.today_quizzes || 0;
      // Update the label ("quiz"/"quizzes")
      const todayQuizLabel = todayQuizzes.parentElement;
      if (todayQuizLabel) {
        let label = 'quizzes';
        if ((basic.today_quizzes || 0) === 1) label = 'quiz';
        // Find the text node after the <strong>
        let next = todayQuizzes.nextSibling;
        // If the text node is missing (e.g., after a DOM change), insert it
        if (!next || next.nodeType !== Node.TEXT_NODE) {
          next = document.createTextNode(' ' + label);
          todayQuizLabel.appendChild(next);
        } else {
          next.textContent = ' ' + label;
        }
      }
    }
    if (studyTime) studyTime.textContent = Math.round((basic.total_time || 0) / 60) + 'm';
    if (bestStreak) bestStreak.textContent = basic.longest_streak || 0;
    if (achievementCount) achievementCount.textContent = stats.achievements?.length || 0;
  },

  // Load topic mastery data
  async loadTopicMastery(userId) {
    try {
      const response = await authFetch(getApiUrl('userTopicPerformance', `/${userId}`));
      const topicMasteryContainer = document.getElementById('topicMastery');
      
      if (response.ok) {
        const topics = await response.json();
        if (topics && topics.length > 0) {
          topicMasteryContainer.innerHTML = topics.map(topic => `
            <div class="topic-item">
              <div class="topic-header">
                <span class="topic-name">${topic.topic}</span>
                <span class="topic-mastery ${topic.mastery_level}">${topic.mastery_level}</span>
              </div>
              <div class="topic-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${topic.avg_score || 0}%"></div>
                </div>
                <span class="progress-text">${topic.avg_score || 0}%</span>
              </div>
              <div class="topic-stats">
                <span>${topic.total_correct || 0}/${topic.total_questions || 0} correct</span>
              </div>
            </div>
          `).join('');
        } else {
          topicMasteryContainer.innerHTML = `
            <div class="empty-state">
              <i class="fas fa-book"></i>
              <p>No topic data yet. Take a quiz to see your progress!</p>
              <a href="quiz-selection-new.html" class="btn btn-primary">Start Learning</a>
            </div>
          `;
        }
      } else {
        console.error('❌ Topic mastery API error:', response.status, response.statusText);
        topicMasteryContainer.innerHTML = '<p>Unable to load topic data.</p>';
      }
    } catch (error) {
      console.error('Error loading topic mastery:', error);
      const topicMasteryContainer = document.getElementById('topicMastery');
      if (topicMasteryContainer) {
        topicMasteryContainer.innerHTML = '<p>Error loading topic data.</p>';
      }
    }
  },

  // Load recent activity
  async loadRecentActivity(userId) {
    try {
      const response = await authFetch(getApiUrl('userStatistics', `/${userId}`));
      const activityContainer = document.getElementById('recentActivity');
      
      if (response.ok) {
        const stats = await response.json();
        const recentQuizzes = stats.recent_performance || [];
        
        if (recentQuizzes.length > 0) {
          activityContainer.innerHTML = recentQuizzes.slice(0, 5).map(quiz => {
            const date = new Date(quiz.date).toLocaleDateString();
            const time = new Date(quiz.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const percentage = quiz.percentage || Math.round((quiz.score / quiz.total) * 100);
            
            return `
              <div class="activity-item">
                <div class="activity-icon">
                  <i class="fas fa-brain"></i>
                </div>
                <div class="activity-content">
                  <div class="activity-title">Quiz Completed</div>
                  <div class="activity-details">Score: ${quiz.score}/${quiz.total} (${percentage}%)</div>
                  <div class="activity-time">${date} at ${time}</div>
                </div>
                <div class="activity-score ${percentage >= 70 ? 'good' : 'needs-improvement'}">
                  ${percentage}%
                </div>
              </div>
            `;
          }).join('');
        } else {
          activityContainer.innerHTML = `
            <div class="empty-state">
              <i class="fas fa-clock"></i>
              <p>No recent activity. Start a quiz to see your progress here!</p>
              <a href="quiz-selection-new.html" class="btn btn-primary">Take Quiz</a>
            </div>
          `;
        }
      } else {
        activityContainer.innerHTML = '<p>Unable to load activity data.</p>';
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
      const activityContainer = document.getElementById('recentActivity');
      if (activityContainer) {
        activityContainer.innerHTML = '<p>Error loading activity data.</p>';
      }
    }
  },

  // Logout function
  logout() {
    // Unified logout: clear all localStorage and redirect
    localStorage.clear();
    window.location.href = 'index.html';
  }
};

function getCurrentUserId() { /* ... */ }
function getCurrentUserId() {
  // Get user ID from localStorage - check both possible keys for compatibility
  let userId = localStorage.getItem('userId') || localStorage.getItem('currentUserId');
  
  // If still undefined/null, set and return default user ID
  if (!userId || userId === 'undefined' || userId === 'null') {
    console.warn('⚠️ No valid userId found in localStorage, defaulting to user 1');
    userId = '1';
    localStorage.setItem('userId', userId); // Store it for future use
  }
  
  // Additional validation to ensure we never return undefined
  if (typeof userId === 'undefined') {
    console.error('❌ UserId is still undefined after fallback, forcing to "1"');
    userId = '1';
  }
  
  return userId;
}
async function loadLatestQuizResults(userId) {
  
  try {
    const response = await authFetch(getApiUrl('latestQuizResult', `/${userId}`));
    
    if (!response.ok) {
      throw new Error('Failed to load latest quiz results');
    }
    
    const latestResult = await response.json();
    
    // Display results if on results page
    const statisticsContent = document.getElementById('quiz-statistics-content');
    if (statisticsContent && latestResult) {
      // Calculate percentage and format time
      const percentage = Math.round((latestResult.score / latestResult.total_questions) * 100);
      
      // Format time taken
      const minutes = Math.floor(latestResult.time_taken / 60);
      const seconds = latestResult.time_taken % 60;
      
      // Update the statistics content
      statisticsContent.innerHTML = `
        <div class="latest-result-card">
          <h3>📊 Latest Quiz Performance</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Score:</span>
              <span class="stat-value">${latestResult.score}/${latestResult.total_questions}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Percentage:</span>
              <span class="stat-value">${percentage}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Time:</span>
              <span class="stat-value">${minutes}:${seconds.toString().padStart(2, '0')}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Topic:</span>
              <span class="stat-value">${latestResult.topic || 'Mixed'}</span>
            </div>
          </div>
        </div>
      `;
    }
    
    return latestResult;
  } catch (error) {
    console.error('❌ Error loading latest quiz results:', error);
    return null;
  }
}

async function loadUserStats(userId) {
  try {
    const response = await authFetch(getApiUrl('userStatistics', `/${userId}`));
    if (response.ok) {
      const stats = await response.json();
      // Optionally update displays if needed
      if (typeof updateStatsTrends === 'function') updateStatsTrends(stats);
      return stats;
    } else {
      console.error('Failed to load user stats:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error loading user stats:', error);
    return null;
  }
}
async function loadQuizHistoryPage() {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('No user ID found for history page');
      return;
    }

    // Load user statistics and quiz history
    const stats = await loadUserStats(userId);
    if (stats) {
      // Update any stats displays on history page
      updateStatsTrends(stats);
    }

    // Load latest quiz results
    await loadLatestQuizResults(userId);
  } catch (error) {
    console.error('Error loading quiz history page:', error);
  }
}
function practiceWeakAreas() {
  try {
    // Store quiz mode in localStorage
    localStorage.setItem('quizMode', 'weak-areas-combined');
    localStorage.setItem('quizModeSelected', 'true');
    
    // Navigate to quiz page
    window.location.href = 'quiz-new.html';
  } catch (error) {
    console.error('Error setting up weak areas practice:', error);
  }
}

function updateStatsTrends(stats) {
  
  // Update trend indicators if elements exist
  const trendElements = {
    'accuracy-trend': stats.basic?.accuracy || 0,
    'streak-trend': stats.basic?.current_streak || 0,
    'improvement-trend': stats.recent_performance?.length || 0
  };
  
  Object.entries(trendElements).forEach(([elementId, value]) => {
    const element = document.getElementById(elementId);
    if (element) {
      // Add trend indicators
      const isPositive = value > 50; // Simple positive trend logic
      element.className = `trend ${isPositive ? 'trend-up' : 'trend-down'}`;
      element.textContent = isPositive ? '↗' : '→';
      element.title = `Trend: ${isPositive ? 'Improving' : 'Stable'}`;
    }
  });
}
// --- Global Click Handler for Recommendations ---

document.addEventListener('DOMContentLoaded', function() {
  document.body.addEventListener('click', function(e) {
    const target = e.target.closest('.rec-action');
    if (target) {
      let topic = null;
      // Try to get topic from URL param
      try {
        const url = new URL(target.href, window.location.origin);
        topic = url.searchParams.get('topic');
      } catch (err) {}
      // Fallback: try to get topic from closest .recommendation-item h4
      if (!topic) {
        const recItem = target.closest('.recommendation-item');
        if (recItem) {
          const h4 = recItem.querySelector('h4');
          if (h4) topic = h4.textContent.trim();
        }
      }

      if (topic) {
        e.preventDefault();
        var questionCount = (window.QUIZ_CONFIG && window.QUIZ_CONFIG.questionCounts && window.QUIZ_CONFIG.questionCounts['topic-specific']) || 10;
        // Always use getCurrentUserId() for consistency
        var userId = (typeof getCurrentUserId === 'function') ? getCurrentUserId() : (localStorage.getItem('currentUserId') || localStorage.getItem('userId') || null);
        var config = {
          mode: 'topic-specific',
          userId: userId,
          selectedTopic: topic,
          questionCount: questionCount
        };
        localStorage.setItem('quizConfig', JSON.stringify(config));
        localStorage.setItem('quizModeSelected', 'true');
        window.location.href = 'quiz-new.html';
      }
    }
  });
});
