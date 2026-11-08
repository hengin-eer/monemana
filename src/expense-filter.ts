import {
  currentJstMonth,
  formatJstMonth,
  isJstMonth,
  shiftJstMonth,
} from "./jst.ts";

// DB に依存しない部分（クエリの解釈・カーソル・月の移動）。純粋な関数なのでテストできる。

export const PAGE_SIZE = 30;

// ---- 絞り込み（URL のクエリ）----------------------------------------------

export type ExpenseFilter = {
  /** "YYYY-MM"（JST）。"all" は全期間。 */
  month: string;
  /** "none" は未分類。数値はカテゴリ ID。null は絞り込みなし。 */
  category: "none" | number | null;
};

/** 不正なクエリは既定値に戻す（今の JST の月・絞り込みなし）。 */
export function parseFilter(query: { month?: string; category?: string }, now = new Date()): ExpenseFilter {
  let month = currentJstMonth(now);
  if (query.month === "all" || (query.month !== undefined && isJstMonth(query.month))) month = query.month;
  let category: ExpenseFilter["category"] = null;
  if (query.category === "none") category = "none";
  else if (query.category && /^\d+$/.test(query.category)) category = Number(query.category);
  return { month, category };
}

/** 次ページの位置。(spentAt, id) の降順で、この行より後ろを返す。 */
export function encodeCursor(row: { spentAt: Date; id: number }): string {
  return `${row.spentAt.getTime()}_${row.id}`;
}

export function decodeCursor(cursor: string | undefined): { spentAt: Date; id: number } | null {
  const m = cursor ? /^(\d{1,16})_(\d{1,16})$/.exec(cursor) : null;
  return m ? { spentAt: new Date(Number(m[1])), id: Number(m[2]) } : null;
}

// ---- 一覧の 1 行（サーバーが整形して画面に渡す）-----------------------------------

export type ExpenseRow = {
  id: number;
  /** ISO 文字列（UTC の瞬間）。 */
  spentAt: string;
  /** 表示用（JST）。サーバーで整形して SSR とブラウザの食い違いを避ける。 */
  spentAtLabel: string;
  /** `datetime-local` 用（JST）。編集フォームに読み込む。 */
  spentAtInput: string;
  amount: number;
  itemName: string;
  categoryId: number | null;
  categoryName: string | null;
};

// ---- 月の移動（画面用）---------------------------------------------------------

export function monthNav(month: string, now = new Date()) {
  const isAll = month === "all";
  return {
    month,
    label: isAll ? "全期間" : formatJstMonth(month),
    prev: isAll ? null : shiftJstMonth(month, -1),
    next: isAll ? null : shiftJstMonth(month, 1),
    current: currentJstMonth(now),
  };
}

