import { defineAuth } from "void/auth";
// auth.ts は Node 側で先に読み込まれ、拡張子なしの相対 import を解決できないため ".ts" を付ける。
import { sendAuthMail } from "./src/auth-mail.ts";

export default defineAuth(({ defaults, env }) => ({
  ...defaults,
  // defineAuth は深いマージをしないので、既定値を展開したうえで必要な項目だけ上書きする。
  emailAndPassword: {
    ...defaults.emailAndPassword,
    enabled: true,
    // メール確認が済むまでサインインさせない（許可メールの先取り登録でログインされるのを防ぐ）。
    requireEmailVerification: true,
    // 再設定したら既存セッションを失効させる（第三者がログイン済みでも締め出せるように）。
    revokeSessionsOnPasswordReset: true,
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
