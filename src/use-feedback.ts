// 成功・失敗の通知（トースト）。フォーカスは奪わない。
// 成功は polite（role=status 相当）で数秒後に消え、失敗は assertive（role=alert 相当）で閉じるまで残す。
// 失敗は消えてしまうと見落とすため、呼び出し側は項目ごとのインラインエラーも併せて出す。

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
