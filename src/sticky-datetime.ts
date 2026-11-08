import { parseJstLocal } from "./jst.ts";

// 直前に記録した日時を、タブ単位（sessionStorage）で引き継ぐ。
// 同じ日にいくつも続けて記録したり、日をまたいで時系列順にまとめて入力したりするため。
// ストレージが使えない環境（プライベートウィンドウなど）でも、入力そのものは動く。

const KEY = "monemana:last-spent-at";

export function readStickyDateTime(): string | null {
  try {
    const value = sessionStorage.getItem(KEY);
    return value && parseJstLocal(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeStickyDateTime(value: string): void {
  try {
    sessionStorage.setItem(KEY, value);
  } catch {
    // 保存できなくても記録は続けられる。
  }
}
