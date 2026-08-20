-- Add design_json column to email_templates to store the visual builder's state
ALTER TABLE public.email_templates
ADD COLUMN IF NOT EXISTS design_json jsonb;

COMMENT ON COLUMN public.email_templates.design_json IS 'Stores the Unlayer react-email-editor JSON state for visual drag-and-drop editing.';
