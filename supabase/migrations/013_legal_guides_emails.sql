-- ============================================================
-- Yatri Cloud — 013_legal_guides_emails.sql
-- Dynamic legal pages, in-app guides, and transactional email
-- templates: legal_pages, guides, email_templates.
-- Admin managed from /admin; legal pages + guides are public read,
-- email templates are admin-only. Seeded from the content live in
-- the app today (PrivacyPolicy.tsx, TermsOfService.tsx,
-- guides-content.ts, email-templates.ts).
-- ============================================================

-- ---------- helper macro pattern: every table gets trigger + RLS ----------

create table if not exists legal_pages (
  slug text primary key,
  title text not null,
  body_md text not null,
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_legal_pages_updated on legal_pages;
create trigger trg_legal_pages_updated before update on legal_pages
  for each row execute function set_updated_at();
alter table legal_pages enable row level security;
drop policy if exists "legal_pages_public_read" on legal_pages;
create policy "legal_pages_public_read" on legal_pages for select using (true);
drop policy if exists "legal_pages_admin_write" on legal_pages;
create policy "legal_pages_admin_write" on legal_pages for all using (is_admin()) with check (is_admin());

-- Bodies converted 1:1 from the JSX in src/pages/PrivacyPolicy.tsx and
-- src/pages/TermsOfService.tsx (## heading per <section>, every sentence
-- verbatim). The H1 lives in the title column; the "Last updated" line is
-- rendered dynamically by the page and is not part of the body.
insert into legal_pages (slug, title, body_md)
select * from (values
  ('privacy-policy', 'Privacy Policy', '## 1. Introduction

Yatri Cloud ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.

## 2. Information We Collect

We may collect information about you in a variety of ways:

- Personal information you provide when using our services
- Usage data and analytics information
- Cookies and tracking technologies
- Information from third-party services integrated with our platform

## 3. How We Use Your Information

We use the information we collect to:

- Provide, maintain, and improve our services
- Process transactions and send related information
- Send technical notices and support messages
- Respond to your comments and questions
- Monitor and analyze trends and usage

## 4. Information Sharing

We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:

- With your consent
- To comply with legal obligations
- To protect our rights and safety
- With service providers who assist us in operating our platform

## 5. Data Security

We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.

## 6. Your Rights

You have the right to:

- Access and receive a copy of your personal data
- Rectify inaccurate personal data
- Request deletion of your personal data
- Object to processing of your personal data
- Request restriction of processing your personal data

## 7. Cookies

We use cookies and similar tracking technologies to track activity on our website and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.

## 8. Changes to This Privacy Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.

## 9. Contact Us

If you have any questions about this Privacy Policy, please contact us through our website or email.'),
  ('terms-of-service', 'Terms of Service', '## 1. Agreement to Terms

By accessing or using Yatri Cloud''s services, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access our services.

## 2. Use License

Permission is granted to temporarily access the materials on Yatri Cloud''s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:

- Modify or copy the materials
- Use the materials for any commercial purpose or for any public display
- Attempt to reverse engineer any software contained on the website
- Remove any copyright or other proprietary notations from the materials

## 3. User Accounts

When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.

## 4. Content

Our service allows you to post, link, store, share and otherwise make available certain information. You are responsible for the content that you post on or through the service, including its legality, reliability, and appropriateness.

By posting content on or through the service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such content on and through the service.

## 5. Prohibited Uses

You may not use our service:

- In any way that violates any applicable law or regulation
- To transmit any malicious code or viruses
- To impersonate or attempt to impersonate another user
- To engage in any automated use of the system
- To interfere with or disrupt the service or servers

## 6. Intellectual Property

The service and its original content, features, and functionality are and will remain the exclusive property of Yatri Cloud and its licensors. The service is protected by copyright, trademark, and other laws.

## 7. Disclaimer

The materials on Yatri Cloud''s website are provided on an ''as is'' basis. Yatri Cloud makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.

## 8. Limitations

In no event shall Yatri Cloud or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Yatri Cloud''s website.

## 9. Revisions

Yatri Cloud may revise these terms of service at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.

## 10. Governing Law

These terms and conditions are governed by and construed in accordance with applicable laws. Any disputes relating to these terms will be subject to the exclusive jurisdiction of the courts in the applicable jurisdiction.')
) as seed(slug, title, body_md)
where not exists (select 1 from legal_pages);

create table if not exists guides (
  slug text primary key,
  title text not null,
  body_md text not null,
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_guides_updated on guides;
create trigger trg_guides_updated before update on guides
  for each row execute function set_updated_at();
alter table guides enable row level security;
drop policy if exists "guides_public_read" on guides;
create policy "guides_public_read" on guides for select using (true);
drop policy if exists "guides_admin_write" on guides;
create policy "guides_admin_write" on guides for all using (is_admin()) with check (is_admin());

-- Bodies verbatim from src/data/guides-content.ts (ADMIN_GUIDE_CONTENT,
-- USER_GUIDE_CONTENT, ADMIN_URL_SITE_MAP, USER_URL_SITE_MAP); only the
-- template-literal enclosing newlines were trimmed. Titles = each guide's H1.
insert into guides (slug, title, body_md)
select * from (values
  ('admin-guide', 'Yatri Cloud: The Definitive Operations Manual', '# Yatri Cloud: The Definitive Operations Manual

## 1. Platform Architecture & Strategy
Yatri Cloud is an enterprise-grade community and learning management system (CLMS) designed to bridge the gap between education and industry certification.
- **Core Engine**: A hybrid architecture using Google Sheets as a synchronized database, Vercel for high-performance hosting, and a robust Proxy Layer for API security.
- **Mission**: Orchestrating the "Yatri" (Learner) journey from first gathering to verified cloud expert.

## 2. The Event Ecosystem (Lifecycle)
Efficient event management is the heartbeat of the platform. Admins manage the full lifecycle:
- **Phase 1: Incubation (Draft)**: Identifying the theme and logistics. Posters should be optimized for 16:9 for consistent branding.
- **Phase 2: Live Registration**:
  - **Dynamic Ticketing**: Configure multiple tiers (Early Bird, Standard, VIP).
  - **Inventory Control**: Real-time tracking of registration limits.
- **Phase 3: Execution (Live)**: Managing joining links for virtual sessions (Zoom/Google Meet) and venue maps for in-person workshops.
- **Phase 4: Archival (Past Events)**:
  - **Gallery Automation**: Uploading highlight albums to engage the community post-event.
  - **Metrics**: Access registries to track engagement across domains.

## 3. Academia & Training Infrastructure
The Training Hub is designed for scalability and knowledge preservation.
- **Curriculum Architecture**: Hierarchy based on **Modules** (Logical units) and **Lessons** (Specific concepts).
- **Interactive Lessons**: Support for 4K Video embed (YouTube/Vimeo), professional Markdown documentation, and dedicated resource downloads.
- **Validation Engine**: Integrating **Module Quizzes** with auto-grading allows for a "Mastery-based" learning flow.
- **Dynamic Certification**: Only learners who achieve 100% progress and pass all validation checks can retrieve their platform-signed credentials.

## 4. Community Pipeline (Submissions)
Decentralized community growth is managed through three primary submission pipelines:
- **Speaker Proposals**: Quality control for session content and instructor expertise.
- **Venue Partners**: Vetting local hosts for in-person workshops.
- **Sponsorships**: Managing enterprise partnerships and resource allocations.

## 5. Merchant & External API Services
- **Udemy Gateway**: Synchronizing practice sets and managing large-scale voucher distributions via instructor webhooks.
- **Yatri Store**: Full control over inventory for Cloud Vouchers, Certification exams, and exclusive Community Swag.
- **Payment Processing**: Integrated Razorpay reconciliation for secure, transparent transactions.

## 6. Intelligence & Governance
- **Yatri AI Control**: Configuring the Ollama-driven prompts that power the platform''s intelligent assistants.
- **Identity Trust**: Verifying "Yatri Star" credentials and social media identities (LinkedIn/GitHub) to ensure platform integrity.

---
**Need help finding a specific URL?** Check our definitive [Sitemap & Access Guide](/admin/sitemap).'),
  ('user-guide', 'Yatri Cloud: The Professional Growth Guide', '# Yatri Cloud: The Professional Growth Guide

## 1. Your Verified Professional Identity
Yatri Cloud isn''t just a learning portal—it''s a digital portfolio.
- **The "Yatri Star" Program**: Complete your profile with **LinkedIn** and **GitHub** links to gain the verification badge. Verified accounts rank higher in the Global Wall of Fame.
- **Identity Assets**: Your uploaded profile photo is automatically synced with your earned certificates to ensure high-fidelity credentialing.

## 2. The Learning Journey (Academia)
Mastering cloud technologies through structured, high-stakes training.
- **The Interactive Dashboard**: A triple-pane interface for a distraction-free learning experience (Video, Docs, and Navigation).
- **Progressive Tracking**: Real-time completion percentages across all modules.
- **Knowledge Validation**: Quizzes at the end of each module to test your mastery before certification.
- **Certification Wall**: All earned badges from AWS, Azure, and Google Cloud are showcased alongside your Yatri Cloud progress.

## 3. Community Engagement & Leadership
Transition from a Learner to a Leader.
- **Event Participation**: Direct access to high-impact workshops, meetups, and joining information.
- **Leaderboards**: Track your standing against other "Yatris" in the community through domain-specific filters.
- **Contribute**: Submit proposals to Speak, Host (Venue), or Sponsor events to build your industry authority.

## 4. Store, Vouchers & Rewards
- **Cloud Vouchers**: Access exclusive discounts for Udemy Practice Exams.
- **Store Rewards**: Redeem community points or purchase official certifications and merchandise.

---
**Lost on the Platform?** Use our [URL Sitemap Guide](/profile/sitemap) to find exactly what you need.'),
  ('admin-sitemap', 'Yatri Cloud: Administrative Sitemap & Operations Guide', '# Yatri Cloud: Administrative Sitemap & Operations Guide

This guide provides a comprehensive map of the platform''s internal operational infrastructure. Use this to navigate management command centers, moderation queues, and system governance tools.

## 1. System Command Centers
Core locations for platform-wide monitoring and resource allocation.
- **/admin**: The primary dashboard. High-level performance metrics and event status.
- **/admin/events**: Full-lifecycle event management (Draft to Archive).
- **/admin/training**: Academic administration hub for managing courses, modules, and quizzes.
- **/admin/attendees**: Master registry of all event participants and community members.
- **/admin/enrollments**: Global monitoring of student progress and certification achievement.

## 2. Moderation & Partnerships
Review pipelines for community growth and enterprise relations.
- **/admin/submissions**: Moderation queue for incoming proposals (Speakers, Venues, Sponsors).
- **/admin/udemy**: Gateway for synchronizing external practice sets and voucher distributions.
- **/admin/trainers**: Hub for managing verified instructor applications and permissions.
- **/admin/providers**: Configuration for external payment gateways and cloud infrastructure partners.

## 3. Governance & Automation
Infrastructure settings and intelligent platform layers.
- **/admin/ai**: Management for platform-wide AI prompts and automation settings.
- **/admin/products/add**: Inventory management for the Yatri Store.
- **/admin/guide**: The Definitive Operations Manual for system administrators.

---
**Looking for the Learner Sitemap?** You can view the [User Sitemap Guide](/profile/sitemap) to see the platform from the student''s perspective.'),
  ('user-sitemap', 'Yatri Cloud: User Sitemap & Access Guide', '# Yatri Cloud: User Sitemap & Access Guide

This guide is your definitive reference for navigating the learner-facing side of the Yatri Cloud ecosystem. Use this to find your training materials, certification records, and community event hubs.

## 1. Professional Identity & Profile
Maintain your "Yatri Star" verification and manage your digital certifications.
- **/edit-profile**: Your digital identity. Complete your social profile (LinkedIn/GitHub) to gain the verification badge.
- **/manage-certifications**: The Wall of Badges. Upload and verify your external industry certifications for community recognition.
- **/achievements**: A visual record of your learning milestones and platform contributions.

## 2. Academia & Learning Hub
Primary locations for structured training and certification exam prep.
- **/training**: The course catalog. Browse vendor-neutral cloud certification training (AWS, Azure, Google Cloud).
- **/my-trainings**: Your personal classroom. Resume lessons, track progress (%), and download earned certificates.
- **/yatristore**: Marketplace for Cloud Vouchers, official merchandise, and community swag.

## 3. Community Engagement
Explore upcoming sessions and interact with the global learner network.
- **/**: Platform landing page. Best for discovering trending cloud courses and latest meetups.
- **/events**: The community calendar. View both active registrations and historical galleries.
- **/certifiedyatris**: The Global Wall of Fame. See where you rank on the community leaderboard.
- **/profile/guide**: The comprehensive onboarding handbook for new learners.

## 4. Community Contribution Tools
Specialized hooks for active community members and instructors.
- **/creator**: Onboarding for aspiring trainers looking to contribute to the Academy.
- **/feedback**: Our improvement portal. Share your thoughts on platform features.
- **/reviews**: See what other Yatris are saying about our training programs.')
) as seed(slug, title, body_md)
where not exists (select 1 from guides);

create table if not exists email_templates (
  key text primary key,
  subject text not null,
  body_html text not null,
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_email_templates_updated on email_templates;
create trigger trg_email_templates_updated before update on email_templates
  for each row execute function set_updated_at();
alter table email_templates enable row level security;
drop policy if exists "email_templates_admin_read" on email_templates;
create policy "email_templates_admin_read" on email_templates for select using (is_admin());
drop policy if exists "email_templates_admin_write" on email_templates;
create policy "email_templates_admin_write" on email_templates for all using (is_admin()) with check (is_admin());

-- Templates rendered from src/lib/email-templates.ts (BASE_TEMPLATE + each
-- content builder) with the COLORS constants resolved to their literal hex
-- values (primary #3b82f6, secondary #1e3a8a, background #f3f4f6, card
-- #ffffff, text #1f2937, textMuted #6b7280) and every TS `${expr}`
-- interpolation replaced by a `{{variable}}` placeholder. Shared across all
-- templates: `${new Date().getFullYear()}` -> {{year}}.

-- registration_confirmed <- getRegistrationEmail(name, eventName, code, date, meetLink?)
-- Mapping: ${name} -> {{name}} · ${eventName} -> {{event_name}} ·
-- ${code} -> {{code}} · ${date} -> {{date}} · ${meetLink} -> {{meet_link}}.
-- The Join Meeting block was a TS conditional (`meetLink ? ... : ''`);
-- it is kept wrapped in {{#if meet_link}}...{{/if}} markers.
insert into email_templates (key, subject, body_html)
select 'registration_confirmed', 'Registration Confirmed: {{event_name}}', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Confirmed: {{event_name}}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">

    <!-- Header -->
    <div style="background-color: #1e3a8a; padding: 30px; text-align: center; border-radius: 0 0 20px 20px;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Yatri Cloud</h1>
    </div>

    <!-- Content -->
    <div style="background-color: #ffffff; padding: 40px; margin: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #1e3a8a; margin-top: 0;">Registration Confirmed!</h2>
      <p>Hello {{name}},</p>
      <p>You have successfully registered for <strong>{{event_name}}</strong>.</p>

      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 5px 0; font-size: 16px;"><strong>Registration Code:</strong> <span style="font-family: monospace; background-color: white; padding: 2px 6px; border-radius: 4px; border: 1px solid #3b82f6; color: #3b82f6;">{{code}}</span></p>
        <p style="margin: 5px 0;"><strong>Date:</strong> {{date}}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> Online</p>
      </div>

      {{#if meet_link}}
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{meet_link}}" style="background-color: #3b82f6; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Join Meeting</a>
      </div>
      {{/if}}

      <p>We''re excited to see you there! Make sure to add this to your calendar.</p>
      <p>Best regards,<br>Team Yatri Cloud</p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p style="margin: 5px 0;">© {{year}} Yatri Cloud. All rights reserved.</p>
      <p style="margin: 5px 0;">Empowering your cloud journey.</p>

      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin-bottom: 10px;">Connect with us:</p>
        <a href="https://www.youtube.com/@yatricloud?sub_confirmation=1" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/youtube-play.png" alt="YouTube" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://linkedin.com/company/yatricloud" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/linkedin.png" alt="LinkedIn" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://whatsapp.com/channel/0029VakdAHIFHWq60yHA1Q0s" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/whatsapp.png" alt="WhatsApp" width="24" height="24" style="vertical-align: middle;"></a>
      </div>

      <div style="margin-top: 15px;">
        <p style="margin: 5px 0;">Join Yatri Cloud Community: <a href="https://community.yatricloud.com" style="color: #3b82f6; text-decoration: none; font-weight: bold;">community.yatricloud.com</a></p>
        <p style="margin: 5px 0; color: #dc2626; font-weight: bold;">🔥 Special Offer: <a href="https://calendly.com/yatricloud/40min" style="color: #dc2626; text-decoration: underline;">Get 50% OFF on AWS Exam</a></p>
      </div>
    </div>
  </div>
</body>
</html>'
where not exists (select 1 from email_templates where key = 'registration_confirmed');

-- product_purchase <- getProductPurchaseEmail(name, productNames, amount, paymentId)
-- Mapping: ${name} -> {{name}} · ${productNames} -> {{product_names}} ·
-- ${amount} -> {{amount}} · ${paymentId} -> {{payment_id}}.
insert into email_templates (key, subject, body_html)
select 'product_purchase', 'Order Confirmation - Yatri Cloud', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - Yatri Cloud</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">

    <!-- Header -->
    <div style="background-color: #1e3a8a; padding: 30px; text-align: center; border-radius: 0 0 20px 20px;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Yatri Cloud</h1>
    </div>

    <!-- Content -->
    <div style="background-color: #ffffff; padding: 40px; margin: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #1e3a8a; margin-top: 0;">Order Confirmed!</h2>
      <p>Hello {{name}},</p>
      <p>Thank you for your purchase from the Yatri Store.</p>

      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 5px 0;"><strong>Order ID:</strong> {{payment_id}}</p>
        <p style="margin: 5px 0;"><strong>Items:</strong> {{product_names}}</p>
        <p style="margin: 5px 0;"><strong>Total Paid:</strong> {{amount}}</p>
      </div>

      <p><strong>Next Steps:</strong></p>
      <p>You will receive a separate email shortly with a <strong>meeting link</strong> to schedule your exam with our team.</p>

      <p>If you have any questions, feel free to reply to this email.</p>
      <p>Best regards,<br>Team Yatri Cloud</p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p style="margin: 5px 0;">© {{year}} Yatri Cloud. All rights reserved.</p>
      <p style="margin: 5px 0;">Empowering your cloud journey.</p>

      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin-bottom: 10px;">Connect with us:</p>
        <a href="https://www.youtube.com/@yatricloud?sub_confirmation=1" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/youtube-play.png" alt="YouTube" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://linkedin.com/company/yatricloud" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/linkedin.png" alt="LinkedIn" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://whatsapp.com/channel/0029VakdAHIFHWq60yHA1Q0s" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/whatsapp.png" alt="WhatsApp" width="24" height="24" style="vertical-align: middle;"></a>
      </div>

      <div style="margin-top: 15px;">
        <p style="margin: 5px 0;">Join Yatri Cloud Community: <a href="https://community.yatricloud.com" style="color: #3b82f6; text-decoration: none; font-weight: bold;">community.yatricloud.com</a></p>
        <p style="margin: 5px 0; color: #dc2626; font-weight: bold;">🔥 Special Offer: <a href="https://calendly.com/yatricloud/40min" style="color: #dc2626; text-decoration: underline;">Get 50% OFF on AWS Exam</a></p>
      </div>
    </div>
  </div>
</body>
</html>'
where not exists (select 1 from email_templates where key = 'product_purchase');

-- certificate_submission <- getCertificateSubmissionEmail(name, certName, provider)
-- Mapping: ${name} -> {{name}} · ${certName} -> {{cert_name}} ·
-- ${provider} -> {{provider}}.
insert into email_templates (key, subject, body_html)
select 'certificate_submission', 'Submission Received: {{cert_name}}', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Submission Received: {{cert_name}}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">

    <!-- Header -->
    <div style="background-color: #1e3a8a; padding: 30px; text-align: center; border-radius: 0 0 20px 20px;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Yatri Cloud</h1>
    </div>

    <!-- Content -->
    <div style="background-color: #ffffff; padding: 40px; margin: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #1e3a8a; margin-top: 0;">Achievement Unlocked!</h2>
      <p>Hello {{name}},</p>
      <p>Congratulations on earning your <strong>{{cert_name}}</strong> from <strong>{{provider}}</strong>!</p>
      <p>We''ve successfully received your submission. It will now appear on your public profile and the "Yatri Stars" wall.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://certification.yatricloud.com/achievements" style="background-color: #3b82f6; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">View Profile</a>
      </div>

      <p>Keep learning and collecting those badges!</p>
      <p>Best regards,<br>Team Yatri Cloud</p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p style="margin: 5px 0;">© {{year}} Yatri Cloud. All rights reserved.</p>
      <p style="margin: 5px 0;">Empowering your cloud journey.</p>

      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin-bottom: 10px;">Connect with us:</p>
        <a href="https://www.youtube.com/@yatricloud?sub_confirmation=1" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/youtube-play.png" alt="YouTube" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://linkedin.com/company/yatricloud" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/linkedin.png" alt="LinkedIn" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://whatsapp.com/channel/0029VakdAHIFHWq60yHA1Q0s" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/whatsapp.png" alt="WhatsApp" width="24" height="24" style="vertical-align: middle;"></a>
      </div>

      <div style="margin-top: 15px;">
        <p style="margin: 5px 0;">Join Yatri Cloud Community: <a href="https://community.yatricloud.com" style="color: #3b82f6; text-decoration: none; font-weight: bold;">community.yatricloud.com</a></p>
        <p style="margin: 5px 0; color: #dc2626; font-weight: bold;">🔥 Special Offer: <a href="https://calendly.com/yatricloud/40min" style="color: #dc2626; text-decoration: underline;">Get 50% OFF on AWS Exam</a></p>
      </div>
    </div>
  </div>
</body>
</html>'
where not exists (select 1 from email_templates where key = 'certificate_submission');

-- welcome <- getWelcomeEmail(name)
-- Mapping: ${name} -> {{name}}.
insert into email_templates (key, subject, body_html)
select 'welcome', 'Welcome to Yatri Cloud', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Yatri Cloud</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">

    <!-- Header -->
    <div style="background-color: #1e3a8a; padding: 30px; text-align: center; border-radius: 0 0 20px 20px;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Yatri Cloud</h1>
    </div>

    <!-- Content -->
    <div style="background-color: #ffffff; padding: 40px; margin: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #1e3a8a; margin-top: 0;">Welcome to Yatri Cloud!</h2>
      <p>Hello {{name}},</p>
      <p>We''re thrilled to have you join our community of cloud enthusiasts.</p>
      <p>Here at Yatri Cloud, you can:</p>
      <ul style="padding-left: 20px; color: #1f2937;">
        <li style="margin-bottom: 10px;">Showcase your certifications</li>
        <li style="margin-bottom: 10px;">Register for exclusive workshops</li>
        <li style="margin-bottom: 10px;">Generate AI-powered practice questions</li>
      </ul>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://certification.yatricloud.com" style="background-color: #3b82f6; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Explore Dashboard</a>
      </div>

      <p>If you have any questions, feel free to reply to this email.</p>
      <p>Happy Learning!<br>Team Yatri Cloud</p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p style="margin: 5px 0;">© {{year}} Yatri Cloud. All rights reserved.</p>
      <p style="margin: 5px 0;">Empowering your cloud journey.</p>

      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin-bottom: 10px;">Connect with us:</p>
        <a href="https://www.youtube.com/@yatricloud?sub_confirmation=1" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/youtube-play.png" alt="YouTube" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://linkedin.com/company/yatricloud" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/linkedin.png" alt="LinkedIn" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://whatsapp.com/channel/0029VakdAHIFHWq60yHA1Q0s" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/whatsapp.png" alt="WhatsApp" width="24" height="24" style="vertical-align: middle;"></a>
      </div>

      <div style="margin-top: 15px;">
        <p style="margin: 5px 0;">Join Yatri Cloud Community: <a href="https://community.yatricloud.com" style="color: #3b82f6; text-decoration: none; font-weight: bold;">community.yatricloud.com</a></p>
        <p style="margin: 5px 0; color: #dc2626; font-weight: bold;">🔥 Special Offer: <a href="https://calendly.com/yatricloud/40min" style="color: #dc2626; text-decoration: underline;">Get 50% OFF on AWS Exam</a></p>
      </div>
    </div>
  </div>
</body>
</html>'
where not exists (select 1 from email_templates where key = 'welcome');

-- event_feedback <- getEventFeedbackEmail(name, eventName, feedbackLink)
-- Mapping: ${name} -> {{name}} · ${eventName} -> {{event_name}} ·
-- ${feedbackLink} -> {{feedback_link}}.
insert into email_templates (key, subject, body_html)
select 'event_feedback', 'Feedback Request: {{event_name}}', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feedback Request: {{event_name}}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">

    <!-- Header -->
    <div style="background-color: #1e3a8a; padding: 30px; text-align: center; border-radius: 0 0 20px 20px;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Yatri Cloud</h1>
    </div>

    <!-- Content -->
    <div style="background-color: #ffffff; padding: 40px; margin: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #1e3a8a; margin-top: 0;">Thank You for Attending!</h2>
      <p>Hello {{name}},</p>
      <p>Thanks for joining us at <strong>{{event_name}}</strong>. We hope you found it valuable!</p>
      <p>To help us improve and bring you better events, please take a moment to share your feedback. Completing this form is also required to receive your participation certificate.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{feedback_link}}" style="background-color: #3b82f6; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Give Feedback & Get Certificate</a>
      </div>

      <p>See you at the next event!</p>
      <p>Best regards,<br>Team Yatri Cloud</p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p style="margin: 5px 0;">© {{year}} Yatri Cloud. All rights reserved.</p>
      <p style="margin: 5px 0;">Empowering your cloud journey.</p>

      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin-bottom: 10px;">Connect with us:</p>
        <a href="https://www.youtube.com/@yatricloud?sub_confirmation=1" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/youtube-play.png" alt="YouTube" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://linkedin.com/company/yatricloud" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/linkedin.png" alt="LinkedIn" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://whatsapp.com/channel/0029VakdAHIFHWq60yHA1Q0s" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/whatsapp.png" alt="WhatsApp" width="24" height="24" style="vertical-align: middle;"></a>
      </div>

      <div style="margin-top: 15px;">
        <p style="margin: 5px 0;">Join Yatri Cloud Community: <a href="https://community.yatricloud.com" style="color: #3b82f6; text-decoration: none; font-weight: bold;">community.yatricloud.com</a></p>
        <p style="margin: 5px 0; color: #dc2626; font-weight: bold;">🔥 Special Offer: <a href="https://calendly.com/yatricloud/40min" style="color: #dc2626; text-decoration: underline;">Get 50% OFF on AWS Exam</a></p>
      </div>
    </div>
  </div>
</body>
</html>'
where not exists (select 1 from email_templates where key = 'event_feedback');

-- exam_dump_purchase <- getExamDumpPurchaseEmail(name, dumpTitle, amount, downloadUrl, paymentId)
-- Mapping: ${name} -> {{name}} · ${dumpTitle} -> {{dump_title}} ·
-- ${amount} -> {{amount}} · ${downloadUrl} -> {{download_url}} (used twice) ·
-- ${paymentId} -> {{payment_id}}.
insert into email_templates (key, subject, body_html)
select 'exam_dump_purchase', 'Your Exam Dump Download Link - Yatri Cloud', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Exam Dump Download Link - Yatri Cloud</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">

    <!-- Header -->
    <div style="background-color: #1e3a8a; padding: 30px; text-align: center; border-radius: 0 0 20px 20px;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Yatri Cloud</h1>
    </div>

    <!-- Content -->
    <div style="background-color: #ffffff; padding: 40px; margin: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #1e3a8a; margin-top: 0;">Exam Dump Access!</h2>
      <p>Hello {{name}},</p>
      <p>Thank you for purchasing the <strong>{{dump_title}}</strong> exam dump.</p>

      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 5px 0;"><strong>Order ID:</strong> {{payment_id}}</p>
        <p style="margin: 5px 0;"><strong>Total Paid:</strong> {{amount}}</p>
      </div>

      <p><strong>Your Download Link:</strong></p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{download_url}}" style="background-color: #3b82f6; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Download Exam Dump</a>
      </div>

      <p style="font-size: 14px; color: #6b7280; text-align: center;">you can also access using this link:<br>{{download_url}}</p>

      <p>Success in your certification journey!</p>
      <p>Best regards,<br>Team Yatri Cloud</p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p style="margin: 5px 0;">© {{year}} Yatri Cloud. All rights reserved.</p>
      <p style="margin: 5px 0;">Empowering your cloud journey.</p>

      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin-bottom: 10px;">Connect with us:</p>
        <a href="https://www.youtube.com/@yatricloud?sub_confirmation=1" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/youtube-play.png" alt="YouTube" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://linkedin.com/company/yatricloud" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/linkedin.png" alt="LinkedIn" width="24" height="24" style="vertical-align: middle;"></a>
        <a href="https://whatsapp.com/channel/0029VakdAHIFHWq60yHA1Q0s" style="text-decoration: none; margin: 0 8px;"><img src="https://img.icons8.com/ios-filled/50/3b82f6/whatsapp.png" alt="WhatsApp" width="24" height="24" style="vertical-align: middle;"></a>
      </div>

      <div style="margin-top: 15px;">
        <p style="margin: 5px 0;">Join Yatri Cloud Community: <a href="https://community.yatricloud.com" style="color: #3b82f6; text-decoration: none; font-weight: bold;">community.yatricloud.com</a></p>
        <p style="margin: 5px 0; color: #dc2626; font-weight: bold;">🔥 Special Offer: <a href="https://calendly.com/yatricloud/40min" style="color: #dc2626; text-decoration: underline;">Get 50% OFF on AWS Exam</a></p>
      </div>
    </div>
  </div>
</body>
</html>'
where not exists (select 1 from email_templates where key = 'exam_dump_purchase');
