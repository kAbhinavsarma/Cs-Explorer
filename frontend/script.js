// script.js
// This file will handle dynamic content and API calls in future steps.
//console.log('CS Explorer frontend loaded.');
// Handle Login Form Submission
document.addEventListener('DOMContentLoaded', function () {
  // Login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value;
      const password = document.getElementById('loginPassword').value;

      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        // Save user info (for demo: localStorage)
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', data.username);
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
      } else {
        alert(data.error || 'Login failed');
      }
    });
  }

  // Signup
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const username = document.getElementById('signupUsername').value;
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPassword').value;

      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await response.json();
      if (response.ok) {
        alert('Signup successful! Please log in.');
        // Optionally, auto-fill login form
        document.getElementById('loginUsername').value = username;
        document.getElementById('loginPassword').value = password;
      } else {
        alert(data.error || 'Signup failed');
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
    const userId = localStorage.getItem('userId');
    // You can add topic or adaptive logic here if you want
    const response = await fetch('http://localhost:5000/api/questions');
    questions = await response.json();
    displayQuestions();
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
    submitBtn.style.display = 'block';
  }

  // Collect answers and submit
  submitBtn.onclick = async function () {
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
    // Save result for results page
    localStorage.setItem('lastQuizResult', JSON.stringify(result));
    // Redirect to results page
    window.location.href = 'results.html';
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

    // Fetch quiz history (add this endpoint to your backend if not present)
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

    dashboardContent.innerHTML = html;
  }

  loadDashboard();
}
