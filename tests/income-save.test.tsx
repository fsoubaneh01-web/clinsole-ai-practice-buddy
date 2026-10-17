import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import React from "react";
import { act, create } from "react-test-renderer";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const success: string[] = [];
const errors: string[] = [];
const addTransaction = mock(async (_transaction: any) => {});
const host = (tag: string) => ({ children, ...props }: any) => React.createElement(tag, props, children);
mock.module("@tanstack/react-router", () => ({ createFileRoute: () => (options: any) => options, Link: host("a") }));
mock.module("@/components/AppShell", () => ({ AppShell: ({ actions, children }: any) => <main>{actions}{children}</main>, Container: host("div") }));
mock.module("@/lib/store", () => ({ useStore: () => ({ transactions: [], addTransaction }), PLAN_LIMITS: { free: { aiPerMonth: 5 } }, summarizeAssessment: () => "" }));
mock.module("@/components/ui/button", () => ({ Button: host("button") }));
mock.module("@/components/ui/input", () => ({ Input: host("input") }));
mock.module("@/components/ui/label", () => ({ Label: host("label") }));
mock.module("@/components/ui/select", () => Object.fromEntries(["Select", "SelectContent", "SelectItem", "SelectTrigger", "SelectValue"].map((name) => [name, host("section")])));
mock.module("@/components/ui/dialog", () => ({ Dialog: host("dialog"), DialogContent: host("section"), DialogHeader: host("header"), DialogTitle: host("h2"), DialogTrigger: host("div") }));
mock.module("lucide-react", () => Object.fromEntries(["Plus", "ArrowUpRight", "ArrowDownRight", "TrendingUp", "Sparkles", "Save", "Loader2", "Crown", "CalendarPlus", "MapPin", "Pencil", "RefreshCw", "Trash2"].map((name) => [name, host("i")])));
mock.module("sonner", () => ({ toast: { success: (message: string) => success.push(message), error: (message: string) => errors.push(message) } }));

const { Route } = await import("../src/routes/app.income");
let view: ReturnType<typeof create>;
const saveButton = () => view.root.findAllByType("button").find((button) => button.children.some((child) => child === "Save" || child === "Saving…"))!;
beforeEach(async () => {
  success.length = 0; errors.length = 0;
  addTransaction.mockClear(); addTransaction.mockImplementation(async () => {});
  await act(async () => { view = create(<Route.component />); });
  await act(async () => { view.root.findByType("dialog").props.onOpenChange(true); });
});
afterEach(async () => { await act(async () => { view.unmount(); }); });

test("waits for persistence and blocks duplicate submissions", async () => {
  let resolve!: () => void;
  addTransaction.mockImplementation(() => new Promise<void>((done) => { resolve = done; }));
  const save = saveButton().props.onClick;
  let request: Promise<void>;
  await act(async () => { request = save(); await save(); });
  expect(addTransaction).toHaveBeenCalledTimes(1);
  expect(success).toHaveLength(0);
  expect(saveButton().props.disabled).toBe(true);
  expect(view.root.findByType("dialog").props.open).toBe(true);
  await act(async () => { resolve(); await request; });
  expect(success).toEqual(["Transaction added"]);
  expect(view.root.findByType("dialog").props.open).toBe(false);
});

test("failed writes keep entered values and show no success message", async () => {
  const amountInput = view.root.findAllByType("input")[0];
  await act(async () => { amountInput.props.onChange({ target: { value: "75" } }); });
  addTransaction.mockImplementation(async () => { throw new Error("Save failed"); });
  await act(async () => { await saveButton().props.onClick(); });
  expect(errors).toEqual(["Save failed"]);
  expect(success).toHaveLength(0);
  expect(view.root.findByType("dialog").props.open).toBe(true);
  expect(view.root.findAllByType("input")[0].props.value).toBe(75);
});

test("negative amounts are rejected before persistence", async () => {
  await act(async () => { view.root.findAllByType("input")[0].props.onChange({ target: { value: "-10" } }); });
  await act(async () => { await saveButton().props.onClick(); });
  expect(addTransaction).not.toHaveBeenCalled();
  expect(errors).toHaveLength(1);
});
