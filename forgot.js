// // server.js
// const express = require('express');
// const bodyParser = require('body-parser');
// const nodemailer = require('nodemailer');
// const crypto = require('crypto');

// const app = express();
// const port = 3000;

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

// // Replace these with your email credentials
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'your_email@gmail.com',
//     pass: 'your_password'
//   }
// });

// // In a real application, store user data securely (e.g., in a database)
// let users = [
//   { email: 'user1@example.com', password: 'password1' },
//   { email: 'user2@example.com', password: 'password2' }
// ];

// app.post('/forgotpassword', (req, res) => {
//   const { email } = req.body;
//   const user = users.find(user => user.email === email);

//   if (!user) {
//     return res.status(404).send('User not found');
//   }

//   const token = crypto.randomBytes(20).toString('hex');

//   // In a real application, you would save the token to the user's record in the database
//   // For simplicity, let's just log it to the console
//   console.log(`Password reset token for ${email}: ${token}`);

//   const mailOptions = {
//     from: 'your_email@gmail.com',
//     to: email,
//     subject: 'Password Reset Request',
//     text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
//            Please click on the following link, or paste this into your browser to complete the process:\n\n
//            http://localhost:3000/reset/${token}\n\n
//            If you did not request this, please ignore this email and your password will remain unchanged.\n`
//   };

//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       console.error(error);
//       return res.status(500).send('Error sending email');
//     }
//     console.log('Email sent: ' + info.response);
//     res.status(200).send('Password reset instructions sent to your email');
//   });
// });

// app.listen(port, () => {
//   console.log(`Server is listening on port ${port}`);
// });

/// Updated code 



// Add preventDefault() to stop the form submission default behavior
document.getElementById('forgot-form').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent the default form submission behavior
  const email = document.getElementById('email').value;

  // Send password reset request to server
  fetch('http://localhost:3000/forgotpassword', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })
  .then(response => {
    if (response.ok) {
      return response.text();
    } else {
      throw new Error('Failed to send password reset instructions');
    }
  })
  .then(data => {
    alert(data); 
  })
  .catch(error => {
    console.error('Error:', error);
    alert('An error occurred. Please try again later.');
  });
});
