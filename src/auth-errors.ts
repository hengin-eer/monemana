// Better Auth のエラーコード → 画面に出す日本語文言。
// サーバーの message には依存せず、コードで文言を決める。
// 入口（登録・ログイン）は列挙対策のため、あえて具体的な理由を伏せた文言にしている。

export type AuthClientError = {
  code?: string;
  status?: number;
  message?: string;
} | null | undefined;

export const DEFAULT_AUTH_ERROR = "うまくいきませんでした。時間をおいてもう一度お試しください。";
const RATE_LIMITED = "短時間に操作が多すぎます。少し待ってからもう一度お試しください。";
const SERVER_ERROR = "サーバーで問題が起きました。時間をおいてもう一度お試しください。";
const SIGN_UP_FAILED = "登録できませんでした。許可されたメールアドレスか確認してください。登録済みの場合はログインしてください。";

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  EMAIL_NOT_VERIFIED: "メールアドレスが未確認です。確認メールを再送したので、届いたリンクを開いてください。",
  INVALID_EMAIL_OR_PASSWORD:
    "メールアドレスまたはパスワードが正しくありません。登録直後なら、確認メールのリンクを開いたか確認してください。パスワードを忘れた場合は再設定できます。",
  FAILED_TO_CREATE_USER: SIGN_UP_FAILED,
  USER_ALREADY_EXISTS: SIGN_UP_FAILED,
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: SIGN_UP_FAILED,
  INVALID_EMAIL: "メールアドレスの形式が正しくありません。",
  PASSWORD_TOO_SHORT: "パスワードが短すぎます。8文字以上で入力してください。",
  PASSWORD_TOO_LONG: "パスワードが長すぎます。128文字以下で入力してください。",
  INVALID_TOKEN: "リンクが無効です。もう一度再設定をお申し込みください。",
  TOKEN_EXPIRED: "リンクの期限が切れています。もう一度再設定をお申し込みください。",
  EMAIL_ALREADY_VERIFIED: "すでに確認済みです。ログインしてください。",
};

export function authErrorMessage(error: AuthClientError): string {
  if (!error) return DEFAULT_AUTH_ERROR;
  if (error.code && AUTH_ERROR_MESSAGES[error.code]) return AUTH_ERROR_MESSAGES[error.code]!;
  if (error.status === 429) return RATE_LIMITED;
  if (error.status && error.status >= 500) return SERVER_ERROR;
  return DEFAULT_AUTH_ERROR;
}
