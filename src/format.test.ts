import { describe, expect, it } from "vite-plus/test";
import { formatYen } from "./format.ts";

describe("formatYen", () => {
  it("桁区切りと円を付ける", () => {
    expect(formatYen(1200)).toBe("1,200円");
    expect(formatYen(0)).toBe("0円");
    expect(formatYen(1234567)).toBe("1,234,567円");
  });
});
