<script setup lang="ts">
import { getCurrentInstance } from "vue";
import uiPlugin from "@nuxt/ui/vue-plugin";
import { ja } from "@nuxt/ui/locale";
import "./app.css";

// Void creates the app internally. Install before UApp and its descendants run setup.
getCurrentInstance()!.appContext.app.use(uiPlugin);
</script>

<template>
  <div class="isolate">
    <UApp :locale="ja">
      <slot />
    </UApp>
  </div>
</template>
