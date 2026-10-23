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
  <main>
    <header>
      <p>{{ email }}</p>
      <button type="button" :disabled="signingOut" @click="signOut">
        {{ signingOut ? "処理中…" : "ログアウト" }}
      </button>
      <p v-if="signOutError" role="alert">{{ signOutError }}</p>
    </header>
    <h1>Welcome to Void</h1>
    <p>
      This starter is running in Pages mode. The list below is loaded from your database in
      <code>pages/index.server.ts</code>.
    </p>
    <p>
      API example: <a href="/api/hello">/api/hello</a>
    </p>
    <p v-if="messages.length === 0">
      No messages yet. Run <code>void db seed</code> to load the sample row from
      <code>db/seed.ts</code>.
    </p>
    <ul v-else>
      <li v-for="message in messages" :key="message.id">
        <strong>{{ message.text }}</strong>
        <br />
        <small>{{ String(message.createdAt) }}</small>
      </li>
    </ul>
    <Form :form="form">
      <label>Message <input v-model="form.data.text" /></label>
      <button :disabled="form.pending">Add message</button>
    </Form>
  </main>
</template>
