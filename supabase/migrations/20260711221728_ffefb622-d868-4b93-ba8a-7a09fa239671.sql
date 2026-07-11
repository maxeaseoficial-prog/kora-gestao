
CREATE TABLE public.agenda_local_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_local_events TO authenticated;
GRANT ALL ON public.agenda_local_events TO service_role;

ALTER TABLE public.agenda_local_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own agenda events"
ON public.agenda_local_events FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_agenda_local_events_updated_at
BEFORE UPDATE ON public.agenda_local_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_agenda_local_events_user_time ON public.agenda_local_events(user_id, starts_at);
