import { describe, expect, it } from "vite-plus/test";
import {
  amountField,
  categoryIdField,
  categoryNameField,
  itemNameField,
  spentAtField,
} from "./fields.ts";

const messageOf = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.error?.issues[0]?.message;

describe("amountField", () => {
  it("正しい金額を整数にする", () => {
    expect(amountField.parse("１,２００円")).toBe(1200);
    expect(amountField.parse(300)).toBe(300);
  });
  it("0 以下・不正は弾く", () => {
    for (const v of ["0", "-1", "abc", "", 0, -3, 1.5, "100000000001"]) {
      const r = amountField.safeParse(v);
      expect(r.success, String(v)).toBe(false);
      expect(messageOf(r)).toBe("金額は1円以上、1,000億円以下の整数で入力してください");
    }
  });
});

describe("itemNameField", () => {
  it("前後の空白を取り除く", () => {
    expect(itemNameField.parse("  ランチ  ")).toBe("ランチ");
  });
  it("空・空白だけ・101 文字は弾く", () => {
    expect(itemNameField.safeParse("").success).toBe(false);
    expect(itemNameField.safeParse("   ").success).toBe(false);
    expect(itemNameField.safeParse("あ".repeat(100)).success).toBe(true);
    expect(itemNameField.safeParse("あ".repeat(101)).success).toBe(false);
  });
});

describe("spentAtField", () => {
  it("JST として解釈する", () => {
    expect(spentAtField.parse("2026-11-08T13:43").toISOString()).toBe("2026-11-08T04:43:00.000Z");
  });
  it("存在しない日時は弾く", () => {
    expect(messageOf(spentAtField.safeParse("2026-02-30T10:00"))).toBe("日時を正しく入力してください");
    expect(spentAtField.safeParse("").success).toBe(false);
  });
});

describe("categoryIdField", () => {
  it("正の整数か null（未分類）を通す", () => {
    expect(categoryIdField.parse(3)).toBe(3);
    expect(categoryIdField.parse(null)).toBeNull();
  });
  it("0・負数・小数・文字列は弾く", () => {
    for (const v of [0, -1, 1.5, "1", undefined]) {
      expect(categoryIdField.safeParse(v).success, String(v)).toBe(false);
    }
  });
});

describe("categoryNameField", () => {
  it("trim して 1〜30 文字", () => {
    expect(categoryNameField.parse(" 食費 ")).toBe("食費");
    expect(categoryNameField.safeParse("").success).toBe(false);
    expect(categoryNameField.safeParse("あ".repeat(31)).success).toBe(false);
    expect(categoryNameField.safeParse("あ".repeat(30)).success).toBe(true);
  });
});
