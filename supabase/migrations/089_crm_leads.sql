CREATE TABLE IF NOT EXISTS public.crm_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    email TEXT,
    linkedin_profile TEXT,
    notes TEXT,
    status TEXT DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'In Progress', 'Closed', 'Lost')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

-- Allow public inserts
CREATE POLICY "Allow public insert to crm_leads" ON public.crm_leads 
    FOR INSERT TO public WITH CHECK (true);

-- Allow admin full access
CREATE POLICY "Allow admin all on crm_leads" ON public.crm_leads 
    FOR ALL TO authenticated USING (
        auth.jwt() ->> 'role' = 'admin'
    );
