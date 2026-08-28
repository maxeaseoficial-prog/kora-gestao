-- Replace the browser-verified shared admin password with Supabase Auth identity
-- plus a database-owned allowlist. No administrator is bootstrapped here because
-- the repository does not prove which existing auth user should receive access.
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_users IS
    'Administrative identities provisioned only from a trusted database or backend context.';

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.admin_users FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.admin_users TO service_role;

-- This helper intentionally takes no user id: callers can only ask about the
-- identity carried by their verified Supabase Auth JWT.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT (SELECT auth.uid()) IS NOT NULL
       AND EXISTS (
           SELECT 1
           FROM public.admin_users
           WHERE user_id = (SELECT auth.uid())
       );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Retire the legacy shared-credential API surface. Historical data is retained,
-- but browsers can no longer read or update the row containing that credential.
DROP POLICY IF EXISTS "Allow authenticated to read admin_settings"
    ON public.admin_settings;
REVOKE ALL ON TABLE public.admin_settings FROM PUBLIC, anon, authenticated;

-- The legacy view exposes auth.users and was previously granted to every signed-in
-- user. Administrative user listing now goes through the checked function below.
REVOKE ALL ON TABLE public.admin_user_view FROM PUBLIC, anon, authenticated;

-- Normal users retain only the pre-existing, RLS-limited ability to read their own
-- override. Administrative writes are performed by the checked function below.
REVOKE ALL ON TABLE public.user_plan_overrides FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON TABLE public.user_plan_overrides FROM authenticated;
GRANT SELECT ON TABLE public.user_plan_overrides TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS TABLE (
    id UUID,
    email TEXT,
    created_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    override_plan TEXT,
    override_expires TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Administrative access required' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT
        users.id,
        users.email::TEXT,
        users.created_at,
        users.last_sign_in_at,
        overrides.plan_type,
        overrides.expires_at
    FROM auth.users AS users
    LEFT JOIN public.user_plan_overrides AS overrides
        ON overrides.user_id = users.id
    ORDER BY users.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_users() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_users() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_user_plan(
    p_user_id UUID,
    p_plan_type TEXT,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Administrative access required' USING ERRCODE = '42501';
    END IF;

    IF p_plan_type IS NULL THEN
        DELETE FROM public.user_plan_overrides WHERE user_id = p_user_id;
        RETURN;
    END IF;

    IF p_plan_type NOT IN ('lifetime', 'monthly', 'annual') THEN
        RAISE EXCEPTION 'Invalid plan type' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.user_plan_overrides (user_id, plan_type, expires_at)
    VALUES (p_user_id, p_plan_type, p_expires_at)
    ON CONFLICT (user_id) DO UPDATE
    SET plan_type = EXCLUDED.plan_type,
        expires_at = EXCLUDED.expires_at;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_plan(UUID, TEXT, TIMESTAMPTZ)
    FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_user_plan(UUID, TEXT, TIMESTAMPTZ)
    TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_get_site_name()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Administrative access required' USING ERRCODE = '42501';
    END IF;

    RETURN (
        SELECT site_name
        FROM public.admin_settings
        ORDER BY updated_at DESC NULLS LAST
        LIMIT 1
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_site_name() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_site_name() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_site_name(p_site_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Administrative access required' USING ERRCODE = '42501';
    END IF;

    IF NULLIF(BTRIM(p_site_name), '') IS NULL THEN
        RAISE EXCEPTION 'Site name cannot be empty' USING ERRCODE = '22023';
    END IF;

    UPDATE public.admin_settings
    SET site_name = BTRIM(p_site_name),
        updated_at = now()
    WHERE id = (
        SELECT id
        FROM public.admin_settings
        ORDER BY updated_at DESC NULLS LAST
        LIMIT 1
    );

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Admin settings row not found' USING ERRCODE = 'P0002';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_site_name(TEXT)
    FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_site_name(TEXT)
    TO authenticated;

-- Provision an administrator only from a trusted context after reviewing the UUID:
-- INSERT INTO public.admin_users (user_id) VALUES ('<auth.users UUID>');