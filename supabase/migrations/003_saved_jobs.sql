-- =============================================
-- JOB TRACKER - SAVED JOBS TABLOSU
-- =============================================

CREATE TABLE saved_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  posted_date TIMESTAMPTZ, -- Opsiyonel ilan yayınlanma tarihi
  job_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved jobs"
  ON saved_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved jobs"
  ON saved_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved jobs"
  ON saved_jobs FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own saved jobs"
  ON saved_jobs FOR UPDATE
  USING (auth.uid() = user_id);
