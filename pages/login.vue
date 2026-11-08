<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { auth } from "void/client";
import { authErrorMessage, AUTH_ERROR_MESSAGES } from "../src/auth-errors";

const RESEND_COOLDOWN_SECONDS = 60;

const signingUp = ref(false);
const email = ref("");
const password = ref("");
const pending = ref(false);
const error = ref("");
const notice = ref("");
// 確認メールの再送ボタンを出すか（登録直後・未確認ログイン時）
const canResend = ref(false);
const cooldown = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;

function startCooldown() {
  cooldown.value = RESEND_COOLDOWN_SECONDS;
  clearInterval(timer);
  timer = setInterval(() => {
    cooldown.value -= 1;
    if (cooldown.value <= 0) clearInterval(timer);
  }, 1000);
}

onBeforeUnmount(() => clearInterval(timer));

async function submit() {
  if (pending.value) return;
  pending.value = true;
  error.value = "";
  notice.value = "";
  canResend.value = false;
  try {
    const credentials = { email: email.value.trim(), password: password.value };
    const result = signingUp.value
      ? await auth.signUp.email({ ...credentials, name: credentials.email, callbackURL: "/" })
      : await auth.signIn.email({ ...credentials, callbackURL: "/" });
    if (result.error) {
      if (result.error.code === "EMAIL_NOT_VERIFIED") {
        // 未確認は失敗ではなく案内として出す。サーバーが確認メールを再送している。
        notice.value = AUTH_ERROR_MESSAGES.EMAIL_NOT_VERIFIED!;
        canResend.value = true;
        startCooldown();
      } else {
        error.value = authErrorMessage(result.error);
      }
      return;
    }
    if (signingUp.value) {
      // メール確認が済むまでセッションは発行されない。送信の成否はサーバーから分からないため、断定しない。
      notice.value = "登録を受け付けました。確認メールのリンクを開くと登録が完了します。届かない場合は下の「確認メールを再送」を押してください。登録済みのアドレスならログインしてください。";
      canResend.value = true;
      password.value = "";
      startCooldown();
      return;
    }
    window.location.assign("/");
  } catch {
    error.value = "通信に失敗しました。時間をおいてもう一度お試しください。";
  } finally {
    pending.value = false;
  }
}

async function resend() {
  if (pending.value || cooldown.value > 0 || !email.value.trim()) return;
  pending.value = true;
  error.value = "";
  try {
    const result = await auth.sendVerificationEmail({ email: email.value.trim(), callbackURL: "/" });
    if (result.error) {
      error.value = authErrorMessage(result.error);
      return;
    }
    notice.value = "確認メールの再送を受け付けました。届かない場合は、しばらく待ってからもう一度お試しください。";
    startCooldown();
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
  notice.value = "";
  canResend.value = false;
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
        <p v-if="notice" role="status">{{ notice }}</p>
        <p v-if="error" role="alert">{{ error }}</p>
        <button type="submit">{{ pending ? "処理中…" : signingUp ? "登録する" : "ログイン" }}</button>
      </fieldset>
    </form>
    <p v-if="canResend">
      <button type="button" :disabled="pending || cooldown > 0 || !email.trim()" @click="resend">
        {{ cooldown > 0 ? `確認メールを再送（${cooldown}秒後に可能）` : "確認メールを再送" }}
      </button>
    </p>
    <p><a href="/reset-password">パスワードを忘れた場合・登録後にログインできない場合</a></p>
    <button type="button" :disabled="pending" @click="toggleMode">
      {{ signingUp ? "ログインに戻る" : "初めて使う方：初回登録" }}
    </button>
  </main>
</template>
