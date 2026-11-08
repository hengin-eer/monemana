<script setup lang="ts">
import { ref } from "vue";
import { Link } from "@void/vue";
import { auth } from "void/client";

// 全ページ共通のヘッダー（ナビ・ログイン中のメール・ログアウト）。
defineProps<{ email: string; current: "expenses" | "categories" }>();

const signingOut = ref(false);
const signOutError = ref("");

async function signOut() {
  if (signingOut.value) return;
  signingOut.value = true;
  signOutError.value = "";
  try {
    const result = await auth.signOut();
    if (result.error) {
      signOutError.value = "ログアウトできませんでした。もう一度お試しください。";
      return;
    }
    window.location.assign("/login");
  } catch {
    signOutError.value = "通信に失敗しました。もう一度お試しください。";
  } finally {
    signingOut.value = false;
  }
}

const linkClass =
  "rounded-sm py-1 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-[current=page]:font-bold aria-[current=page]:text-primary";
</script>

<template>
  <header class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-default py-3">
    <div class="flex items-center gap-6">
      <span class="font-bold">monemana</span>
      <nav aria-label="メイン">
        <ul class="flex gap-4 text-sm">
          <li><Link href="/" :class="linkClass" :aria-current="current === 'expenses' ? 'page' : undefined">支出</Link></li>
          <li><Link href="/categories" :class="linkClass" :aria-current="current === 'categories' ? 'page' : undefined">カテゴリ</Link></li>
        </ul>
      </nav>
    </div>
    <div class="flex items-center gap-3 text-sm">
      <span class="text-muted">{{ email }}</span>
      <UButton type="button" variant="outline" color="neutral" size="sm" :aria-disabled="signingOut" @click="signOut">
        {{ signingOut ? "処理中…" : "ログアウト" }}
      </UButton>
    </div>
    <p v-if="signOutError" role="alert" class="w-full text-sm text-error">{{ signOutError }}</p>
  </header>
</template>
