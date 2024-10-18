const nodemailer = require("nodemailer");

async function sendMail(to, subject, text) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.mail_username,
      pass: process.env.mail_password,
    },
  });

  const mailOptions = {
    from: "aswinram2k85@gmail.com",
    to,
    subject,
    text,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent done.");
  } catch (error) {
    console.log(error.message);
  }
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


module.exports = { sendMail, generateOTP };
