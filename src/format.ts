const yen = new Intl.NumberFormat("ja-JP");

/** 金額の表示: "1,200円"。SSR とブラウザで同じ結果になる。 */
export function formatYen(amount: number): string {
  return `${yen.format(amount)}円`;
}
