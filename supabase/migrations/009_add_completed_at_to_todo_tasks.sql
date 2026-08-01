-- =============================================
-- GÖREV YÖNETİCİSİ - TAMAMLANMA ZAMANI
-- =============================================

ALTER TABLE todo_tasks 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
