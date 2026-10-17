# ClinSole launch readiness

Original target: Friday, October 16, 2026 (America/Toronto). As of October 17, the public release remains unverified and the blockers below are unresolved.

## Prepared changes

- SOAP editors are isolated by patient, route patient and nurse account. Switching patients clears all visit inputs and generated drafts.
- Late AI responses are ignored after an editor is replaced, including returning to the same patient.
- A synchronous operation guard prevents double saves and concurrent generation/saving.
- Negative/non-finite fees are rejected. Clinical-save failures retain the draft.
- Failed income writes raise errors. When the note was saved but the income write fails, the nurse is told to add the income separately without saving the clinical note again.
- Removed the calendar's fake reminder-send action. Automated reminders need a delivery implementation before they can return.
- Premium is labelled coming soon; removed misleading signup, reminder, support and privacy promises.
- Mobile headers now link to Account & plan. Manual income entry waits for persistence, reports failures, keeps failed inputs and blocks repeated submits.
- Added behavioral regression tests with mocked persistence/AI. These do not validate production RLS, billing, transcription, AI accuracy or infrastructure privacy.
- The AI prompt distinguishes the dated latest stored assessment from current visit observations, prohibits invented findings/interventions, and uses "Not documented" for missing information. Prompt wording alone cannot guarantee model accuracy; synthetic live validation remains required.
- After a synthetic live draft invented "foot health status appears stable", Assessment was removed from model control: the server now replaces it with the nurse's explicitly entered assessment, or "Not documented". This applies to both structured-output and JSON fallback responses. The standalone SOAP screen exposes an optional nurse-assessment input; the guided Visit screen can still be edited during review. Other AI sections continue to require nurse verification.

- Missing patient history is now passed as "Not documented", keeping the separate diabetes field intact. A synthetic preview retest retained Type 1 diabetes without the earlier contradictory "no known conditions" statement.
- Visit history now renders all four saved SOAP sections. Preview screenshots on October 15 showed the saved note on both iPhone and MacBook.
- Unassessed visits display "Risk not assessed" instead of a low-risk badge/category. This only addresses missing assessments; it does not validate the scoring algorithm for partial or complete assessments.
- Business totals distinguish monthly visit entries/average from all-time totals. Screenshots showed one October 15 $75 entry, retained on MacBook, with one monthly visit and a $75 average. August entries were preserved.
- Calendar saves now block repeat clicks and closing while pending, validate duration/fee/patient, retain failed inputs, and stop if the conflict service fails. Repeat bookings whose checks fail are skipped and reported as failures, not conflicts. Opening a new booking uses the selected calendar day. These are client-flow protections, not an atomic database guarantee against simultaneous bookings from separate sessions.

## Release blockers

1. **Lovable access and publishing**: project `3cfd8151-814b-4f44-96ea-a4a97d0f8aa5` is private; the browser requires sign-in. GitHub sync does not prove the published app has updated. Verify the running build identifier after publishing.
2. **Database verification**: repository configuration points to `ogdpzjxupyreqrtmjxfo`, absent from the connected Supabase account's project list. Do not substitute another project's credentials. Verify ownership policies, clinical-photo isolation, migrations, backups and a restore procedure through the correct Lovable Cloud project.
3. **Health information processing**: verify hosting and AI/transcription providers, contractual permissions, data locations, retention, logging and breach handling. AWS dictation code uploads audio and transcript objects; retention/cleanup is not established in this audit. No PHIPA/HIPAA certification or compliance claim has been established.
4. **AI and clinical functions**: patient consent and nurse review must be supported. Validate historical/current assessment handling with live synthetic generations. Risk scores/referral recommendations need a documented regulatory assessment before release; this change does not disable them.
5. **Paid access**: no payment checkout/webhook/cancellation implementation is established. Profile plan updates and AI credit enforcement require server-side enforcement; a disabled upgrade button is not sufficient authorization protection.
6. **Account recovery and patient record lifecycle**: password recovery, record access/export/correction, retention and deletion policies need implementation and verification appropriate to the practice.
7. **Production journey**: test signup/sign-in/onboarding, separate nurse accounts, patient CRUD, left/right foot assessments, photos, dictation, AI draft/review/save, appointments and accounting on desktop and iPhone using synthetic patients. Verify failures and reload persistence.
8. **Business information**: confirm the actual operator, privacy/support contacts, terms, proposed USD pricing and cancellation/refund rules. `support@clinsole.ai` is present in code but mailbox ownership/delivery is unverified.

## Verification commands

Local verification on October 17, 2026 (Toronto): 25 SOAP/income/history/calendar regression tests passed, TypeScript passed using locked dependencies, production build passed, and the changed files passed whitespace checks. User preview screenshots verified patient-switch clearing, explicit Assessment fallback, consistent diabetes history, saved full SOAP text, an unassessed risk label and the $75 income entry retained across devices. Appointment details/reload, separate-nurse isolation, photos, dictation and the public production version remain unverified. Agent access to the correct database and Lovable publishing remains blocked.

Use the committed Bun lockfile. Resolving caret ranges with npm without the lockfile can select incompatible TanStack versions.

```sh
bun install --frozen-lockfile
bun test tests
bunx tsc --noEmit
bun run build
git diff --check
```

Preserve patient records and published git history. Do not force-push the Lovable-connected branch. Do not represent a passing local build as successful deployment, legal approval or complete launch readiness.
