
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nurse_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 45,
  visit_type TEXT NOT NULL DEFAULT 'Routine footcare',
  location TEXT,
  notes TEXT,
  expected_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  recurring TEXT,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nurses can view their own appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (auth.uid() = nurse_id);
CREATE POLICY "Nurses can insert their own appointments"
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = nurse_id);
CREATE POLICY "Nurses can update their own appointments"
  ON public.appointments FOR UPDATE TO authenticated
  USING (auth.uid() = nurse_id) WITH CHECK (auth.uid() = nurse_id);
CREATE POLICY "Nurses can delete their own appointments"
  ON public.appointments FOR DELETE TO authenticated
  USING (auth.uid() = nurse_id);

CREATE INDEX appointments_nurse_scheduled_idx
  ON public.appointments (nurse_id, scheduled_at);
CREATE INDEX appointments_patient_idx
  ON public.appointments (patient_id);

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
