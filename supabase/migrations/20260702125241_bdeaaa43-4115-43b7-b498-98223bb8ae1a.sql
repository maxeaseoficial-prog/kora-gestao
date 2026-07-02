CREATE TABLE public.password_reset_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.password_reset_codes TO service_role;
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_password_reset_codes_user ON public.password_reset_codes(user_id, created_at DESC);