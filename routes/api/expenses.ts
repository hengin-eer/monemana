import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";
import { listExpenses } from "../../src/expense-queries.ts";
import { parseFilter } from "../../src/expense-filter.ts";

// 「さらに 30 件読み込む」用。cursor の後ろの 30 件を返す。認証は middleware が守り、
// ここでも requireAuth で userId を取り出す（自分の支出だけを返す）。
export const GET = defineHandler.withValidator({
  query: z.object({
    month: z.string().optional(),
    category: z.string().optional(),
    cursor: z.string().optional(),
  }),
})(async (c, { query }) => {
  const user = requireAuth(c);
  return listExpenses(user.id, parseFilter(query), query.cursor);
});
