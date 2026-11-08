import { categories, expenses } from "@schema";
import { createInsertSchema } from "void/drizzle-zod";
import { z } from "zod";
import {
  amountField,
  categoryIdField,
  categoryNameField,
  idField,
  itemNameField,
  spentAtField,
} from "./fields.ts";

// 入力の検証は drizzle-zod でテーブル定義から作り、項目ごとの検証（src/fields.ts）で上書きする。
// userId・createdAt・updatedAt はクライアントから受け取らない（サーバーで設定する）。

export const createExpenseSchema = createInsertSchema(expenses, {
  spentAt: spentAtField,
  amount: amountField,
  itemName: itemNameField,
  categoryId: categoryIdField,
}).pick({ spentAt: true, amount: true, itemName: true, categoryId: true });

export const updateExpenseSchema = createExpenseSchema.extend({ id: idField });

export const deleteExpenseSchema = z.object({ id: idField });

export const createCategorySchema = createInsertSchema(categories, {
  name: categoryNameField,
}).pick({ name: true });

export const renameCategorySchema = createCategorySchema.extend({ id: idField });

export const deleteCategorySchema = z.object({ id: idField });
