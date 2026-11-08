import { z } from "zod";
import { parseJstLocal } from "./jst.ts";
import { parseAmount } from "./money.ts";

// フォームの各項目の検証。drizzle-zod の列定義に上書きして使う（src/validators.ts）。
// 画面とサーバーで同じ文言を使う。

export const amountField = z.union([z.string(), z.number()]).transform((value, ctx) => {
  const amount = parseAmount(value);
  if (amount === null) {
    ctx.addIssue({ code: "custom", message: "金額は1円以上、1,000億円以下の整数で入力してください" });
    return z.NEVER;
  }
  return amount;
});

export const itemNameField = z
  .string()
  .trim()
  .min(1, "商品名を入力してください")
  .max(100, "商品名は100文字以内で入力してください");

/** `datetime-local` の値（"2026-11-08T13:43"）を JST として解釈した Date にする。 */
export const spentAtField = z.string().transform((value, ctx) => {
  const date = parseJstLocal(value);
  if (!date) {
    ctx.addIssue({ code: "custom", message: "日時を正しく入力してください" });
    return z.NEVER;
  }
  return date;
});

/** 未分類は null。 */
export const categoryIdField = z
  .number({ error: "カテゴリを正しく選択してください" })
  .int("カテゴリを正しく選択してください")
  .positive("カテゴリを正しく選択してください")
  .nullable();

export const categoryNameField = z
  .string()
  .trim()
  .min(1, "カテゴリ名を入力してください")
  .max(30, "カテゴリ名は30文字以内で入力してください");

export const idField = z.number().int().positive();
