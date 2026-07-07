
CREATE TYPE public.diabetes_status AS ENUM ('none','prediabetes','type1','type2');

CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nurse_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dob DATE,
  phone TEXT,
  email TEXT,
  address TEXT,
  conditions TEXT[] NOT NULL DEFAULT '{}',
  diabetes_status public.diabetes_status NOT NULL DEFAULT 'none',
  allergies TEXT,
  notes TEXT,
  next_follow_up TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX patients_nurse_id_idx ON public.patients(nurse_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nurses can view their own patients"
  ON public.patients FOR SELECT
  TO authenticated
  USING (auth.uid() = nurse_id);

CREATE POLICY "Nurses can insert their own patients"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = nurse_id);

CREATE POLICY "Nurses can update their own patients"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (auth.uid() = nurse_id)
  WITH CHECK (auth.uid() = nurse_id);

CREATE POLICY "Nurses can delete their own patients"
  ON public.patients FOR DELETE
  TO authenticated
  USING (auth.uid() = nurse_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
