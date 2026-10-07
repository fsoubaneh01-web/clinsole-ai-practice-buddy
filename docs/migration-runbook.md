# ClinSole development outside Lovable

This branch prepares an independent build while retaining the existing Supabase
connection and an optional Lovable compatibility build. It does not move patient
records, apply a production migration, enable paid subscriptions, or change DNS.

## Local setup and preview

Use Node 22.12 or later and `npm ci`. The npm lockfile replaces the previous Bun
lockfile so the branch has one reproducible dependency graph. Copy `.env.example`
to `.env.local` and enter configuration through your host's secret manager, never
GitHub or chat. Only `VITE_*` settings are included in browser bundles.

For clinical testing, use a separate Supabase project with fictional patients.
Do not run the full historical migration folder against the existing live
database: it contains old data-repair and deletion operations. For a fresh staging
database, inspect the historical migrations first; the test suite runs them only
against an empty, local PostgreSQL instance with fictional fixtures.

1. Confirm a database backup and the current applied migration list.
2. Apply **only** `20261007120000_portability_usage_guards.sql` to an existing
   staging project with the prior schema. This migration creates a private photo
   bucket, protects account plans, the ten-patient free allowance, and parent references, and adds atomic AI and
   dictation reservations. It performs no patient cleanup.
3. Configure the preview project's Supabase URL, public key, and server-only
   service-role key. Add the preview URL to Supabase's auth redirect allowlist.
4. Run `npm test`, `npm run typecheck`, and `npm run build`.
5. Run `npm run dev` for development or `npm start` for the Node production build.
   Runtime environment variables must be set for `npm start`; Vite does not load
   `.env.local` once the app is built. Node may load it with
   `node --env-file=.env.local .output/server/index.mjs` during local testing.
6. Verify account signup/login, fictional patient CRUD, appointments, edited SOAP
   drafts, clinical photos, income entries, and the tests listed below.

Default output: `.output/server/index.mjs` and `.output/public/`. Set
`NITRO_PRESET` to a supported deployment target if moving to another host. The
existing Lovable build can be requested with `CLINSOLE_BUILD_TARGET=lovable` and
is selected automatically in a Lovable sandbox. Do not enable that setting on an
independent Node host. Foot illustrations are checked into `src/assets/` and no
longer require Lovable's asset service.

## Independent AI configuration

The existing deployment still defaults to `CLINSOLE_AI_PROVIDER=lovable`. For an
independent preview, set `CLINSOLE_AI_PROVIDER=gateway`, `AI_GATEWAY_MODEL`, and
`AI_GATEWAY_API_KEY` on the server. A Vercel runtime OIDC token is also supported.
The example retains `google/gemini-2.5-flash`, checked against the live model
catalog on October 7, 2026; choose another verified text model if desired.

Both SOAP generation and the business assistant reserve a shared credit on the
server before calling the provider. The free allowance is five requests per UTC
calendar month. Premium retains its existing unrestricted monthly count; each
request still has bounded input, output, timeout, and no automatic retries.
Reservations count attempts, including provider failures, because a failed
request may already have incurred cost. An unavailable usage RPC fails closed.
The UI refreshes the counter after requests and never inserts usage itself.

The structured patient-name field is excluded from the SOAP prompt. Free text
can still contain identifying or clinical information. Before real patient use,
verify the selected provider's processing, retention, region, and contractual
terms. All generated notes remain editable drafts for the nurse to review.

## Plans and payments

Premium remains "Coming soon"; there is no implemented payment checkout. Users
cannot change their plan through profile updates or direct Supabase requests.
Profile upserts preserve the database's plan. Only a trusted service-role caller
may change it. A future billing integration must validate provider webhooks and
update entitlements server-side before enabling the upgrade button.

Existing premium rows are preserved. Before charging customers, reconcile those
rows with your pilot access list or payment evidence; this migration cannot prove
that a historical premium grant was paid for.

## Dictation safeguards

Browser recordings are decoded locally and resampled to mono 16 kHz PCM16 WAV.
The server validates the exact WAV structure and calculates duration from sample
bytes, ignoring any caller-supplied duration. Clips stop automatically at 90
seconds. Platforms that cannot decode their recording format retain typed notes
as a fallback. Test this flow on Safari/iPhone before launch.

The server reserves a conservative cost estimate (minimum 15 seconds) against
both the per-user minutes and global spending cap **before** uploading to AWS.
Reservations use one shared database lock and fail closed. Failed attempts remain
counted to avoid underestimating potentially billed provider work. These are
estimated application budgets, not a guarantee of the final AWS bill; configure
AWS account alerts as well. Transcription currently polls for up to 110 seconds,
so choose a host with a sufficient request-duration limit.

Configure AWS credentials/region/bucket only through server environment settings.
Use a private bucket with appropriate encryption, access controls, and lifecycle
retention for dictation audio and transcripts. This branch does not provision AWS
or change its storage region or retention rules.

## Review and release gates

The local database tests execute the actual SQL, with two fictional nurses, to
verify self-upgrade rejection, plan-preserving profile edits, patient and AI allowances,
month rollover, parent ownership, private photo access, and dictation caps.
They are not a substitute for testing managed Supabase settings and concurrent
requests in staging. No patient records are required for any local test.

Before a live cutover:

- Verify the new migration in staging and test simultaneous fifth/sixth AI
  requests and simultaneous dictation reservations at the shared budget boundary.
- Verify there are no broader live RLS policies than those in this repository.
- Test an actual AI generation and microphone transcription using fictional
  clinical notes. Inspect account usage and AWS retention configuration.
- Test mobile auth, signed clinical-photo URLs, plan-preserving onboarding, and
  rejection of anonymous generation requests.
- Confirm deployment health and an identified rollback deployment. New guard
  rules should remain enabled if rolling back hosting; old clients that try to
  insert their own AI usage will need this branch's client changes.
- Cut over only after review. Do not merge this branch or replay migrations onto
  production automatically.
