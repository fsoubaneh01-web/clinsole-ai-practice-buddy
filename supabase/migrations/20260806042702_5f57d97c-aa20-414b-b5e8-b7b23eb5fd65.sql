-- nurse_profiles
CREATE TABLE public.nurse_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  credentials text NOT NULL DEFAULT '',
  service_area text NOT NULL DEFAULT '',
  years_experience integer NOT NULL DEFAULT 0,
  bio text NOT NULL DEFAULT '',
  plan text NOT NULL DEFAULT 'free',
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nurse_profiles TO authenticated;
GRANT ALL ON public.nurse_profiles TO service_role;
ALTER TABLE public.nurse_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nurses can view their own profile" ON public.nurse_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Nurses can insert their own profile" ON public.nurse_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nurses can update their own profile" ON public.nurse_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nurses can delete their own profile" ON public.nurse_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_nurse_profiles_updated_at BEFORE UPDATE ON public.nurse_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- treatments (SOAP notes)
CREATE TABLE public.treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nurse_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_date timestamptz NOT NULL DEFAULT now(),
  soap_subjective text NOT NULL DEFAULT '',
  soap_objective text NOT NULL DEFAULT '',
  soap_assessment text NOT NULL DEFAULT '',
  soap_plan text NOT NULL DEFAULT '',
  fee numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX treatments_nurse_patient_idx ON public.treatments (nurse_id, patient_id, visit_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatments TO authenticated;
GRANT ALL ON public.treatments TO service_role;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nurses can view their own treatments" ON public.treatments FOR SELECT TO authenticated USING (auth.uid() = nurse_id);
CREATE POLICY "Nurses can insert their own treatments" ON public.treatments FOR INSERT TO authenticated WITH CHECK (auth.uid() = nurse_id);
CREATE POLICY "Nurses can update their own treatments" ON public.treatments FOR UPDATE TO authenticated USING (auth.uid() = nurse_id) WITH CHECK (auth.uid() = nurse_id);
CREATE POLICY "Nurses can delete their own treatments" ON public.treatments FOR DELETE TO authenticated USING (auth.uid() = nurse_id);
CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON public.treatments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- transactions
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nurse_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'income',
  amount numeric NOT NULL DEFAULT 0,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  category text NOT NULL DEFAULT '',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transactions_nurse_date_idx ON public.transactions (nurse_id, occurred_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nurses can view their own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = nurse_id);
CREATE POLICY "Nurses can insert their own transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = nurse_id);
CREATE POLICY "Nurses can update their own transactions" ON public.transactions FOR UPDATE TO authenticated USING (auth.uid() = nurse_id) WITH CHECK (auth.uid() = nurse_id);
CREATE POLICY "Nurses can delete their own transactions" ON public.transactions FOR DELETE TO authenticated USING (auth.uid() = nurse_id);
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ai usage events (append-only)
CREATE TABLE public.ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'soap',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_usage_events_user_created_idx ON public.ai_usage_events (user_id, created_at DESC);
GRANT SELECT, INSERT ON public.ai_usage_events TO authenticated;
GRANT ALL ON public.ai_usage_events TO service_role;
ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own AI usage" ON public.ai_usage_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can record their own AI usage" ON public.ai_usage_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);