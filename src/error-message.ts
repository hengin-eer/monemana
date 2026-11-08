// fetch / action の失敗から、画面に出す短い文言を取り出す。
// - 検証エラー: { errors: { 項目: "文言" } } の最初の文言
// - HTTPException（409 など）: text/plain の本文がそのまま文言
// - { message: "..." } 形式
// - どれでもなければ Error の message、それも無ければ汎用の文言
export function errorMessage(error: unknown): string {
  const body = (error as { body?: unknown } | null)?.body;
  if (typeof body === "string" && body.trim()) return body.trim().slice(0, 300);
  if (body && typeof body === "object") {
    const record = body as { message?: unknown; errors?: unknown };
    if (record.errors && typeof record.errors === "object") {
      const first = Object.values(record.errors as Record<string, unknown>).find((v) => typeof v === "string");
      if (typeof first === "string") return first;
    }
    if (typeof record.message === "string" && record.message) return record.message;
  }
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === "string" && message ? message : "もう一度お試しください。";
}
