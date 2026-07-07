import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Patient = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  dob: string; // ISO date
  conditions: string[];
  diabetesStatus: "none" | "type1" | "type2" | "prediabetes";
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
  recurring?: "weekly" | "biweekly" | "monthly" | null;
  notes?: string;
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

type State = {
  nurse: Nurse | null;
  patients: Patient[];
  appointments: Appointment[];
  transactions: Transaction[];
  onboarded: boolean;
};

type Ctx = State & {
  signIn: (email: string) => void;
  signOut: () => void;
  setNurse: (n: Nurse) => void;
  addPatient: (p: Omit<Patient, "id" | "createdAt" | "assessments" | "treatments">) => Patient | null;
  updatePatient: (id: string, p: Partial<Patient>) => void;
  addTreatment: (patientId: string, t: Omit<Treatment, "id">) => void;
  addAppointment: (a: Omit<Appointment, "id">) => void;
  deleteAppointment: (id: string) => void;
  addTransaction: (t: Omit<Transaction, "id">) => void;
  upgradeToPremium: () => void;
  useAiCredit: () => boolean;
  ageOf: (dob: string) => number;
};

const KEY = "clinsole-state-v2";

const seedDate = (offsetDays: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const yearsAgo = (n: number) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d.toISOString().slice(0, 10);
};

const seed = (): State => {
  const p1: Patient = {
    id: "p1",
    name: "Margaret Chen",
    phone: "(416) 555-0142",
    email: "margaret.c@example.com",
    address: "22 Elm St, Toronto",
    dob: yearsAgo(74),
    conditions: ["Neuropathy", "Hypertension"],
    diabetesStatus: "type2",
    allergies: "Penicillin",
    notes: "Prefers morning visits. Cat at home.",
    createdAt: seedDate(-40),
    assessments: [{ id: "a1", date: seedDate(-14), summary: "Mild callus on 1st MTP, no ulceration", risk: "medium" }],
    treatments: [{
      id: "t1", date: seedDate(-14), fee: 75,
      soap: {
        s: "Reports mild burning in R foot at night.",
        o: "Callus 1st MTP R, dry skin bilateral heels. Monofilament: 6/10 sites.",
        a: "Diabetic foot at moderate risk; callus requiring debridement.",
        p: "Debride callus, emollient, review footwear. F/U 4 weeks.",
      },
    }],
    nextFollowUp: seedDate(14),
  };
  const p2: Patient = {
    id: "p2", name: "Harold Whitaker", phone: "(416) 555-0198",
    address: "14 Oak Ave, North York", dob: yearsAgo(81),
    conditions: ["Peripheral Vascular Disease"], diabetesStatus: "none",
    allergies: "None known", notes: "Uses walker. Daughter present.",
    createdAt: seedDate(-90),
    assessments: [{ id: "a2", date: seedDate(-7), summary: "Onychomycosis all toenails", risk: "low" }],
    treatments: [], nextFollowUp: seedDate(21),
  };
  const p3: Patient = {
    id: "p3", name: "Priya Ramesh", phone: "(647) 555-0173",
    address: "88 Maple Rd, Scarborough", dob: yearsAgo(68),
    conditions: ["Rheumatoid Arthritis"], diabetesStatus: "prediabetes",
    allergies: "Latex", notes: "", createdAt: seedDate(-10),
    assessments: [], treatments: [],
  };

  return {
    onboarded: false, nurse: null,
    patients: [p1, p2, p3],
    appointments: [
      { id: "ap1", patientId: "p1", patientName: p1.name, date: seedDate(0, 9), duration: 45, type: "Routine footcare" },
      { id: "ap2", patientId: "p2", patientName: p2.name, date: seedDate(0, 11), duration: 60, type: "Nail care" },
      { id: "ap3", patientId: "p3", patientName: p3.name, date: seedDate(0, 14), duration: 45, type: "Initial assessment" },
      { id: "ap4", patientId: "p1", patientName: p1.name, date: seedDate(2, 10), duration: 45, type: "Follow-up" },
      { id: "ap5", patientId: "p2", patientName: p2.name, date: seedDate(5, 13), duration: 60, type: "Nail care", recurring: "monthly" },
    ],
    transactions: [
      { id: "tx1", type: "income", amount: 75, date: seedDate(-1), category: "Visit", patientId: "p1" },
      { id: "tx2", type: "income", amount: 90, date: seedDate(-3), category: "Visit", patientId: "p2" },
      { id: "tx3", type: "income", amount: 75, date: seedDate(-5), category: "Visit", patientId: "p1" },
      { id: "tx4", type: "expense", amount: 32, date: seedDate(-6), category: "Supplies", note: "Gauze, blades" },
      { id: "tx5", type: "income", amount: 120, date: seedDate(-8), category: "Assessment", patientId: "p3" },
      { id: "tx6", type: "expense", amount: 60, date: seedDate(-12), category: "Fuel" },
    ],
  };
};

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => {
    if (typeof window === "undefined") return seed();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return seed();
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const id = () => Math.random().toString(36).slice(2, 10);

  const ageOf = (dob: string) => {
    if (!dob) return 0;
    const d = new Date(dob);
    const diff = Date.now() - d.getTime();
    return Math.floor(diff / (365.25 * 864e5));
  };

  const ctx: Ctx = {
    ...state,
    ageOf,
    signIn: (email) =>
      setState((s) => ({
        ...s,
        nurse: s.nurse ?? {
          name: "", email, credentials: "RN, Advanced Foot Care",
          serviceArea: "", yearsExperience: 0, bio: "",
          plan: "free", aiUsedThisMonth: 0,
        },
      })),
    signOut: () => setState((s) => ({ ...s, nurse: null, onboarded: false })),
    setNurse: (n) => setState((s) => ({ ...s, nurse: n, onboarded: true })),
    addPatient: (p) => {
      const plan = state.nurse?.plan || "free";
      if (state.patients.length >= PLAN_LIMITS[plan].patients) return null;
      const newP: Patient = { ...p, id: id(), createdAt: new Date().toISOString(), assessments: [], treatments: [] };
      setState((s) => ({ ...s, patients: [newP, ...s.patients] }));
      return newP;
    },
    updatePatient: (pid, p) =>
      setState((s) => ({ ...s, patients: s.patients.map((x) => (x.id === pid ? { ...x, ...p } : x)) })),
    addTreatment: (pid, t) =>
      setState((s) => ({
        ...s,
        patients: s.patients.map((x) =>
          x.id === pid ? { ...x, treatments: [{ ...t, id: id() }, ...x.treatments] } : x,
        ),
      })),
    addAppointment: (a) => setState((s) => ({ ...s, appointments: [...s.appointments, { ...a, id: id() }] })),
    deleteAppointment: (aid) => setState((s) => ({ ...s, appointments: s.appointments.filter((a) => a.id !== aid) })),
    addTransaction: (t) => setState((s) => ({ ...s, transactions: [{ ...t, id: id() }, ...s.transactions] })),
    upgradeToPremium: () =>
      setState((s) => ({ ...s, nurse: s.nurse ? { ...s.nurse, plan: "premium" } : s.nurse })),
    useAiCredit: () => {
      const n = state.nurse;
      if (!n) return false;
      const limit = PLAN_LIMITS[n.plan].aiPerMonth;
      if (n.aiUsedThisMonth >= limit) return false;
      setState((s) => ({ ...s, nurse: s.nurse ? { ...s.nurse, aiUsedThisMonth: s.nurse.aiUsedThisMonth + 1 } : s.nurse }));
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
