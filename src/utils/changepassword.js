import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
async function sendPasswordResetEmail(email, generatedOTP) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.NODE_MAILER_EMAIL,
      pass: process.env.NODE_MAILER_GMAIL_APP_PASSWORD,
    },
  });

  const resetLink = `${process.env.APP_URL}/reset-password`;

  const mailOptions = {
    from: process.env.NODE_MAILER_EMAIL,
    to: email,
    subject: "Reset Your Password",
    text: `Please click the following link to reset your password: ${resetLink} \n OTP for Change Password:${generatedOTP}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
}

export default sendPasswordResetEmail;
