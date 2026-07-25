-- =============================================
-- JOB TRACKER - JOB METRICS MIGRATION
-- =============================================

ALTER TABLE saved_jobs 
ADD COLUMN match_level TEXT DEFAULT 'medium' NOT NULL,
ADD COLUMN priority_level TEXT DEFAULT 'medium' NOT NULL;

ALTER TABLE applications
ADD COLUMN match_level TEXT DEFAULT 'medium' NOT NULL,
ADD COLUMN priority_level TEXT DEFAULT 'medium' NOT NULL;
