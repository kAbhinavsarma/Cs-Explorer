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
