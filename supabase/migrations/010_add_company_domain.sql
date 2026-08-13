-- Store the verified company website domain used for logo lookups.
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS company_domain TEXT;

ALTER TABLE public.saved_jobs
  ADD COLUMN IF NOT EXISTS company_domain TEXT;

COMMENT ON COLUMN public.applications.company_domain IS
  'Verified company website domain used for brand logo lookup.';

COMMENT ON COLUMN public.saved_jobs.company_domain IS
  'Verified company website domain used for brand logo lookup.';
