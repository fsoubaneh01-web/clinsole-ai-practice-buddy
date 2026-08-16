ALTER TABLE public.foot_assessments
  ADD COLUMN IF NOT EXISTS trend text;

ALTER TABLE public.foot_assessments
  DROP CONSTRAINT IF EXISTS foot_assessments_trend_check;

ALTER TABLE public.foot_assessments
  ADD CONSTRAINT foot_assessments_trend_check
  CHECK (trend IS NULL OR trend IN ('improving','worsening','unchanged','new'));