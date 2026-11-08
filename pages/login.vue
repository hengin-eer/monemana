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
  <main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
    <div>
      <h1 class="text-sm font-medium text-muted">monemana</h1>
      <h2 class="mt-1 text-2xl font-bold">{{ signingUp ? "初回登録" : "ログイン" }}</h2>
      <p v-if="signingUp" class="mt-2 text-sm text-muted">管理者が許可したメールアドレスでのみ登録できます。</p>
    </div>
    <form @submit.prevent="submit">
      <fieldset :disabled="pending" class="space-y-4">
        <legend class="mb-3 text-sm font-medium">{{ signingUp ? "アカウントを登録" : "メールとパスワードでログイン" }}</legend>
        <UFormField label="メールアドレス">
          <UInput v-model="email" name="email" type="email" autocomplete="username" required class="w-full" />
        </UFormField>
        <UFormField
          label="パスワード"
          :help="signingUp ? 'パスワードは8〜128文字で入力してください。' : undefined"
        >
          <UInput
            v-model="password"
            name="password"
            type="password"
            :autocomplete="signingUp ? 'new-password' : 'current-password'"
            :minlength="signingUp ? 8 : undefined"
            :maxlength="signingUp ? 128 : undefined"
            required
            class="w-full"
          />
        </UFormField>
        <UAlert v-if="notice" role="status" color="info" variant="subtle" :description="notice" />
        <UAlert v-if="error" role="alert" color="error" variant="subtle" :description="error" />
        <UButton type="submit" block>{{ pending ? "処理中…" : signingUp ? "登録する" : "ログイン" }}</UButton>
      </fieldset>
    </form>
    <div v-if="canResend">
      <UButton
        type="button"
        variant="outline"
        block
        :disabled="pending || cooldown > 0 || !email.trim()"
        @click="resend"
      >
        {{ cooldown > 0 ? `確認メールを再送（${cooldown}秒後に可能）` : "確認メールを再送" }}
      </UButton>
    </div>
    <p class="text-sm"><a href="/reset-password" class="rounded-sm text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">パスワードを忘れた場合・登録後にログインできない場合</a></p>
    <UButton type="button" variant="ghost" color="neutral" :disabled="pending" @click="toggleMode">
      {{ signingUp ? "ログインに戻る" : "初めて使う方：初回登録" }}
    </UButton>
  </main>
</template>
