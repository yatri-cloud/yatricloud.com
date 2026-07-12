-- ============================================================
-- Yatri Cloud — 051_azure_github_poster_certs.sql
-- Refresh the Azure + GitHub certification lists to match the official
-- Microsoft "Become Certified" poster (aka.ms/CertificationsPoster,
-- last updated July 2026):
--   https://arch-center.azureedge.net/Credentials/Certification-Poster_en-us.pdf
--
-- The 010 seed had stale entries (AI-900→AI-901, AI-102→AI-103, DP-203,
-- DP-100, SC-400, MS-900, MB-910/920/700/240/300/335, PL-500/600, AZ-720,
-- windows-server-hybrid AZ-800/801, GH-1001/GH-400/GH-300 codes, …).
-- This replaces both provider lists wholesale and populates `level`.
--
-- Azure/GitHub are already `cert_providers` rows AND `provider_t` enum
-- members, so this is a pure catalog-data refresh — every catalog-driven
-- surface (Certified Yatris cert picker, Training cert link, vouchers,
-- homepage, admin cert catalog) picks the new list up automatically.
--
-- Keep in sync with src/lib/cert-catalog.ts FALLBACK_PROVIDER_CERTS.
--
-- NON-DESTRUCTIVE: upsert on (provider_slug, value) so surviving certs keep
-- their id (study_plans.certification_id is ON DELETE CASCADE, trainings is
-- ON DELETE SET NULL — a blind delete would drop user study plans / unlink
-- courses). Genuinely retired certs are pruned by value at the end.
-- ============================================================

-- ---------- azure: 50 certifications (all Microsoft certs on the poster) ----------
insert into provider_certifications (provider_slug, value, label, exam_code, level, sort_order) values
  ('azure', 'az-900', 'AZ-900: Azure Fundamentals', 'AZ-900', 'fundamentals', 1),
  ('azure', 'ai-901', 'AI-901: Azure AI Fundamentals', 'AI-901', 'fundamentals', 2),
  ('azure', 'dp-900', 'DP-900: Azure Data Fundamentals', 'DP-900', 'fundamentals', 3),
  ('azure', 'sc-900', 'SC-900: Security, Compliance, and Identity Fundamentals', 'SC-900', 'fundamentals', 4),
  ('azure', 'ab-900', 'AB-900: Microsoft 365 Copilot and Agent Administration Fundamentals', 'AB-900', 'fundamentals', 5),
  ('azure', 'pl-900', 'PL-900: Power Platform Fundamentals', 'PL-900', 'fundamentals', 6),
  ('azure', 'az-104', 'AZ-104: Azure Administrator Associate', 'AZ-104', 'associate', 7),
  ('azure', 'az-204', 'AZ-204: Azure Developer Associate', 'AZ-204', 'associate', 8),
  ('azure', 'az-500', 'AZ-500: Azure Security Engineer Associate', 'AZ-500', 'associate', 9),
  ('azure', 'az-700', 'AZ-700: Azure Network Engineer Associate', 'AZ-700', 'associate', 10),
  ('azure', 'az-802', 'AZ-802: Windows Server Administrator Associate (Beta)', 'AZ-802', 'associate', 11),
  ('azure', 'ai-103', 'AI-103: Azure AI Apps and Agents Developer Associate', 'AI-103', 'associate', 12),
  ('azure', 'ai-200', 'AI-200: Azure AI Cloud Developer Associate (Beta)', 'AI-200', 'associate', 13),
  ('azure', 'ai-300', 'AI-300: Machine Learning Operations Engineer Associate', 'AI-300', 'associate', 14),
  ('azure', 'dp-300', 'DP-300: Azure Database Administrator Associate', 'DP-300', 'associate', 15),
  ('azure', 'dp-600', 'DP-600: Fabric Analytics Engineer Associate', 'DP-600', 'associate', 16),
  ('azure', 'dp-700', 'DP-700: Fabric Data Engineer Associate', 'DP-700', 'associate', 17),
  ('azure', 'dp-750', 'DP-750: Azure Databricks Data Engineer Associate', 'DP-750', 'associate', 18),
  ('azure', 'dp-800', 'DP-800: SQL AI Developer Associate', 'DP-800', 'associate', 19),
  ('azure', 'pl-300', 'PL-300: Power BI Data Analyst Associate', 'PL-300', 'associate', 20),
  ('azure', 'sc-200', 'SC-200: Security Operations Analyst Associate', 'SC-200', 'associate', 21),
  ('azure', 'sc-300', 'SC-300: Identity and Access Administrator Associate', 'SC-300', 'associate', 22),
  ('azure', 'sc-401', 'SC-401: Information Security Administrator Associate', 'SC-401', 'associate', 23),
  ('azure', 'sc-500', 'SC-500: Cloud and AI Security Engineer Associate (Beta)', 'SC-500', 'associate', 24),
  ('azure', 'md-102', 'MD-102: Endpoint Administrator Associate', 'MD-102', 'associate', 25),
  ('azure', 'ms-700', 'MS-700: Teams Administrator Associate', 'MS-700', 'associate', 26),
  ('azure', 'ms-721', 'MS-721: Collaboration Communications Systems Engineer Associate', 'MS-721', 'associate', 27),
  ('azure', 'mb-230', 'MB-230: Dynamics 365 Customer Service Functional Consultant Associate', 'MB-230', 'associate', 28),
  ('azure', 'mb-280', 'MB-280: Dynamics 365 Customer Experience Analyst Associate', 'MB-280', 'associate', 29),
  ('azure', 'mb-310', 'MB-310: Dynamics 365 Finance Functional Consultant Associate', 'MB-310', 'associate', 30),
  ('azure', 'mb-330', 'MB-330: Dynamics 365 Supply Chain Management Functional Consultant Associate', 'MB-330', 'associate', 31),
  ('azure', 'mb-500', 'MB-500: Dynamics 365: Finance and Operations Apps Developer Associate', 'MB-500', 'associate', 32),
  ('azure', 'mb-800', 'MB-800: Dynamics 365 Business Central Functional Consultant Associate', 'MB-800', 'associate', 33),
  ('azure', 'mb-820', 'MB-820: Dynamics 365 Business Central Developer Associate', 'MB-820', 'associate', 34),
  ('azure', 'pl-200', 'PL-200: Power Platform Functional Consultant Associate', 'PL-200', 'associate', 35),
  ('azure', 'pl-400', 'PL-400: Power Platform Developer Associate', 'PL-400', 'associate', 36),
  ('azure', 'ab-210', 'AB-210: Dynamics 365 Sales AI Consultant Associate (Beta)', 'AB-210', 'associate', 37),
  ('azure', 'ab-250', 'AB-250: Dynamics 365 Contact Center AI Engineer Associate (Beta)', 'AB-250', 'associate', 38),
  ('azure', 'ab-410', 'AB-410: Intelligent Applications Builder Associate (Beta)', 'AB-410', 'associate', 39),
  ('azure', 'ab-620', 'AB-620: AI Agent Builder Associate', 'AB-620', 'associate', 40),
  ('azure', 'az-305', 'AZ-305: Azure Solutions Architect Expert', 'AZ-305', 'expert', 41),
  ('azure', 'az-400', 'AZ-400: DevOps Engineer Expert', 'AZ-400', 'expert', 42),
  ('azure', 'sc-100', 'SC-100: Cybersecurity Architect Expert', 'SC-100', 'expert', 43),
  ('azure', 'ms-102', 'MS-102: Microsoft 365 Administrator Expert', 'MS-102', 'expert', 44),
  ('azure', 'ab-100', 'AB-100: Agentic AI Business Solutions Architect', 'AB-100', 'expert', 45),
  ('azure', 'az-120', 'AZ-120: Azure for SAP Workloads Specialty', 'AZ-120', 'specialty', 46),
  ('azure', 'az-140', 'AZ-140: Azure Virtual Desktop Specialty', 'AZ-140', 'specialty', 47),
  ('azure', 'dp-420', 'DP-420: Azure Cosmos DB Developer Specialty', 'DP-420', 'specialty', 48),
  ('azure', 'ab-730', 'AB-730: AI Business Professional', 'AB-730', 'business', 49),
  ('azure', 'ab-731', 'AB-731: AI Transformation Leader', 'AB-731', 'business', 50)
on conflict (provider_slug, value) do update
  set label = excluded.label, exam_code = excluded.exam_code, level = excluded.level,
      sort_order = excluded.sort_order, active = true, updated_at = now();

-- ---------- github: 6 certifications ----------
insert into provider_certifications (provider_slug, value, label, exam_code, level, sort_order) values
  ('github', 'gh-900', 'GH-900: GitHub Foundations', 'GH-900', 'fundamentals', 1),
  ('github', 'gh-100', 'GH-100: GitHub Administration', 'GH-100', 'specialty', 2),
  ('github', 'gh-200', 'GH-200: GitHub Actions', 'GH-200', 'specialty', 3),
  ('github', 'gh-300', 'GH-300: GitHub Copilot', 'GH-300', 'specialty', 4),
  ('github', 'gh-500', 'GH-500: GitHub Advanced Security', 'GH-500', 'specialty', 5),
  ('github', 'gh-600', 'GH-600: GitHub Agentic AI Developer (Beta)', 'GH-600', 'specialty', 6)
on conflict (provider_slug, value) do update
  set label = excluded.label, exam_code = excluded.exam_code, level = excluded.level,
      sort_order = excluded.sort_order, active = true, updated_at = now();

-- ---------- prune retired certs (values no longer on the poster) ----------
-- Only deletes genuinely-removed codes (e.g. ai-900, dp-203, sc-400, gh-1001).
-- Surviving certs kept their id above, so linked study plans / courses are safe.
delete from provider_certifications
where provider_slug = 'azure' and value not in (
  'az-900','ai-901','dp-900','sc-900','ab-900','pl-900','az-104','az-204','az-500','az-700',
  'az-802','ai-103','ai-200','ai-300','dp-300','dp-600','dp-700','dp-750','dp-800','pl-300',
  'sc-200','sc-300','sc-401','sc-500','md-102','ms-700','ms-721','mb-230','mb-280','mb-310',
  'mb-330','mb-500','mb-800','mb-820','pl-200','pl-400','ab-210','ab-250','ab-410','ab-620',
  'az-305','az-400','sc-100','ms-102','ab-100','az-120','az-140','dp-420','ab-730','ab-731'
);

delete from provider_certifications
where provider_slug = 'github' and value not in (
  'gh-900','gh-100','gh-200','gh-300','gh-500','gh-600'
);
