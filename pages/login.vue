<script setup lang="ts">
import { ref } from "vue";
import { auth } from "void/client";

const signingUp = ref(false);
const email = ref("");
const password = ref("");
const pending = ref(false);
const error = ref("");

async function submit() {
  if (pending.value) return;
  pending.value = true;
  error.value = "";
  try {
    const credentials = { email: email.value.trim(), password: password.value };
    const result = signingUp.value
      ? await auth.signUp.email({ ...credentials, name: credentials.email })
      : await auth.signIn.email(credentials);
    if (result.error) {
      error.value = signingUp.value
        ? "登録できませんでした。許可されたメールアドレスか、登録済みでないかを確認してください。"
        : "ログインできませんでした。メールアドレスとパスワードを確認してください。";
      return;
    }
    window.location.assign("/");
  } catch {
    error.value = "通信に失敗しました。時間をおいてもう一度お試しください。";
  } finally {
    pending.value = false;
  }
}

function toggleMode() {
  signingUp.value = !signingUp.value;
  password.value = "";
  error.value = "";
}
</script>

<template>
  <main>
    <h1>monemana</h1>
    <h2>{{ signingUp ? "初回登録" : "ログイン" }}</h2>
    <p v-if="signingUp">管理者が許可したメールアドレスでのみ登録できます。</p>
    <form @submit.prevent="submit">
      <fieldset :disabled="pending">
        <legend>{{ signingUp ? "アカウントを登録" : "メールとパスワードでログイン" }}</legend>
        <p>
          <label for="email">メールアドレス</label>
          <input id="email" v-model="email" name="email" type="email" autocomplete="username" required />
        </p>
        <p>
          <label for="password">パスワード</label>
          <input id="password" v-model="password" name="password" type="password"
            :autocomplete="signingUp ? 'new-password' : 'current-password'"
            :minlength="signingUp ? 8 : undefined" :maxlength="signingUp ? 128 : undefined" required />
        </p>
        <p v-if="signingUp">パスワードは8〜128文字で入力してください。</p>
        <p v-if="error" role="alert">{{ error }}</p>
        <button type="submit">{{ pending ? "処理中…" : signingUp ? "登録する" : "ログイン" }}</button>
      </fieldset>
    </form>
    <button type="button" :disabled="pending" @click="toggleMode">
      {{ signingUp ? "ログインに戻る" : "初めて使う方：初回登録" }}
    </button>
  </main>
</template>
