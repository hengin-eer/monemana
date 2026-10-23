import { defineHandler, type InferProps } from "void";
import { db, desc } from "void/db";
import { messages } from "@schema";
import { createInsertSchema } from "void/drizzle-zod";
import { getUser, requireAuth } from "void/auth";

export type Props = InferProps<typeof loader>;

export const loader = defineHandler(async (c) => {
  if (!getUser()) return c.redirect("/login");
  const user = requireAuth(c);
  const rows = await db.select().from(messages).orderBy(desc(messages.id));
  return { messages: rows, email: user.email };
});
export const action = defineHandler.withValidator({
  body: createInsertSchema(messages, { text: schema => schema.trim().min(1).max(1000) }).pick({ text: true }),
})(async (c, { body }) => {
  requireAuth(c);
  await db.insert(messages).values(body);
});
