import { categories, expenses } from "@schema";
import { and, count, db, eq } from "void/db";
import { ValidationError } from "void/handler";
import { HTTPException } from "hono/http-exception";
import { isForeignKeyViolation, isUniqueViolation } from "./db-errors.ts";

// カテゴリの読み書き。すべて userId で絞り、他人のカテゴリには触れない。


export type CategoryWithUsage = { id: number; name: string; usageCount: number };

export async function listCategories(userId: string): Promise<CategoryWithUsage[]> {
  const rows = await db
    .select({ id: categories.id, name: categories.name, usageCount: count(expenses.id) })
    .from(categories)
    .leftJoin(expenses, eq(expenses.categoryId, categories.id))
    .where(eq(categories.userId, userId))
    .groupBy(categories.id)
    .orderBy(categories.id);
  return rows;
}

/** 自分のカテゴリか確認する。他人のカテゴリ・存在しない ID は項目エラーにする。 */
export async function assertOwnedCategory(userId: string, categoryId: number | null): Promise<void> {
  if (categoryId === null) return;
  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .limit(1);
  if (!row) throw new ValidationError({ categoryId: "カテゴリが見つかりません" });
}

const findByName = async (userId: string, name: string) => {
  const [row] = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.name, name)))
    .limit(1);
  return row;
};

/**
 * カテゴリを作る。
 * reuseExisting: 入力フォームからその場で作るときは、同名があればそれを返す（二重送信・競合を吸収する）。
 * それ以外（管理画面）は、同名を「同じ名前のカテゴリがあります」のエラーにする。
 */
export async function createCategory(
  userId: string,
  name: string,
  options: { reuseExisting?: boolean } = {},
): Promise<{ id: number; name: string }> {
  const existing = await findByName(userId, name);
  if (existing) {
    if (options.reuseExisting) return existing;
    throw new ValidationError({ name: "同じ名前のカテゴリがあります" });
  }
  try {
    const [created] = await db
      .insert(categories)
      .values({ userId, name })
      .returning({ id: categories.id, name: categories.name });
    return created;
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    // 直前に別のリクエストが同名を作った場合。
    const raced = await findByName(userId, name);
    if (raced && options.reuseExisting) return raced;
    throw new ValidationError({ name: "同じ名前のカテゴリがあります" });
  }
}

export async function renameCategory(userId: string, id: number, name: string): Promise<void> {
  const existing = await findByName(userId, name);
  if (existing && existing.id !== id) throw new ValidationError({ name: "同じ名前のカテゴリがあります" });
  try {
    const updated = await db
      .update(categories)
      .set({ name })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning({ id: categories.id });
    if (updated.length === 0) throw new HTTPException(404, { message: "カテゴリが見つかりません" });
  } catch (error) {
    if (isUniqueViolation(error)) throw new ValidationError({ name: "同じ名前のカテゴリがあります" });
    throw error;
  }
}

const inUseMessage = (name: string, n: number) =>
  `「${name}」は${n}件の支出で使われているため削除できません。支出のカテゴリを変更してから削除してください。`;

/** 使用中のカテゴリは削除できない（件数つきのエラーにする）。 */
export async function deleteCategory(userId: string, id: number): Promise<void> {
  const [category] = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .limit(1);
  if (!category) throw new HTTPException(404, { message: "カテゴリが見つかりません" });

  const usage = async () => {
    const [row] = await db
      .select({ n: count() })
      .from(expenses)
      .where(and(eq(expenses.userId, userId), eq(expenses.categoryId, id)));
    return row?.n ?? 0;
  };

  const before = await usage();
  if (before > 0) throw new HTTPException(409, { message: inUseMessage(category.name, before) });

  try {
    await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
  } catch (error) {
    // 件数の確認と削除の間に別の支出が登録された場合は、外部キー制約が止める。
    if (isForeignKeyViolation(error)) {
      throw new HTTPException(409, { message: inUseMessage(category.name, await usage()) });
    }
    throw error;
  }
}
