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

`/login` の「初回登録」からアカウントを作成し、以降はログインを使います。
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
- 許可されたメールで初回登録後、トップページを表示できる。
- ログアウト後に `/` を開くと再び `/login` に移動する。
- 登録済みのメールとパスワードで再ログインできる。

支出 CRUD は Issue #1 の対象です。既存の messages サンプルは残しています。
