-- ============================================================
-- Yatri Cloud — 090_resources.sql
-- Resource Management System: resources catalog + user access log
-- Admin manages resources from /admin/resources.
-- Users browse at /resources, unlock free resources instantly
-- or purchase paid ones, then view their library in /profile/my-resources.
-- ============================================================

-- ---------- resources table ----------

CREATE TABLE IF NOT EXISTS public.resources (
    id           UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    name         TEXT          NOT NULL,
    description  TEXT          NOT NULL DEFAULT '',
    image_url    TEXT          NOT NULL DEFAULT '',
    access_url   TEXT          NOT NULL,          -- the actual resource link (private)
    resource_type TEXT         NOT NULL DEFAULT 'link' CHECK (resource_type IN ('link', 'file')),
    is_free      BOOLEAN       NOT NULL DEFAULT true,
    price_inr    NUMERIC(10,2) NOT NULL DEFAULT 0,
    provider     TEXT          NOT NULL DEFAULT '', -- e.g. AWS, Azure, GCP
    category     TEXT          NOT NULL DEFAULT '', -- e.g. Study Guide, Practice Test
    tags         TEXT[]        NOT NULL DEFAULT '{}',
    is_published BOOLEAN       NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trg_resources_updated ON public.resources;
CREATE TRIGGER trg_resources_updated
    BEFORE UPDATE ON public.resources
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Public can read published resources (but NOT access_url — that is returned only after unlock)
DROP POLICY IF EXISTS "resources_public_read" ON public.resources;
CREATE POLICY "resources_public_read" ON public.resources
    FOR SELECT USING (is_published = true);

-- Admin has full access
DROP POLICY IF EXISTS "resources_admin_all" ON public.resources;
CREATE POLICY "resources_admin_all" ON public.resources
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ---------- user_resources table (access log) ----------

CREATE TABLE IF NOT EXISTS public.user_resources (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_id UUID        NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    payment_id  TEXT        ,           -- Razorpay payment ID for paid resources
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, resource_id)       -- each user unlocks a resource only once
);

-- RLS
ALTER TABLE public.user_resources ENABLE ROW LEVEL SECURITY;

-- Authenticated users can see only their own rows
DROP POLICY IF EXISTS "user_resources_own_read" ON public.user_resources;
CREATE POLICY "user_resources_own_read" ON public.user_resources
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Authenticated users can insert their own rows
DROP POLICY IF EXISTS "user_resources_own_insert" ON public.user_resources;
CREATE POLICY "user_resources_own_insert" ON public.user_resources
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Admin can read/delete all rows
DROP POLICY IF EXISTS "user_resources_admin_all" ON public.user_resources;
CREATE POLICY "user_resources_admin_all" ON public.user_resources
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ---------- RPC: unlock a resource and return its access_url ----------
-- Inserts into user_resources (idempotent) and returns the access_url.
-- Called from the frontend after free access or after successful payment.

CREATE OR REPLACE FUNCTION public.grant_resource_access(
    p_resource_id UUID,
    p_payment_id  TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_access_url TEXT;
    v_is_free    BOOLEAN;
    v_is_pub     BOOLEAN;
BEGIN
    -- Validate resource exists and is published
    SELECT access_url, is_free, is_published
    INTO v_access_url, v_is_free, v_is_pub
    FROM public.resources
    WHERE id = p_resource_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Resource not found';
    END IF;

    IF NOT v_is_pub THEN
        RAISE EXCEPTION 'Resource is not published';
    END IF;

    -- For paid resources a payment_id must be supplied
    IF NOT v_is_free AND (p_payment_id IS NULL OR p_payment_id = '') THEN
        RAISE EXCEPTION 'Payment required for this resource';
    END IF;

    -- Record access (upsert — safe to call more than once)
    INSERT INTO public.user_resources (user_id, resource_id, payment_id)
    VALUES (auth.uid(), p_resource_id, p_payment_id)
    ON CONFLICT (user_id, resource_id) DO UPDATE
        SET payment_id  = COALESCE(EXCLUDED.payment_id, user_resources.payment_id),
            accessed_at = now();

    RETURN v_access_url;
END;
$$;

-- Only authenticated users can call the RPC
REVOKE ALL ON FUNCTION public.grant_resource_access(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_resource_access(UUID, TEXT) TO authenticated;

-- ---------- Storage bucket for resource thumbnails ----------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'resource-images',
    'resource-images',
    true,
    5242880,   -- 5 MB
    ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Public read on resource-images
DROP POLICY IF EXISTS "resource_images_public_read" ON storage.objects;
CREATE POLICY "resource_images_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'resource-images');

-- Only admins can upload / delete
DROP POLICY IF EXISTS "resource_images_admin_write" ON storage.objects;
CREATE POLICY "resource_images_admin_write" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'resource-images' AND is_admin());

DROP POLICY IF EXISTS "resource_images_admin_delete" ON storage.objects;
CREATE POLICY "resource_images_admin_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'resource-images' AND is_admin());
