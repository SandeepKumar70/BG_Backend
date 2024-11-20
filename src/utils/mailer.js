import nodemailer from "nodemailer";

export const onMailer = async (email, epmId, password) => {
  console.log(email, epmId, password);
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.NODE_MAILER_EMAIL, // jassijas182002@gmail.com
      pass: process.env.NODE_MAILER_GMAIL_APP_PASSWORD,
    },
  });
  console.log("transporter:", transporter);
  const mailOptions = {
    from: process.env.NODE_MAILER_EMAIL, // jassijas182002@gmail.com
    to: email, // Updated recipient email
    subject: "Employee Login Credentials",
    text: `A new employee has been created with the following login credentials:
    Employee Id: ${epmId}
    Employee Password: ${password}`,
  };
  console.log("mailOptions", mailOptions);
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};


export const notifyAdmin = async (adminEmail, newEmployeeDetails) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.NODE_MAILER_EMAIL,
      pass: process.env.NODE_MAILER_GMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.NODE_MAILER_EMAIL,
    to: adminEmail,
    subject: "New Employee Created",
    text: `A new employee has been created with the following details:
    Name: ${newEmployeeDetails.name}
    Employee ID: ${newEmployeeDetails.employeeId}
    Position: ${newEmployeeDetails.position}
    Email: ${newEmployeeDetails.email}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Admin notification sent: " + info.response);
    return true;
  } catch (error) {
    console.log("Error sending admin notification:", error);
    return false;
  }
};
