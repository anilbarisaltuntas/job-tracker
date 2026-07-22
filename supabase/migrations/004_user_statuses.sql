-- =============================================
-- JOB TRACKER - KULLANICIYA ÖZEL STATÜLER TABLOSU
-- =============================================

CREATE TABLE user_statuses (
  -- Hem standart statü ID'lerini ('applied_message_pending') hem de yeni oluşturulacak UUID'leri desteklemek için TEXT
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  title TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL,
  bg_color TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Bir kullanıcının aynı ID'ye sahip birden fazla statüsü olamaz.
  -- Ancak farklı kullanıcılar aynı varsayılan ID'leri ('rejected' vb.) kullanabilir.
  PRIMARY KEY (id, user_id)
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE user_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own statuses"
  ON user_statuses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statuses"
  ON user_statuses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own statuses"
  ON user_statuses FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own statuses"
  ON user_statuses FOR UPDATE
  USING (auth.uid() = user_id);
