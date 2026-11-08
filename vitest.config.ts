import { defineConfig } from "vite-plus";

// Void / Vue のプラグインを読み込まず、純粋な関数のテストだけを実行する。
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
