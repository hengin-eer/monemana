import { defineHandler, type InferProps } from "void";
import { requireAuth } from "void/auth";
import {
  createCategory,
  deleteCategory,
  listCategories,
  renameCategory,
} from "../src/category-service.ts";
import {
  createCategorySchema,
  deleteCategorySchema,
  renameCategorySchema,
} from "../src/validators.ts";

export type Props = InferProps<typeof loader>;

export const loader = defineHandler(async (c) => {
  const user = requireAuth(c);
  return { email: user.email, categories: await listCategories(user.id) };
});

// 追加は POST、名前変更は PUT ?rename、削除は DELETE ?delete。
export const actions = {
  default: defineHandler.withValidator({ body: createCategorySchema })(async (c, { body }) => {
    const user = requireAuth(c);
    await createCategory(user.id, body.name);
  }),

  rename: defineHandler.withValidator({ body: renameCategorySchema })(async (c, { body }) => {
    const user = requireAuth(c);
    await renameCategory(user.id, body.id, body.name);
  }),

  delete: defineHandler.withValidator({ body: deleteCategorySchema })(async (c, { body }) => {
    const user = requireAuth(c);
    await deleteCategory(user.id, body.id);
  }),
};
