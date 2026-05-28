CREATE TABLE public.annual_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  goal_value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.annual_goals TO authenticated;
GRANT ALL ON public.annual_goals TO service_role;

ALTER TABLE public.annual_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own annual_goals"
ON public.annual_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own annual_goals"
ON public.annual_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own annual_goals"
ON public.annual_goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own annual_goals"
ON public.annual_goals FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_annual_goals_updated_at
BEFORE UPDATE ON public.annual_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();