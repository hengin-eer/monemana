import { defineHandler } from "void";
import { getUser } from "void/auth";

export const loader = defineHandler((c) => {
  if (getUser()) return c.redirect("/");
  return {};
});
