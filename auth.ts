import { defineAuth } from "void/auth";
import { sendEmail } from "void/email";

type AuthMailKind = "verification_email" | "password_reset_email";

// Better Auth は送信フックの例外を握りつぶしてログに出すだけで、レスポンスには載せない。
// そのため失敗はここで構造化ログに残し、観測できるようにする。
// ログにはメールアドレス・URL・トークンを出さない。
async function sendAuthMail(kind: AuthMailKind, to: string, subject: string, text: string): Promise<void> {
  try {
    const result = await sendEmail({ to, subject, text });
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

export default defineAuth(({ defaults, env }) => ({
  ...defaults,
  // defineAuth は深いマージをしないので、既定値を展開したうえで必要な項目だけ上書きする。
  emailAndPassword: {
    ...defaults.emailAndPassword,
    enabled: true,
    // メール確認が済むまでサインインさせない（許可メールの先取り登録でログインされるのを防ぐ）。
    requireEmailVerification: true,
    // 先取り登録された本人が回復できるようにする。
    sendResetPassword: async ({ user, url }) => {
      await sendAuthMail(
        "password_reset_email",
        user.email,
        "【monemana】パスワードの再設定",
        `次のリンクを開いて、新しいパスワードを設定してください。\n\n${url}\n\n心当たりがない場合は、このメールを破棄してください。`,
      );
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthMail(
        "verification_email",
        user.email,
        "【monemana】メールアドレスの確認",
        `monemana への登録ありがとうございます。\n次のリンクを開いてメールアドレスを確認してください。\n\n${url}\n\n心当たりがない場合は、このメールを破棄してください。`,
      );
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const allowedEmails = typeof env.ALLOWED_EMAILS === "string"
            ? env.ALLOWED_EMAILS.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean)
            : [];

          if (!allowedEmails.includes(user.email.trim().toLowerCase())) {
            return false;
          }
          return { data: user };
        },
      },
    },
  },
}));
