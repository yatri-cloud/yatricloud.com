-- ============================================================
-- Yatri Cloud — 010_cert_catalog.sql
-- Certification catalog: cert_providers + provider_certifications.
-- Moves the hardcoded provider/cert lists out of the frontend
-- (CertificationForm.tsx, certification-logos.ts, Review.tsx,
-- IndustryLeadersSection.tsx) into admin-managed tables.
-- Seeded with EXACTLY the values that are live on the site today
-- so the frontend swap changes nothing visually.
-- ============================================================

-- ---------- cert_providers: every certification provider shown anywhere ----------
create table if not exists cert_providers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  enum_value text,
  logo_url text,
  logo_light_url text,
  brand_color text,
  blurb text,
  cert_count int,
  show_on_home boolean not null default false,
  show_in_forms boolean not null default true,
  sort_order int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_cert_providers_updated on cert_providers;
create trigger trg_cert_providers_updated before update on cert_providers
  for each row execute function set_updated_at();

alter table cert_providers enable row level security;

drop policy if exists "cert_providers_public_read" on cert_providers;
create policy "cert_providers_public_read" on cert_providers for select using (active = true or is_admin());

drop policy if exists "cert_providers_admin_write" on cert_providers;
create policy "cert_providers_admin_write" on cert_providers for all
  using (is_admin()) with check (is_admin());

-- ---------- provider_certifications: per-provider certification lists ----------
create table if not exists provider_certifications (
  id uuid primary key default gen_random_uuid(),
  provider_slug text not null references cert_providers(slug) on delete cascade,
  value text not null,
  label text not null,
  exam_code text,
  level text,
  sort_order int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (provider_slug, value)
);

drop trigger if exists trg_provider_certifications_updated on provider_certifications;
create trigger trg_provider_certifications_updated before update on provider_certifications
  for each row execute function set_updated_at();

alter table provider_certifications enable row level security;

drop policy if exists "provider_certifications_public_read" on provider_certifications;
create policy "provider_certifications_public_read" on provider_certifications for select using (active = true or is_admin());

drop policy if exists "provider_certifications_admin_write" on provider_certifications;
create policy "provider_certifications_admin_write" on provider_certifications for all
  using (is_admin()) with check (is_admin());

create index if not exists idx_provider_certs_slug on provider_certifications (provider_slug, sort_order);

-- ---------- seed: providers ----------
-- Union of every provider the UI knows about today:
--   · slugs 1-10  — the Certified Yatris form providers (CertificationForm.tsx
--     CERTIFICATION_PROVIDERS order; enum_value = provider_t; logos from
--     PROVIDER_LOGOS — note certification-logos.ts flips aws logo/logoLight,
--     the form orientation is kept: logo = aws.svg, light = aws-light.png)
--   · slugs 11-18 — homepage-only providers (IndustryLeadersSection.tsx order;
--     blurb + cert_count from that section; local /logos/*.svg)
--   · slugs 19-20 — terraform + docker, shown only in the Review.tsx provider
--     picker and certification-logos.ts (brand colors from Review.tsx)
-- brand_color = hex from Review.tsx where available.
insert into cert_providers (slug, label, enum_value, logo_url, logo_light_url, brand_color, blurb, cert_count, show_on_home, show_in_forms, sort_order) values
  ('aws',         'AWS',                  'AWS',         'https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications/aws.svg',                   'https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications/aws-light.png',            '#FF9900', 'Cloud computing & DevOps', 30, true,  true,  1),
  ('azure',       'Azure',                'AZURE',       'https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications/Microsoft_Azure.svg',       null,                                                                                                                                        '#0078D4', 'Cloud solutions & infra',  25, true,  true,  2),
  ('gcp',         'Google Cloud',         'GCP',         'https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications/google_cloud.svg',          null,                                                                                                                                        '#4285F4', 'Enterprise cloud & data',  18, true,  true,  3),
  ('github',      'GitHub',               'GITHUB',      'https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications/github-white-icon.webp',    'https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications/github-white-icon.webp',    '#181717', 'Version control & CI/CD',  20, true,  true,  4),
  ('oracle',      'Oracle',               'ORACLE',      'https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications/Oracle_logo.svg',           null,                                                                                                                                        '#F80000', 'Database & enterprise',    12, true,  true,  5),
  ('salesforce',  'Salesforce',           'SALESFORCE',  'https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications/Salesforce.com_logo.svg',   null,                                                                                                                                        '#00A1E0', 'CRM & cloud solutions',    15, true,  true,  6),
  ('servicenow',  'ServiceNow',           'SERVICENOW',  'https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications/ServiceNow_logo.svg',       null,                                                                                                                                        '#00A82E', 'ITSM & automation',        10, true,  true,  7),
  ('openai',      'OpenAI',               'OPENAI',      'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',                                                                       null,                                                                                                                                        null,      null,                       null, false, true,  8),
  ('hashicorp',   'HashiCorp Certified',  'HASHICORP',   'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Terraform_Logo.svg/1280px-Terraform_Logo.svg.png?20181016201549',                 null,                                                                                                                                        null,      null,                       null, false, true,  9),
  ('kubernetes',  'Kubernetes Certified', 'KUBERNETES',  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Kubernetes_logo_without_workmark.svg/1280px-Kubernetes_logo_without_workmark.svg.png?20190926210707', null,                                                                                                    '#326CE5', 'Container orchestration',  14, true,  true,  10),
  ('linux',       'Linux Foundation',     null,          '/logos/linux.svg',                                                                                                                          null,                                                                                                                                        null,      'Open-source & Linux',      15, true,  false, 11),
  ('comptia',     'CompTIA',              null,          '/logos/comptia.svg',                                                                                                                        null,                                                                                                                                        null,      'Vendor-neutral IT',        20, true,  false, 12),
  ('cisco',       'Cisco',                null,          '/logos/cisco.svg',                                                                                                                          null,                                                                                                                                        null,      'Networking & security',    16, true,  false, 13),
  ('isc2',        'ISC2',                 null,          null,                                                                                                                                        null,                                                                                                                                        null,      'Security incl. CISSP',     13, true,  false, 14),
  ('ibm',         'IBM',                  null,          '/logos/ibm.svg',                                                                                                                            null,                                                                                                                                        null,      'Enterprise & cloud',       12, true,  false, 15),
  ('alibaba',     'Alibaba',              null,          '/logos/alibabacloud.svg',                                                                                                                   null,                                                                                                                                        null,      'Cloud & enterprise',       11, true,  false, 16),
  ('cncf',        'CNCF',                 null,          '/logos/cncf.svg',                                                                                                                           null,                                                                                                                                        null,      'Cloud-native tech',        10, true,  false, 17),
  ('nvidia',      'NVIDIA',               null,          '/logos/nvidia.svg',                                                                                                                         null,                                                                                                                                        null,      'AI & deep learning',       8,  true,  false, 18),
  ('terraform',   'Terraform',            null,          'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Terraform_Logo.svg/1280px-Terraform_Logo.svg.png?20181016201549',                 null,                                                                                                                                        '#844FBA', null,                       null, false, false, 19),
  ('docker',      'Docker',               null,          'https://cdn.simpleicons.org/docker/2496ED',                                                                                                 null,                                                                                                                                        '#2496ED', null,                       null, false, false, 20)
on conflict (slug) do nothing;

-- ---------- seed: per-provider certifications ----------
-- Exact value/label/exam code lists from CertificationForm.tsx,
-- sort_order = position in the source array (1-based).
-- aws: 13 certifications
insert into provider_certifications (provider_slug, value, label, exam_code, sort_order) values
  ('aws', 'cloud-practitioner', 'AWS Certified Cloud Practitioner', 'CLF-C02', 1),
  ('aws', 'ai-practitioner', 'AWS Certified AI Practitioner', 'AIF-C01', 2),
  ('aws', 'cloudops-associate', 'AWS Certified CloudOps Engineer - Associate', 'SOA-C03', 3),
  ('aws', 'solutions-architect-associate', 'AWS Certified Solutions Architect - Associate', 'SAA-C03', 4),
  ('aws', 'developer-associate', 'AWS Certified Developer - Associate', 'DVA-C02', 5),
  ('aws', 'data-engineer-associate', 'AWS Certified Data Engineer - Associate', 'DEA-C01', 6),
  ('aws', 'machine-learning-engineer-associate', 'AWS Certified Machine Learning Engineer - Associate', 'MLE-C01', 7),
  ('aws', 'solutions-architect-professional', 'AWS Certified Solutions Architect - Professional', 'SAP-C02', 8),
  ('aws', 'devops-engineer-professional', 'AWS Certified DevOps Engineer - Professional', 'DOP-C02', 9),
  ('aws', 'genai-developer-professional', 'AWS Certified Generative AI Developer - Professional (Beta)', 'GENAI', 10),
  ('aws', 'advanced-networking-specialty', 'AWS Certified Advanced Networking - Specialty', 'ANS-C01', 11),
  ('aws', 'security-specialty', 'AWS Certified Security - Specialty', 'SCS-C02', 12),
  ('aws', 'machine-learning-specialty', 'AWS Certified Machine Learning - Specialty', 'MLS-C01', 13)
on conflict (provider_slug, value) do nothing;

-- azure: 50 certifications
insert into provider_certifications (provider_slug, value, label, exam_code, sort_order) values
  ('azure', 'az-900', 'AZ-900: Azure Fundamentals', 'AZ-900', 1),
  ('azure', 'ai-900', 'AI-900: Azure AI Fundamentals', 'AI-900', 2),
  ('azure', 'dp-900', 'DP-900: Azure Data Fundamentals', 'DP-900', 3),
  ('azure', 'sc-900', 'SC-900: Security, Compliance, and Identity Fundamentals', 'SC-900', 4),
  ('azure', 'ms-900', 'MS-900: Microsoft 365 Fundamentals', 'MS-900', 5),
  ('azure', 'mb-910', 'MB-910: Dynamics 365 Fundamentals (CRM)', 'MB-910', 6),
  ('azure', 'mb-920', 'MB-920: Dynamics 365 Fundamentals (ERP)', 'MB-920', 7),
  ('azure', 'az-104', 'AZ-104: Azure Administrator Associate', 'AZ-104', 8),
  ('azure', 'az-204', 'AZ-204: Azure Developer Associate', 'AZ-204', 9),
  ('azure', 'dp-203', 'DP-203: Azure Data Engineer Associate', 'DP-203', 10),
  ('azure', 'dp-300', 'DP-300: Azure Database Administrator Associate', 'DP-300', 11),
  ('azure', 'az-400', 'AZ-400: DevOps Engineer Expert', 'AZ-400', 12),
  ('azure', 'az-500', 'AZ-500: Azure Security Engineer Associate', 'AZ-500', 13),
  ('azure', 'az-700', 'AZ-700: Azure Network Engineer Associate', 'AZ-700', 14),
  ('azure', 'az-305', 'AZ-305: Azure Solutions Architect Expert', 'AZ-305', 15),
  ('azure', 'dp-600', 'DP-600: Fabric Analytics Engineer Associate', 'DP-600', 16),
  ('azure', 'dp-700', 'DP-700: Fabric Data Engineer Associate', 'DP-700', 17),
  ('azure', 'ai-102', 'AI-102: Azure AI Engineer Associate', 'AI-102', 18),
  ('azure', 'dp-100', 'DP-100: Azure Data Scientist Associate', 'DP-100', 19),
  ('azure', 'pl-400', 'PL-400: Power Platform Developer Associate', 'PL-400', 20),
  ('azure', 'pl-200', 'PL-200: Power Platform Functional Consultant Associate', 'PL-200', 21),
  ('azure', 'pl-500', 'PL-500: Power Automate RPA Developer Associate', 'PL-500', 22),
  ('azure', 'pl-300', 'PL-300: Power BI Data Analyst Associate', 'PL-300', 23),
  ('azure', 'pl-600', 'PL-600: Power Platform Solution Architect Expert', 'PL-600', 24),
  ('azure', 'pl-900', 'PL-900: Power Platform Fundamentals', 'PL-900', 25),
  ('azure', 'sc-200', 'SC-200: Security Operations Analyst Associate', 'SC-200', 26),
  ('azure', 'sc-300', 'SC-300: Identity and Access Administrator Associate', 'SC-300', 27),
  ('azure', 'sc-400', 'SC-400: Information Protection and Compliance Administrator Associate', 'SC-400', 28),
  ('azure', 'sc-401', 'SC-401: Information Protection and Compliance Administrator Associate', 'SC-401', 29),
  ('azure', 'sc-100', 'SC-100: Cybersecurity Architect Expert', 'SC-100', 30),
  ('azure', 'md-102', 'MD-102: Endpoint Administrator Associate', 'MD-102', 31),
  ('azure', 'ms-102', 'MS-102: Administrator Expert', 'MS-102', 32),
  ('azure', 'ms-700', 'MS-700: Teams Administrator Associate', 'MS-700', 33),
  ('azure', 'ms-721', 'MS-721: Collaboration Communications Systems Engineer Associate', 'MS-721', 34),
  ('azure', 'mb-800', 'MB-800: Dynamics 365 Business Central Functional Consultant Associate', 'MB-800', 35),
  ('azure', 'mb-820', 'MB-820: Dynamics 365 Business Central Developer Associate', 'MB-820', 36),
  ('azure', 'mb-700', 'MB-700: Dynamics 365: Finance and Operations Apps Solution Architect Expert', 'MB-700', 37),
  ('azure', 'mb-230', 'MB-230: Dynamics 365 Customer Service Functional Consultant Associate', 'MB-230', 38),
  ('azure', 'mb-240', 'MB-240: Dynamics 365 Field Service Functional Consultant Associate', 'MB-240', 39),
  ('azure', 'mb-280', 'MB-280: Dynamics 365 Customer Experience Analyst Associate', 'MB-280', 40),
  ('azure', 'mb-300', 'MB-300: Dynamics 365 Finance and Operations Apps Core', 'MB-300', 41),
  ('azure', 'mb-310', 'MB-310: Dynamics 365 Finance Functional Consultant Associate', 'MB-310', 42),
  ('azure', 'mb-330', 'MB-330: Dynamics 365 Supply Chain Management Functional Consultant Associate', 'MB-330', 43),
  ('azure', 'mb-335', 'MB-335: Dynamics 365: Supply Chain Management Functional Consultant Expert', 'MB-335', 44),
  ('azure', 'mb-500', 'MB-500: Dynamics 365: Finance and Operations Apps Developer Associate', 'MB-500', 45),
  ('azure', 'windows-server-hybrid-admin-associate', 'Windows Server Hybrid Administrator Associate (AZ-800 / AZ-801)', 'AZ-800 / AZ-801', 46),
  ('azure', 'az-120', 'AZ-120: Azure for SAP Workloads Specialty', 'AZ-120', 47),
  ('azure', 'az-140', 'AZ-140: Azure Virtual Desktop Specialty', 'AZ-140', 48),
  ('azure', 'az-720', 'AZ-720: Azure Stack HCI Specialty', 'AZ-720', 49),
  ('azure', 'dp-420', 'DP-420: Azure Cosmos DB Developer Specialty', 'DP-420', 50)
on conflict (provider_slug, value) do nothing;

-- gcp: 14 certifications
insert into provider_certifications (provider_slug, value, label, exam_code, sort_order) values
  ('gcp', 'cloud-digital-leader', 'Cloud Digital Leader (Foundational)', 'CDL', 1),
  ('gcp', 'generative-ai-leader', 'Generative AI Leader (Foundational)', 'GAIL', 2),
  ('gcp', 'associate-cloud-engineer', 'Associate Cloud Engineer', 'ACE', 3),
  ('gcp', 'google-workspace-administrator', 'Google Workspace Administrator (Associate)', 'GWA', 4),
  ('gcp', 'data-practitioner', 'Data Practitioner (Associate)', 'DP', 5),
  ('gcp', 'professional-cloud-architect', 'Cloud Architect (Professional)', 'PCA', 6),
  ('gcp', 'professional-cloud-database-engineer', 'Cloud Database Engineer (Professional)', 'PCDBE', 7),
  ('gcp', 'professional-cloud-developer', 'Cloud Developer (Professional)', 'PCD', 8),
  ('gcp', 'professional-data-engineer', 'Data Engineer (Professional)', 'PDE', 9),
  ('gcp', 'professional-cloud-devops-engineer', 'Cloud DevOps Engineer (Professional)', 'PCDE', 10),
  ('gcp', 'professional-cloud-security-engineer', 'Cloud Security Engineer (Professional)', 'PCSE', 11),
  ('gcp', 'professional-cloud-network-engineer', 'Cloud Network Engineer (Professional)', 'PCNE', 12),
  ('gcp', 'professional-machine-learning-engineer', 'Machine Learning Engineer (Professional)', 'PMLE', 13),
  ('gcp', 'professional-security-operations-engineer', 'Security Operations Engineer (Professional)', 'PSOE', 14)
on conflict (provider_slug, value) do nothing;

-- openai: 1 certifications
insert into provider_certifications (provider_slug, value, label, exam_code, sort_order) values
  ('openai', 'chatgpt-foundations-teachers', 'ChatGPT Foundations for Teachers', 'CGFT', 1)
on conflict (provider_slug, value) do nothing;

-- hashicorp: 5 certifications
insert into provider_certifications (provider_slug, value, label, exam_code, sort_order) values
  ('hashicorp', 'terraform-associate', 'Terraform Associate', 'TA', 1),
  ('hashicorp', 'terraform-authoring-operations-professional', 'Terraform Authoring and Operations Professional', 'TAOP', 2),
  ('hashicorp', 'vault-associate', 'Vault Associate', 'VA', 3),
  ('hashicorp', 'vault-operations-professional', 'Vault Operations Professional', 'VOP', 4),
  ('hashicorp', 'consul-associate', 'Consul Associate', 'CA', 5)
on conflict (provider_slug, value) do nothing;

-- kubernetes: 5 certifications
insert into provider_certifications (provider_slug, value, label, exam_code, sort_order) values
  ('kubernetes', 'kcna', 'Kubernetes and Cloud Native Associate (KCNA)', 'KCNA', 1),
  ('kubernetes', 'kcsa', 'Kubernetes and Cloud Native Security Associate (KCSA)', 'KCSA', 2),
  ('kubernetes', 'ckad', 'Certified Kubernetes Application Developer (CKAD)', 'CKAD', 3),
  ('kubernetes', 'cka', 'Certified Kubernetes Administrator (CKA)', 'CKA', 4),
  ('kubernetes', 'cks', 'Certified Kubernetes Security Specialist (CKS)', 'CKS', 5)
on conflict (provider_slug, value) do nothing;

-- github: 5 certifications
insert into provider_certifications (provider_slug, value, label, exam_code, sort_order) values
  ('github', 'gh-900', 'GitHub Foundations GH-900', 'GH-900', 1),
  ('github', 'gh-1001', 'GitHub Copilot Certification GH-1001 (NEW - Live)', 'GH-1001', 2),
  ('github', 'gh-400', 'GitHub Actions GH-400', 'GH-400', 3),
  ('github', 'gh-500', 'GitHub Advanced Security GH-500', 'GH-500', 4),
  ('github', 'gh-300', 'GitHub Administration GH-300', 'GH-300', 5)
on conflict (provider_slug, value) do nothing;

-- oracle: 179 certifications
insert into provider_certifications (provider_slug, value, label, exam_code, sort_order) values
  ('oracle', 'oci-2025-foundations-associate', 'Oracle Cloud Infrastructure 2025 Foundations Associate', 'OCI-FOUND-2025', 1),
  ('oracle', 'oracle-data-platform-2025-foundations-associate', 'Oracle Data Platform 2025 Foundations Associate', 'ODP-FOUND-2025', 2),
  ('oracle', 'oci-2025-ai-foundations-associate', 'Oracle Cloud Infrastructure 2025 AI Foundations Associate', 'OCI-AI-FOUND-2025', 3),
  ('oracle', 'oci-2025-architect-associate', 'Oracle Cloud Infrastructure 2025 Architect Associate', 'OCI-ARCH-ASSOC-2025', 4),
  ('oracle', 'oracle-redwood-application-2025-developer-associate', 'Oracle Redwood Application 2025 Developer Associate', 'REDWOOD-DEV-2025', 5),
  ('oracle', 'oci-2025-architect-professional', 'Oracle Cloud Infrastructure 2025 Architect Professional', 'OCI-ARCH-PRO-2025', 6),
  ('oracle', 'oracle-ai-vector-search-professional', 'Oracle AI Vector Search Professional', 'OAIVS-PRO', 7),
  ('oracle', 'oci-2025-multicloud-architect-professional', 'Oracle Cloud Infrastructure 2025 Multicloud Architect Professional', 'OCI-MULTI-ARCH-PRO-2025', 8),
  ('oracle', 'oci-2025-networking-professional', 'Oracle Cloud Infrastructure 2025 Networking Professional', 'OCI-NET-PRO-2025', 9),
  ('oracle', 'oci-2025-developer-professional', 'Oracle Cloud Infrastructure 2025 Developer Professional', 'OCI-DEV-PRO-2025', 10),
  ('oracle', 'oci-2025-devops-professional', 'Oracle Cloud Infrastructure 2025 DevOps Professional', 'OCI-DEVOPS-PRO-2025', 11),
  ('oracle', 'oracle-analytics-cloud-2025-professional', 'Oracle Analytics Cloud 2025 Professional', 'OAC-PRO-2025', 12),
  ('oracle', 'oracle-apex-cloud-developer-professional', 'Oracle APEX Cloud Developer Professional', 'APEX-CLOUD-PRO', 13),
  ('oracle', 'oci-2025-security-professional', 'Oracle Cloud Infrastructure 2025 Security Professional', 'OCI-SEC-PRO-2025', 14),
  ('oracle', 'oci-2025-cloud-operations-professional', 'Oracle Cloud Infrastructure 2025 Cloud Operations Professional', 'OCI-OPS-PRO-2025', 15),
  ('oracle', 'oci-2025-observability-professional', 'Oracle Cloud Infrastructure 2025 Observability Professional', 'OCI-OBS-PRO-2025', 16),
  ('oracle', 'oci-2025-migration-architect-professional', 'Oracle Cloud Infrastructure 2025 Migration Architect Professional', 'OCI-MIG-ARCH-PRO-2025', 17),
  ('oracle', 'oci-2025-generative-ai-professional', 'Oracle Cloud Infrastructure 2025 Generative AI Professional', 'OCI-GENAI-PRO-2025', 18),
  ('oracle', 'oci-2025-data-science-professional', 'Oracle Cloud Infrastructure 2025 Data Science Professional', 'OCI-DS-PRO-2025', 19),
  ('oracle', 'oci-2025-application-integration-professional', 'Oracle Cloud Infrastructure 2025 Application Integration Professional', 'OCI-APP-INT-PRO-2025', 20),
  ('oracle', 'oracle-ai-cloud-database-services-2025-professional', 'Oracle AI Cloud Database Services 2025 Professional', 'OAICDS-2025', 21),
  ('oracle', 'oracle-ai-autonomous-database-2025-professional', 'Oracle AI Autonomous Database 2025 Professional', 'OAIADB-PRO-2025', 22),
  ('oracle', 'oracle-database-aws-architect-professional', 'Oracle Database@AWS Architect Professional', 'ODB-AWS-ARCH-PRO', 23),
  ('oracle', 'oci-sunbird-ed-specialty', 'Oracle Cloud Infrastructure for Sunbird ED Specialty', 'OCI-SUNBIRD-ED', 24),
  ('oracle', 'oracle-database-administration-i', 'Oracle Database Administration I', 'DBA-I', 25),
  ('oracle', 'oracle-database-administration-ii', 'Oracle Database Administration II', 'DBA-II', 26),
  ('oracle', 'oracle-database-19c-performance-management-and-tuning', 'Oracle Database 19c: Performance Management and Tuning', 'DB-19C-PERF', 27),
  ('oracle', 'oracle-database-19c-data-guard-administration', 'Oracle Database 19c: Data Guard Administration', 'DB-19C-DG', 28),
  ('oracle', 'oracle-database-19c-rac-asm-grid', 'Oracle Database 19c: RAC, ASM, and Grid Infrastructure Administration', 'DB-19C-RAC-ASM', 29),
  ('oracle', 'oracle-database-sql', 'Oracle Database SQL', '1Z0-071', 30),
  ('oracle', 'oracle-database-program-with-plsql', 'Oracle Database Program with PL/SQL', '1Z0-149', 31),
  ('oracle', 'oracle-apex-cloud-developer-professional-db', 'Oracle APEX Cloud Developer Professional', 'APEX-CLOUD-PRO', 32),
  ('oracle', 'oracle-database-security-administration', 'Oracle Database Security Administration', 'DB-SEC-ADMIN', 33),
  ('oracle', 'oracle-database-foundations', 'Oracle Database Foundations', '1Z0-006', 34),
  ('oracle', 'oracle-ai-database-administration-associate', 'Oracle AI Database Administration Associate', 'OAI-DBA-ASSOC', 35),
  ('oracle', 'oracle-ai-database-administration-professional', 'Oracle AI Database Administration Professional', 'OAI-DBA-PRO', 36),
  ('oracle', 'oracle-ai-database-sql-associate', 'Oracle AI Database SQL Associate', 'OAI-SQL-ASSOC', 37),
  ('oracle', 'oracle-ai-vector-search-professional-db', 'Oracle AI Vector Search Professional', 'OAIVS-PRO', 38),
  ('oracle', 'oracle-database-aws-architect-professional-db', 'Oracle Database@AWS Architect Professional', 'ODB-AWS-ARCH-PRO', 39),
  ('oracle', 'java-ee-7-application-developer', 'Java EE 7 Application Developer', '1Z0-900', 40),
  ('oracle', 'java-se-8-programmer-i', 'Java SE 8 Programmer I', '1Z0-808', 41),
  ('oracle', 'java-se-8-programmer-ii', 'Java SE 8 Programmer II', '1Z0-809', 42),
  ('oracle', 'java-foundations', 'Java Foundations', '1Z0-811', 43),
  ('oracle', 'java-se-11-developer', 'Java SE 11 Developer', '1Z0-819', 44),
  ('oracle', 'java-se-17-developer', 'Java SE 17 Developer', '1Z0-829', 45),
  ('oracle', 'java-se-21-developer-professional', 'Java SE 21 Developer Professional', '1Z0-830', 46),
  ('oracle', 'helidon-microservices-developer', 'Helidon Microservices Developer', '1Z0-1113', 47),
  ('oracle', 'mysql-8-database-administrator', 'MySQL 8.0 Database Administrator', 'MYSQL-8-DBA', 48),
  ('oracle', 'mysql-heatwave-implementation-associate-rel1', 'MySQL HeatWave Implementation Associate Rel 1', 'MYSQL-HW-ASSOC-1', 49),
  ('oracle', 'mysql-8-database-developer', 'MySQL 8.0 Database Developer', 'MYSQL-8-DEV', 50),
  ('oracle', 'mysql-implementation-associate', 'MySQL Implementation Associate', 'MYSQL-IMPL-ASSOC', 51),
  ('oracle', 'oracle-communications-sbc-implementation', 'Oracle Communications Session Border Controller Implementation', 'OC-SBC-IMPL', 52),
  ('oracle', 'oracle-communications-sbc-troubleshooting', 'Oracle Communications Session Border Controller Troubleshooting', 'OC-SBC-TSHOOT', 53),
  ('oracle', 'oracle-utilities-work-asset-cloud-2024-impl-pro', 'Oracle Utilities Work and Asset Cloud 2024 Implementation Professional', 'UTIL-WAC-2024-PRO', 54),
  ('oracle', 'oracle-utilities-meter-solution-cloud-2024-impl-pro', 'Oracle Utilities Meter Solution Cloud Service 2024 Implementation Professional', 'UTIL-MTR-2024-PRO', 55),
  ('oracle', 'oracle-utilities-c2m-customer-cloud-2025-impl-pro', 'Oracle Utilities Customer to Meter and Customer Cloud Service 2025 Implementation Professional', 'UTIL-C2M-2025-PRO', 56),
  ('oracle', 'primavera-p6-eppm-professional', 'Primavera P6 Enterprise Project Portfolio Management Professional', 'P6-EPPM-PRO', 57),
  ('oracle', 'primavera-unifier-administration-professional', 'Primavera Unifier Administration Professional', 'UNIFIER-ADMIN-PRO', 58),
  ('oracle', 'ebs-r12-1-gl-essentials', 'Oracle E-Business Suite R12.1 General Ledger Essentials', 'EBS-R12-GL', 59),
  ('oracle', 'ebs-r12-1-payables-essentials', 'Oracle E-Business Suite R12.1 Payables Essentials', 'EBS-R12-PAY', 60),
  ('oracle', 'ebs-r12-1-receivables-essentials', 'Oracle E-Business Suite R12.1 Receivables Essentials', 'EBS-R12-REC', 61),
  ('oracle', 'ebs-r12-hcm-essentials', 'Oracle E-Business Suite (EBS) R12 Human Capital Management Essentials', 'EBS-R12-HCM', 62),
  ('oracle', 'ebs-r12-1-purchasing-essentials', 'Oracle E-Business Suite R12.1 Purchasing Essentials', 'EBS-R12-PUR', 63),
  ('oracle', 'ebs-r12-project-essentials', 'Oracle E-Business Suite (EBS) R12 Project Essentials', 'EBS-R12-PROJ', 64),
  ('oracle', 'ebs-r12-1-inventory-essentials', 'Oracle E-Business Suite R12.1 Inventory Essentials', 'EBS-R12-INV', 65),
  ('oracle', 'ebs-r12-1-order-management-essentials', 'Oracle E-Business Suite R12.1 Order Management Essentials', 'EBS-R12-OM', 66),
  ('oracle', 'jde-e1-financial-mgmt-9-2-impl-essentials', 'JD Edwards EnterpriseOne Financial Management 9.2 Implementation Essentials', 'JDE-FIN-9-2', 67),
  ('oracle', 'jde-e1-distribution-9-2-impl-essentials', 'JD Edwards EnterpriseOne Distribution 9.2 Implementation Essentials', 'JDE-DIST-9-2', 68),
  ('oracle', 'jde-e1-cnc-9-2-impl-essentials', 'JD Edwards EnterpriseOne Configurable Network Computing 9.2 Implementation Essentials', 'JDE-CNC-9-2', 69),
  ('oracle', 'oracle-hyperion-planning-11-essentials', 'Oracle Hyperion Planning 11 Essentials', 'HYP-PLAN-11', 70),
  ('oracle', 'oracle-hyperion-fm-11-essentials', 'Oracle Hyperion Financial Management 11 Essentials', 'HYP-FM-11', 71),
  ('oracle', 'oracle-hyperion-drm-essentials', 'Oracle Hyperion Data Relationship Management Essentials', 'HYP-DRM', 72),
  ('oracle', 'oracle-weblogic-12c-admin-i', 'Oracle WebLogic Server 12c: Administration I', 'WLS-12C-ADMIN-I', 73),
  ('oracle', 'oracle-weblogic-12c-advanced-admin-ii', 'Oracle WebLogic Server 12c: Advanced Administrator II', 'WLS-12C-ADMIN-II', 74),
  ('oracle', 'oracle-weblogic-12c-essentials', 'Oracle WebLogic Server 12c Essentials', 'WLS-12C-ESS', 75),
  ('oracle', 'oracle-weblogic-14c-admin-pro', 'Oracle WebLogic Server 14c Administrator Professional', 'WLS-14C-ADMIN-PRO', 76),
  ('oracle', 'oracle-soa-suite-12c-essentials', 'Oracle SOA Suite 12c Essentials', 'SOA-12C-ESS', 77),
  ('oracle', 'oracle-bpm-12c-essentials', 'Oracle Business Process Management Suite 12c Essentials', 'BPM-12C-ESS', 78),
  ('oracle', 'oracle-data-integrator-12c-essentials', 'Oracle Data Integrator 12c Essentials', 'ODI-12C-ESS', 79),
  ('oracle', 'oracle-goldengate-12c-impl-essentials', 'Oracle GoldenGate 12c Implementation Essentials', 'OGG-12C-IMPL', 80),
  ('oracle', 'oracle-goldengate-19c-impl-pro', 'Oracle GoldenGate 19c Implementation Certified Professional', 'OGG-19C-PRO', 81),
  ('oracle', 'oracle-goldengate-23ai-impl-associate', 'Oracle GoldenGate 23ai Implementation Associate', 'OGG-23AI-ASSOC', 82),
  ('oracle', 'oracle-linux-8-advanced-sysadmin', 'Oracle Linux 8 Advanced System Administration', 'OL-8-ADV-SYSADMIN', 83),
  ('oracle', 'oracle-linux-virtualization-manager-assoc', 'Oracle Linux Virtualization Manager Associate', 'OL-VIRT-MGR-ASSOC', 84),
  ('oracle', 'oracle-solaris-11-system-admin', 'Oracle Solaris 11 System Administration', 'SOL-11-SYSADMIN', 85),
  ('oracle', 'oracle-solaris-11-advanced-system-admin', 'Oracle Solaris 11 Advanced System Administration', 'SOL-11-ADV-SYSADMIN', 86),
  ('oracle', 'oracle-solaris-11-install-config-essentials', 'Oracle Solaris 11 Installation and Configuration Essentials', 'SOL-11-INST-CONF', 87),
  ('oracle', 'oracle-solaris-11-upgrade-sysadmin', 'Upgrade to Oracle Solaris 11 System Administrator', 'SOL-11-UPGRADE', 88),
  ('oracle', 'oracle-exadata-x9m-impl-essentials', 'Oracle Exadata Database Machine X9M Implementation Essentials', 'EXADATA-X9M-IMPL', 89),
  ('oracle', 'oracle-vm-3-x86-essentials', 'Oracle VM 3.0 for x86 Essentials', 'OVM-3-X86-ESS', 90),
  ('oracle', 'oracle-analytics-cloud-2025-professional-dup', 'Oracle Analytics Cloud 2025 Professional', 'OAC-PRO-2025', 91),
  ('oracle', 'oracle-fusion-data-intelligence-2024-impl-pro', 'Oracle Fusion Data Intelligence 2024 Implementation Professional', 'FDI-2024-IMPL-PRO', 92),
  ('oracle', 'oracle-fccm-applications-professional', 'Financial Crime and Compliance Management (FCCM) Applications Professional', 'FCCM-APPS-PRO', 93),
  ('oracle', 'oracle-siebel-crm-foundations-assoc', 'Oracle Siebel CRM Foundations Associate', 'SIEBEL-FOUND-ASSOC', 94),
  ('oracle', 'oracle-siebel-crm-professional', 'Oracle Siebel CRM Professional', 'SIEBEL-PRO', 95),
  ('oracle', 'oracle-erp-process-essentials-certified', 'Oracle Fusion Cloud Applications ERP Process Essentials Certified', 'ERP-PROC-ESS', 96),
  ('oracle', 'oracle-erp-accounting-hub-2025-impl-pro', 'Oracle Accounting Hub Cloud 2025 Implementation Professional', 'ERP-AH-2025-PRO', 97),
  ('oracle', 'oracle-erp-accounting-hub-2025-impl-pro-delta', 'Oracle Accounting Hub Cloud 2025 Implementation Professional—Delta', 'ERP-AH-2025-PRO-DELTA', 98),
  ('oracle', 'oracle-erp-gl-2025-impl-pro', 'Oracle Financials Cloud: General Ledger 2025 Implementation Professional', 'ERP-GL-2025-PRO', 99),
  ('oracle', 'oracle-erp-gl-2025-impl-pro-delta', 'Oracle Financials Cloud: General Ledger 2025 Implementation Professional—Delta', 'ERP-GL-2025-PRO-DELTA', 100),
  ('oracle', 'oracle-erp-pay-exp-2025-impl-pro', 'Oracle Financials Cloud: Payables and Expenses 2025 Implementation Professional', 'ERP-AP-EXP-2025-PRO', 101),
  ('oracle', 'oracle-erp-pay-exp-2025-impl-pro-delta', 'Oracle Financials Cloud: Payables and Expenses 2025 Implementation Professional—Delta', 'ERP-AP-EXP-2025-PRO-DELTA', 102),
  ('oracle', 'oracle-erp-rec-col-2025-impl-pro', 'Oracle Financials Cloud: Receivables and Collections 2025 Implementation Professional', 'ERP-AR-COLL-2025-PRO', 103),
  ('oracle', 'oracle-erp-rec-col-2025-impl-pro-delta', 'Oracle Financials Cloud: Receivables and Collections 2025 Implementation Professional—Delta', 'ERP-AR-COLL-2025-PRO-DELTA', 104),
  ('oracle', 'oracle-erp-revenue-mgmt-2025-impl-pro', 'Oracle Revenue Management Cloud Service 2025 Implementation Professional', 'ERP-REV-2025-PRO', 105),
  ('oracle', 'oracle-erp-revenue-mgmt-2025-impl-pro-delta', 'Oracle Revenue Management Cloud Service 2025 Implementation Professional—Delta', 'ERP-REV-2025-PRO-DELTA', 106),
  ('oracle', 'oracle-erp-risk-mgmt-2025-impl-pro', 'Oracle Risk Management Cloud 2025 Implementation Professional', 'ERP-RISK-2025-PRO', 107),
  ('oracle', 'oracle-erp-risk-mgmt-2025-impl-pro-delta', 'Oracle Risk Management Cloud 2025 Implementation Professional—Delta', 'ERP-RISK-2025-PRO-DELTA', 108),
  ('oracle', 'oracle-erp-project-mgmt-2025-impl-pro', 'Oracle Project Management Cloud 2025 Implementation Professional', 'ERP-PM-2025-PRO', 109),
  ('oracle', 'oracle-erp-project-mgmt-2025-impl-pro-delta', 'Oracle Project Management Cloud 2025 Implementation Professional—Delta', 'ERP-PM-2025-PRO-DELTA', 110),
  ('oracle', 'oracle-erp-fusion-ai-agent-studio-foundations', 'Oracle Fusion AI Agent Studio Foundations Associate', 'ERP-AI-AGENT-FOUND', 111),
  ('oracle', 'oracle-erp-ai-agent-studio-dev-pro', 'Oracle AI Agent Studio for Fusion Applications Developers Professional', 'ERP-AI-AGENT-DEV-PRO', 112),
  ('oracle', 'oracle-hcm-process-essentials-certified', 'Oracle Fusion Cloud Applications HCM Process Essentials Certified', 'HCM-PROC-ESS', 113),
  ('oracle', 'oracle-hcm-ghr-2025-impl-pro', 'Oracle Global Human Resources Cloud 2025 Implementation Professional', 'HCM-GHR-2025-PRO', 114),
  ('oracle', 'oracle-hcm-ghr-2025-impl-pro-delta', 'Oracle Global Human Resources Cloud 2025 Implementation Professional—Delta', 'HCM-GHR-2025-PRO-DELTA', 115),
  ('oracle', 'oracle-hcm-benefits-2025-impl-pro', 'Oracle Benefits Cloud 2025 Implementation Professional', 'HCM-BEN-2025-PRO', 116),
  ('oracle', 'oracle-hcm-benefits-2025-impl-pro-delta', 'Oracle Benefits Cloud 2025 Implementation Professional—Delta', 'HCM-BEN-2025-PRO-DELTA', 117),
  ('oracle', 'oracle-hcm-comp-2025-impl-pro', 'Oracle Compensation Cloud 2025 Implementation Professional', 'HCM-COMP-2025-PRO', 118),
  ('oracle', 'oracle-hcm-comp-2025-impl-pro-delta', 'Oracle Compensation Cloud 2025 Implementation Professional—Delta', 'HCM-COMP-2025-PRO-DELTA', 119),
  ('oracle', 'oracle-hcm-payroll-2025-impl-pro', 'Oracle Payroll Cloud 2025 Implementation Professional', 'HCM-PAY-2025-PRO', 120),
  ('oracle', 'oracle-hcm-payroll-2025-impl-pro-delta', 'Oracle Payroll Cloud 2025 Implementation Professional—Delta', 'HCM-PAY-2025-PRO-DELTA', 121),
  ('oracle', 'oracle-hcm-talent-2025-impl-pro', 'Oracle Talent Management Cloud 2025 Implementation Professional', 'HCM-TALENT-2025-PRO', 122),
  ('oracle', 'oracle-hcm-talent-2025-impl-pro-delta', 'Oracle Talent Management Cloud 2025 Implementation Professional—Delta', 'HCM-TALENT-2025-PRO-DELTA', 123),
  ('oracle', 'oracle-hcm-learning-2025-impl-pro', 'Oracle Learning Cloud 2025 Implementation Professional', 'HCM-LEARN-2025-PRO', 124),
  ('oracle', 'oracle-hcm-learning-2025-impl-pro-delta', 'Oracle Learning Cloud 2025 Implementation Professional—Delta', 'HCM-LEARN-2025-PRO-DELTA', 125),
  ('oracle', 'oracle-hcm-recruiting-2025-impl-pro', 'Oracle Recruiting Cloud 2025 Implementation Professional', 'HCM-REC-2025-PRO', 126),
  ('oracle', 'oracle-hcm-recruiting-2025-impl-pro-delta', 'Oracle Recruiting Cloud 2025 Implementation Professional—Delta', 'HCM-REC-2025-PRO-DELTA', 127),
  ('oracle', 'oracle-hcm-absence-2025-impl-pro', 'Oracle Absence Management Cloud 2025 Implementation Professional', 'HCM-ABS-2025-PRO', 128),
  ('oracle', 'oracle-hcm-absence-2025-impl-pro-delta', 'Oracle Absence Management Cloud 2025 Implementation Professional—Delta', 'HCM-ABS-2025-PRO-DELTA', 129),
  ('oracle', 'oracle-hcm-time-labor-2025-impl-pro', 'Oracle Time and Labor Cloud 2025 Implementation Professional', 'HCM-TL-2025-PRO', 130),
  ('oracle', 'oracle-hcm-time-labor-2025-impl-pro-delta', 'Oracle Time and Labor Cloud 2025 Implementation Professional—Delta', 'HCM-TL-2025-PRO-DELTA', 131),
  ('oracle', 'oracle-hcm-fusion-ai-agent-studio-foundations', 'Oracle Fusion AI Agent Studio Foundations Associate', 'HCM-AI-AGENT-FOUND', 132),
  ('oracle', 'oracle-hcm-ai-agent-studio-dev-pro', 'Oracle AI Agent Studio for Fusion Applications Developers Professional', 'HCM-AI-AGENT-DEV-PRO', 133),
  ('oracle', 'oracle-epm-process-essentials-rel1', 'Oracle Cloud Applications EPM Process Essentials - Rel 1', 'EPM-PROC-ESS-REL1', 134),
  ('oracle', 'oracle-epm-fcc-2025-impl-pro', 'Oracle Financial Consolidation and Close 2025 Implementation Professional', 'EPM-FCC-2025-PRO', 135),
  ('oracle', 'oracle-epm-fcc-2025-impl-pro-delta', 'Oracle Financial Consolidation and Close 2025 Implementation Professional - Delta', 'EPM-FCC-2025-PRO-DELTA', 136),
  ('oracle', 'oracle-epm-planning-2025-impl-pro', 'Oracle Planning 2025 Implementation Professional', 'EPM-PLAN-2025-PRO', 137),
  ('oracle', 'oracle-epm-planning-2025-impl-pro-delta', 'Oracle Planning 2025 Implementation Professional - Delta', 'EPM-PLAN-2025-PRO-DELTA', 138),
  ('oracle', 'oracle-epm-account-rec-2025-impl-pro', 'Oracle Account Reconciliation 2025 Implementation Professional', 'EPM-AR-2025-PRO', 139),
  ('oracle', 'oracle-epm-account-rec-2025-impl-pro-delta', 'Oracle Account Reconciliation 2025 Implementation Professional - Delta', 'EPM-AR-2025-PRO-DELTA', 140),
  ('oracle', 'oracle-epm-data-int-2025-impl-pro', 'Oracle Cloud EPM Data Integration 2025 Implementation Professional', 'EPM-DI-2025-PRO', 141),
  ('oracle', 'oracle-epm-data-int-2025-impl-cert-pro-delta', 'Oracle Cloud EPM Data Integration 2025 Implementation Certified Professional - Delta', 'EPM-DI-2025-PRO-DELTA', 142),
  ('oracle', 'oracle-epm-narrative-reporting-2025-impl-pro', 'Oracle Narrative Reporting 2025 Implementation Professional', 'EPM-NR-2025-PRO', 143),
  ('oracle', 'oracle-epm-narrative-reporting-2025-impl-pro-delta', 'Oracle Narrative Reporting 2025 Implementation Professional - Delta', 'EPM-NR-2025-PRO-DELTA', 144),
  ('oracle', 'oracle-epm-pcm-2025-impl-pro', 'Oracle Profitability and Cost Management 2025 Implementation Professional', 'EPM-PCM-2025-PRO', 145),
  ('oracle', 'oracle-epm-pcm-2025-impl-pro-delta', 'Oracle Profitability and Cost Management 2025 Implementation Professional - Delta', 'EPM-PCM-2025-PRO-DELTA', 146),
  ('oracle', 'oracle-epm-edm-2025-impl-pro', 'Oracle Enterprise Data Management Cloud 2025 Implementation Professional', 'EPM-EDM-2025-PRO', 147),
  ('oracle', 'oracle-epm-edm-2025-impl-pro-delta', 'Oracle Enterprise Data Management Cloud 2025 Implementation Professional - Delta', 'EPM-EDM-2025-PRO-DELTA', 148),
  ('oracle', 'oracle-epm-fusion-ai-agent-studio-foundations', 'Oracle Fusion AI Agent Studio Foundations Associate', 'EPM-AI-AGENT-FOUND', 149),
  ('oracle', 'oracle-epm-ai-agent-studio-dev-pro', 'Oracle AI Agent Studio for Fusion Applications Developers Professional', 'EPM-AI-AGENT-DEV-PRO', 150),
  ('oracle', 'oracle-scm-pcm-2025-impl-pro-delta', 'Oracle Profitability and Cost Management 2025 Implementation Professional - Delta', 'SCM-PCM-2025-PRO-DELTA', 151),
  ('oracle', 'oracle-scm-edm-2025-impl-pro', 'Oracle Enterprise Data Management Cloud 2025 Implementation Professional', 'SCM-EDM-2025-PRO', 152),
  ('oracle', 'oracle-scm-edm-2025-impl-pro-delta', 'Oracle Enterprise Data Management Cloud 2025 Implementation Professional - Delta', 'SCM-EDM-2025-PRO-DELTA', 153),
  ('oracle', 'oracle-scm-fusion-ai-agent-studio-foundations', 'Oracle Fusion AI Agent Studio Foundations Associate', 'SCM-AI-AGENT-FOUND', 154),
  ('oracle', 'oracle-scm-ai-agent-studio-dev-pro', 'Oracle AI Agent Studio for Fusion Applications Developers Professional', 'SCM-AI-AGENT-DEV-PRO', 155),
  ('oracle', 'oracle-cx-process-essentials-certified', 'Oracle Fusion Cloud Applications CX Process Essentials Certified', 'CX-PROC-ESS', 156),
  ('oracle', 'oracle-cx-sales-2025-impl-pro', 'Oracle CX Sales 2025 Implementation Professional', 'CX-SALES-2025-PRO', 157),
  ('oracle', 'oracle-cx-sales-2025-impl-pro-delta', 'Oracle CX Sales 2025 Implementation Professional - Delta', 'CX-SALES-2025-PRO-DELTA', 158),
  ('oracle', 'oracle-cx-commerce-2025-impl-pro', 'Oracle CX Commerce 2025 Implementation Professional', 'CX-COMM-2025-PRO', 159),
  ('oracle', 'oracle-cx-commerce-2025-impl-pro-delta', 'Oracle CX Commerce 2025 Implementation Professional - Delta', 'CX-COMM-2025-PRO-DELTA', 160),
  ('oracle', 'oracle-cx-cpq-2025-impl-pro', 'Oracle CPQ 2025 Implementation Professional', 'CX-CPQ-2025-PRO', 161),
  ('oracle', 'oracle-cx-cpq-2025-impl-pro-delta', 'Oracle CPQ 2025 Implementation Professional - Delta', 'CX-CPQ-2025-PRO-DELTA', 162),
  ('oracle', 'oracle-cx-fusion-service-2025-impl-pro', 'Oracle Fusion Service 2025 Implementation Professional', 'CX-SVC-2025-PRO', 163),
  ('oracle', 'oracle-cx-fusion-service-2025-impl-pro-delta', 'Oracle Fusion Service 2025 Implementation Professional - Delta', 'CX-SVC-2025-PRO-DELTA', 164),
  ('oracle', 'oracle-cx-intelligent-advisor-2025-impl-pro', 'Oracle Intelligent Advisor 2025 Implementation Professional', 'CX-IA-2025-PRO', 165),
  ('oracle', 'oracle-cx-intelligent-advisor-2025-impl-pro-delta', 'Oracle Intelligent Advisor 2025 Implementation Professional - Delta', 'CX-IA-2025-PRO-DELTA', 166),
  ('oracle', 'oracle-cx-field-service-2025-impl-pro', 'Oracle Field Service 2025 Implementation Professional', 'CX-FS-2025-PRO', 167),
  ('oracle', 'oracle-cx-field-service-2025-impl-pro-delta', 'Oracle Field Service 2025 Implementation Professional - Delta', 'CX-FS-2025-PRO-DELTA', 168),
  ('oracle', 'oracle-cx-b2c-service-2025-impl-pro', 'Oracle B2C Service 2025 Implementation Professional', 'CX-B2C-2025-PRO', 169),
  ('oracle', 'oracle-cx-b2c-service-2025-impl-pro-delta', 'Oracle B2C Service 2025 Implementation Professional - Delta', 'CX-B2C-2025-PRO-DELTA', 170),
  ('oracle', 'oracle-cx-eloqua-2025-impl-pro', 'Oracle Eloqua Marketing 2025 Implementation Professional', 'CX-ELOQUA-2025-PRO', 171),
  ('oracle', 'oracle-cx-eloqua-2025-impl-pro-delta', 'Oracle Eloqua Marketing 2025 Implementation Professional - Delta', 'CX-ELOQUA-2025-PRO-DELTA', 172),
  ('oracle', 'oracle-cx-responsys-2025-impl-pro', 'Oracle Responsys Marketing Platform 2025 Implementation Professional', 'CX-RESP-2025-PRO', 173),
  ('oracle', 'oracle-cx-responsys-2025-impl-pro-delta', 'Oracle Responsys Marketing Platform 2025 Implementation Professional – Delta', 'CX-RESP-2025-PRO-DELTA', 174),
  ('oracle', 'oracle-cx-fusion-ai-agent-studio-foundations', 'Oracle Fusion AI Agent Studio Foundations Associate', 'CX-AI-AGENT-FOUND', 175),
  ('oracle', 'oracle-cx-ai-agent-studio-dev-pro', 'Oracle AI Agent Studio for Fusion Applications Developers Professional', 'CX-AI-AGENT-DEV-PRO', 176),
  ('oracle', 'oracle-gl-content-dev-foundations-assoc', 'Oracle Guided Learning Content Developer Foundations Associate', 'OGL-CONTENT-FOUND', 177),
  ('oracle', 'oracle-gl-project-mgmt-foundations-assoc', 'Oracle Guided Learning Project Management Foundations Associate', 'OGL-PM-FOUND', 178),
  ('oracle', 'oracle-gl-admin-foundations-assoc', 'Oracle Guided Learning Administrator Foundations Associate', 'OGL-ADMIN-FOUND', 179)
on conflict (provider_slug, value) do nothing;

-- salesforce: 58 certifications
insert into provider_certifications (provider_slug, value, label, exam_code, sort_order) values
  ('salesforce', 'platform-foundations', 'Platform Foundations', 'PF', 1),
  ('salesforce', 'sales-foundations', 'Sales Foundations', 'SF', 2),
  ('salesforce', 'marketing-cloud-engagement-foundations', 'Marketing Cloud Engagement Foundations', 'MCEF', 3),
  ('salesforce', 'tableau-desktop-foundations', 'Tableau Desktop Foundations', 'TDF', 4),
  ('salesforce', 'mulesoft-integration-foundations', 'MuleSoft Integration Foundations', 'MIF', 5),
  ('salesforce', 'slack-administrator', 'Slack Administrator', 'SA', 6),
  ('salesforce', 'tableau-server-administrator', 'Tableau Server Administrator', 'TSA', 7),
  ('salesforce', 'cpq-administrator', 'CPQ Administrator', 'CPQA', 8),
  ('salesforce', 'slack-consultant', 'Slack Consultant', 'SC', 9),
  ('salesforce', 'ai-associate', 'AI Associate', 'AIA', 10),
  ('salesforce', 'platform-administrator', 'Platform Administrator', 'PA', 11),
  ('salesforce', 'platform-administrator-ii', 'Platform Administrator II', 'PA2', 12),
  ('salesforce', 'platform-app-builder', 'Platform App Builder', 'PAB', 13),
  ('salesforce', 'platform-developer', 'Platform Developer', 'PD', 14),
  ('salesforce', 'javascript-developer', 'JavaScript Developer', 'JSD', 15),
  ('salesforce', 'industries-cpq-developer', 'Industries CPQ Developer', 'ICPQD', 16),
  ('salesforce', 'b2c-commerce-developer', 'B2C Commerce Developer', 'B2CCD', 17),
  ('salesforce', 'sales-cloud-consultant', 'Sales Cloud Consultant', 'SCC', 18),
  ('salesforce', 'service-cloud-consultant', 'Service Cloud Consultant', 'SCC2', 19),
  ('salesforce', 'experience-cloud-consultant', 'Experience Cloud Consultant', 'ECC', 20),
  ('salesforce', 'field-service-cloud-consultant', 'Field Service Cloud Consultant', 'FSCC', 21),
  ('salesforce', 'data-cloud-consultant', 'Data Cloud Consultant', 'DCC', 22),
  ('salesforce', 'agentforce-specialist', 'Agentforce Specialist', 'AFS', 23),
  ('salesforce', 'mulesoft-developer', 'MuleSoft Developer', 'MSD', 24),
  ('salesforce', 'slack-developer', 'Slack Developer', 'SD', 25),
  ('salesforce', 'identity-access-management-architect', 'Identity & Access Management Architect', 'IAMA', 26),
  ('salesforce', 'business-analyst', 'Business Analyst', 'BA', 27),
  ('salesforce', 'platform-developer-ii', 'Platform Developer II', 'PD2', 28),
  ('salesforce', 'omnistudio-developer', 'OmniStudio Developer', 'OSD', 29),
  ('salesforce', 'omnistudio-consultant', 'OmniStudio Consultant', 'OSC', 30),
  ('salesforce', 'marketing-cloud-administrator', 'Marketing Cloud Administrator', 'MCA', 31),
  ('salesforce', 'marketing-cloud-engagement-consultant', 'Marketing Cloud Engagement Consultant', 'MCEC', 32),
  ('salesforce', 'marketing-cloud-engagement-developer', 'Marketing Cloud Engagement Developer', 'MCED', 33),
  ('salesforce', 'marketing-cloud-email-specialist', 'Marketing Cloud Email Specialist', 'MCES', 34),
  ('salesforce', 'marketing-cloud-account-engagement-consultant', 'Marketing Cloud Account Engagement Consultant', 'MCAEC', 35),
  ('salesforce', 'marketing-cloud-account-engagement-specialist', 'Marketing Cloud Account Engagement Specialist', 'MCAES', 36),
  ('salesforce', 'b2c-solution-architect', 'B2C Solution Architect', 'B2CSA', 37),
  ('salesforce', 'platform-strategy-designer', 'Platform Strategy Designer', 'PSD', 38),
  ('salesforce', 'platform-user-experience-designer', 'Platform User Experience Designer', 'PUXD', 39),
  ('salesforce', 'nonprofit-cloud-consultant', 'Nonprofit Cloud Consultant', 'NPCC', 40),
  ('salesforce', 'nonprofit-success-pack-consultant', 'Nonprofit Success Pack Consultant', 'NSPC', 41),
  ('salesforce', 'education-cloud-consultant', 'Education Cloud Consultant', 'ECC2', 42),
  ('salesforce', 'tableau-crm-einstein-discovery-consultant', 'Tableau CRM & Einstein Discovery Consultant', 'TCEDC', 43),
  ('salesforce', 'platform-sharing-visibility-architect', 'Platform Sharing & Visibility Architect', 'PSVA', 44),
  ('salesforce', 'mulesoft-developer-ii', 'MuleSoft Developer II', 'MSD2', 45),
  ('salesforce', 'mulesoft-hyperautomation-developer', 'MuleSoft Hyperautomation Developer', 'MSHD', 46),
  ('salesforce', 'platform-dev-lifecycle-deployment-architect', 'Platform Dev Lifecycle & Deployment Architect', 'PDLDA', 47),
  ('salesforce', 'system-architect', 'System Architect', 'SA2', 48),
  ('salesforce', 'application-architect', 'Application Architect', 'AA', 49),
  ('salesforce', 'b2b-solution-architect', 'B2B Solution Architect', 'B2BSA', 50),
  ('salesforce', 'b2c-commerce-architect', 'B2C Commerce Architect', 'B2CCA', 51),
  ('salesforce', 'heroku-architect', 'Heroku Architect', 'HA', 52),
  ('salesforce', 'tableau-architect', 'Tableau Architect', 'TA', 53),
  ('salesforce', 'mulesoft-platform-architect', 'MuleSoft Platform Architect', 'MSPA', 54),
  ('salesforce', 'mulesoft-integration-architect', 'MuleSoft Integration Architect', 'MSIA', 55),
  ('salesforce', 'platform-integration-architect', 'Platform Integration Architect', 'PIA', 56),
  ('salesforce', 'platform-data-architect', 'Platform Data Architect', 'PDA', 57),
  ('salesforce', 'technical-architect', 'Technical Architect', 'TA2', 58)
on conflict (provider_slug, value) do nothing;

-- servicenow: 35 certifications
insert into provider_certifications (provider_slug, value, label, exam_code, sort_order) values
  ('servicenow', 'certified-technical-architect', 'Certified Technical Architect (CTA)', 'CTA', 1),
  ('servicenow', 'certified-master-architect', 'Certified Master Architect (CMA)', 'CMA', 2),
  ('servicenow', 'certified-system-administrator', 'Certified System Administrator (CSA)', 'CSA', 3),
  ('servicenow', 'certified-application-developer', 'Certified Application Developer (CAD)', 'CAD', 4),
  ('servicenow', 'cis-itsm', 'CIS - IT Service Management (CIS-ITSM)', 'CIS-ITSM', 5),
  ('servicenow', 'cis-itom', 'CIS - IT Operations Management (CIS-ITOM)', 'CIS-ITOM', 6),
  ('servicenow', 'cis-csm', 'CIS - Customer Service Management (CIS-CSM)', 'CIS-CSM', 7),
  ('servicenow', 'cis-hr', 'CIS - HR Service Delivery (CIS-HR)', 'CIS-HR', 8),
  ('servicenow', 'cis-sir', 'CIS - Security Incident Response (CIS-SIR)', 'CIS-SIR', 9),
  ('servicenow', 'cis-vr', 'CIS - Vulnerability Response (CIS-VR)', 'CIS-VR', 10),
  ('servicenow', 'cis-discovery', 'CIS - Discovery (CIS-Discovery)', 'CIS-Discovery', 11),
  ('servicenow', 'cis-em', 'CIS - Event Management (CIS-EM)', 'CIS-EM', 12),
  ('servicenow', 'cis-sam', 'CIS - Software Asset Management (CIS-SAM)', 'CIS-SAM', 13),
  ('servicenow', 'cis-ham', 'CIS - Hardware Asset Management (CIS-HAM)', 'CIS-HAM', 14),
  ('servicenow', 'cis-rc', 'CIS - Risk and Compliance (CIS-RC)', 'CIS-RC', 15),
  ('servicenow', 'cis-cloud-provisioning-governance', 'CIS - Cloud Provisioning and Governance', 'CIS-CPG', 16),
  ('servicenow', 'cis-fsm', 'CIS - Field Service Management (CIS-FSM)', 'CIS-FSM', 17),
  ('servicenow', 'cis-apm', 'CIS - Application Portfolio Management (CIS-APM)', 'CIS-APM', 18),
  ('servicenow', 'cis-spm', 'CIS - Strategic Portfolio Management (CIS-SPM)', 'CIS-SPM', 19),
  ('servicenow', 'cis-irm', 'CIS - Integrated Risk Management (CIS-IRM)', 'CIS-IRM', 20),
  ('servicenow', 'cis-ape', 'CIS - App Engine (CIS-APE)', 'CIS-APE', 21),
  ('servicenow', 'mc-welcome-to-servicenow', 'MC - Welcome to ServiceNow', 'MC-WTS', 22),
  ('servicenow', 'mc-predictive-intelligence', 'MC - Predictive Intelligence', 'MC-PI', 23),
  ('servicenow', 'mc-virtual-agent', 'MC - Virtual Agent', 'MC-VA', 24),
  ('servicenow', 'mc-automated-test-framework', 'MC - Automated Test Framework', 'MC-ATF', 25),
  ('servicenow', 'mc-flow-designer', 'MC - Flow Designer', 'MC-FD', 26),
  ('servicenow', 'mc-integration-hub', 'MC - Integration Hub', 'MC-IH', 27),
  ('servicenow', 'mc-performance-analytics', 'MC - Performance Analytics', 'MC-PA', 28),
  ('servicenow', 'mc-service-portal', 'MC - Service Portal', 'MC-SP', 29),
  ('servicenow', 'mc-agile-development', 'MC - Agile Development', 'MC-AD', 30),
  ('servicenow', 'mc-application-developer-process-creator', 'MC - Application Developer Process Creator', 'MC-ADPC', 31),
  ('servicenow', 'mc-citizen-developer-application-creator', 'MC - Citizen Developer Application Creator', 'MC-CDAC', 32),
  ('servicenow', 'mc-generative-ai-executive', 'MC - Generative AI (Executive)', 'MC-GAI-E', 33),
  ('servicenow', 'mc-now-assist', 'MC - Now Assist (NEW 2025)', 'MC-NA', 34),
  ('servicenow', 'cloud-cost-management-accreditation', 'Cloud Cost Management Accreditation (NEW)', 'CCMA', 35)
on conflict (provider_slug, value) do nothing;

