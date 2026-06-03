CREATE TABLE public.job_resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  kind text NOT NULL DEFAULT 'pdf',
  file_path text,
  content text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_resumes TO authenticated;
GRANT ALL ON public.job_resumes TO service_role;

ALTER TABLE public.job_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_select ON public.job_resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY own_insert ON public.job_resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_update ON public.job_resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY own_delete ON public.job_resumes FOR DELETE USING (auth.uid() = user_id);

-- Storage policies for the `resumes` private bucket (bucket will be created via tool).
CREATE POLICY "Users read own resumes" ON storage.objects FOR SELECT
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own resumes" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own resumes" ON storage.objects FOR UPDATE
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own resumes" ON storage.objects FOR DELETE
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);