# monemana

## 認証の設定

ローカル開発ではルートの `.env` に登録を許可するメールアドレスを設定します。
複数の場合はカンマで区切ります。前後の空白と大文字・小文字は無視します。

```dotenv
ALLOWED_EMAILS=owner@example.com
```

```sh
pnpm install
pnpm exec void env check
pnpm exec vp dev
```

`/login` の「初回登録」からアカウントを作成すると確認メールが届きます。
メール内のリンクを開いて確認を済ませると登録が完了し、以降はログインを使います。
メール確認が済むまではログインできません（ログインを試すと確認メールを再送します）。
ローカル開発では、確認メールは実送信されず Void のローカル受信箱に溜まります。
本番は Cloudflare の `send_email` バインディングで送信します（Workers Free の構成）。
Workers Free では検証済みの宛先にしか送れないため、`ALLOWED_EMAILS` の各アドレスを
Cloudflare の Email Routing の「Destination addresses」に追加し、受信者が確認リンクを開いて検証済みにしてください。
未検証の宛先に送ると、ログに `auth_mail_failed`（`UNVERIFIED_DESTINATION`）が残り、メールは届きません。
送信元は Email Routing が有効なドメインのアドレス（`src/auth-mail.ts` の `AUTH_MAIL_FROM`）です。

確認メールが届かない場合は、ログイン画面の「確認メールを再送」を使います（60秒の間隔あり）。
パスワードを忘れた場合や、登録後にログインできない場合は `/reset-password` から再設定できます。

メール送信の失敗は Better Auth の仕様でレスポンスに載せられないため、画面では送信成功を断定しません。
失敗は Worker のログに `{"event":"auth_mail_failed","kind":...,"codes":[...]}` として残ります
（メールアドレス・URL・トークンは含めません）。エラーコードと画面文言の対応は `src/auth-errors.ts` にあります。

許可リストが空なら新規登録はすべて拒否します。リストは新規登録時のみ判定し、
登録済みアカウントのログイン権限を取り消すものではありません。

本番ではデプロイ前に、許可するメールアドレスを Worker の secret として設定します。
ローカルの `.env` はアップロードされません。

```sh
pnpm exec void secret put ALLOWED_EMAILS
```

`BETTER_AUTH_SECRET` は Void がデプロイ時に自動生成します。
Cloudflare への直接デプロイ用に auth テーブルのマイグレーションをコミットしています。
認証設定を変更した場合は `pnpm exec void db generate` で再生成し、SQL を確認してください。

## 確認方法

```sh
pnpm exec vp build
```

- 未ログインで `/` を開くと `/login` に移動する。
- 未ログインで `POST /` を送ると、入力内容にかかわらず 401 になる。
- 許可されていないメールの初回登録が拒否される。
- 許可されたメールで初回登録すると確認メールが届き、確認前はログインできない。
- 確認リンクを開くとログイン状態でトップページを表示できる。
- 登録直後と未確認ログイン時に「確認メールを再送」が表示され、押すと60秒間は無効になる。
- `/reset-password` で依頼したメールのリンクから新しいパスワードを設定し、そのパスワードでログインできる。
- 無効・期限切れの再設定リンクを開くと、画面にエラー文言が表示される。
- 送信に失敗する宛先（未承認など）で登録すると、ログに `auth_mail_failed` が残る。
- ログアウト後に `/` を開くと再び `/login` に移動する。
- 登録済みのメールとパスワードで再ログインできる。

支出 CRUD は Issue #1 の対象です。既存の messages サンプルは残しています。

## UI（Nuxt UI + Tailwind CSS）

- Nuxt UI のコンポーネント（`UButton` など）と `useToast` は自動で import されます。
- 型定義の `auto-imports.d.ts` / `components.d.ts` は `vp dev` または `vp build` を一度実行すると生成されます（git では管理しません）。
  新しく clone した直後は、型チェックの前に `pnpm exec vp build` を実行してください。
- `@void/vue` にはアプリの初期化に差し込む公開フックがないため、`pages/layout.vue` の `setup` で Nuxt UI のプラグインを差し込んでいます。
- Nuxt UI は色の CSS 変数を実行時に出しますが、Void の SSR には含まれないため、`vite.config.ts` の `uiColors` から静的な CSS（`virtual:ui-colors.css`）を作って補っています。色を変えるときは `uiColors` を直してください。
