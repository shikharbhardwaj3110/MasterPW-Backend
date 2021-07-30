const nodemailer = require('nodemailer')
const dotenv = require('dotenv').config()

sendEmail = (recipientId, resetUrl) => {

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.sender_email,
      pass: process.env.sender_password
    }
  });
  
  var mailOptions = {
    from: process.env.sender_email,
    to: recipientId,
    subject: 'Password reset request',
    text: 'Dear user, here is your password reset link : ' + resetUrl
  };

  transporter.sendMail(mailOptions, (error,info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

module.exports = {sendEmail}