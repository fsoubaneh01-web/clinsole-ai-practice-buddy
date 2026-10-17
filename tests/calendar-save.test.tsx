import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import React from "react";
import { act, create } from "react-test-renderer";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const errors: string[] = [];
const warnings: string[] = [];
const success: string[] = [];
const patients = [{ id: "test-a", name: "Test A" }];
const addAppointment = mock(async (_value: any): Promise<any> => ({}));
const checkOverlap = mock(async (_value: any): Promise<any> => ({ conflict: null }));
const host = (tag: string) => ({ children, ...props }: any) => React.createElement(tag, props, children);
mock.module("@tanstack/react-router", () => ({ createFileRoute: () => (options: any) => options, Link: host("a") }));
mock.module("@tanstack/react-start", () => ({ useServerFn: (fn: any) => fn }));
mock.module("@/lib/appointments.functions", () => ({ checkAppointmentOverlap: checkOverlap }));
mock.module("@/components/AppShell", () => ({ AppShell: ({ actions, children }: any) => <main>{actions}{children}</main>, Container: host("div") }));
mock.module("@/lib/store", () => ({ useStore: () => ({ appointments: [], patients, addAppointment }), PLAN_LIMITS: { free: { aiPerMonth: 5 } }, summarizeAssessment: () => "" }));
mock.module("@/components/ui/button", () => ({ Button: host("button") }));
mock.module("@/components/ui/input", () => ({ Input: host("input") }));
mock.module("@/components/ui/label", () => ({ Label: host("label") }));
mock.module("@/components/ui/textarea", () => ({ Textarea: host("textarea") }));
mock.module("@/components/ui/select", () => Object.fromEntries(["Select", "SelectContent", "SelectItem", "SelectTrigger", "SelectValue"].map((name) => [name, host("section")])));
mock.module("@/components/ui/dialog", () => ({ Dialog: host("dialog"), DialogContent: host("section"), DialogHeader: host("header"), DialogTitle: host("h2"), DialogTrigger: host("div") }));
mock.module("@/components/ui/alert-dialog", () => Object.fromEntries(["AlertDialog", "AlertDialogAction", "AlertDialogCancel", "AlertDialogContent", "AlertDialogDescription", "AlertDialogFooter", "AlertDialogHeader", "AlertDialogTitle"].map((name) => [name, host("aside")])));
mock.module("lucide-react", () => Object.fromEntries(["CalendarPlus", "MapPin", "Pencil", "RefreshCw", "Trash2", "Plus", "ArrowUpRight", "ArrowDownRight", "TrendingUp", "Sparkles", "Save", "Loader2", "Crown"].map((name) => [name, host("i")])));
mock.module("sonner", () => ({ toast: { success: (s: string) => success.push(s), error: (s: string) => errors.push(s), warning: (s: string) => warnings.push(s) } }));
const { Route } = await import("../src/routes/app.calendar");
let view: ReturnType<typeof create>;
const bookButton = () => view.root.findAllByType("button").find((button) => button.children.some((child) => child === "Book appointment" || child === "Saving..."))!;
const clickBook = async () => { await act(async () => { bookButton().props.onClick(); }); };
const input = (type: string) => view.root.findAllByType("input").find((node) => node.props.type === type)!;
beforeEach(async () => {
  errors.length = 0; warnings.length = 0; success.length = 0;
  addAppointment.mockClear(); addAppointment.mockImplementation(async () => ({}));
  checkOverlap.mockClear(); checkOverlap.mockImplementation(async () => ({ conflict: null }));
  await act(async () => { view = create(<Route.component />); });
  await act(async () => { view.root.findByType("dialog").props.onOpenChange(true); });
});
afterEach(async () => { await act(async () => { view.unmount(); }); });

test("a failed conflict check never books and permits retry", async () => {
  checkOverlap.mockImplementation(async () => { throw Error("Offline"); });
  await clickBook();
  expect(addAppointment).not.toHaveBeenCalled();
  expect(errors[0]).toContain("Nothing was booked");
  expect(view.root.findByType("dialog").props.open).toBe(true);
  checkOverlap.mockImplementation(async () => ({ conflict: null }));
  await clickBook();
  expect(addAppointment).toHaveBeenCalledTimes(1);
});

test("rapid clicks share a single conflict check and save", async () => {
  let resolve!: (value: any) => void;
  checkOverlap.mockImplementation(() => new Promise((done) => { resolve = done; }));
  const click = bookButton().props.onClick;
  await act(async () => { click(); click(); });
  expect(checkOverlap).toHaveBeenCalledTimes(1);
  expect(addAppointment).not.toHaveBeenCalled();
  await act(async () => { view.root.findByType("dialog").props.onOpenChange(false); });
  expect(view.root.findByType("dialog").props.open).toBe(true);
  await act(async () => { resolve({ conflict: null }); });
  expect(addAppointment).toHaveBeenCalledTimes(1);
  expect(view.root.findByType("dialog").props.open).toBe(false);
});

test("failed saves retain form values and unlock retry", async () => {
  await act(async () => { input("time").props.onChange({ target: { value: "14:30" } }); });
  addAppointment.mockImplementation(async () => { throw Error("Write failed"); });
  await clickBook();
  expect(errors).toContain("Write failed");
  expect(input("time").props.value).toBe("14:30");
  expect(bookButton().props.disabled).toBe(false);
  expect(view.root.findByType("dialog").props.open).toBe(true);
});

test("opening a new booking uses the newly selected calendar day", async () => {
  await act(async () => { view.root.findByType("dialog").props.onOpenChange(false); });
  const days = view.root.findAllByType("button").filter((node) => node.props.className?.includes("flex flex-col items-center"));
  await act(async () => { days[6].props.onClick(); });
  await act(async () => { view.root.findByType("dialog").props.onOpenChange(true); });
  await clickBook();
  const booked = new Date(addAppointment.mock.calls[0][0].date);
  expect(booked.getDay()).toBe(0);
});

test("invalid duration and fee never reach the conflict service or save", async () => {
  const numbers = view.root.findAllByType("input").filter((node) => node.props.type === "number");
  await act(async () => { numbers[0].props.onChange({ target: { value: "0" } }); });
  await clickBook();
  await act(async () => { numbers[0].props.onChange({ target: { value: "45" } }); numbers[1].props.onChange({ target: { value: "-5" } }); });
  await clickBook();
  expect(checkOverlap).not.toHaveBeenCalled();
  expect(addAppointment).not.toHaveBeenCalled();
  expect(errors).toHaveLength(2);
});

test("repeat conflict-check failures do not create unchecked appointments", async () => {
  const weekly = view.root.findAllByType("button").find((node) => node.children.includes("Weekly"))!;
  await act(async () => { weekly.props.onClick(); });
  checkOverlap.mockImplementation(async () => {
    if (checkOverlap.mock.calls.length > 1) throw Error("Offline");
    return { conflict: null };
  });
  await clickBook();
  expect(addAppointment).toHaveBeenCalledTimes(1);
  expect(warnings.some((s) => s.includes("first appointment is saved"))).toBe(true);
  expect(view.root.findByType("dialog").props.open).toBe(false);
});
