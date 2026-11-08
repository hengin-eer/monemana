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

## 支出の記録

- `/` で支出を記録・一覧・編集・削除します。`/categories` でカテゴリを追加・名前変更・削除します。
- カテゴリは任意です（未分類のまま記録できます）。使用中のカテゴリは削除できません。
- 日時は JST（UTC+9）で入力・表示します。保存は UTC の瞬間です（`src/jst.ts`）。
- 連続入力: Tab 順は 日時 → 金額 → 商品名 → カテゴリ → 追加。どの入力欄でも Enter で送信できます。
  記録すると金額と商品名だけが空になり、フォーカスは金額に戻ります。日時とカテゴリは直前の値が残ります（日時はタブ単位）。
- カテゴリ欄は、Space / Enter / ↓ で開き、入力で検索し、一致するものがなければその場で作成できます。
- 一覧は 30 件ずつ表示し、「さらに30件読み込む」で追加します。月ごとの合計とカテゴリ別の内訳は、一覧に読み込んだ件数ではなく月全体を集計します。

## テスト

```sh
pnpm test
```

DB に依存しない純粋な部分（`src/jst.ts`、金額・項目の検証、クエリの解釈、公開パスの判定など）をテストします。

## 認証の守り方

`middleware/auth.ts` が、公開パス（`src/public-paths.ts`）以外のすべてのリクエストを、ログイン済みでなければ止めます
（ページの取得は `/login` へリダイレクト、それ以外は 401）。新しいページや API ルートを足しても、認証チェックを書き忘れて公開されることはありません。
公開したいパスだけを `src/public-paths.ts` に足してください。

## UI（Nuxt UI + Tailwind CSS）

- Nuxt UI のコンポーネント（`UButton` など）と `useToast` は自動で import されます。
- 型定義の `auto-imports.d.ts` / `components.d.ts` は `vp dev` または `vp build` を一度実行すると生成されます（git では管理しません）。
  新しく clone した直後は、型チェックの前に `pnpm exec vp build` を実行してください。
- `@void/vue` にはアプリの初期化に差し込む公開フックがないため、`pages/layout.vue` の `setup` で Nuxt UI のプラグインを差し込んでいます。
- Nuxt UI は色の CSS 変数を実行時に出しますが、Void の SSR には含まれないため、`vite.config.ts` の `uiColors` から静的な CSS（`virtual:ui-colors.css`）を作って補っています。色を変えるときは `uiColors` を直してください。

## デプロイ

手元から手動で行う（GitHub Actions の自動デプロイは止めている）。

```sh
git checkout main && git pull
pnpm install --frozen-lockfile
pnpm exec void deploy --platform cloudflare
```

- 事前に `pnpm exec void cloudflare status` でログイン状態を確認する。
- `.env.local` があるとビルドが失敗する（`void/env supports one local file: .env`）。置かない。
- 破壊的なマイグレーション（`DROP` など）は、SQL の先頭に `-- void:allow-destructive` が無いと止まる。
- 自動デプロイが止まっている理由: CI では起動確認が `Cloudflare Access blocked the uploaded Worker Version readiness probe` で失敗する。原因は未特定（Access は未使用、`CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_WORKERS_SUBDOMAIN` は設定済みでも再現）。再開する時は `.github/workflows/void-deploy.yml` に `push` トリガーを戻す。
