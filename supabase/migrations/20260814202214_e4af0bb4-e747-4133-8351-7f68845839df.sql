-- No SQL change needed here, just a note that I'm redeploying the function with a fix in code.
-- Actually, the Edge Function usually has service role access by default if configured,
-- but since I can't check secrets directly, I will add an authenticated select policy 
-- for users to read their own override just in case the function uses their token.

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_plan_overrides' 
        AND policyname = 'Users can read their own override'
    ) THEN
        CREATE POLICY "Users can read their own override" ON public.user_plan_overrides
        FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;
END $$;