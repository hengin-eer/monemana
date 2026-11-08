import { describe, expect, it } from "vite-plus/test";
import {
  currentJstMonth,
  formatJstDateTime,
  formatJstMonth,
  isJstMonth,
  jstMonthRange,
  parseJstLocal,
  shiftJstMonth,
  toJstLocalInput,
} from "./jst.ts";

describe("parseJstLocal", () => {
  it("JST として解釈し、UTC の瞬間にする（9 時間引く）", () => {
    expect(parseJstLocal("2026-11-08T13:43")?.toISOString()).toBe("2026-11-08T04:43:00.000Z");
  });

  it("JST の日付が UTC では前日になるケース", () => {
    expect(parseJstLocal("2026-12-01T00:30")?.toISOString()).toBe("2026-11-30T15:30:00.000Z");
  });

  it("存在しない日時・形式違いは null", () => {
    expect(parseJstLocal("2026-02-30T10:00")).toBeNull();
    expect(parseJstLocal("2026-13-01T10:00")).toBeNull();
    expect(parseJstLocal("2026-11-08T24:00")).toBeNull();
    expect(parseJstLocal("2026-11-08T10:60")).toBeNull();
    expect(parseJstLocal("2026-11-08")).toBeNull();
    expect(parseJstLocal("")).toBeNull();
  });

  it("うるう日を受け付ける", () => {
    expect(parseJstLocal("2028-02-29T10:00")).not.toBeNull();
    expect(parseJstLocal("2027-02-29T10:00")).toBeNull();
  });
});

describe("toJstLocalInput", () => {
  it("parseJstLocal と往復して値が変わらない", () => {
    for (const v of ["2026-11-08T13:43", "2026-12-31T23:59", "2027-01-01T00:00", "2028-02-29T00:01"]) {
      expect(toJstLocalInput(parseJstLocal(v)!)).toBe(v);
    }
  });

  it("UTC では前日の瞬間も JST の日付で出す", () => {
    expect(toJstLocalInput(new Date("2026-11-30T15:00:00.000Z"))).toBe("2026-12-01T00:00");
  });
});

describe("jstMonthRange", () => {
  it("JST の月初 00:00 から翌月初 00:00 まで（半開区間）", () => {
    const r = jstMonthRange("2026-11")!;
    expect(r.start.toISOString()).toBe("2026-10-31T15:00:00.000Z");
    expect(r.end.toISOString()).toBe("2026-11-30T15:00:00.000Z");
  });

  it("12 月は翌年 1 月へ繰り上がる", () => {
    const r = jstMonthRange("2026-12")!;
    expect(r.end.toISOString()).toBe("2026-12-31T15:00:00.000Z");
  });

  it("月末 23:59 JST は当月、月初 00:00 JST は翌月に入る", () => {
    const nov = jstMonthRange("2026-11")!;
    const inRange = (d: Date) => d >= nov.start && d < nov.end;
    expect(inRange(parseJstLocal("2026-11-30T23:59")!)).toBe(true);
    expect(inRange(parseJstLocal("2026-12-01T00:00")!)).toBe(false);
    expect(inRange(parseJstLocal("2026-11-01T00:00")!)).toBe(true);
    expect(inRange(parseJstLocal("2026-10-31T23:59")!)).toBe(false);
  });

  it("UTC で月を切ると混ざる 2026-12-01 00:30 JST が 11 月に入らない", () => {
    const nov = jstMonthRange("2026-11")!;
    const d = parseJstLocal("2026-12-01T00:30")!;
    expect(d >= nov.start && d < nov.end).toBe(false);
  });

  it("不正な月は null", () => {
    expect(jstMonthRange("2026-13")).toBeNull();
    expect(jstMonthRange("2026-00")).toBeNull();
    expect(jstMonthRange("2026-1")).toBeNull();
    expect(jstMonthRange("abc")).toBeNull();
    expect(isJstMonth("2026-11")).toBe(true);
    expect(isJstMonth("2026-13")).toBe(false);
  });
});

describe("currentJstMonth / shiftJstMonth", () => {
  it("UTC では 11 月末でも JST で 12 月なら 12 月", () => {
    expect(currentJstMonth(new Date("2026-11-30T15:00:00.000Z"))).toBe("2026-12");
    expect(currentJstMonth(new Date("2026-11-30T14:59:59.999Z"))).toBe("2026-11");
  });

  it("月をまたいで前後に動かせる", () => {
    expect(shiftJstMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftJstMonth("2027-01", -1)).toBe("2026-12");
    expect(shiftJstMonth("2026-11", 0)).toBe("2026-11");
    expect(shiftJstMonth("bad", 1)).toBe("bad");
  });
});

describe("表示", () => {
  it("JST で整形する（実行環境のタイムゾーンに依存しない）", () => {
    expect(formatJstDateTime(new Date("2026-11-08T04:43:00.000Z"))).toBe("2026/11/08 13:43");
    expect(formatJstDateTime(new Date("2026-11-30T15:00:00.000Z"))).toBe("2026/12/01 00:00");
  });

  it("月を日本語で表示する", () => {
    expect(formatJstMonth("2026-11")).toBe("2026年11月");
  });
});
