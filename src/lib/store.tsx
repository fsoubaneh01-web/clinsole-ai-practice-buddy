import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export type DiabetesStatus = "none" | "type1" | "type2" | "prediabetes";

export type Patient = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  dob: string;
  conditions: string[];
  diabetesStatus: DiabetesStatus;
  allergies: string;
  notes: string;
  createdAt: string;
  assessments: Assessment[];
  treatments: Treatment[];
  nextFollowUp?: string;
};

export type RiskLevel = "low" | "moderate" | "high";

export type FootSide = "L" | "R";
export type FootView = "plantar" | "dorsal";
export type PainLevel = "none" | "mild" | "moderate" | "severe";
export type CallusLevel = "none" | "mild" | "moderate" | "severe";
export type SkinCondition = "dry" | "moist" | "macerated";
export type WoundMeasurements = { length?: number; width?: number; depth?: number };

export type FootAssessment = {
  id: string;
  patientId: string;
  date: string;
  leftFoot: boolean;
  rightFoot: boolean;
  skinDry: boolean; skinCallus: boolean; skinCorns: boolean;
  skinFissures: boolean; skinUlcer: boolean; skinInfection: boolean;
  nailsThickened: boolean; nailsFungal: boolean; nailsIngrown: boolean;
  nailsTrimmed: boolean; nailsDebrided: boolean;
  pulsesPresent: string;
  capillaryRefill: string;
  edema: string;
  skinTemperature: string;
  protectiveSensation: string;
  monofilamentFindings: string;
  neuropathyRisk: string;
  riskLevel: RiskLevel;
  notes: string;
  photoPaths: string[];
  /* Per-region clinical observation fields (null for whole-foot assessments) */
  side?: FootSide;
  view?: FootView;
  region?: string;
  regionLabel?: string;
  regionGroup?: string;
  pain?: PainLevel;
  callus?: CallusLevel;
  skin?: SkinCondition[];
  measurements?: WoundMeasurements;
  followUp?: string;
};

export type FootAssessmentInput = Omit<
  FootAssessment,
  | "id" | "date" | "photoPaths" | "side" | "view" | "region" | "regionLabel"
  | "regionGroup" | "pain" | "callus" | "skin" | "measurements" | "followUp"
>;

export type FootObservationInput = {
  patientId: string;
  side: FootSide;
  view: FootView;
  region: string;
  regionLabel: string;
  group: string;
  text: string;
  pain?: PainLevel;
  callus?: CallusLevel;
  skin?: SkinCondition[];
  measurements?: WoundMeasurements;
  followUp?: string;
};


export type Assessment = {
  id: string;
  date: string;
  summary: string;
  risk: "low" | "medium" | "high";
};


export type Treatment = {
  id: string;
  date: string;
  soap: { s: string; o: string; a: string; p: string };
  fee: number;
};

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  duration: number;
  type: string;
  location?: string;
  notes?: string;
  expectedFee: number;
  recurring?: "weekly" | "biweekly" | "monthly" | null;
};


export type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  category: string;
  note?: string;
  patientId?: string;
};

export type Plan = "free" | "premium";

export type Nurse = {
  name: string;
  email: string;
  credentials: string;
  serviceArea: string;
  yearsExperience: number;
  bio: string;
  plan: Plan;
  aiUsedThisMonth: number;
};

export const PLAN_LIMITS = {
  free: { patients: 10, aiPerMonth: 5 },
  premium: { patients: Infinity, aiPerMonth: Infinity },
} as const;


type Ctx = {
  session: Session | null;
  loading: boolean;
  nurse: Nurse | null;
  onboarded: boolean;
  patients: Patient[];
  appointments: Appointment[];
  transactions: Transaction[];
  footAssessments: FootAssessment[];

  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;

  setNurse: (n: Nurse) => Promise<void>;
  addPatient: (p: Omit<Patient, "id" | "createdAt" | "assessments" | "treatments">) => Promise<{ patient?: Patient; error?: string }>;
  updatePatient: (id: string, p: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  addTreatment: (patientId: string, t: Omit<Treatment, "id">) => Promise<{ treatment?: Treatment; error?: string }>;
  addAppointment: (a: Omit<Appointment, "id" | "patientName">) => Promise<{ appointment?: Appointment; error?: string }>;
  updateAppointment: (id: string, a: Partial<Omit<Appointment, "id" | "patientName">>) => Promise<{ error?: string }>;
  deleteAppointment: (id: string) => Promise<void>;
  addFootAssessment: (a: FootAssessmentInput, photos: File[]) => Promise<{ assessment?: FootAssessment; error?: string }>;
  addFootObservation: (o: FootObservationInput, photos: File[]) => Promise<{ assessment?: FootAssessment; error?: string }>;
  uploadClinicalPhotos: (patientId: string, files: File[]) => Promise<{ paths?: string[]; error?: string }>;
  deleteFootAssessment: (id: string) => Promise<void>;
  getPhotoUrl: (path: string) => Promise<string | null>;
  latestAssessmentFor: (patientId: string) => FootAssessment | undefined;
  addTransaction: (t: Omit<Transaction, "id">) => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  useAiCredit: () => Promise<boolean>;
  ageOf: (dob: string) => number;
};


const StoreCtx = createContext<Ctx | null>(null);

const localKey = (userId: string) => `clinsole-local-${userId}`;

const emptyExtras: LocalExtras = {
  nurse: null,
  onboarded: false,
  transactions: [],
  patientExtras: {},
};


const loadLocal = (userId: string): LocalExtras => {
  if (typeof window === "undefined") return emptyExtras;
  try {
    const raw = localStorage.getItem(localKey(userId));
    if (raw) return { ...emptyExtras, ...JSON.parse(raw) };
  } catch {}
  return emptyExtras;
};

const saveLocal = (userId: string, data: LocalExtras) => {
  try { localStorage.setItem(localKey(userId), JSON.stringify(data)); } catch {}
};

type PatientRow = {
  id: string;
  name: string;
  dob: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  conditions: string[] | null;
  diabetes_status: DiabetesStatus;
  allergies: string | null;
  notes: string | null;
  next_follow_up: string | null;
  created_at: string;
};

const rowToPatient = (row: PatientRow, extras?: { assessments: Assessment[]; treatments: Treatment[] }): Patient => ({
  id: row.id,
  name: row.name,
  dob: row.dob ?? "",
  phone: row.phone ?? "",
  email: row.email ?? undefined,
  address: row.address ?? "",
  conditions: row.conditions ?? [],
  diabetesStatus: row.diabetes_status,
  allergies: row.allergies ?? "",
  notes: row.notes ?? "",
  nextFollowUp: row.next_follow_up ?? undefined,
  createdAt: row.created_at,
  assessments: extras?.assessments ?? [],
  treatments: extras?.treatments ?? [],
});

type AppointmentRow = {
  id: string;
  patient_id: string;
  scheduled_at: string;
  duration_min: number;
  visit_type: string;
  location: string | null;
  notes: string | null;
  expected_fee: number | string;
  recurring: string | null;
};

const rowToAppointment = (r: AppointmentRow, patientName: string): Appointment => ({
  id: r.id,
  patientId: r.patient_id,
  patientName,
  date: r.scheduled_at,
  duration: r.duration_min,
  type: r.visit_type,
  location: r.location ?? undefined,
  notes: r.notes ?? undefined,
  expectedFee: typeof r.expected_fee === "string" ? parseFloat(r.expected_fee) : r.expected_fee,
  recurring: (r.recurring as Appointment["recurring"]) ?? null,
});

type FootAssessmentRow = {
  id: string;
  patient_id: string;
  assessed_at: string;
  left_foot: boolean; right_foot: boolean;
  skin_dry: boolean; skin_callus: boolean; skin_corns: boolean;
  skin_fissures: boolean; skin_ulcer: boolean; skin_infection: boolean;
  nails_thickened: boolean; nails_fungal: boolean; nails_ingrown: boolean;
  nails_trimmed: boolean; nails_debrided: boolean;
  pulses_present: string | null;
  capillary_refill: string | null;
  edema: string | null;
  skin_temperature: string | null;
  protective_sensation: string | null;
  monofilament_findings: string | null;
  neuropathy_risk: string | null;
  risk_level: string;
  notes: string | null;
  photo_urls: string[] | null;
  side: string | null;
  foot_view: string | null;
  region: string | null;
  region_label: string | null;
  region_group: string | null;
  pain_level: string | null;
  callus_level: string | null;
  skin_conditions: string[] | null;
  wound_length_mm: number | string | null;
  wound_width_mm: number | string | null;
  wound_depth_mm: number | string | null;
  follow_up_at: string | null;
};

const num = (v: number | string | null) =>
  v === null || v === "" ? undefined : typeof v === "string" ? parseFloat(v) : v;

const rowToFootAssessment = (r: FootAssessmentRow): FootAssessment => {
  const length = num(r.wound_length_mm);
  const width = num(r.wound_width_mm);
  const depth = num(r.wound_depth_mm);
  const hasWound = length !== undefined || width !== undefined || depth !== undefined;
  return {
    id: r.id,
    patientId: r.patient_id,
    date: r.assessed_at,
    leftFoot: r.left_foot, rightFoot: r.right_foot,
    skinDry: r.skin_dry, skinCallus: r.skin_callus, skinCorns: r.skin_corns,
    skinFissures: r.skin_fissures, skinUlcer: r.skin_ulcer, skinInfection: r.skin_infection,
    nailsThickened: r.nails_thickened, nailsFungal: r.nails_fungal, nailsIngrown: r.nails_ingrown,
    nailsTrimmed: r.nails_trimmed, nailsDebrided: r.nails_debrided,
    pulsesPresent: r.pulses_present ?? "",
    capillaryRefill: r.capillary_refill ?? "",
    edema: r.edema ?? "",
    skinTemperature: r.skin_temperature ?? "",
    protectiveSensation: r.protective_sensation ?? "",
    monofilamentFindings: r.monofilament_findings ?? "",
    neuropathyRisk: r.neuropathy_risk ?? "",
    riskLevel: (r.risk_level as RiskLevel) || "low",
    notes: r.notes ?? "",
    photoPaths: r.photo_urls ?? [],
    side: (r.side as FootSide) ?? undefined,
    view: (r.foot_view as FootView) ?? undefined,
    region: r.region ?? undefined,
    regionLabel: r.region_label ?? undefined,
    regionGroup: r.region_group ?? undefined,
    pain: (r.pain_level as PainLevel) ?? undefined,
    callus: (r.callus_level as CallusLevel) ?? undefined,
    skin: (r.skin_conditions as SkinCondition[] | null)?.length ? (r.skin_conditions as SkinCondition[]) : undefined,
    measurements: hasWound ? { length, width, depth } : undefined,
    followUp: r.follow_up_at ?? undefined,
  };
};

export function summarizeAssessment(a: FootAssessment): string {
  const parts: string[] = [];
  const feet = [a.leftFoot && "left", a.rightFoot && "right"].filter(Boolean).join(" and ");
  if (feet) parts.push(`Assessed ${feet} foot`);
  const skin = [
    a.skinDry && "dry skin", a.skinCallus && "callus", a.skinCorns && "corns",
    a.skinFissures && "fissures", a.skinUlcer && "ulcer", a.skinInfection && "infection",
  ].filter(Boolean);
  if (skin.length) parts.push(`Skin: ${skin.join(", ")}`);
  const nails = [
    a.nailsThickened && "thickened", a.nailsFungal && "fungal appearance", a.nailsIngrown && "ingrown",
    a.nailsTrimmed && "trimmed", a.nailsDebrided && "debrided",
  ].filter(Boolean);
  if (nails.length) parts.push(`Nails: ${nails.join(", ")}`);
  const circ: string[] = [];
  if (a.pulsesPresent) circ.push(`pedal pulses ${a.pulsesPresent}`);
  if (a.capillaryRefill) circ.push(`cap refill ${a.capillaryRefill}`);
  if (a.edema && a.edema !== "none") circ.push(`${a.edema} edema`);
  if (a.skinTemperature) circ.push(`${a.skinTemperature} skin temp`);
  if (circ.length) parts.push(`Circulation: ${circ.join(", ")}`);
  const neuro: string[] = [];
  if (a.protectiveSensation) neuro.push(`protective sensation ${a.protectiveSensation}`);
  if (a.monofilamentFindings) neuro.push(`monofilament ${a.monofilamentFindings}`);
  if (a.neuropathyRisk && a.neuropathyRisk !== "none") neuro.push(`${a.neuropathyRisk} neuropathy risk`);
  if (neuro.length) parts.push(`Neuro: ${neuro.join(", ")}`);
  parts.push(`Overall risk: ${a.riskLevel}`);
  if (a.notes) parts.push(`Notes: ${a.notes}`);
  return parts.join(". ") + ".";
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [extras, setExtras] = useState<LocalExtras>(emptyExtras);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [footAssessments, setFootAssessments] = useState<FootAssessment[]>([]);

  // Auth session
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load local extras + patients + appointments + assessments on session change
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setExtras(emptyExtras);
      setPatients([]);
      setAppointments([]);
      setFootAssessments([]);
      return;
    }
    const local = loadLocal(userId);
    if (local.nurse && !local.nurse.email) local.nurse.email = session.user.email || "";
    setExtras(local);

    (async () => {
      const [pRes, aRes, fRes] = await Promise.all([
        supabase.from("patients").select("*").order("created_at", { ascending: false }),
        supabase.from("appointments").select("*").order("scheduled_at", { ascending: true }),
        supabase.from("foot_assessments").select("*").order("assessed_at", { ascending: false }),
      ]);
      if (pRes.error) { console.error("load patients", pRes.error); return; }
      const patientRows = pRes.data as PatientRow[];
      const pList = patientRows.map((r) => rowToPatient(r, local.patientExtras[r.id]));
      setPatients(pList);
      const nameById = new Map(pList.map((p) => [p.id, p.name]));
      if (aRes.error) { console.error("load appointments", aRes.error); return; }
      setAppointments((aRes.data as AppointmentRow[]).map((r) => rowToAppointment(r, nameById.get(r.patient_id) ?? "Patient")));
      if (fRes.error) { console.error("load foot_assessments", fRes.error); return; }
      setFootAssessments((fRes.data as FootAssessmentRow[]).map(rowToFootAssessment));
    })();
  }, [session]);

  useEffect(() => {
    if (session?.user?.id) saveLocal(session.user.id, extras);
  }, [extras, session]);

  const id = () => Math.random().toString(36).slice(2, 10);

  const ageOf = (dob: string) => {
    if (!dob) return 0;
    const d = new Date(dob);
    const diff = Date.now() - d.getTime();
    return Math.floor(diff / (365.25 * 864e5));
  };

  const ctx: Ctx = {
    session,
    loading,
    nurse: extras.nurse,
    onboarded: extras.onboarded,
    patients,
    appointments,
    transactions: extras.transactions,
    footAssessments,
    ageOf,
    latestAssessmentFor: (pid) => footAssessments.find((a) => a.patientId === pid),
    getPhotoUrl: async (path) => {
      const { data, error } = await supabase.storage.from("clinical-photos").createSignedUrl(path, 3600);
      if (error) { console.error("signed url", error); return null; }
      return data.signedUrl;
    },


    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { error: error.message } : {};
    },
    signUp: async (email, password) => {
      const redirect = typeof window !== "undefined" ? `${window.location.origin}/app/dashboard` : undefined;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirect },
      });
      return error ? { error: error.message } : {};
    },
    signOut: async () => {
      await supabase.auth.signOut();
      setPatients([]);
      setAppointments([]);
      setExtras(emptyExtras);
    },

    setNurse: (n) => setExtras((s) => ({ ...s, nurse: n, onboarded: true })),

    addPatient: async (p) => {
      const userId = session?.user?.id;
      if (!userId) return { error: "You must be signed in to add a patient." };
      const plan = extras.nurse?.plan || "free";
      if (patients.length >= PLAN_LIMITS[plan].patients) {
        return { error: "You've reached the Free plan patient limit. Upgrade to add more." };
      }
      const { data, error } = await supabase
        .from("patients")
        .insert({
          nurse_id: userId,
          name: p.name,
          dob: p.dob || null,
          phone: p.phone || null,
          email: p.email || null,
          address: p.address || null,
          conditions: p.conditions,
          diabetes_status: p.diabetesStatus,
          allergies: p.allergies || null,
          notes: p.notes || null,
          next_follow_up: p.nextFollowUp || null,
        })
        .select()
        .single();
      if (error || !data) {
        console.error("addPatient", error);
        return { error: error?.message || "Failed to save patient." };
      }
      const newP = rowToPatient(data as PatientRow);
      setPatients((s) => [newP, ...s]);
      return { patient: newP };
    },
    updatePatient: async (pid, p) => {
      const patch: {
        name?: string; dob?: string | null; phone?: string | null; email?: string | null;
        address?: string | null; conditions?: string[]; diabetes_status?: DiabetesStatus;
        allergies?: string | null; notes?: string | null; next_follow_up?: string | null;
      } = {};
      if (p.name !== undefined) patch.name = p.name;
      if (p.dob !== undefined) patch.dob = p.dob || null;
      if (p.phone !== undefined) patch.phone = p.phone || null;
      if (p.email !== undefined) patch.email = p.email || null;
      if (p.address !== undefined) patch.address = p.address || null;
      if (p.conditions !== undefined) patch.conditions = p.conditions;
      if (p.diabetesStatus !== undefined) patch.diabetes_status = p.diabetesStatus;
      if (p.allergies !== undefined) patch.allergies = p.allergies || null;
      if (p.notes !== undefined) patch.notes = p.notes || null;
      if (p.nextFollowUp !== undefined) patch.next_follow_up = p.nextFollowUp || null;

      if (Object.keys(patch).length > 0) {
        const { error } = await supabase.from("patients").update(patch).eq("id", pid);
        if (error) { console.error("updatePatient", error); return; }
      }
      setPatients((s) => s.map((x) => (x.id === pid ? { ...x, ...p } : x)));
    },
    deletePatient: async (pid) => {
      const { error } = await supabase.from("patients").delete().eq("id", pid);
      if (error) { console.error("deletePatient", error); return; }
      setPatients((s) => s.filter((x) => x.id !== pid));
      setAppointments((s) => s.filter((a) => a.patientId !== pid));
      setExtras((s) => {
        const { [pid]: _, ...rest } = s.patientExtras;
        return { ...s, patientExtras: rest };
      });
    },
    addTreatment: (pid, t) => {
      const treatment: Treatment = { ...t, id: id() };
      setExtras((s) => ({
        ...s,
        patientExtras: {
          ...s.patientExtras,
          [pid]: {
            assessments: s.patientExtras[pid]?.assessments ?? [],
            treatments: [treatment, ...(s.patientExtras[pid]?.treatments ?? [])],
          },
        },
      }));
      setPatients((s) => s.map((x) => (x.id === pid ? { ...x, treatments: [treatment, ...x.treatments] } : x)));
    },
    addAppointment: async (a) => {
      const userId = session?.user?.id;
      if (!userId) return { error: "You must be signed in." };
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          nurse_id: userId,
          patient_id: a.patientId,
          scheduled_at: a.date,
          duration_min: a.duration,
          visit_type: a.type,
          location: a.location || null,
          notes: a.notes || null,
          expected_fee: a.expectedFee,
          recurring: a.recurring || null,
        })
        .select()
        .single();
      if (error || !data) {
        console.error("addAppointment", error);
        return { error: error?.message || "Failed to book appointment." };
      }
      const name = patients.find((p) => p.id === a.patientId)?.name ?? "Patient";
      const appt = rowToAppointment(data as AppointmentRow, name);
      setAppointments((s) => [...s, appt].sort((x, y) => x.date.localeCompare(y.date)));
      return { appointment: appt };
    },
    updateAppointment: async (aid, a) => {
      const patch: {
        patient_id?: string; scheduled_at?: string; duration_min?: number;
        visit_type?: string; location?: string | null; notes?: string | null;
        expected_fee?: number; recurring?: string | null;
      } = {};
      if (a.patientId !== undefined) patch.patient_id = a.patientId;
      if (a.date !== undefined) patch.scheduled_at = a.date;
      if (a.duration !== undefined) patch.duration_min = a.duration;
      if (a.type !== undefined) patch.visit_type = a.type;
      if (a.location !== undefined) patch.location = a.location || null;
      if (a.notes !== undefined) patch.notes = a.notes || null;
      if (a.expectedFee !== undefined) patch.expected_fee = a.expectedFee;
      if (a.recurring !== undefined) patch.recurring = a.recurring || null;
      const { error } = await supabase.from("appointments").update(patch).eq("id", aid);

      if (error) { console.error("updateAppointment", error); return { error: error.message }; }
      const name = a.patientId ? patients.find((p) => p.id === a.patientId)?.name : undefined;
      setAppointments((s) =>
        s.map((x) => (x.id === aid ? { ...x, ...a, patientName: name ?? x.patientName } : x))
          .sort((x, y) => x.date.localeCompare(y.date))
      );
      return {};
    },
    deleteAppointment: async (aid) => {
      const { error } = await supabase.from("appointments").delete().eq("id", aid);
      if (error) { console.error("deleteAppointment", error); return; }
      setAppointments((s) => s.filter((a) => a.id !== aid));
    },
    uploadClinicalPhotos: async (patientId, files) => {
      const userId = session?.user?.id;
      if (!userId) return { error: "You must be signed in." };
      const paths: string[] = [];
      for (const file of files) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${userId}/${patientId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("clinical-photos").upload(path, file, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });
        if (upErr) { console.error("photo upload", upErr); return { error: `Photo upload failed: ${upErr.message}` }; }
        paths.push(path);
      }
      return { paths };
    },
    addFootObservation: async (o, photos) => {
      const userId = session?.user?.id;
      if (!userId) return { error: "You must be signed in." };
      if (!o.patientId) return { error: "Choose a patient." };

      const paths: string[] = [];
      for (const file of photos) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${userId}/${o.patientId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("clinical-photos").upload(path, file, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });
        if (upErr) { console.error("photo upload", upErr); return { error: `Photo upload failed: ${upErr.message}` }; }
        paths.push(path);
      }

      const severe = o.pain === "severe" || o.callus === "severe";
      const moderate = o.pain === "moderate" || o.callus === "moderate";
      const { data, error } = await supabase
        .from("foot_assessments")
        .insert({
          nurse_id: userId,
          patient_id: o.patientId,
          left_foot: o.side === "L",
          right_foot: o.side === "R",
          skin_dry: !!o.skin?.includes("dry"),
          skin_callus: !!o.callus && o.callus !== "none",
          risk_level: severe ? "high" : moderate ? "moderate" : "low",
          notes: o.text || null,
          photo_urls: paths,
          side: o.side,
          foot_view: o.view,
          region: o.region,
          region_label: o.regionLabel,
          region_group: o.group,
          pain_level: o.pain ?? null,
          callus_level: o.callus ?? null,
          skin_conditions: o.skin ?? [],
          wound_length_mm: o.measurements?.length ?? null,
          wound_width_mm: o.measurements?.width ?? null,
          wound_depth_mm: o.measurements?.depth ?? null,
          follow_up_at: o.followUp ?? null,
        })
        .select()
        .single();
      if (error || !data) {
        console.error("addFootObservation", error);
        return { error: error?.message || "Failed to save observation." };
      }
      const assessment = rowToFootAssessment(data as FootAssessmentRow);
      setFootAssessments((s) => [assessment, ...s]);
      return { assessment };
    },
    addFootAssessment: async (a, photos) => {
      const userId = session?.user?.id;
      if (!userId) return { error: "You must be signed in." };
      if (!a.patientId) return { error: "Choose a patient." };

      const paths: string[] = [];
      for (const file of photos) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${userId}/${a.patientId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("clinical-photos").upload(path, file, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });
        if (upErr) { console.error("photo upload", upErr); return { error: `Photo upload failed: ${upErr.message}` }; }
        paths.push(path);
      }


      const { data, error } = await supabase
        .from("foot_assessments")
        .insert({
          nurse_id: userId,
          patient_id: a.patientId,
          left_foot: a.leftFoot, right_foot: a.rightFoot,
          skin_dry: a.skinDry, skin_callus: a.skinCallus, skin_corns: a.skinCorns,
          skin_fissures: a.skinFissures, skin_ulcer: a.skinUlcer, skin_infection: a.skinInfection,
          nails_thickened: a.nailsThickened, nails_fungal: a.nailsFungal, nails_ingrown: a.nailsIngrown,
          nails_trimmed: a.nailsTrimmed, nails_debrided: a.nailsDebrided,
          pulses_present: a.pulsesPresent || null,
          capillary_refill: a.capillaryRefill || null,
          edema: a.edema || null,
          skin_temperature: a.skinTemperature || null,
          protective_sensation: a.protectiveSensation || null,
          monofilament_findings: a.monofilamentFindings || null,
          neuropathy_risk: a.neuropathyRisk || null,
          risk_level: a.riskLevel,
          notes: a.notes || null,
          photo_urls: paths,
        })
        .select()
        .single();
      if (error || !data) {
        console.error("addFootAssessment", error);
        return { error: error?.message || "Failed to save assessment." };
      }
      const assessment = rowToFootAssessment(data as FootAssessmentRow);
      setFootAssessments((s) => [assessment, ...s]);
      return { assessment };
    },
    deleteFootAssessment: async (aid) => {
      const target = footAssessments.find((x) => x.id === aid);
      const { error } = await supabase.from("foot_assessments").delete().eq("id", aid);
      if (error) { console.error("deleteFootAssessment", error); return; }
      if (target?.photoPaths.length) {
        await supabase.storage.from("clinical-photos").remove(target.photoPaths);
      }
      setFootAssessments((s) => s.filter((x) => x.id !== aid));
    },

    addTransaction: (t) =>
      setExtras((s) => ({ ...s, transactions: [{ ...t, id: id() }, ...s.transactions] })),
    upgradeToPremium: () =>
      setExtras((s) => ({ ...s, nurse: s.nurse ? { ...s.nurse, plan: "premium" } : s.nurse })),
    useAiCredit: () => {
      const n = extras.nurse;
      if (!n) return false;
      const limit = PLAN_LIMITS[n.plan].aiPerMonth;
      if (n.aiUsedThisMonth >= limit) return false;
      setExtras((s) => ({ ...s, nurse: s.nurse ? { ...s.nurse, aiUsedThisMonth: s.nurse.aiUsedThisMonth + 1 } : s.nurse }));
      return true;
    },
  };

  return <StoreCtx.Provider value={ctx}>{children}</StoreCtx.Provider>;
}


export const useStore = () => {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
};
