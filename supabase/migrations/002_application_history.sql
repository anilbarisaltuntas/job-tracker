-- =============================================
-- JOB TRACKER - TIMELINE / HISTORY TABLOSU
-- =============================================

CREATE TABLE application_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  event_type TEXT NOT NULL, -- Örn: 'CREATED', 'STATUS_CHANGED'
  old_status TEXT,
  new_status TEXT,
  description TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE application_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history"
  ON application_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON application_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- OTOMATİK LOGLAYICI (TRIGGER)
-- =============================================
CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Yeni başvuru eklendiğinde
    INSERT INTO application_history (application_id, user_id, event_type, new_status, description)
    VALUES (NEW.id, NEW.user_id, 'CREATED', NEW.status, 'Başvuru sisteme eklendi.');
  
  ELSIF TG_OP = 'UPDATE' THEN
    -- Durum (status) değiştiğinde
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO application_history (application_id, user_id, event_type, old_status, new_status, description)
      VALUES (NEW.id, NEW.user_id, 'STATUS_CHANGED', OLD.status, NEW.status, 'Başvuru durumu güncellendi.');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER application_status_tracker
  AFTER INSERT OR UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION log_application_status_change();
