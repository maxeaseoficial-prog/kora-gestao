CREATE TABLE public.manual_monthly_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
  value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, year, month)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manual_monthly_revenue TO authenticated;
GRANT ALL ON public.manual_monthly_revenue TO service_role;

ALTER TABLE public.manual_monthly_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own manual_monthly_revenue"
  ON public.manual_monthly_revenue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own manual_monthly_revenue"
  ON public.manual_monthly_revenue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own manual_monthly_revenue"
  ON public.manual_monthly_revenue FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own manual_monthly_revenue"
  ON public.manual_monthly_revenue FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_manual_monthly_revenue_updated_at
  BEFORE UPDATE ON public.manual_monthly_revenue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();