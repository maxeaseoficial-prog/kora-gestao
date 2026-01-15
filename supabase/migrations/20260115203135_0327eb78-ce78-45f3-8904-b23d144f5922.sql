
-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  service_type TEXT NOT NULL,
  recurrence TEXT NOT NULL DEFAULT 'mensal',
  monthly_value NUMERIC NOT NULL DEFAULT 0,
  contract_day INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ativo',
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create CRM columns table
CREATE TABLE public.crm_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  column_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create CRM cards table
CREATE TABLE public.crm_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  description TEXT,
  email TEXT,
  phone TEXT,
  service_type TEXT,
  column_id TEXT NOT NULL,
  card_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create finance entries table
CREATE TABLE public.finance_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id TEXT,
  client_name TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_type TEXT NOT NULL DEFAULT 'Mensalidade',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  report_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for clients
CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for crm_columns
CREATE POLICY "Users can view their own crm_columns" ON public.crm_columns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own crm_columns" ON public.crm_columns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own crm_columns" ON public.crm_columns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own crm_columns" ON public.crm_columns FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for crm_cards
CREATE POLICY "Users can view their own crm_cards" ON public.crm_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own crm_cards" ON public.crm_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own crm_cards" ON public.crm_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own crm_cards" ON public.crm_cards FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for finance_entries
CREATE POLICY "Users can view their own finance_entries" ON public.finance_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own finance_entries" ON public.finance_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own finance_entries" ON public.finance_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own finance_entries" ON public.finance_entries FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for reports
CREATE POLICY "Users can view their own reports" ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reports" ON public.reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reports" ON public.reports FOR DELETE USING (auth.uid() = user_id);
