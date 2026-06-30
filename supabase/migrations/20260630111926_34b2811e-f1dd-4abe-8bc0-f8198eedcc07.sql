
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS origin_type TEXT,
  ADD COLUMN IF NOT EXISTS origin_channel TEXT,
  ADD COLUMN IF NOT EXISTS referrer_name TEXT;
