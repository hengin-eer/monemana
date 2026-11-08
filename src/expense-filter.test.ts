import { describe, expect, it } from "vite-plus/test";
import { PAGE_SIZE, decodeCursor, encodeCursor, monthNav, parseFilter } from "./expense-filter.ts";

// 2026-11-30 15:00 UTC は JST では 2026-12-01 00:00
const now = new Date("2026-11-30T15:00:00.000Z");

describe("parseFilter", () => {
  it("月の既定は今の JST の月", () => {
    expect(parseFilter({}, now)).toEqual({ month: "2026-12", category: null });
    expect(parseFilter({}, new Date("2026-11-30T14:59:00.000Z")).month).toBe("2026-11");
  });

  it("正しい月・全期間を受け付ける", () => {
    expect(parseFilter({ month: "2026-03" }, now).month).toBe("2026-03");
    expect(parseFilter({ month: "all" }, now).month).toBe("all");
  });

  it("不正な月は既定に戻す", () => {
    for (const month of ["2026-13", "abc", "", "2026-1"]) {
      expect(parseFilter({ month }, now).month, month).toBe("2026-12");
    }
  });

  it("カテゴリは数値か none。それ以外は絞り込みなし", () => {
    expect(parseFilter({ category: "12" }, now).category).toBe(12);
    expect(parseFilter({ category: "none" }, now).category).toBe("none");
    for (const category of ["abc", "-1", "1.5", "", "0", "00", "99999999999999999999"]) {
      expect(parseFilter({ category }, now).category, category).toBeNull();
    }
  });
});

describe("cursor", () => {
  it("往復で値が変わらない", () => {
    const spentAt = new Date("2026-11-08T04:43:00.000Z");
    const cursor = encodeCursor({ spentAt, id: 42 });
    expect(cursor).toBe(`${spentAt.getTime()}_42`);
    expect(decodeCursor(cursor)).toEqual({ spentAt, id: 42 });
  });

  it("1970 年より前の日時（負の epoch）も往復できる", () => {
    const spentAt = new Date("1969-12-31T14:59:00.000Z");
    expect(spentAt.getTime()).toBeLessThan(0);
    expect(decodeCursor(encodeCursor({ spentAt, id: 42 }))).toEqual({ spentAt, id: 42 });
  });

  it("不正なカーソルは null（先頭から読む）", () => {
    for (const c of [undefined, "", "abc", "1_", "_1", "1_2_3", "1; DROP TABLE", "9999999999999999_1"]) {
      expect(decodeCursor(c), String(c)).toBeNull();
    }
  });
});

describe("monthNav", () => {
  it("前月・翌月を出す", () => {
    expect(monthNav("2026-12", now)).toMatchObject({ label: "2026年12月", prev: "2026-11", next: "2027-01", current: "2026-12" });
  });
  it("全期間では前後なし", () => {
    expect(monthNav("all", now)).toMatchObject({ label: "全期間", prev: null, next: null });
  });
});

describe("PAGE_SIZE", () => {
  it("30 件", () => expect(PAGE_SIZE).toBe(30));
});
