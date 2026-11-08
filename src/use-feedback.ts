// 成功・失敗の通知（トースト）。フォーカスは奪わない。
// 成功は polite（role=status 相当）で数秒後に消え、失敗は assertive（role=alert 相当）で閉じるまで残す。
// 失敗は消えてしまうと見落とすため、呼び出し側は項目ごとのインラインエラーも併せて出す。

/** fetch / action の失敗から、画面に出す短い文言を取り出す。 */
export function errorMessage(error: unknown): string {
  const body = (error as { body?: unknown } | null)?.body;
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

export function useFeedback() {
  const toast = useToast();
  return {
    success(title: string, description?: string) {
      toast.add({
        title,
        description,
        icon: "i-lucide-circle-check",
        color: "success",
        type: "background",
        duration: 3000,
      });
    },
    error(title: string, description?: string) {
      toast.add({
        title,
        description,
        icon: "i-lucide-circle-alert",
        color: "error",
        type: "foreground",
        duration: 0,
      });
    },
  };
}
