import { defineConfig } from "vite";
import { voidPlugin } from "void";
import { voidVue } from "@void/vue/plugin";
import ui from "@nuxt/ui/vite";
import tailwindColors from "tailwindcss/colors";

// Nuxt UI のカラー設定。primary は白文字・リンク文字との対比を AA（4.5:1）以上にするため青を使う。
const uiColors = {
  primary: "blue",
  secondary: "blue",
  success: "green",
  info: "blue",
  warning: "yellow",
  error: "red",
  neutral: "slate",
} as const;

// 既定の solid ボタンは hover / active で primary を 75% に透かす。白文字との対比が 4.5:1 を下回るため、
// 不透明な 700 番に置き換える（twMerge で既定の hover:bg-primary/75 より後ろのクラスが勝つ）。
const uiButton = {
  compoundVariants: [
    {
      color: "primary",
      variant: "solid",
      class: "hover:bg-(--ui-color-primary-700) active:bg-(--ui-color-primary-700)",
    },
  ],
};

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

// Nuxt UI は色の CSS 変数（--ui-color-*）を実行時に Unhead 経由で出す。
// Void の SSR は Unhead を HTML に出力しないため、JS が動くまで（初回表示・JS 失敗時）色が解決されず、
// 白文字のボタンが白背景に溶ける。同じ定義を静的な CSS として SSR にも含める。
// 値は上の uiColors から作るので、色を変えるときは 1 か所だけ直せばよい（ダークモードは使わない）。
function uiColorsCss() {
  const id = "virtual:ui-colors.css";
  const resolvedId = `\0${id}`;
  const palette = tailwindColors as unknown as Record<string, Record<string, string> | string>;
  const shades = Object.entries(uiColors)
    .map(([key, value]) =>
      SHADES.map((shade) => {
        const color = palette[value];
        const fallback = typeof color === "object" ? (color[shade] ?? "") : "";
        return `--ui-color-${key}-${shade}: var(--color-${value}-${shade}, ${fallback});`;
      }).join("\n    "),
    )
    .join("\n    ");
  const roles = Object.keys(uiColors)
    .filter((key) => key !== "neutral")
    .map((key) => `--ui-${key}: var(--ui-color-${key}-500);`)
    .join("\n    ");
  const css = `@layer theme {\n  :root, :host {\n    ${shades}\n  }\n  :root, :host, .light {\n    ${roles}\n  }\n}\n`;
  return {
    name: "monemana:ui-colors",
    resolveId: (source: string) => (source === id ? resolvedId : undefined),
    load: (loaded: string) => (loaded === resolvedId ? css : undefined),
  };
}

export default defineConfig({
  plugins: [voidPlugin(), voidVue(), uiColorsCss(), ui({ colorMode: false, router: false, ui: { colors: uiColors, button: uiButton } })],
});
