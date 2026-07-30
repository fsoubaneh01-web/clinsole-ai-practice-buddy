ALTER TABLE public.foot_assessments
  ADD COLUMN IF NOT EXISTS side text,
  ADD COLUMN IF NOT EXISTS foot_view text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS region_label text,
  ADD COLUMN IF NOT EXISTS region_group text,
  ADD COLUMN IF NOT EXISTS pain_level text,
  ADD COLUMN IF NOT EXISTS callus_level text,
  ADD COLUMN IF NOT EXISTS skin_conditions text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS wound_length_mm numeric,
  ADD COLUMN IF NOT EXISTS wound_width_mm numeric,
  ADD COLUMN IF NOT EXISTS wound_depth_mm numeric,
  ADD COLUMN IF NOT EXISTS follow_up_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS foot_assessments_patient_region_idx
  ON public.foot_assessments (patient_id, region);