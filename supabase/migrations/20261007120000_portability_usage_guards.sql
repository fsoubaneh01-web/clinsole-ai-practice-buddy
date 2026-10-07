-- Additive migration only: no patient cleanup or historical repair is replayed.
BEGIN;

-- A user may edit their profile, but only a trusted service may grant a plan.
CREATE FUNCTION public.guard_nurse_plan()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF (TG_OP = 'INSERT' AND NEW.plan IS DISTINCT FROM 'free')
       OR (TG_OP = 'UPDATE' AND NEW.plan IS DISTINCT FROM OLD.plan) THEN
      RAISE EXCEPTION 'PLAN_SERVER_MANAGED' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER nurse_plan_server_managed
  BEFORE INSERT OR UPDATE ON public.nurse_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_nurse_plan();

CREATE FUNCTION public.guard_patient_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_plan text;
BEGIN
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM NEW.nurse_id THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = '42501';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('clinsole-patients:' || NEW.nurse_id::text, 0));
  SELECT plan INTO current_plan FROM public.nurse_profiles WHERE user_id = NEW.nurse_id;
  IF coalesce(current_plan, 'free') <> 'premium'
     AND (SELECT count(*) FROM public.patients WHERE nurse_id = NEW.nurse_id) >= 10 THEN
    RAISE EXCEPTION 'FREE_PATIENT_LIMIT' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER patient_plan_limit BEFORE INSERT ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.guard_patient_limit();
REVOKE ALL ON FUNCTION public.guard_patient_limit() FROM PUBLIC, anon, authenticated;

-- Browser inserts are not authoritative usage. Retain read access for counters.
DROP POLICY IF EXISTS "Users can record their own AI usage" ON public.ai_usage_events;
REVOKE INSERT, UPDATE, DELETE ON public.ai_usage_events FROM authenticated, anon;

CREATE FUNCTION public.reserve_ai_usage(p_kind text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := auth.uid();
  used integer;
  current_plan text;
  month_start timestamptz := date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = '42501'; END IF;
  IF p_kind IS NULL OR p_kind NOT IN ('soap', 'assistant') THEN
    RAISE EXCEPTION 'INVALID_AI_KIND' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('clinsole-ai:' || caller::text, 0));
  SELECT plan INTO current_plan FROM public.nurse_profiles WHERE user_id = caller;
  SELECT count(*) INTO used FROM public.ai_usage_events
    WHERE user_id = caller AND created_at >= month_start;
  IF coalesce(current_plan, 'free') <> 'premium' AND used >= 5 THEN
    RAISE EXCEPTION 'AI_MONTHLY_LIMIT' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.ai_usage_events (user_id, kind) VALUES (caller, p_kind);
  RETURN used + 1;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_ai_usage(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_ai_usage(text) TO authenticated;

-- Reserve dictation against both caps atomically, before any paid AWS work.
-- Only the server/service-role may supply measured duration and configured caps.
DROP POLICY IF EXISTS "Users can record their own dictation usage" ON public.dictation_usage;
REVOKE INSERT, UPDATE, DELETE ON public.dictation_usage FROM authenticated, anon;
CREATE FUNCTION public.reserve_dictation_usage(
  p_user_id uuid, p_visit_id text, p_seconds numeric, p_cost numeric,
  p_minute_limit numeric, p_spend_cap numeric
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  reservation uuid;
  used_seconds numeric;
  global_spend numeric;
  month_start timestamptz := date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS NULL OR p_seconds IS NULL OR p_cost IS NULL
     OR p_minute_limit IS NULL OR p_spend_cap IS NULL
     OR p_seconds <= 0 OR p_seconds > 90 OR p_cost <= 0
     OR p_minute_limit <= 0 OR p_spend_cap <= 0 THEN
    RAISE EXCEPTION 'INVALID_DICTATION_RESERVATION' USING ERRCODE = '22023';
  END IF;
  -- One lock across all nurses: concurrent users must not overspend a shared cap.
  PERFORM pg_advisory_xact_lock(hashtextextended('clinsole-dictation', 0));
  SELECT coalesce(sum(duration_seconds), 0) INTO used_seconds
    FROM public.dictation_usage WHERE user_id = p_user_id AND created_at >= month_start;
  SELECT coalesce(sum(estimated_cost), 0) INTO global_spend
    FROM public.dictation_usage WHERE created_at >= month_start;
  IF used_seconds + p_seconds > p_minute_limit * 60 THEN
    RAISE EXCEPTION 'DICTATION_MONTHLY_LIMIT' USING ERRCODE = 'P0001';
  END IF;
  IF global_spend + p_cost > p_spend_cap THEN
    RAISE EXCEPTION 'DICTATION_SPEND_LIMIT' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.dictation_usage (user_id, visit_id, duration_seconds, estimated_cost)
    VALUES (p_user_id, p_visit_id, p_seconds, p_cost) RETURNING id INTO reservation;
  RETURN reservation;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_dictation_usage(uuid, text, numeric, numeric, numeric, numeric)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_dictation_usage(uuid, text, numeric, numeric, numeric, numeric)
  TO service_role;

-- Reproduce the private bucket that was previously created outside migrations.
INSERT INTO storage.buckets (id, name, public)
  VALUES ('clinical-photos', 'clinical-photos', false)
  ON CONFLICT (id) DO UPDATE SET public = false;

-- Parent references must belong to the same nurse, not merely a guessed UUID.
CREATE FUNCTION public.guard_clinical_parent()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.patient_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.patients WHERE id = NEW.patient_id AND nurse_id = NEW.nurse_id
  ) THEN
    RAISE EXCEPTION 'INVALID_PATIENT_REFERENCE' USING ERRCODE = '42501';
  END IF;
  IF TG_TABLE_NAME = 'visit_photos' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.treatments
      WHERE id = NEW.treatment_id AND nurse_id = NEW.nurse_id AND patient_id = NEW.patient_id
    ) OR split_part(NEW.storage_path, '/', 1) IS DISTINCT FROM NEW.nurse_id::text
      OR split_part(NEW.storage_path, '/', 2) IS DISTINCT FROM NEW.patient_id::text THEN
      RAISE EXCEPTION 'INVALID_PHOTO_REFERENCE' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER appointments_parent_guard BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.guard_clinical_parent();
CREATE TRIGGER treatments_parent_guard BEFORE INSERT OR UPDATE ON public.treatments
  FOR EACH ROW EXECUTE FUNCTION public.guard_clinical_parent();
CREATE TRIGGER assessments_parent_guard BEFORE INSERT OR UPDATE ON public.foot_assessments
  FOR EACH ROW EXECUTE FUNCTION public.guard_clinical_parent();
CREATE TRIGGER transactions_parent_guard BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.guard_clinical_parent();
CREATE TRIGGER photos_parent_guard BEFORE INSERT OR UPDATE ON public.visit_photos
  FOR EACH ROW EXECUTE FUNCTION public.guard_clinical_parent();
REVOKE ALL ON FUNCTION public.guard_clinical_parent() FROM PUBLIC, anon, authenticated;

COMMIT;
