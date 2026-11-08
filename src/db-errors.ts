// DB の制約違反の判定。drizzle はドライバの例外を「Failed query: ...」で包み、
// 制約のメッセージは cause に入る。cause の連なりも含めて判定する。

function errorText(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current && depth < 6; depth += 1) {
    const message = (current as { message?: unknown }).message;
    parts.push(typeof message === "string" ? message : String(current));
    current = (current as { cause?: unknown }).cause;
  }
  return parts.join(" | ");
}

export const isUniqueViolation = (error: unknown): boolean => /UNIQUE constraint failed/i.test(errorText(error));

export const isForeignKeyViolation = (error: unknown): boolean =>
  /FOREIGN KEY constraint failed/i.test(errorText(error));
