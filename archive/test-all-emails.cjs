
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

const TO_EMAIL = 'yatharth.chauhan@yatricloud.com';

// --- TEMPLATES (Copied and adapted from src/lib/email-templates.ts) ---

const COLORS = {
    primary: '#3b82f6',
    secondary: '#1e3a8a',
    background: '#f3f4f6',
    card: '#ffffff',
    text: '#1f2937',
    textMuted: '#6b7280',
};

const BASE_TEMPLATE = (content, title) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; color: ${COLORS.text}; line-height: 1.6;">
    
    <!-- Header -->
    <div style="background-color: ${COLORS.secondary}; padding: 30px; text-align: center; border-radius: 0 0 20px 20px;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Yatri Cloud</h1>
    </div>

    <!-- Content -->
    <div style="background-color: ${COLORS.card}; padding: 40px; margin: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      ${content}
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: ${COLORS.textMuted}; font-size: 12px;">
      <p style="margin: 5px 0;">© ${new Date().getFullYear()} Yatri Cloud. All rights reserved.</p>
      <p style="margin: 5px 0;">Empowering your cloud journey.</p>
      
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin-bottom: 10px;">Connect with us:</p>
        <a href="https://www.youtube.com/@yatricloud?sub_confirmation=1&sub_confirmation=1" style="text-decoration: none; margin: 0 5px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/youtube-play.png" alt="YouTube" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://linkedin.com/company/yatricloud" style="text-decoration: none; margin: 0 5px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/linkedin.png" alt="LinkedIn" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://whatsapp.com/channel/0029VakdAHIFHWq60yHA1Q0s" style="text-decoration: none; margin: 0 5px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/whatsapp.png" alt="WhatsApp" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://twitter.com/yatricloud" style="text-decoration: none; margin: 0 5px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/twitter.png" alt="Twitter" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://instagram.com/yatricloud" style="text-decoration: none; margin: 0 5px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/instagram-new.png" alt="Instagram" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://discord.com/invite/92warrKq9j" style="text-decoration: none; margin: 0 5px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/discord-logo.png" alt="Discord" width="24" height="24" style="vertical-align: middle;"></a>
      </div>
    </div>
  </div>
</body>
</html>
`;

const getRegistrationEmail = (name, eventName, code, date, meetLink) => {
    const content = `
    <h2 style="color: ${COLORS.secondary}; margin-top: 0;">Registration Confirmed!</h2>
    <p>Hi ${name},</p>
    <p>You have successfully registered for <strong>${eventName}</strong>.</p>
    
    <div style="background-color: #eff6ff; border-left: 4px solid ${COLORS.primary}; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 5px 0; font-size: 16px;"><strong>Registration Code:</strong> <span style="font-family: monospace; background-color: white; padding: 2px 6px; border-radius: 4px; border: 1px solid ${COLORS.primary}; color: ${COLORS.primary};">${code}</span></p>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
      <p style="margin: 5px 0;"><strong>Location:</strong> Online</p>
    </div>

    ${meetLink ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${meetLink}" style="background-color: ${COLORS.primary}; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Join Meeting</a>
    </div>
    ` : ''}

    <p>We're excited to see you there! Make sure to add this to your calendar.</p>
    <p>Best regards,<br>The Yatri Cloud Team</p>
  `;
    return BASE_TEMPLATE(content, `Registration Confirmed: ${eventName}`);
};

const getProductPurchaseEmail = (name, productNames, amount, paymentId) => {
    const content = `
    <h2 style="color: ${COLORS.secondary}; margin-top: 0;">Order Confirmed!</h2>
    <p>Hi ${name},</p>
    <p>Thank you for your purchase from the Yatri Store.</p>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 5px 0;"><strong>Order ID:</strong> ${paymentId}</p>
      <p style="margin: 5px 0;"><strong>Items:</strong> ${productNames}</p>
      <p style="margin: 5px 0;"><strong>Total Paid:</strong> ${amount}</p>
    </div>

    <p><strong>Next Steps:</strong></p>
    <p>You will receive a separate email shortly with a <strong>meeting link</strong> to schedule your exam with our team.</p>
    
    <p>If you have any questions, feel free to reply to this email.</p>
    <p>Best regards,<br>The Yatri Cloud Team</p>
  `;
    return BASE_TEMPLATE(content, "Order Confirmation - Yatri Cloud");
};

const getWelcomeEmail = (name) => {
    const content = `
    <h2 style="color: ${COLORS.secondary}; margin-top: 0;">Welcome to Yatri Cloud!</h2>
    <p>Hi ${name},</p>
    <p>We're thrilled to have you join our community of cloud enthusiasts.</p>
    <p>Here at Yatri Cloud, you can:</p>
    <ul style="padding-left: 20px; color: ${COLORS.text};">
      <li style="margin-bottom: 10px;">Showcase your certifications</li>
      <li style="margin-bottom: 10px;">Register for exclusive workshops</li>
      <li style="margin-bottom: 10px;">Generate AI-powered practice questions</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://certification.yatricloud.com" style="background-color: ${COLORS.primary}; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Explore Dashboard</a>
    </div>

    <p>If you have any questions, feel free to reply to this email.</p>
    <p>Happy Learning!<br>The Yatri Cloud Team</p>
  `;
    return BASE_TEMPLATE(content, "Welcome to Yatri Cloud");
};

const getEventFeedbackEmail = (name, eventName, feedbackLink) => {
    const content = `
    <h2 style="color: ${COLORS.secondary}; margin-top: 0;">Thank You for Attending!</h2>
    <p>Hi ${name},</p>
    <p>Thanks for joining us at <strong>${eventName}</strong>. We hope you found it valuable!</p>
    <p>To help us improve and bring you better events, please take a moment to share your feedback. Completing this form is also required to receive your participation certificate.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${feedbackLink}" style="background-color: ${COLORS.primary}; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Give Feedback & Get Certificate</a>
    </div>

    <p>See you at the next event!</p>
    <p>Best regards,<br>The Yatri Cloud Team</p>
  `;
    return BASE_TEMPLATE(content, `Feedback Request: ${eventName}`);
};

const getCertificateSubmissionEmail = (name, certName, provider) => {
    const content = `
    <h2 style="color: ${COLORS.secondary}; margin-top: 0;">Achievement Unlocked!</h2>
    <p>Hi ${name},</p>
    <p>Congratulations on earning your <strong>${certName}</strong> from <strong>${provider}</strong>!</p>
    <p>We've successfully received your submission. It will now appear on your public profile and the "Yatri Stars" wall.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://certification.yatricloud.com/achievements" style="background-color: ${COLORS.primary}; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">View Profile</a>
    </div>

    <p>Keep learning and collecting those badges!</p>
    <p>Best regards,<br>The Yatri Cloud Team</p>
  `;
    return BASE_TEMPLATE(content, `Submission Received: ${certName}`);
};

// --- SENDING LOGIC ---

async function sendAllEmails() {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.office365.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            ciphers: 'SSLv3'
        }
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP connection established');
    } catch (e) {
        console.error('❌ SMTP connection failed', e);
        return;
    }

    const emails = [
        {
            name: "Welcome Email",
            subject: "Welcome to Yatri Cloud!",
            html: getWelcomeEmail("Yatharth Chauhan")
        },
        {
            name: "Registration Email (Free)",
            subject: "Registration Confirmed: Cloud Summit 2026",
            html: getRegistrationEmail("Yatharth Chauhan", "Cloud Summit 2026", "TEST-CODE-1234", "March 20, 2026", "https://meet.google.com/abc-defg-hij")
        },
        {
            name: "Product Purchase Email",
            subject: "Order Confirmation - Yatri Cloud",
            html: getProductPurchaseEmail("Yatharth Chauhan", "AWS Solution Architect Voucher", "₹12,499", "pay_test_123456789")
        },
        {
            name: "Event Feedback Email",
            subject: "Thanks for attending Cloud Summit 2026!",
            html: getEventFeedbackEmail("Yatharth Chauhan", "Cloud Summit 2026", "https://certification.yatricloud.com/events/CloudSummit2026/feedback")
        },
        {
            name: "Certificate Submission Email",
            subject: "Submission Received: AWS Developer Associate",
            html: getCertificateSubmissionEmail("Yatharth Chauhan", "AWS Developer Associate", "Amazon Web Services")
        }
    ];

    console.log(`📧 Sending ${emails.length} test emails to ${TO_EMAIL}...`);

    for (const email of emails) {
        try {
            await transporter.sendMail({
                from: `"Yatri Cloud" <${process.env.EMAIL_USER}>`,
                to: TO_EMAIL,
                subject: email.subject,
                html: email.html
            });
            console.log(`✅ Sent: ${email.name}`);
        } catch (error) {
            console.error(`❌ Failed: ${email.name}`, error.message);
        }
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('🎉 All test emails processed!');
}

sendAllEmails();
