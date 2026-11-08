// 未ログインでも開ける公開パス。ここに無いパスはすべて認証必須（デフォルト拒否）。
// 新しいページやルートを足すときは、認証チェックを書かなくても守られる。
// 公開したいパスだけをここに足す。

const PUBLIC_EXACT = new Set(["/login", "/reset-password", "/favicon.ico"]);
// 前方一致は「/」で終わる形にする（"/api/auth" と "/api/authx" を区別するため）。
const PUBLIC_PREFIXES = ["/api/auth/", "/assets/"];

/** 末尾の "/" を取り除く（"/login/" を "/login" と同じに扱う）。ルートの "/" はそのまま。 */
function normalize(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") || "/" : path;
}

export function isPublicPath(path: string): boolean {
  const p = normalize(path);
  if (PUBLIC_EXACT.has(p) || p === "/api/auth") return true;
  return PUBLIC_PREFIXES.some((prefix) => p.startsWith(prefix));
}

/** 画面の取得（ログインページへ誘導してよいリクエスト）か。API ルートは 401 にする。 */
export function shouldRedirectToLogin(method: string, path: string): boolean {
  return (method === "GET" || method === "HEAD") && !normalize(path).startsWith("/api/");
}
