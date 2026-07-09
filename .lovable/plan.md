# ClinSole AI — Clinical Workspace Redesign

Two phases. Ship the full visual + interactive redesign into `/prototype` this turn with local state, so you can review the entire dashboard end-to-end. Once you approve the look and interactions, we port it to `/app/dashboard` and wire persistence to Lovable Cloud.

## Phase 1 — Prototype (this turn)

Rebuild `src/routes/prototype.tsx` as the ClinSole AI dashboard. Mobile-first (390px), scales up to desktop. Local state only — no DB writes yet.

**Layout, top to bottom:**
1. **Clinical summary header** — today's patient card: name/age, risk chip, primary diagnosis, last visit, next follow-up, outstanding tasks count. Utility strip (privacy lock, sync badge) stays.
2. **Smart alerts strip** — horizontally scrollable AI-generated alert chips (overdue follow-up, high diabetic risk, left heel worsening, missing vascular assessment). Tap → detail popover.
3. **Interactive foot diagram** — SVG of both feet (dorsal + plantar toggle). Ten tappable zones per foot: heel, arch, forefoot, toes, hallux, plantar, dorsal, medial, lateral, ankle. Tap → highlight zone + open floating observation panel.
4. **Observation panel (bottom sheet on mobile)** — shows selected location, mic button, textarea, condition-aware suggestion chips (diabetes / nail care / wound care sets). Tap chip → inserts into observation. Save → appends to today's assessment feed with auto-tagged location.
5. **Today's assessment feed** — grouped by SOAP category (Skin, Nails, Vascular, Neurological, Musculoskeletal, Treatment, Plan). Each entry shows location badge + timestamp + text. Swipe to delete.
6. **Progress timeline** — horizontal swipeable visit cards. Date, treatment type, risk level (green/yellow/orange/red bar), provider, AI summary. Tap → expands to tabs: SOAP, Photos, Treatment, Assessment, Billing, Follow-up.
7. **Floating AI assistant FAB** — bottom-right. Opens sheet with actions: Generate SOAP, Summarize visit, Patient education, Follow-up instructions, Referral letter, Ask a question.

**Design tokens (added to `src/styles.css`):**
- Deep purple `#5B4BDB` (new primary accent)
- Blue `#3F8CFF`
- Teal `#2CB1A1`
- Kept: existing white surface, light grey bg, warm amber for alerts
- Rounded 2xl cards, soft shadows, minimal borders, large 44px+ touch targets

**Interactions kept from current prototype:** privacy padlock overlay, offline sync badge, SOAP prefill templates by condition, referral PDF modal.

**Out of scope for phase 1:** real voice transcription (mic button shows animated recording state + mock transcript), backend persistence, cross-visit navigation between patients.

## Phase 2 — Port + persist (next turn, after you approve phase 1)

**Backend migration:**
```text
patients            existing — reuse
visits              new: id, patient_id, nurse_id, visit_date, treatment_type,
                    risk_level, ai_summary, soap jsonb
observations        new: id, visit_id, patient_id, nurse_id, location,
                    category, text, source (voice|text|chip), created_at
clinical_alerts     new: id, patient_id, kind, severity, message, resolved_at
```
All tables: RLS scoped to `nurse_id = auth.uid()`, GRANTs to authenticated + service_role, updated_at triggers.

**Server functions (`src/lib/clinical.functions.ts`):** `listTodayVisits`, `getVisitDetail`, `saveObservation`, `listPatientTimeline`, `listAlerts`, `resolveAlert`. All use `requireSupabaseAuth`.

**Port target:** replace `src/routes/app.dashboard.tsx` body with the phase-1 components, swap local `useState` for TanStack Query + mutations against the new server fns.

**Voice dictation:** wire mic buttons to Lovable AI STT (`openai/gpt-4o-mini-transcribe`) via a `createServerFn` that receives audio and returns transcript. AI SOAP structuring uses a chat completion with structured output.

---

Reply "go" and I build phase 1. When it looks right, say the word and I ship phase 2.
