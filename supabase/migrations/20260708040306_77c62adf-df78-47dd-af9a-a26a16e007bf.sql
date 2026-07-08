CREATE TABLE public.foot_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nurse_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  assessed_at timestamptz NOT NULL DEFAULT now(),
  -- General side involvement
  left_foot boolean NOT NULL DEFAULT false,
  right_foot boolean NOT NULL DEFAULT false,
  -- Skin
  skin_dry boolean NOT NULL DEFAULT false,
  skin_callus boolean NOT NULL DEFAULT false,
  skin_corns boolean NOT NULL DEFAULT false,
  skin_fissures boolean NOT NULL DEFAULT false,
  skin_ulcer boolean NOT NULL DEFAULT false,
  skin_infection boolean NOT NULL DEFAULT false,
  -- Nails
  nails_thickened boolean NOT NULL DEFAULT false,
  nails_fungal boolean NOT NULL DEFAULT false,
  nails_ingrown boolean NOT NULL DEFAULT false,
  nails_trimmed boolean NOT NULL DEFAULT false,
  nails_debrided boolean NOT NULL DEFAULT false,
  -- Circulation
  pulses_present text,             -- 'both' | 'left' | 'right' | 'none' | 'diminished'
  capillary_refill text,           -- '<3s' | '>3s' | 'not_assessed'
  edema text,                      -- 'none' | 'mild' | 'moderate' | 'severe'
  skin_temperature text,           -- 'warm' | 'cool' | 'cold' | 'hot'
  -- Neurological
  protective_sensation text,       -- 'intact' | 'reduced' | 'absent'
  monofilament_findings text,
  neuropathy_risk text,            -- 'none' | 'mild' | 'moderate' | 'severe'
  -- Risk
  risk_level text NOT NULL DEFAULT 'low', -- 'low' | 'moderate' | 'high'
  notes text,
  photo_urls text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.foot_assessments TO authenticated;
GRANT ALL ON public.foot_assessments TO service_role;

ALTER TABLE public.foot_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nurses can view their own assessments" ON public.foot_assessments
  FOR SELECT TO authenticated USING (auth.uid() = nurse_id);
CREATE POLICY "Nurses can insert their own assessments" ON public.foot_assessments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = nurse_id);
CREATE POLICY "Nurses can update their own assessments" ON public.foot_assessments
  FOR UPDATE TO authenticated USING (auth.uid() = nurse_id) WITH CHECK (auth.uid() = nurse_id);
CREATE POLICY "Nurses can delete their own assessments" ON public.foot_assessments
  FOR DELETE TO authenticated USING (auth.uid() = nurse_id);

CREATE INDEX idx_foot_assessments_patient ON public.foot_assessments(patient_id, assessed_at DESC);
CREATE INDEX idx_foot_assessments_nurse ON public.foot_assessments(nurse_id, assessed_at DESC);

CREATE TRIGGER update_foot_assessments_updated_at
  BEFORE UPDATE ON public.foot_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies for private clinical photos bucket (bucket created separately via tool)
CREATE POLICY "Nurses can view their own clinical photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'clinical-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Nurses can upload their own clinical photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'clinical-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Nurses can delete their own clinical photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'clinical-photos' AND auth.uid()::text = (storage.foldername(name))[1]);