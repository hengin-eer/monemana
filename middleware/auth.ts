import { defineMiddleware } from "void";
import { requireAuth } from "void/auth";

// Reject unauthenticated mutations before the page action validates its input.
export default defineMiddleware(async (c, next) => {
  if (c.req.path === "/" && !["GET", "HEAD"].includes(c.req.method)) {
    requireAuth(c);
  }
  await next();
});
