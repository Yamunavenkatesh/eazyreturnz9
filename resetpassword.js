// resetpassword.js
document.getElementById('reset-password-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const token = document.getElementById('token').value;
    const newPassword = document.getElementById('new-password').value;
  
    fetch('http://localhost:3000/resetpassword', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('Failed to reset password');
      }
    })
    .then(data => {
      alert(data.message); 
      // Redirect to login page or perform further actions upon successful password reset
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred. Please try again later.');
    });
  });
  