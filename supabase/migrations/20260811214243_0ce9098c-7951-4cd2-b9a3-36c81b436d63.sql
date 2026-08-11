DELETE FROM public.appointments a
USING public.appointments b
WHERE a.nurse_id = b.nurse_id
  AND a.patient_id = b.patient_id
  AND a.scheduled_at = b.scheduled_at
  AND (a.created_at, a.id) > (b.created_at, b.id);

CREATE UNIQUE INDEX appointments_unique_patient_slot
  ON public.appointments (nurse_id, patient_id, scheduled_at);