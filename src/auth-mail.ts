import { sendEmail } from "void/email";

// 送信元は Email Routing が有効なドメインのアドレスにする（無料プランの send_email バインディングの条件）。
export const AUTH_MAIL_FROM = "monemana <noreply@hiro-to.moda>";

export type AuthMailKind = "verification_email" | "password_reset_email";

// Better Auth は送信フックの例外を握りつぶしてログに出すだけで、レスポンスには載せない。
// そのため失敗はここで構造化ログに残し、観測できるようにする。
// ログにはメールアドレス・URL・トークンを出さない。
export async function sendAuthMail(kind: AuthMailKind, to: string, subject: string, text: string): Promise<void> {
  try {
    const result = await sendEmail({ from: AUTH_MAIL_FROM, to, subject, text });
    if (result.ok) return;
    const codes = "error" in result
      ? [result.error.code]
      : result.deliveries.filter((d) => !d.ok).map((d) => d.error.code);
    console.error(JSON.stringify({ event: "auth_mail_failed", kind, codes }));
  } catch (error) {
    console.error(JSON.stringify({
      event: "auth_mail_failed",
      kind,
      codes: [error instanceof Error ? error.name : "UNKNOWN"],
    }));
  }
}
