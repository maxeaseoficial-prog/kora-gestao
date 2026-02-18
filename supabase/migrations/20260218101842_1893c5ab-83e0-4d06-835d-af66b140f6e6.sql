
-- Create storage bucket for reports
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own reports"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to view their own reports
CREATE POLICY "Users can view their own reports"
ON storage.objects
FOR SELECT
USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own reports
CREATE POLICY "Users can delete their own reports"
ON storage.objects
FOR DELETE
USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add file_url column to reports table
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS file_name text;
