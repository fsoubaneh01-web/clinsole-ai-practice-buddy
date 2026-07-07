import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Patient = {
  id: string;
  name: string;
  age: number;
  phone: string;
  address: string;
  conditions: string[];
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
  date: string; // ISO
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

export type Nurse = {
  name: string;
  email: string;
  credentials: string;
  serviceArea: string;
  yearsExperience: number;
  bio: string;
  plan: "trial" | "premium";
  trialEndsAt: string;
};

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
  addPatient: (p: Omit<Patient, "id" | "createdAt" | "assessments" | "treatments">) => Patient;
  updatePatient: (id: string, p: Partial<Patient>) => void;
  addTreatment: (patientId: string, t: Omit<Treatment, "id">) => void;
  addAppointment: (a: Omit<Appointment, "id">) => void;
  deleteAppointment: (id: string) => void;
  addTransaction: (t: Omit<Transaction, "id">) => void;
  upgradeToPremium: () => void;
};

const KEY = "clinsole-state-v1";

const seedDate = (offsetDays: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const seed = (): State => {
  const p1: Patient = {
    id: "p1",
    name: "Margaret Chen",
    age: 74,
    phone: "(416) 555-0142",
    address: "22 Elm St, Toronto",
    conditions: ["Type 2 Diabetes", "Neuropathy"],
    notes: "Prefers morning visits. Cat at home.",
    createdAt: seedDate(-40),
    assessments: [
      { id: "a1", date: seedDate(-14), summary: "Mild callus on 1st MTP, no ulceration", risk: "medium" },
    ],
    treatments: [
      {
        id: "t1",
        date: seedDate(-14),
        fee: 75,
        soap: {
          s: "Reports mild burning in R foot at night.",
          o: "Callus 1st MTP R, dry skin bilateral heels. Monofilament: 6/10 sites.",
          a: "Diabetic foot at moderate risk; callus requiring debridement.",
          p: "Debride callus, emollient, review footwear. F/U 4 weeks.",
        },
      },
    ],
    nextFollowUp: seedDate(14),
  };
  const p2: Patient = {
    id: "p2",
    name: "Harold Whitaker",
    age: 81,
    phone: "(416) 555-0198",
    address: "14 Oak Ave, North York",
    conditions: ["Peripheral Vascular Disease"],
    notes: "Uses walker. Daughter present.",
    createdAt: seedDate(-90),
    assessments: [{ id: "a2", date: seedDate(-7), summary: "Onychomycosis all toenails", risk: "low" }],
    treatments: [],
    nextFollowUp: seedDate(21),
  };
  const p3: Patient = {
    id: "p3",
    name: "Priya Ramesh",
    age: 68,
    phone: "(647) 555-0173",
    address: "88 Maple Rd, Scarborough",
    conditions: ["Rheumatoid Arthritis"],
    notes: "",
    createdAt: seedDate(-10),
    assessments: [],
    treatments: [],
  };

  return {
    onboarded: false,
    nurse: null,
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
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const id = () => Math.random().toString(36).slice(2, 10);

  const ctx: Ctx = {
    ...state,
    signIn: (email) =>
      setState((s) => ({
        ...s,
        nurse: s.nurse ?? {
          name: "",
          email,
          credentials: "RN, Advanced Foot Care",
          serviceArea: "",
          yearsExperience: 0,
          bio: "",
          plan: "trial",
          trialEndsAt: seedDate(14),
        },
      })),
    signOut: () => setState((s) => ({ ...s, nurse: null, onboarded: false })),
    setNurse: (n) => setState((s) => ({ ...s, nurse: n, onboarded: true })),
    addPatient: (p) => {
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
  };

  return <StoreCtx.Provider value={ctx}>{children}</StoreCtx.Provider>;
}

export const useStore = () => {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
};
