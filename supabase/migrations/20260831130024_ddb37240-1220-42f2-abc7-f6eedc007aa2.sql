CREATE TABLE public.user_trials (
  user_id uuid PRIMARY KEY,
  trial_started_at timestamptz NOT NULL DEFAULT now(),
  trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_trials TO authenticated;
GRANT ALL ON public.user_trials TO service_role;

ALTER TABLE public.user_trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trial"
ON public.user_trials FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE TABLE public.trial_settings (
  id boolean PRIMARY KEY DEFAULT true,
  eligible_after timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trial_settings_singleton CHECK (id)
);

GRANT SELECT ON public.trial_settings TO authenticated;
GRANT ALL ON public.trial_settings TO service_role;

ALTER TABLE public.trial_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can read trial settings"
ON public.trial_settings FOR SELECT TO authenticated
USING (true);

INSERT INTO public.trial_settings (id, eligible_after) VALUES (true, now());