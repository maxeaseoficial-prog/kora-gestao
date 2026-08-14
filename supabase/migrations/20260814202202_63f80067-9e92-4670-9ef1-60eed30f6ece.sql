GRANT SELECT ON public.user_plan_overrides TO authenticated;
GRANT ALL ON public.user_plan_overrides TO service_role;
GRANT ALL ON public.user_plan_overrides TO postgres;

-- Ensure RLS is enabled and there's a policy for service_role/admin logic
ALTER TABLE public.user_plan_overrides ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_plan_overrides' 
        AND policyname = 'Service role can do everything'
    ) THEN
        CREATE POLICY "Service role can do everything" ON public.user_plan_overrides
        FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;