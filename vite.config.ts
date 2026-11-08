import { defineConfig } from "vite";
import { voidPlugin } from "void";
import { voidVue } from "@void/vue/plugin";
import ui from "@nuxt/ui/vite";

export default defineConfig({
  plugins: [voidPlugin(), voidVue(), ui({ colorMode: false, router: false, ui: { colors: { primary: "blue", neutral: "slate" } } })],
});
