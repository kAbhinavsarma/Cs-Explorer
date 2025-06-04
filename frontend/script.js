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
