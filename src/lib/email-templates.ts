/**
 * Email Templates for Yatri Cloud
 * Uses inline styles for maximum email client compatibility.
 */

const COLORS = {
  primary: '#3b82f6', // blue-500
  secondary: '#1e3a8a', // blue-900
  background: '#f3f4f6', // gray-100
  card: '#ffffff',
  text: '#1f2937', // gray-800
  textMuted: '#6b7280', // gray-500
};

const LOGO_URL = "https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/logo/yatri_cloud_logo.png"; // Replace with actual logo URL if available

const BASE_TEMPLATE = (content: string, title: string) => `
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
        <a href="https://www.youtube.com/@yatricloud?sub_confirmation=1" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/youtube-play.png" alt="YouTube" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://linkedin.com/company/yatricloud" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/linkedin.png" alt="LinkedIn" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://whatsapp.com/channel/0029VakdAHIFHWq60yHA1Q0s" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/whatsapp.png" alt="WhatsApp" width="24" height="24" style="vertical-align: middle;"></a>
      </div>

      <div style="margin-top: 15px;">
        <p style="margin: 5px 0;">Join Yatri Cloud Community: <a href="https://community.yatricloud.com" style="color: ${COLORS.primary}; text-decoration: none; font-weight: bold;">community.yatricloud.com</a></p>
        <p style="margin: 5px 0; color: #dc2626; font-weight: bold;">🔥 Special Offer: <a href="https://calendly.com/yatricloud/30min" style="color: #dc2626; text-decoration: underline;">Get 50% OFF on AWS Exam</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const getRegistrationEmail = (name: string, eventName: string, code: string, date: string, meetLink?: string) => {
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
    <p>Best regards,<br>Team Yatri Cloud</p>
  `;
  return BASE_TEMPLATE(content, `Registration Confirmed: ${eventName}`);
};

export const getProductPurchaseEmail = (name: string, productNames: string, amount: string, paymentId: string) => {
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
    <p>Best regards,<br>Team Yatri Cloud</p>
  `;
  return BASE_TEMPLATE(content, "Order Confirmation - Yatri Cloud");
};

export const getCertificateSubmissionEmail = (name: string, certName: string, provider: string) => {
  const content = `
    <h2 style="color: ${COLORS.secondary}; margin-top: 0;">Achievement Unlocked!</h2>
    <p>Hi ${name},</p>
    <p>Congratulations on earning your <strong>${certName}</strong> from <strong>${provider}</strong>!</p>
    <p>We've successfully received your submission. It will now appear on your public profile and the "Yatri Stars" wall.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://certification.yatricloud.com/achievements" style="background-color: ${COLORS.primary}; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">View Profile</a>
    </div>

    <p>Keep learning and collecting those badges!</p>
    <p>Best regards,<br>Team Yatri Cloud</p>
  `;
  return BASE_TEMPLATE(content, `Submission Received: ${certName}`);
};

export const getWelcomeEmail = (name: string) => {
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
    <p>Happy Learning!<br>Team Yatri Cloud</p>
  `;
  return BASE_TEMPLATE(content, "Welcome to Yatri Cloud");
};

export const getEventFeedbackEmail = (name: string, eventName: string, feedbackLink: string) => {
  const content = `
    <h2 style="color: ${COLORS.secondary}; margin-top: 0;">Thank You for Attending!</h2>
    <p>Hi ${name},</p>
    <p>Thanks for joining us at <strong>${eventName}</strong>. We hope you found it valuable!</p>
    <p>To help us improve and bring you better events, please take a moment to share your feedback. Completing this form is also required to receive your participation certificate.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${feedbackLink}" style="background-color: ${COLORS.primary}; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Give Feedback & Get Certificate</a>
    </div>

    <p>See you at the next event!</p>
    <p>Best regards,<br>Team Yatri Cloud</p>
  `;
  return BASE_TEMPLATE(content, `Feedback Request: ${eventName}`);
};

export const getExamDumpPurchaseEmail = (name: string, dumpTitle: string, amount: string, downloadUrl: string, paymentId: string) => {
  const content = `
    <h2 style="color: ${COLORS.secondary}; margin-top: 0;">Exam Dump Access!</h2>
    <p>Hi ${name},</p>
    <p>Thank you for purchasing the <strong>${dumpTitle}</strong> exam dump.</p>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 5px 0;"><strong>Order ID:</strong> ${paymentId}</p>
      <p style="margin: 5px 0;"><strong>Total Paid:</strong> ${amount}</p>
    </div>

    <p><strong>Your Download Link:</strong></p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${downloadUrl}" style="background-color: ${COLORS.primary}; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Download Exam Dump</a>
    </div>
    
    <p style="font-size: 14px; color: ${COLORS.textMuted}; text-align: center;">If the button above doesn't work, copy and paste this link into your browser:<br>${downloadUrl}</p>

    <p>Success in your certification journey!</p>
    <p>Best regards,<br>Team Yatri Cloud</p>
  `;
  return BASE_TEMPLATE(content, "Your Exam Dump Download Link - Yatri Cloud");
};
