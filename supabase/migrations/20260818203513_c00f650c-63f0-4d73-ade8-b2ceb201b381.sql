delete from public.visit_photos vp
using storage.objects o
where vp.storage_path = o.name
  and vp.treatment_id = '8b6caa2d-c816-43dc-9156-39aadfb1f47c'
  and o.created_at < '2026-08-18 20:24:14+00';