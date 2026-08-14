-- Create table for admin settings (login, password, site config)
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_username TEXT NOT NULL UNIQUE DEFAULT 'admin',
    admin_password_hash TEXT NOT NULL,
    site_name TEXT DEFAULT 'Kora Gestão Inteligente',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Grant access to admin_settings
GRANT SELECT, UPDATE ON public.admin_settings TO authenticated;
GRANT ALL ON public.admin_settings TO service_role;

-- Table for plan overrides (giving access to users manually)
CREATE TABLE IF NOT EXISTS public.user_plan_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('lifetime', 'monthly', 'annual')),
    expires_at TIMESTAMPTZ, -- null for lifetime
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Grant access to user_plan_overrides
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_plan_overrides TO authenticated;
GRANT ALL ON public.user_plan_overrides TO service_role;

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plan_overrides ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role all access on admin_settings') THEN
        CREATE POLICY "Allow service role all access on admin_settings" ON public.admin_settings FOR ALL TO service_role USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role all access on user_plan_overrides') THEN
        CREATE POLICY "Allow service role all access on user_plan_overrides" ON public.user_plan_overrides FOR ALL TO service_role USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated to read admin_settings') THEN
        CREATE POLICY "Allow authenticated to read admin_settings" ON public.admin_settings FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- Insert initial admin (admin/admin)
INSERT INTO public.admin_settings (admin_username, admin_password_hash) 
SELECT 'admin', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM public.admin_settings WHERE admin_username = 'admin');

-- View to list users for the admin panel
CREATE OR REPLACE VIEW public.admin_user_view AS
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    upo.plan_type as override_plan,
    upo.expires_at as override_expires
FROM auth.users u
LEFT JOIN public.user_plan_overrides upo ON u.id = upo.user_id;

GRANT SELECT ON public.admin_user_view TO authenticated;
GRANT SELECT ON public.admin_user_view TO service_role;
