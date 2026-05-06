import { describe, expect, it } from "vitest";
import { buildPercentSetPlan, extractPercentFromLoadString, kgFromPercent } from "./load-percent";

describe("load-percent", () => {
  it("extractPercentFromLoadString", () => {
    expect(extractPercentFromLoadString("75%")).toBe(75);
    expect(extractPercentFromLoadString("75,5 %")).toBe(75.5);
    expect(extractPercentFromLoadString("@ 70%")).toBe(70);
    expect(extractPercentFromLoadString("70")).toBe(70);
    expect(extractPercentFromLoadString(null)).toBeNull();
  });

  it("kgFromPercent", () => {
    expect(kgFromPercent(75, 100)).toBe(75);
    expect(kgFromPercent(70, 90)).toBe(63);
  });

  it("buildPercentSetPlan", () => {
    const plan = buildPercentSetPlan(2, "60%", ["70%", "80%"], "percent", 100);
    expect(plan[0].percent).toBe(70);
    expect(plan[0].targetKg).toBe(70);
    expect(plan[1].percent).toBe(80);
    expect(plan[1].targetKg).toBe(80);
  });

  it("buildPercentSetPlan sem referência", () => {
    const plan = buildPercentSetPlan(1, "60%", undefined, "percent", null);
    expect(plan[0].percent).toBe(60);
    expect(plan[0].targetKg).toBeNull();
  });
});
