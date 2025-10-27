require("dotenv").config();
const nodemailer = require("nodemailer");

module.exports.sendEmail = (emailText, toEmail, subject, cvPath) => {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.warn("GMAIL_USER or GMAIL_PASSWORD is not set. Email will not be sent.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  const mailOptions = {
    from: gmailUser,
    to: toEmail,
    subject: subject,
    text: emailText,
    attachments: cvPath
      ? [
          {
            filename: cvPath.split("/").pop(),
            path: cvPath,
          },
        ]
      : undefined,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}
