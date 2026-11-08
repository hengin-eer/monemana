import { defineMiddleware } from "void";
import { requireAuth } from "void/auth";
import { HTTPException } from "hono/http-exception";
import { isPublicPath, shouldRedirectToLogin } from "../src/public-paths.ts";

// 認証のデフォルト拒否。公開パス（src/public-paths.ts）以外は、ページ・API・変更系を問わず
// ログイン済みでなければ通さない。各ページや API ルートは認証チェックを書き忘れても守られる。
export default defineMiddleware(async (c, next) => {
  if (!isPublicPath(c.req.path)) {
    try {
      requireAuth(c);
    } catch (error) {
      if (error instanceof HTTPException && error.status === 401 && shouldRedirectToLogin(c.req.method, c.req.path)) {
        return c.redirect("/login");
      }
      throw error;
    }
  }
  await next();
});
