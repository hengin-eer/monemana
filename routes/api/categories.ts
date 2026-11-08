import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { createCategory } from "../../src/category-service.ts";
import { createCategorySchema } from "../../src/validators.ts";

// 入力フォームのカテゴリ欄から、その場でカテゴリを作る。同名があればそれを返す（二重送信・競合の吸収）。
// ページの action ではなくここに置くのは、ページを作り直さずに入力途中の値を保つため。
export const POST = defineHandler.withValidator({ body: createCategorySchema })(async (c, { body }) => {
  const user = requireAuth(c);
  return createCategory(user.id, body.name, { reuseExisting: true });
});
