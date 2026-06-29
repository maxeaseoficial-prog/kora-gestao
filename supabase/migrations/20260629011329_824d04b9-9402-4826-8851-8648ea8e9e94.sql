ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS client_type text NOT NULL DEFAULT 'empresa',
  ADD COLUMN IF NOT EXISTS secondary_phone text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS end_date date;

ALTER TABLE public.clients ALTER COLUMN company DROP NOT NULL;

ALTER TABLE public.clients
  ADD CONSTRAINT clients_client_type_check CHECK (client_type IN ('empresa','pessoa'));