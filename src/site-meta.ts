// サイト全体の <head>（メタ情報・OGP・favicon）。文言や URL を変えるときはここだけを直す。
// void.config.ts の head 既定値として使う。ページごとに変えたいときは pageHead() を各ページの head() で返す。

export const SITE = {
  name: "monemana",
  url: "https://monemana.hiro-to.moda",
  lang: "ja",
  locale: "ja_JP",
  description: "日々の支出をすばやく記録して、月ごと・カテゴリごとに振り返れる家計簿アプリ。",
  themeColor: "#0f766e",
  // 💸（Noto Emoji, Apache-2.0）。public/ に置いた静的ファイル。
  favicon: "/favicon.svg",
  ogImage: { path: "/og-image.png", width: 1200, height: 630 },
} as const;

type Meta = { name?: string; property?: string; content: string };

// OGP の共通部分。title / description / path はページごとに差し替えられる。
function ogMeta({ title, description, path }: { title: string; description: string; path: string }): Meta[] {
  return [
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE.name },
    { property: "og:locale", content: SITE.locale },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: new URL(path, SITE.url).toString() },
    { property: "og:image", content: new URL(SITE.ogImage.path, SITE.url).toString() },
    { property: "og:image:width", content: String(SITE.ogImage.width) },
    { property: "og:image:height", content: String(SITE.ogImage.height) },
    { name: "twitter:card", content: "summary_large_image" },
  ];
}

// サイト既定の head（void.config.ts 用）。
export function siteHead() {
  return {
    htmlAttrs: { lang: SITE.lang },
    meta: [
      // viewport が無いとスマホがデスクトップ幅(約980px)で描画する。ズームは塞がない(アクセシビリティ)。
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "description", content: SITE.description },
      { name: "theme-color", content: SITE.themeColor },
      ...ogMeta({ title: SITE.name, description: SITE.description, path: "/" }),
    ],
    link: [{ rel: "icon", href: SITE.favicon, type: "image/svg+xml" }],
  };
}

// ページ用の head()。例: `export const head = () => pageHead({ title: "カテゴリ", path: "/categories" })`
// title は <title> と og:title に使い、description を省くとサイト既定になる。
export function pageHead({ title, description = SITE.description, path }: { title: string; description?: string; path: string }) {
  const full = `${title} | ${SITE.name}`;
  return {
    title: full,
    meta: [{ name: "description", content: description }, ...ogMeta({ title: full, description, path })],
  };
}
