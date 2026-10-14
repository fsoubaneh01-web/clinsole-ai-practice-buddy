import { expect, test } from "bun:test";
import { withNurseAssessment } from "../src/lib/soap-assessment";

const unsafeDraft = { s: "No pain reported", o: "Toenails trimmed", a: "Foot health appears stable. Low risk.", p: "Education provided" };

test("an omitted nurse assessment discards model-invented stability and risk", () => {
  expect(withNurseAssessment(unsafeDraft).a).toBe("Not documented");
});

test("whitespace is not a documented assessment", () => {
  expect(withNurseAssessment(unsafeDraft, "  \n ").a).toBe("Not documented");
});

test("the nurse's assessment is reproduced without model additions", () => {
  const result = withNurseAssessment(unsafeDraft, "  TEST: Nurse assessment entered.  ");
  expect(result.a).toBe("TEST: Nurse assessment entered.");
  expect(result.s).toBe(unsafeDraft.s);
  expect(result.o).toBe(unsafeDraft.o);
  expect(result.p).toBe(unsafeDraft.p);
  expect(unsafeDraft.a).toBe("Foot health appears stable. Low risk.");
});
