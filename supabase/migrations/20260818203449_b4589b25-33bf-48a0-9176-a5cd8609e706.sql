insert into public.visit_photos (treatment_id, patient_id, nurse_id, storage_path, step_index)
select t.id, 'b4b9eeb9-4e05-4015-ac64-cb5b0598c113'::uuid, '772976a9-70b9-4723-87af-3c278ed92837'::uuid, o.name, 3
from storage.objects o
join public.treatments t on t.id in ('cf9cbf6a-c475-4400-8a41-c665dd0b4d2a','8b6caa2d-c816-43dc-9156-39aadfb1f47c')
where o.bucket_id = 'clinical-photos'
  and o.created_at < t.created_at
  and o.created_at > t.created_at - interval '3 minutes'
  and not exists (select 1 from public.visit_photos vp where vp.storage_path = o.name);