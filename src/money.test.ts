import { describe, expect, it } from "vite-plus/test";
import { parseAmount } from "./money.ts";

describe("parseAmount", () => {
  it("半角の整数をそのまま通す", () => {
    expect(parseAmount("1200")).toBe(1200);
    expect(parseAmount(1200)).toBe(1200);
  });

  it("全角数字・カンマ・通貨記号・空白を取り除く", () => {
    expect(parseAmount("１２００")).toBe(1200);
    expect(parseAmount("1,200")).toBe(1200);
    expect(parseAmount("１，２００円")).toBe(1200);
    expect(parseAmount("¥1200")).toBe(1200);
    expect(parseAmount("￥ 1 200 円")).toBe(1200);
  });

  it("0・負数・小数・文字は null", () => {
    for (const v of ["0", "０", "-5", "1.5", "abc", "", "  ", "12a", "1e3"]) {
      expect(parseAmount(v), v).toBeNull();
    }
    expect(parseAmount(0)).toBeNull();
    expect(parseAmount(-1)).toBeNull();
    expect(parseAmount(1.5)).toBeNull();
    expect(parseAmount(Number.NaN)).toBeNull();
  });

  it("安全な整数の範囲を超えたら null", () => {
    expect(parseAmount("9007199254740991")).toBe(9007199254740991);
    expect(parseAmount("9007199254740992")).toBeNull();
    expect(parseAmount("99999999999999999999")).toBeNull();
  });

  it("文字列・数値以外は null", () => {
    expect(parseAmount(null)).toBeNull();
    expect(parseAmount(undefined)).toBeNull();
    expect(parseAmount({})).toBeNull();
  });
});
