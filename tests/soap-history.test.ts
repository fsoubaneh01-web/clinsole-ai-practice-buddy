import { describe, expect, test } from "bun:test";
import { formatSoapHistory } from "../src/lib/soap-history";

describe("SOAP history evidence", () => {
  test("retains diabetes when the separate conditions list is empty", () => {
    const history = formatSoapHistory({ diabetesStatus: "type1", conditions: [], allergies: "None" });
    expect(history).toContain("Diabetes status (separate structured field): type1");
    expect(history).toContain("Other recorded medical conditions: Not documented");
    expect(history).toContain("Recorded allergies: None");
    expect(history).not.toContain("none reported");
  });

  test("missing and whitespace-only history remain unknown", () => {
    const history = formatSoapHistory({ diabetesStatus: " ", conditions: [" "], allergies: " " });
    expect(history.match(/Not documented/g)).toHaveLength(3);
  });

  test("preserves explicitly recorded conditions and allergy information", () => {
    const history = formatSoapHistory({ diabetesStatus: "none", conditions: ["Hypertension"], allergies: "Penicillin" });
    expect(history).toContain("Other recorded medical conditions: Hypertension");
    expect(history).toContain("Recorded allergies: Penicillin");
  });
});
