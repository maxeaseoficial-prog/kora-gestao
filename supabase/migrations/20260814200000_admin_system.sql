-- Create table for admin settings (login, password, site config)
CREATE TABLE public.admin_settings (
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
CREATE TABLE public.user_plan_overrides (
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

-- Policies (We'll handle authentication at the application layer for the admin panel, 
-- but we protect the tables for the service_role and authenticated users with restricted logic)

CREATE POLICY "Allow service role all access on admin_settings" ON public.admin_settings FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role all access on user_plan_overrides" ON public.user_plan_overrides FOR ALL TO service_role USING (true);

-- Insert initial admin (admin/admin) - password 'admin' hashed with a dummy method for first login
-- Note: In a real app we'd use bcrypt or similar, but for the first step we'll store a known hash 
-- and let the user change it. For now, we'll use a simple representation.
INSERT INTO public.admin_settings (admin_username, admin_password_hash) 
VALUES ('admin', 'admin'); 

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
