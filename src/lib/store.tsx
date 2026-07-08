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

type LocalExtras = {
  nurse: Nurse | null;
  onboarded: boolean;
  appointments: Appointment[];
  transactions: Transaction[];
  patientExtras: Record<string, { assessments: Assessment[]; treatments: Treatment[] }>;
};

type Ctx = {
  session: Session | null;
  loading: boolean;
  nurse: Nurse | null;
  onboarded: boolean;
  patients: Patient[];
  appointments: Appointment[];
  transactions: Transaction[];

  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;

  setNurse: (n: Nurse) => void;
  addPatient: (p: Omit<Patient, "id" | "createdAt" | "assessments" | "treatments">) => Promise<{ patient?: Patient; error?: string }>;
  updatePatient: (id: string, p: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  addTreatment: (patientId: string, t: Omit<Treatment, "id">) => void;
  addAppointment: (a: Omit<Appointment, "id">) => void;
  deleteAppointment: (id: string) => void;
  addTransaction: (t: Omit<Transaction, "id">) => void;
  upgradeToPremium: () => void;
  useAiCredit: () => boolean;
  ageOf: (dob: string) => number;
};

const StoreCtx = createContext<Ctx | null>(null);

const localKey = (userId: string) => `clinsole-local-${userId}`;

const emptyExtras: LocalExtras = {
  nurse: null,
  onboarded: false,
  appointments: [],
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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [extras, setExtras] = useState<LocalExtras>(emptyExtras);
  const [patients, setPatients] = useState<Patient[]>([]);

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

  // Load local extras + patients on session change
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setExtras(emptyExtras);
      setPatients([]);
      return;
    }
    const local = loadLocal(userId);
    // hydrate email from session if missing
    if (local.nurse && !local.nurse.email) local.nurse.email = session.user.email || "";
    setExtras(local);

    (async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("load patients", error);
        return;
      }
      setPatients((data as PatientRow[]).map((r) => rowToPatient(r, local.patientExtras[r.id])));
    })();
  }, [session]);

  // Persist local extras
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
    appointments: extras.appointments,
    transactions: extras.transactions,
    ageOf,

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
    addAppointment: (a) =>
      setExtras((s) => ({ ...s, appointments: [...s.appointments, { ...a, id: id() }] })),
    deleteAppointment: (aid) =>
      setExtras((s) => ({ ...s, appointments: s.appointments.filter((a) => a.id !== aid) })),
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
