import { describe, expect, it } from "vite-plus/test";
import { isPublicPath, shouldRedirectToLogin } from "./public-paths.ts";

describe("isPublicPath", () => {
  it("公開パスは未ログインでも通す", () => {
    for (const p of ["/login", "/login/", "/reset-password", "/api/auth", "/api/auth/sign-in/email", "/assets/app.js", "/favicon.svg", "/og-image.png"]) {
      expect(isPublicPath(p), p).toBe(true);
    }
  });

  it("それ以外はすべて認証必須（デフォルト拒否）", () => {
    for (const p of ["/", "/categories", "/api/hello", "/api/expenses", "/anything-new", "/api/authx", "/loginx", "/login/extra", "/assetsx/a.js", "//login"]) {
      expect(isPublicPath(p), p).toBe(false);
    }
  });
});

describe("shouldRedirectToLogin", () => {
  it("ページの GET / HEAD はログインへ誘導する", () => {
    expect(shouldRedirectToLogin("GET", "/")).toBe(true);
    expect(shouldRedirectToLogin("HEAD", "/categories")).toBe(true);
  });

  it("変更系と API は 401 にする", () => {
    expect(shouldRedirectToLogin("POST", "/")).toBe(false);
    expect(shouldRedirectToLogin("DELETE", "/")).toBe(false);
    expect(shouldRedirectToLogin("GET", "/api/expenses")).toBe(false);
  });
});
