-- 071: Rebrand email templates to Yatri Cloud brand blue (#007CFF).
-- The email_templates rows are the admin-managed source (RLS: admin only);
-- code builders in src/lib/email-templates.ts are the public fallbacks. This
-- keeps the two in sync: brand blue header/headings/accents/icons instead of
-- navy (#1e3a8a) + blue-500 (#3b82f6), and community.yatricloud.com ->
-- yatricloud.com/community. Idempotent — re-running is a no-op once branded.

update email_templates set body_html =
  replace(
    replace(
      replace(
        replace(body_html, '3b82f6', '007cff'),
        '1e3a8a', '007cff'),
      'https://community.yatricloud.com', 'https://www.yatricloud.com/community'),
    'community.yatricloud.com', 'yatricloud.com/community');

-- Seed the enrollment confirmation template (new) so admin sessions render the
-- same branded email the code fallback (getEnrollmentEmail) produces.
insert into email_templates (key, subject, body_html)
values ('enrollment_confirmed', 'Enrollment Confirmed: {{course_name}}', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enrollment Confirmed: {{course_name}}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">

    <!-- Header -->
    <div style="background-color: #007cff; padding: 30px; text-align: center; border-radius: 0 0 20px 20px;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Yatri Cloud</h1>
    </div>

    <!-- Content -->
    <div style="background-color: #ffffff; padding: 40px; margin: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #007cff; margin-top: 0;">You''re enrolled!</h2>
      <p>Hello {{name}},</p>
      <p>You have successfully enrolled in <strong>{{course_name}}</strong>.</p>

      <div style="background-color: #eff6ff; border-left: 4px solid #007cff; padding: 15px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 5px 0;">Our team will reach out shortly with your access details and everything you need to get started.</p>
      </div>

      {{#if calendar_url}}
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{calendar_url}}" style="background-color: #007cff; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Add to your calendar</a>
      </div>
      {{/if}}

      <p>Happy learning,<br>Team Yatri Cloud</p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p style="margin: 5px 0;">© {{year}} Yatri Cloud. All rights reserved.</p>
      <p style="margin: 5px 0;">Empowering your cloud journey.</p>

      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin-bottom: 10px;">Connect with us:</p>
        <a href="https://www.youtube.com/@yatricloud?sub_confirmation=1" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/007cff/youtube-play.png" alt="YouTube" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://linkedin.com/company/yatricloud" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/007cff/linkedin.png" alt="LinkedIn" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://whatsapp.com/channel/0029VakdAHIFHWq60yHA1Q0s" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/007cff/whatsapp.png" alt="WhatsApp" width="24" height="24" style="vertical-align: middle;"></a>
      </div>

      <div style="margin-top: 15px;">
        <p style="margin: 5px 0;">Join Yatri Cloud Community: <a href="https://www.yatricloud.com/community" style="color: #007cff; text-decoration: none; font-weight: bold;">yatricloud.com/community</a></p>
        <p style="margin: 5px 0; color: #dc2626; font-weight: bold;">🔥 Special Offer: <a href="https://calendly.com/yatricloud/40min" style="color: #dc2626; text-decoration: underline;">Get 50% OFF on AWS Exam</a></p>
      </div>
    </div>
  </div>
</body>
</html>')
on conflict (key) do update set subject = excluded.subject, body_html = excluded.body_html;
