
-- Table for custom report folders
CREATE TABLE public.report_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.report_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own report_folders" ON public.report_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own report_folders" ON public.report_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own report_folders" ON public.report_folders FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own report_folders" ON public.report_folders FOR UPDATE USING (auth.uid() = user_id);

-- Table for hidden client folders in reports
CREATE TABLE public.hidden_report_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  folder_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, folder_id)
);

ALTER TABLE public.hidden_report_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own hidden_report_folders" ON public.hidden_report_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own hidden_report_folders" ON public.hidden_report_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own hidden_report_folders" ON public.hidden_report_folders FOR DELETE USING (auth.uid() = user_id);
