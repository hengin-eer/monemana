import { index, integer, sqliteTable, text, uniqueIndex } from "void/schema-d1";

// 認証テーブル（user など）は Void が管理する。ここでは FK の参照先として宣言するだけで、
// export しない（export するとマイグレーションに user テーブルが重複して作られる）。
const user = sqliteTable("user", {
  id: text("id").primaryKey(),
});

export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("categories_user_name_unique").on(t.userId, t.name)],
);

export const expenses = sqliteTable(
  "expenses",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    spentAt: integer("spent_at", { mode: "timestamp_ms" }).notNull(),
    amount: integer("amount").notNull(),
    itemName: text("item_name").notNull(),
    // 未分類を許す。使用中のカテゴリは削除できない（restrict）。
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "restrict" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("expenses_user_spent_at_idx").on(t.userId, t.spentAt),
    index("expenses_category_idx").on(t.categoryId),
  ],
);
