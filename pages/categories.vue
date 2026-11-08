<script setup lang="ts">
import { nextTick, ref } from "vue";
import { Link, useForm } from "@void/vue";
import type { Props } from "./categories.server";
import AppHeader from "../src/components/AppHeader.vue";
import { errorMessage } from "../src/error-message.ts";
import { useFeedback } from "../src/use-feedback.ts";

const props = defineProps<Props>();
const feedback = useFeedback();

// ---- 追加 ---------------------------------------------------------------------------------
const createForm = useForm("/categories", { name: "" });
const nameEl = ref<{ inputRef?: HTMLInputElement | null } | null>(null);

async function create() {
  if (createForm.pending) return;
  createForm.clearErrors();
  const name = createForm.data.name.trim();
  try {
    await createForm.post({ preserveScroll: true, preserveState: true });
  } catch {
    feedback.error("通信に失敗しました", "ネットワークを確認して、もう一度お試しください。");
    return;
  }
  if (createForm.error || createForm.errors.name) {
    feedback.error("追加できませんでした", createForm.errors.name ?? errorMessage(createForm.error));
    return;
  }
  feedback.success("カテゴリを追加しました", name);
  createForm.data.name = "";
  nameEl.value?.inputRef?.focus();
}

// ---- 名前変更 -----------------------------------------------------------------------------
const renamingId = ref<number | null>(null);
const renameForm = useForm("/categories?rename", { id: 0, name: "" });

function startRename(category: { id: number; name: string }) {
  renamingId.value = category.id;
  renameForm.clearErrors();
  renameForm.data.id = category.id;
  renameForm.data.name = category.name;
  void nextTick(() => document.querySelector<HTMLInputElement>(`#category-${category.id} input`)?.focus());
}

// キャンセルしたら、名前変更ボタンにフォーカスを戻す。
function cancelRename(id: number) {
  renamingId.value = null;
  void nextTick(() => document.querySelector<HTMLElement>(`#category-${id} button`)?.focus());
}

async function rename() {
  if (renameForm.pending) return;
  renameForm.clearErrors();
  const id = renameForm.data.id;
  try {
    await renameForm.put({ preserveScroll: true, preserveState: true });
  } catch {
    feedback.error("通信に失敗しました", "ネットワークを確認して、もう一度お試しください。");
    return;
  }
  if (renameForm.error || renameForm.errors.name) {
    feedback.error("名前を変更できませんでした", renameForm.errors.name ?? errorMessage(renameForm.error));
    return;
  }
  renamingId.value = null;
  feedback.success("名前を変更しました");
  document.getElementById(`category-${id}`)?.focus();
}

// ---- 削除（使用中は不可）-------------------------------------------------------------------
const deleteForm = useForm("/categories?delete", { id: 0 });
// 使用中で削除できなかったカテゴリ。エラー文と、該当の支出への導線を出す。
const blocked = ref<{ id: number; name: string; message: string } | null>(null);

async function remove(category: { id: number; name: string }) {
  if (deleteForm.pending) return;
  blocked.value = null;
  deleteForm.data.id = category.id;
  deleteForm.clearError();
  try {
    await deleteForm.delete({ preserveScroll: true, preserveState: true });
  } catch {
    feedback.error("通信に失敗しました", "ネットワークを確認して、もう一度お試しください。");
    return;
  }
  if (deleteForm.error) {
    const message = errorMessage(deleteForm.error);
    blocked.value = { id: category.id, name: category.name, message };
    feedback.error("削除できませんでした", message);
    return;
  }
  feedback.success("カテゴリを削除しました", category.name);
  document.getElementById("categories-heading")?.focus();
}
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 pb-16">
    <AppHeader :email="email" current="categories" />
    <h1 class="mt-6 text-2xl font-bold">カテゴリ</h1>
    <p class="mt-1 text-sm text-muted">支出のカテゴリは任意です。使用中のカテゴリは削除できません。</p>

    <section aria-labelledby="add-heading" class="mt-4 rounded-lg border border-default p-4">
      <h2 id="add-heading" class="text-lg font-bold">カテゴリを追加</h2>
      <form class="mt-3 flex flex-wrap items-start gap-3" novalidate @submit.prevent="create">
        <UFormField label="名前（30文字まで）" name="name" :error="createForm.errors.name" class="min-w-56 flex-1">
          <UInput ref="nameEl" v-model="createForm.data.name" autocomplete="off" maxlength="30" class="w-full" />
        </UFormField>
        <UButton type="submit" :aria-disabled="createForm.pending" class="mt-[1.625rem]">追加</UButton>
      </form>
    </section>

    <section aria-labelledby="categories-heading" class="mt-8">
      <h2 id="categories-heading" tabindex="-1" class="text-lg font-bold">カテゴリの一覧</h2>
      <p v-if="categories.length === 0" class="mt-3 rounded-lg border border-dashed border-default p-6 text-center text-sm text-muted">
        カテゴリはまだありません。支出の記録フォームからも、その場で作成できます。
      </p>
      <ul v-else class="mt-2 divide-y divide-default">
        <li v-for="category in categories" :id="`category-${category.id}`" :key="category.id" tabindex="-1" class="py-3">
          <form v-if="renamingId === category.id" class="flex flex-wrap items-start gap-2" novalidate @submit.prevent="rename">
            <UFormField :label="`「${category.name}」の新しい名前`" name="name" :error="renameForm.errors.name" class="min-w-56 flex-1">
              <UInput v-model="renameForm.data.name" autocomplete="off" maxlength="30" class="w-full" />
            </UFormField>
            <div class="mt-[1.625rem] flex gap-2">
              <UButton type="submit" :aria-disabled="renameForm.pending">保存</UButton>
              <UButton type="button" color="neutral" variant="outline" @click="cancelRename(category.id)">キャンセル</UButton>
            </div>
          </form>
          <div v-else class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="font-medium">{{ category.name }}</p>
              <p class="text-sm text-muted">{{ category.usageCount }}件の支出で使用中</p>
            </div>
            <div class="flex gap-1">
              <UButton size="sm" variant="ghost" color="neutral" :aria-label="`「${category.name}」の名前を変更`" @click="startRename(category)">名前変更</UButton>
              <UButton size="sm" variant="ghost" color="error" :aria-label="`「${category.name}」を削除`" @click="remove(category)">削除</UButton>
            </div>
          </div>
          <p v-if="blocked?.id === category.id" role="alert" class="mt-2 text-sm text-error">
            {{ blocked.message }}
            <Link
              :href="`/?month=all&category=${category.id}`"
              class="rounded-sm underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >使用している支出を見る</Link>
          </p>
        </li>
      </ul>
    </section>
  </main>
</template>
