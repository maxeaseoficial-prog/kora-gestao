
-- Add optional description to annual_goals
ALTER TABLE public.annual_goals ADD COLUMN IF NOT EXISTS description text;

-- Add linking columns on finance_entries (optional / nullable, non-breaking)
ALTER TABLE public.finance_entries ADD COLUMN IF NOT EXISTS product_id uuid;
ALTER TABLE public.finance_entries ADD COLUMN IF NOT EXISTS service_id uuid;
ALTER TABLE public.finance_entries ADD COLUMN IF NOT EXISTS quantity numeric;
ALTER TABLE public.finance_entries ADD COLUMN IF NOT EXISTS kind text; -- 'produto' | 'servico'

-- ============ monthly_goals ============
CREATE TABLE IF NOT EXISTS public.monthly_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  value numeric NOT NULL DEFAULT 0,
  is_manual boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_goals TO authenticated;
GRANT ALL ON public.monthly_goals TO service_role;
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own monthly goals" ON public.monthly_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_monthly_goals_updated_at BEFORE UPDATE ON public.monthly_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ planning_objectives ============
CREATE TABLE IF NOT EXISTS public.planning_objectives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  type text NOT NULL CHECK (type IN ('produto','servico','contrato','outro')),
  name text NOT NULL,
  product_id uuid,
  service_id uuid,
  client_id uuid,
  target_value numeric NOT NULL DEFAULT 0,
  target_quantity numeric,
  unit_price_snapshot numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_planning_objectives_user_period ON public.planning_objectives(user_id, year, month);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planning_objectives TO authenticated;
GRANT ALL ON public.planning_objectives TO service_role;
ALTER TABLE public.planning_objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own planning objectives" ON public.planning_objectives
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_planning_objectives_updated_at BEFORE UPDATE ON public.planning_objectives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ planning_history ============
CREATE TABLE IF NOT EXISTS public.planning_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_planning_history_user_created ON public.planning_history(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planning_history TO authenticated;
GRANT ALL ON public.planning_history TO service_role;
ALTER TABLE public.planning_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own planning history" ON public.planning_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
