-- =============================================
-- JOB TRACKER - GÖREV YÖNETİCİSİ (TODO TASKS)
-- =============================================

CREATE TABLE todo_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- İş başvurusuna bağlamak için (Opsiyonel)
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Durum (pending, in_progress, completed)
  status TEXT DEFAULT 'pending' NOT NULL,
  
  -- Öncelik (low, medium, high)
  priority TEXT DEFAULT 'medium' NOT NULL,
  
  -- Kategori (interview, cv, networking, general vs.)
  category TEXT DEFAULT 'general' NOT NULL,
  
  due_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE todo_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON todo_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON todo_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON todo_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON todo_tasks FOR DELETE
  USING (auth.uid() = user_id);
