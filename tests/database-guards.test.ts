import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const nurseA = "00000000-0000-4000-8000-000000000001";
const nurseB = "00000000-0000-4000-8000-000000000002";
const patientA = "00000000-0000-4000-8000-000000000011";
const patientB = "00000000-0000-4000-8000-000000000012";
const treatmentA = "00000000-0000-4000-8000-000000000021";

async function as(role: string, user = "") {
  await db.exec(`RESET ROLE; SET ROLE ${role};`);
  await db.query(
    "SELECT set_config('request.jwt.claim.role', $1, false), set_config('request.jwt.claim.sub', $2, false)",
    [role, user],
  );
}

before(async () => {
  // Stand-in for Supabase's platform schemas; app migrations run unchanged.
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE SCHEMA storage;
    CREATE TABLE auth.users (id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.role', true), '') $$;
    CREATE TABLE storage.buckets (id text PRIMARY KEY, name text NOT NULL, public boolean DEFAULT false);
    CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text,
      name text NOT NULL, created_at timestamptz DEFAULT now());
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS
      $$ SELECT (string_to_array($1, '/'))[1:array_length(string_to_array($1, '/'), 1)-1] $$;
    GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated, service_role;
    GRANT ALL ON storage.objects, storage.buckets TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
  `);
  const folder = new URL("../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(folder)).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(await readFile(new URL(file, folder), "utf8"));
  }
  await db.query("INSERT INTO auth.users VALUES ($1), ($2)", [nurseA, nurseB]);
  await as("authenticated", nurseA);
  await db.query(
    "INSERT INTO public.nurse_profiles (user_id, name) VALUES ($1, 'Fictional nurse A')",
    [nurseA],
  );
  await db.query(
    "INSERT INTO public.patients (id, nurse_id, name) VALUES ($1, $2, 'Fictional patient A')",
    [patientA, nurseA],
  );
  await db.query("INSERT INTO public.treatments (id, nurse_id, patient_id) VALUES ($1, $2, $3)", [
    treatmentA,
    nurseA,
    patientA,
  ]);
  await as("authenticated", nurseB);
  await db.query(
    "INSERT INTO public.nurse_profiles (user_id, name) VALUES ($1, 'Fictional nurse B')",
    [nurseB],
  );
  await db.query(
    "INSERT INTO public.patients (id, nurse_id, name) VALUES ($1, $2, 'Fictional patient B')",
    [patientB, nurseB],
  );
});
after(async () => {
  await db.close();
});

test("profile edits work but a nurse cannot self-grant a paid plan", async () => {
  await as("authenticated", nurseA);
  await db.query("UPDATE public.nurse_profiles SET name = 'Edited name' WHERE user_id = $1", [
    nurseA,
  ]);
  await assert.rejects(
    db.query("UPDATE public.nurse_profiles SET plan = 'premium' WHERE user_id = $1", [nurseA]),
    /PLAN_SERVER_MANAGED/,
  );
  await db.query(
    "INSERT INTO public.nurse_profiles (user_id, name) VALUES ($1, 'Upserted name') ON CONFLICT (user_id) DO UPDATE SET name = excluded.name",
    [nurseA],
  );
  await as("service_role");
  await db.query("UPDATE public.nurse_profiles SET plan = 'premium' WHERE user_id = $1", [nurseB]);
  await as("authenticated", nurseB);
  await db.query(
    "INSERT INTO public.nurse_profiles (user_id, name) VALUES ($1, 'Paid-profile edit') ON CONFLICT (user_id) DO UPDATE SET name = excluded.name",
    [nurseB],
  );
  const plan = await db.query<{ plan: string }>("SELECT plan FROM public.nurse_profiles");
  assert.equal(plan.rows[0].plan, "premium");
});

test("patient allowance is enforced on database writes, while paid profiles retain access", async () => {
  await as("authenticated", nurseA);
  for (let i = 0; i < 9; i++) {
    await db.query(
      "INSERT INTO public.patients (nurse_id, name) VALUES ($1, 'Fictional allowance fixture')",
      [nurseA],
    );
  }
  await assert.rejects(
    db.query("INSERT INTO public.patients (nurse_id, name) VALUES ($1, 'Over limit')", [nurseA]),
    /FREE_PATIENT_LIMIT/,
  );
  await as("authenticated", nurseB);
  for (let i = 0; i < 10; i++) {
    await db.query(
      "INSERT INTO public.patients (nurse_id, name) VALUES ($1, 'Fictional paid fixture')",
      [nurseB],
    );
  }
});

test("free allowance is shared across SOAP and assistant, and direct inserts are denied", async () => {
  await as("authenticated", nurseA);
  await assert.rejects(
    db.query("INSERT INTO public.ai_usage_events (user_id) VALUES ($1)", [nurseA]),
    /permission denied/,
  );
  for (let i = 1; i <= 5; i++) {
    const r = await db.query<{ used: number }>("SELECT public.reserve_ai_usage($1) AS used", [
      i % 2 ? "soap" : "assistant",
    ]);
    assert.equal(r.rows[0].used, i);
  }
  await assert.rejects(db.query("SELECT public.reserve_ai_usage('soap')"), /AI_MONTHLY_LIMIT/);
  await assert.rejects(db.query("SELECT public.reserve_ai_usage('other')"), /INVALID_AI_KIND/);
  await as("authenticated", nurseB);
  for (let i = 0; i < 6; i++) await db.query("SELECT public.reserve_ai_usage('soap')");
  await as("anon");
  await assert.rejects(db.query("SELECT public.reserve_ai_usage('soap')"), /permission denied/);
});

test("historical usage does not consume the new month's allowance", async () => {
  await as("service_role");
  await db.query(
    "UPDATE public.ai_usage_events SET created_at = date_trunc('month', now()) - interval '1 day' WHERE user_id = $1",
    [nurseA],
  );
  await as("authenticated", nurseA);
  const r = await db.query<{ used: number }>("SELECT public.reserve_ai_usage('soap') AS used");
  assert.equal(r.rows[0].used, 1);
});

test("one nurse cannot read another patient's record or attach guessed parent IDs", async () => {
  await as("authenticated", nurseA);
  const r = await db.query("SELECT id FROM public.patients WHERE id = $1", [patientB]);
  assert.equal(r.rows.length, 0);
  for (const table of ["appointments", "treatments", "foot_assessments", "transactions"]) {
    const extra = table === "appointments" ? ", scheduled_at" : "";
    const value = table === "appointments" ? ", now()" : "";
    await assert.rejects(
      db.query(
        `INSERT INTO public.${table} (nurse_id, patient_id${extra}) VALUES ($1, $2${value})`,
        [nurseA, patientB],
      ),
      /INVALID_PATIENT_REFERENCE/,
    );
  }
  await assert.rejects(
    db.query(
      "INSERT INTO public.visit_photos (nurse_id, patient_id, treatment_id, storage_path) VALUES ($1,$2,$3,'wrong/photo.jpg')",
      [nurseA, patientA, treatmentA],
    ),
    /INVALID_PHOTO_REFERENCE/,
  );
  await db.query(
    "INSERT INTO public.visit_photos (nurse_id, patient_id, treatment_id, storage_path) VALUES ($1,$2,$3,$4)",
    [nurseA, patientA, treatmentA, `${nurseA}/${patientA}/photo.jpg`],
  );
});

test("dictation reservations enforce user and global caps before paid work", async () => {
  await as("authenticated", nurseA);
  await assert.rejects(
    db.query("INSERT INTO public.dictation_usage (user_id) VALUES ($1)", [nurseA]),
    /permission denied/,
  );
  await assert.rejects(
    db.query("SELECT public.reserve_dictation_usage($1, null, 60, 0.075, 1, 1)", [nurseA]),
    /permission denied/,
  );
  await as("service_role");
  await db.query("SELECT public.reserve_dictation_usage($1, null, 60, 0.075, 1, 0.1)", [nurseA]);
  await assert.rejects(
    db.query("SELECT public.reserve_dictation_usage($1, null, 15, 0.0188, 1, 1)", [nurseA]),
    /DICTATION_MONTHLY_LIMIT/,
  );
  await assert.rejects(
    db.query("SELECT public.reserve_dictation_usage($1, null, 60, 0.075, 1, 0.1)", [nurseB]),
    /DICTATION_SPEND_LIMIT/,
  );
  await assert.rejects(
    db.query("SELECT public.reserve_dictation_usage($1, null, 91, 0.1, 120, 15)", [nurseB]),
    /INVALID_DICTATION_RESERVATION/,
  );
  const r = await db.query<{ count: number }>(
    "SELECT count(*)::int AS count FROM public.dictation_usage",
  );
  assert.equal(r.rows[0].count, 1);
});

test("clinical photos are private and isolated by nurse folder", async () => {
  await as("service_role");
  const bucket = await db.query<{ public: boolean }>(
    "SELECT public FROM storage.buckets WHERE id='clinical-photos'",
  );
  assert.equal(bucket.rows[0].public, false);
  await as("authenticated", nurseA);
  await db.query("INSERT INTO storage.objects (bucket_id, name) VALUES ('clinical-photos', $1)", [
    `${nurseA}/${patientA}/test.jpg`,
  ]);
  await assert.rejects(
    db.query("INSERT INTO storage.objects (bucket_id, name) VALUES ('clinical-photos', $1)", [
      `${nurseB}/${patientB}/test.jpg`,
    ]),
    /row-level security/,
  );
  await as("authenticated", nurseB);
  const objects = await db.query("SELECT name FROM storage.objects");
  assert.equal(objects.rows.length, 0);
});
