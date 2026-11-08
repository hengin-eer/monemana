import { categories, expenses } from "@schema";
import { and, count, db, desc, eq, gte, isNull, lt, or, sql, sum } from "void/db";
import { HTTPException } from "hono/http-exception";
import { assertOwnedCategory } from "./category-service.ts";
import {
  type ExpenseFilter,
  type ExpenseRow,
  PAGE_SIZE,
  decodeCursor,
  encodeCursor,
} from "./expense-filter.ts";
import { formatJstDateTime, jstMonthRange, toJstLocalInput } from "./jst.ts";

function conditions(userId: string, filter: ExpenseFilter) {
  const where = [eq(expenses.userId, userId)];
  const range = filter.month === "all" ? null : jstMonthRange(filter.month);
  if (range) where.push(gte(expenses.spentAt, range.start), lt(expenses.spentAt, range.end));
  if (filter.category === "none") where.push(isNull(expenses.categoryId));
  else if (typeof filter.category === "number") where.push(eq(expenses.categoryId, filter.category));
  return where;
}

// ---- 一覧（keyset ページング）---------------------------------------------

export async function listExpenses(
  userId: string,
  filter: ExpenseFilter,
  cursor?: string,
): Promise<{ items: ExpenseRow[]; nextCursor: string | null }> {
  const where = conditions(userId, filter);
  const after = decodeCursor(cursor);
  if (after) {
    where.push(
      or(
        lt(expenses.spentAt, after.spentAt),
        and(eq(expenses.spentAt, after.spentAt), lt(expenses.id, after.id)),
      )!,
    );
  }
  const rows = await db
    .select({
      id: expenses.id,
      spentAt: expenses.spentAt,
      amount: expenses.amount,
      itemName: expenses.itemName,
      categoryId: expenses.categoryId,
      categoryName: categories.name,
    })
    .from(expenses)
    .leftJoin(categories, eq(expenses.categoryId, categories.id))
    .where(and(...where))
    .orderBy(desc(expenses.spentAt), desc(expenses.id))
    .limit(PAGE_SIZE + 1);

  const page = rows.slice(0, PAGE_SIZE);
  return {
    items: page.map((r) => ({
      id: r.id,
      spentAt: r.spentAt.toISOString(),
      spentAtLabel: formatJstDateTime(r.spentAt),
      spentAtInput: toJstLocalInput(r.spentAt),
      amount: r.amount,
      itemName: r.itemName,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
    })),
    nextCursor: rows.length > PAGE_SIZE ? encodeCursor(page[page.length - 1]) : null,
  };
}

export async function countExpenses(userId: string, filter: ExpenseFilter): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(expenses)
    .where(and(...conditions(userId, filter)));
  return row?.n ?? 0;
}

// ---- 集計（月全体。一覧に読み込んだ件数ではない）------------------------------

export type Summary = {
  total: number;
  count: number;
  breakdown: { categoryId: number | null; name: string | null; total: number; count: number }[];
};

export async function summarize(userId: string, month: string): Promise<Summary> {
  // 集計はカテゴリの絞り込みの影響を受けない（その月全体の内訳を見せる）。
  const rows = await db
    .select({
      categoryId: expenses.categoryId,
      name: categories.name,
      total: sum(expenses.amount),
      count: count(),
    })
    .from(expenses)
    .leftJoin(categories, eq(expenses.categoryId, categories.id))
    .where(and(...conditions(userId, { month, category: null })))
    .groupBy(expenses.categoryId)
    .orderBy(desc(sql`sum(${expenses.amount})`));

  const breakdown = rows.map((r) => ({
    categoryId: r.categoryId,
    name: r.name,
    total: Number(r.total ?? 0),
    count: r.count,
  }));
  return {
    total: breakdown.reduce((acc, r) => acc + r.total, 0),
    count: breakdown.reduce((acc, r) => acc + r.count, 0),
    breakdown,
  };
}

// ---- 書き込み（すべて userId で絞る）----------------------------------------------

type ExpenseInput = { spentAt: Date; amount: number; itemName: string; categoryId: number | null };

export async function createExpense(userId: string, input: ExpenseInput): Promise<void> {
  await assertOwnedCategory(userId, input.categoryId);
  await db.insert(expenses).values({ ...input, userId });
}

/** 他人の行・存在しない行は 404。 */
export async function updateExpense(userId: string, id: number, input: ExpenseInput): Promise<void> {
  await assertOwnedCategory(userId, input.categoryId);
  const updated = await db
    .update(expenses)
    .set(input)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
    .returning({ id: expenses.id });
  if (updated.length === 0) throw new HTTPException(404, { message: "支出が見つかりません" });
}

export async function deleteExpense(userId: string, id: number): Promise<void> {
  const deleted = await db
    .delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
    .returning({ id: expenses.id });
  if (deleted.length === 0) throw new HTTPException(404, { message: "支出が見つかりません" });
}
