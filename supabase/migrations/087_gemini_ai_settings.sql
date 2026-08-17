-- ============================================================
-- Yatri Cloud — 087_gemini_ai_settings.sql
-- Seed Google Gemini AI settings and model configurations
-- ============================================================

INSERT INTO site_settings (key, value)
VALUES (
  'gemini_ai',
  '{
    "api_key": "",
    "model": "gemini-1.5-flash",
    "temperature": 0.2,
    "max_tokens": 4096,
    "enabled": true
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
