require('dotenv').config();
const nodemailer = require('nodemailer');

async function send() {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.office365.com',
    port: Number(process.env.EMAIL_PORT || 587),
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls: { ciphers: 'SSLv3' },
  });

  const info = await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || 'Yatri Cloud'}" <${process.env.EMAIL_USER}>`,
    to: "yatharthchauhan.me@gmail.com",
    subject: "Test Email from Yatri Cloud",
    html: "<h2>Hello Yatharth!</h2><p>This is a test email sent to verify that the email configuration is working perfectly.</p>",
  });

  console.log('✅ Email sent:', info.messageId);
}
send().catch(console.error);
