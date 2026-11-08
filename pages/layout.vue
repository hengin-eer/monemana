<script setup lang="ts">
import { getCurrentInstance } from "vue";
import uiPlugin from "@nuxt/ui/vue-plugin";
import { ja } from "@nuxt/ui/locale";
import "virtual:ui-colors.css";
import "./app.css";

// Void は app を内部で生成し、app.use を差し込む公開フックがない。
// そこでルートのレイアウトの setup で、子孫（UApp など）の setup より前に差し込む。
// SSR はリクエストごとに app を作る。head プラグインは usehead が既にあれば何もしないので、
// HMR などでこの setup が再実行されたときは、再 install しない。
const app = getCurrentInstance()!.appContext.app;
if (!app._context.provides.usehead) app.use(uiPlugin);
</script>

<template>
  <div class="isolate">
    <UApp :locale="ja">
      <slot />
    </UApp>
  </div>
</template>
