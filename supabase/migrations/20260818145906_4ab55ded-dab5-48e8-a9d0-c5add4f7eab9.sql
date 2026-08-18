create table public.visit_photos (
  id uuid primary key default gen_random_uuid(),
  treatment_id uuid not null references public.treatments(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  nurse_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  caption text,
  step_index int,
  created_at timestamptz not null default now()
);

create index visit_photos_treatment_id_idx on public.visit_photos (treatment_id);
create index visit_photos_patient_id_idx on public.visit_photos (patient_id);

grant select, insert, update, delete on public.visit_photos to authenticated;
grant all on public.visit_photos to service_role;

alter table public.visit_photos enable row level security;

create policy "Nurses can view their own visit photos"
  on public.visit_photos for select to authenticated
  using (auth.uid() = nurse_id);

create policy "Nurses can insert their own visit photos"
  on public.visit_photos for insert to authenticated
  with check (auth.uid() = nurse_id);

create policy "Nurses can update their own visit photos"
  on public.visit_photos for update to authenticated
  using (auth.uid() = nurse_id) with check (auth.uid() = nurse_id);

create policy "Nurses can delete their own visit photos"
  on public.visit_photos for delete to authenticated
  using (auth.uid() = nurse_id);