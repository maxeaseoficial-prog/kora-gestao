-- Create script_folders table
CREATE TABLE public.script_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Nova Pasta',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scripts table
CREATE TABLE public.scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  folder_id UUID REFERENCES public.script_folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Novo Roteiro',
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.script_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

-- RLS policies for script_folders
CREATE POLICY "Users can view their own folders" ON public.script_folders
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders" ON public.script_folders
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON public.script_folders
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON public.script_folders
FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for scripts
CREATE POLICY "Users can view their own scripts" ON public.scripts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scripts" ON public.scripts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scripts" ON public.scripts
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scripts" ON public.scripts
FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_script_folders_updated_at
BEFORE UPDATE ON public.script_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scripts_updated_at
BEFORE UPDATE ON public.scripts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();