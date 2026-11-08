// 金額の入力を整数の円にそろえる。全角数字、カンマ、「¥」「円」、空白を許す。
// 入力補助（クライアント）と検証（サーバー）で同じ関数を使う。

/** 1 以上の安全な整数の円にする。解釈できなければ null。 */
export function parseAmount(input: unknown): number | null {
  if (typeof input === "number") {
    return Number.isSafeInteger(input) && input >= 1 ? input : null;
  }
  if (typeof input !== "string") return null;
  // NFKC で全角数字・全角記号を半角にそろえてから、区切りと通貨記号を取り除く。
  const digits = input.normalize("NFKC").replace(/[\s,、¥円]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  const n = Number(digits);
  return Number.isSafeInteger(n) && n >= 1 ? n : null;
}
