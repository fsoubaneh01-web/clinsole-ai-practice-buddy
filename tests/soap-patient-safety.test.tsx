import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import React from "react";
import { act, create } from "react-test-renderer";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let search: { patientId?: string } = {};
const messages: string[] = [];
const generate = mock(async () => ({ s: "A subjective", o: "A objective", a: "A assessment", p: "A plan" }));
const addTreatment = mock(async () => ({ treatment: { id: "saved" } }));
const addTransaction = mock(async () => {});
const useAiCredit = mock(async () => true);
const patients = ["A", "B"].map((id) => ({ id, name: id, dob: "1950-01-01", conditions: [], diabetesStatus: "none", allergies: "" }));
let store: any;
const host = (tag: string) => ({ children, ...props }: any) => React.createElement(tag, props, children);

mock.module("@tanstack/react-router", () => ({
  createFileRoute: () => (options: any) => ({ ...options, useSearch: () => search }),
  Link: host("a"),
}));
mock.module("@tanstack/react-start", () => ({ useServerFn: () => generate }));
mock.module("@/lib/soap.functions", () => ({ generateSoapNote: generate }));
mock.module("@/lib/store", () => ({
  useStore: () => store,
  PLAN_LIMITS: { free: { aiPerMonth: 5 } },
  summarizeAssessment: () => "",
}));
mock.module("@/components/AppShell", () => ({ AppShell: host("main"), Container: host("div") }));
mock.module("@/components/ui/button", () => ({ Button: host("button") }));
mock.module("@/components/ui/textarea", () => ({ Textarea: host("textarea") }));
mock.module("@/components/ui/input", () => ({ Input: host("input") }));
mock.module("@/components/ui/label", () => ({ Label: host("label") }));
mock.module("@/components/ui/select", () => ({
  Select: host("select"), SelectContent: host("section"), SelectItem: host("option"),
  SelectTrigger: host("header"), SelectValue: host("span"),
}));
mock.module("lucide-react", () => Object.fromEntries(["Sparkles", "Save", "Loader2", "Crown", "CalendarPlus", "MapPin", "Pencil", "RefreshCw", "Trash2", "Plus", "ArrowUpRight", "ArrowDownRight", "TrendingUp"].map((name) => [name, host("i")])));
mock.module("sonner", () => ({ toast: Object.fromEntries(["error", "success", "warning"].map((name) => [name, (message: string) => messages.push(message)])) }));

const { Route } = await import("../src/routes/app.soap");
let view: ReturnType<typeof create>;
const deferred = () => {
  let resolve!: (value: any) => void;
  const promise = new Promise<any>((done) => { resolve = done; });
  return { promise, resolve };
};
const nodeText = (node: any): string => typeof node === "string" ? node : (node.children || []).map(nodeText).join("");
const button = (text: string) => view.root.findAllByType("button").find((node) => nodeText(node).includes(text))!;
const selectPatient = async (id: string) => { await act(async () => { view.root.findByType("select").props.onValueChange(id); }); };
const enterBrief = async () => { await act(async () => { view.root.findAllByType("textarea")[0].props.onChange({ target: { value: "Notes for patient A" } }); }); };
const makeDraft = async () => { await enterBrief(); await act(async () => { await button("Generate SOAP note").props.onClick(); }); };

beforeEach(async () => {
  search = {};
  messages.length = 0;
  generate.mockClear(); addTreatment.mockClear(); addTransaction.mockClear(); useAiCredit.mockClear();
  generate.mockImplementation(async () => ({ s: "A subjective", o: "A objective", a: "A assessment", p: "A plan" }));
  addTreatment.mockImplementation(async () => ({ treatment: { id: "saved" } }));
  addTransaction.mockImplementation(async () => {});
  useAiCredit.mockImplementation(async () => true);
  store = { patients, addTreatment, addTransaction, useAiCredit, ageOf: () => 76,
    latestAssessmentFor: () => undefined, nurse: { plan: "free", aiUsedThisMonth: 0 }, session: { user: { id: "nurse-1" } } };
  await act(async () => { view = create(<Route.component />); });
});
afterEach(async () => { await act(async () => { view.unmount(); }); });

test("switching patients clears visit inputs and the generated draft", async () => {
  await act(async () => { view.root.findAllByType("textarea")[1].props.onChange({ target: { value: "TEST A assessment" } }); });
  await makeDraft();
  expect(generate.mock.calls[0][0].data.nurseAssessment).toBe("TEST A assessment");
  expect(view.root.findAllByType("textarea")).toHaveLength(6);
  await selectPatient("B");
  expect(view.root.findAllByType("textarea")).toHaveLength(2);
  expect(view.root.findAllByType("textarea")[0].props.value).toBe("");
  expect(view.root.findAllByType("textarea")[1].props.value).toBe("");
  expect(view.root.findByType("select").props.value).toBe("B");
});

test("late AI responses cannot populate another patient's editor", async () => {
  const pending = deferred();
  generate.mockImplementation(() => pending.promise);
  await enterBrief();
  let request: Promise<void>;
  await act(async () => { request = button("Generate SOAP note").props.onClick(); });
  await selectPatient("B");
  await act(async () => { pending.resolve({ s: "A", o: "A", a: "A", p: "A" }); await request; });
  expect(view.root.findAllByType("textarea")).toHaveLength(2);
  expect(messages).not.toContain("SOAP note generated");
});

test("returning to patient A still discards the old in-flight A response", async () => {
  const pending = deferred(); generate.mockImplementation(() => pending.promise);
  await enterBrief();
  let request: Promise<void>;
  await act(async () => { request = button("Generate SOAP note").props.onClick(); });
  await selectPatient("B"); await selectPatient("A");
  await act(async () => { pending.resolve({ s: "old A", o: "", a: "", p: "" }); await request; });
  expect(view.root.findAllByType("textarea")).toHaveLength(2);
});

test("changing the route patient clears the draft", async () => {
  await makeDraft();
  search = { patientId: "B" };
  await act(async () => { view.update(<Route.component />); });
  expect(view.root.findByType("select").props.value).toBe("B");
  expect(view.root.findAllByType("textarea")).toHaveLength(2);
});

test("rapid repeated saves create only one treatment", async () => {
  await makeDraft();
  const pending = deferred(); addTreatment.mockImplementation(() => pending.promise);
  const save = button("Save to patient record").props.onClick;
  let first: Promise<void>;
  await act(async () => { first = save(); await save(); });
  expect(addTreatment).toHaveBeenCalledTimes(1);
  expect(view.root.findByType("select").props.disabled).toBe(true);
  await act(async () => { pending.resolve({ treatment: { id: "saved" } }); await first; });
  expect(addTransaction).toHaveBeenCalledTimes(1);
  expect(addTreatment.mock.calls[0][0]).toBe("A");
});

test("an income failure preserves the saved note and cannot invite a duplicate save", async () => {
  await makeDraft();
  addTransaction.mockImplementation(async () => { throw new Error("offline"); });
  await act(async () => { await button("Save to patient record").props.onClick(); });
  expect(addTreatment).toHaveBeenCalledTimes(1);
  expect(view.root.findAllByType("textarea")).toHaveLength(2);
  expect(messages.some((message) => message.includes("Note saved, but income"))).toBe(true);
});

test("failed clinical saves retain the draft for retry", async () => {
  await makeDraft();
  addTreatment.mockImplementation(async () => ({ error: "Save failed" }));
  await act(async () => { await button("Save to patient record").props.onClick(); });
  expect(addTransaction).not.toHaveBeenCalled();
  expect(view.root.findAllByType("textarea")).toHaveLength(6);
  expect(messages).toContain("Save failed");
});

test("switching patients during the credit check prevents the old AI call", async () => {
  const pending = deferred(); useAiCredit.mockImplementation(() => pending.promise);
  await enterBrief();
  let request: Promise<void>;
  await act(async () => { request = button("Generate SOAP note").props.onClick(); });
  await selectPatient("B");
  await act(async () => { pending.resolve(true); await request; });
  expect(generate).not.toHaveBeenCalled();
});

test("changing nurse accounts clears the previous nurse's draft", async () => {
  await makeDraft();
  store = { ...store, session: { user: { id: "nurse-2" } } };
  await act(async () => { view.update(<Route.component />); });
  expect(view.root.findAllByType("textarea")).toHaveLength(2);
  expect(view.root.findAllByType("textarea")[0].props.value).toBe("");
});

test("negative visit fees never reach persistence", async () => {
  await makeDraft();
  await act(async () => { view.root.findByType("input").props.onChange({ target: { value: "-1" } }); });
  await act(async () => { await button("Save to patient record").props.onClick(); });
  expect(addTreatment).not.toHaveBeenCalled();
  expect(addTransaction).not.toHaveBeenCalled();
});
