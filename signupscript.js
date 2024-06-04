document.getElementById('signup-form').addEventListener('submit', function(event) {
  event.preventDefault();

  // Get form values
  var username = document.getElementById('username').value;
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;
  var confirmPassword = document.getElementById('confirm-password').value;

  // Check if passwords match
  if (password !== confirmPassword) {
    var message = document.getElementById('message');
    message.textContent = 'Passwords do not match!';
    message.style.color = 'red';
    return;
  }

  // Send data to server
  fetch('http://localhost:3000/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  })
  .then(response => response.json()) // Expecting JSON response
  .then(data => {
    var message = document.getElementById('message');
    message.textContent = data.message; // Display server response message
    message.style.color = 'green';
  })
  .catch(error => {
    console.error('Error:', error);
    var message = document.getElementById('message');
    message.textContent = 'An error occurred. Please try again.';
    message.style.color = 'red';
  });
});
