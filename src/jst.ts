// JST（UTC+9 固定。日本は夏時間が無い）の変換を 1 か所に集約する。
// 保存は UTC の瞬間（epoch ms）。入力の解釈・表示・月の区切りだけ JST で行う。
// Workers は UTC で動くため、Date#getHours() や toLocaleString() の既定に任せない。

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

const LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

/** JST の壁時計の値から、その瞬間を作る。範囲外（2/30 など）は null。 */
function fromJstParts(year: number, month: number, day: number, hour = 0, minute = 0): Date | null {
  if (month < 1 || month > 12 || hour > 23 || minute > 59) return null;
  const utc = new Date(Date.UTC(year, month - 1, day, hour, minute) - JST_OFFSET_MS);
  const back = new Date(utc.getTime() + JST_OFFSET_MS);
  // 存在しない日付（2 月 30 日など）は Date.UTC が繰り上げるので、往復で一致を確かめる。
  if (
    back.getUTCFullYear() !== year ||
    back.getUTCMonth() !== month - 1 ||
    back.getUTCDate() !== day
  ) {
    return null;
  }
  return utc;
}

/** `datetime-local` の値（"2026-11-08T13:43"）を JST として解釈する。不正なら null。 */
export function parseJstLocal(value: string): Date | null {
  const m = LOCAL_PATTERN.exec(value);
  if (!m) return null;
  return fromJstParts(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]));
}

/** 瞬間を、`datetime-local` 用の JST の文字列 "YYYY-MM-DDTHH:mm" にする。 */
export function toJstLocalInput(date: Date): string {
  const j = new Date(date.getTime() + JST_OFFSET_MS);
  return (
    `${pad(j.getUTCFullYear(), 4)}-${pad(j.getUTCMonth() + 1)}-${pad(j.getUTCDate())}` +
    `T${pad(j.getUTCHours())}:${pad(j.getUTCMinutes())}`
  );
}

/** 今の JST の月 "YYYY-MM"。 */
export function currentJstMonth(now: Date = new Date()): string {
  return toJstLocalInput(now).slice(0, 7);
}

/** "YYYY-MM" が正しい月の表記か。 */
export function isJstMonth(value: string): boolean {
  return jstMonthRange(value) !== null;
}

/** "2026-11" → JST の月の [start, end)（半開区間）。不正なら null。 */
export function jstMonthRange(month: string): { start: Date; end: Date } | null {
  const m = MONTH_PATTERN.exec(month);
  if (!m) return null;
  const year = Number(m[1]);
  const mon = Number(m[2]);
  const start = fromJstParts(year, mon, 1);
  if (!start) return null;
  const end = mon === 12 ? fromJstParts(year + 1, 1, 1) : fromJstParts(year, mon + 1, 1);
  if (!end) return null;
  return { start, end };
}

/** 月を前後に動かす（"2026-12" + 1 → "2027-01"）。不正な月はそのまま返す。 */
export function shiftJstMonth(month: string, delta: number): string {
  const m = MONTH_PATTERN.exec(month);
  if (!m) return month;
  const index = Number(m[1]) * 12 + (Number(m[2]) - 1) + delta;
  return `${pad(Math.floor(index / 12), 4)}-${pad((index % 12) + 1)}`;
}

const dateTimeFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** 表示用: "2026/11/08 13:43"（JST）。SSR とブラウザで同じ結果になる。 */
export function formatJstDateTime(date: Date): string {
  return dateTimeFormat.format(date);
}

/** 表示用: "2026年11月"。 */
export function formatJstMonth(month: string): string {
  const m = MONTH_PATTERN.exec(month);
  return m ? `${Number(m[1])}年${Number(m[2])}月` : month;
}
