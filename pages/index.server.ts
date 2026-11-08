import { defineHandler, type InferProps } from "void";
import { requireAuth } from "void/auth";
import { listCategories } from "../src/category-service.ts";
import { monthNav, parseFilter } from "../src/expense-filter.ts";
import {
  countExpenses,
  createExpense,
  deleteExpense,
  listExpenses,
  summarize,
  updateExpense,
} from "../src/expense-queries.ts";
import { toJstLocalInput } from "../src/jst.ts";
import {
  createExpenseSchema,
  deleteExpenseSchema,
  updateExpenseSchema,
} from "../src/validators.ts";

export type Props = InferProps<typeof loader>;

export const loader = defineHandler(async (c) => {
  // 未ログインのリクエストは middleware（デフォルト拒否）がここに到達する前に止める。
  const user = requireAuth(c);
  const now = new Date();
  const filter = parseFilter({ month: c.req.query("month"), category: c.req.query("category") }, now);

  const [categories, list, totalCount, summary] = await Promise.all([
    listCategories(user.id),
    listExpenses(user.id, filter),
    countExpenses(user.id, filter),
    summarize(user.id, filter.month),
  ]);

  return {
    email: user.email,
    filter,
    nav: monthNav(filter.month, now),
    categories,
    expenses: list.items,
    nextCursor: list.nextCursor,
    totalCount,
    summary,
    // フォームの日時の初期値（JST の今）。サーバーで決めて SSR とブラウザで同じ値にする。
    defaultSpentAt: toJstLocalInput(now),
  };
});

// 作成は POST、更新は PUT ?update、削除は DELETE ?delete。
export const actions = {
  default: defineHandler.withValidator({ body: createExpenseSchema })(async (c, { body }) => {
    const user = requireAuth(c);
    await createExpense(user.id, body);
  }),

  update: defineHandler.withValidator({ body: updateExpenseSchema })(async (c, { body }) => {
    const user = requireAuth(c);
    const { id, ...input } = body;
    await updateExpense(user.id, id, input);
  }),

  delete: defineHandler.withValidator({ body: deleteExpenseSchema })(async (c, { body }) => {
    const user = requireAuth(c);
    await deleteExpense(user.id, body.id);
  }),

};
