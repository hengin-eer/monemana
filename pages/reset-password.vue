<script setup lang="ts">
import { onMounted, ref } from "vue";
import { auth } from "void/client";
import { authErrorMessage } from "../src/auth-errors";

// ?token=... があれば新パスワードの入力、なければ再設定メールの依頼。
// 無効・期限切れのリンクは Better Auth が ?error=INVALID_TOKEN 付きで戻してくる。
const token = ref("");
const linkError = ref("");
const email = ref("");
const newPassword = ref("");
const pending = ref(false);
const error = ref("");
const notice = ref("");

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  token.value = params.get("token") ?? "";
  const code = params.get("error");
  if (code) linkError.value = authErrorMessage({ code });
});

async function requestReset() {
  if (pending.value) return;
  pending.value = true;
  error.value = "";
  notice.value = "";
  try {
    const result = await auth.requestPasswordReset({
      email: email.value.trim(),
      redirectTo: "/reset-password",
    });
    if (result.error) {
      error.value = authErrorMessage(result.error);
      return;
    }
    // 登録の有無は伏せる（列挙対策）。送信の成否もサーバーから分からないため断定しない。
    notice.value = "再設定の依頼を受け付けました。登録済みのアドレスにメールを送ります。届かない場合は、しばらく待ってからもう一度お試しください。";
  } catch {
    error.value = "通信に失敗しました。時間をおいてもう一度お試しください。";
  } finally {
    pending.value = false;
  }
}

async function resetPassword() {
  if (pending.value) return;
  pending.value = true;
  error.value = "";
  try {
    const result = await auth.resetPassword({ newPassword: newPassword.value, token: token.value });
    if (result.error) {
      if (result.error.code === "INVALID_TOKEN" || result.error.code === "TOKEN_EXPIRED") {
        // 入力中に期限切れになった・使用済みのリンクの場合は、再申請の画面に切り替える。
        linkError.value = authErrorMessage(result.error);
        token.value = "";
        newPassword.value = "";
        window.history.replaceState(null, "", "/reset-password");
        return;
      }
      error.value = authErrorMessage(result.error);
      return;
    }
    window.location.assign("/login");
  } catch {
    error.value = "通信に失敗しました。時間をおいてもう一度お試しください。";
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <main>
    <h1>monemana</h1>
    <h2>パスワードの再設定</h2>
    <p v-if="linkError" role="alert">{{ linkError }}</p>

    <form v-if="token" @submit.prevent="resetPassword">
      <fieldset :disabled="pending">
        <legend>新しいパスワード</legend>
        <p>
          <label for="new-password">新しいパスワード（8〜128文字）</label>
          <input id="new-password" v-model="newPassword" type="password" autocomplete="new-password"
            minlength="8" maxlength="128" required />
        </p>
        <p v-if="error" role="alert">{{ error }}</p>
        <button type="submit">{{ pending ? "処理中…" : "パスワードを変更" }}</button>
      </fieldset>
    </form>

    <form v-else @submit.prevent="requestReset">
      <fieldset :disabled="pending">
        <legend>再設定メールを依頼</legend>
        <p>
          <label for="email">メールアドレス</label>
          <input id="email" v-model="email" type="email" autocomplete="username" required />
        </p>
        <p v-if="notice" role="status">{{ notice }}</p>
        <p v-if="error" role="alert">{{ error }}</p>
        <button type="submit">{{ pending ? "処理中…" : "再設定メールを送る" }}</button>
      </fieldset>
    </form>

    <p><a href="/login">ログインに戻る</a></p>
  </main>
</template>
