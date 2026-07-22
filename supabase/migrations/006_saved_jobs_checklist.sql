-- =============================================
-- JOB TRACKER - SAVED JOBS CHECKLIST MIGRATION
-- =============================================

ALTER TABLE saved_jobs 
ADD COLUMN is_cv_updated BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN is_message_drafted BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN is_applied BOOLEAN DEFAULT FALSE NOT NULL;
