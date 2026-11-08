<script setup lang="ts">
import type { Props } from "./index.server";
import { Form, useForm } from "@void/vue";
import { ref } from "vue";
import { auth } from "void/client";

defineProps<Props>();
const form = useForm("/", { text: "" });
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
</script>

<template>
  <main class="mx-auto max-w-2xl space-y-6 px-4 py-8">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-muted">{{ email }}</p>
      <UButton type="button" variant="outline" color="neutral" size="sm" :disabled="signingOut" @click="signOut">
        {{ signingOut ? "処理中…" : "ログアウト" }}
      </UButton>
      <p v-if="signOutError" role="alert" class="w-full text-sm text-error">{{ signOutError }}</p>
    </header>
    <h1 class="text-2xl font-bold">Welcome to Void</h1>
    <p>
      This starter is running in Pages mode. The list below is loaded from your database in
      <code>pages/index.server.ts</code>.
    </p>
    <p>
      API example: <a href="/api/hello" class="text-primary underline underline-offset-2">/api/hello</a>
    </p>
    <p v-if="messages.length === 0">
      No messages yet. Run <code>void db seed</code> to load the sample row from
      <code>db/seed.ts</code>.
    </p>
    <ul v-else class="list-disc space-y-2 ps-5">
      <li v-for="message in messages" :key="message.id">
        <strong>{{ message.text }}</strong>
        <br />
        <small class="text-muted">{{ String(message.createdAt) }}</small>
      </li>
    </ul>
    <Form :form="form" class="flex items-end gap-2">
      <UFormField label="Message" class="flex-1">
        <UInput v-model="form.data.text" class="w-full" />
      </UFormField>
      <UButton type="submit" :disabled="form.pending">Add message</UButton>
    </Form>
  </main>
</template>
