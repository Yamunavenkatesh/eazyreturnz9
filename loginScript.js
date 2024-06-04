// script.js
document.getElementById('login-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // Send login credentials to server
  fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })
  .then(response => {
    if (response.ok) {
      // Redirect to another page upon successful login
      window.location.href = './home.html';
    } else {
      return response.json();
    }
  })
  .then(data => {
    document.getElementById('error-message').textContent = data.message;
  })
  .catch(error => {
    console.error('Error:', error);
    document.getElementById('error-message').textContent = 'An error occurred. Please try again.';
  });
});
