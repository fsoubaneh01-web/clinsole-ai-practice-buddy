DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','nurse');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE IF NOT EXISTS public.dictation_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  visit_id text,
  duration_seconds numeric NOT NULL DEFAULT 0,
  estimated_cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.dictation_usage TO authenticated;
GRANT ALL ON public.dictation_usage TO service_role;
ALTER TABLE public.dictation_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own dictation usage" ON public.dictation_usage;
CREATE POLICY "Users can view their own dictation usage" ON public.dictation_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all dictation usage" ON public.dictation_usage;
CREATE POLICY "Admins can view all dictation usage" ON public.dictation_usage
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can record their own dictation usage" ON public.dictation_usage;
CREATE POLICY "Users can record their own dictation usage" ON public.dictation_usage
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS dictation_usage_user_created_idx ON public.dictation_usage (user_id, created_at DESC);