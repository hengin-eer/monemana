<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import { useForm, useRouter } from "@void/vue";
import { fetch } from "void/client";
import type { ExpenseRow } from "../expense-filter.ts";
import { toJstLocalInput } from "../jst.ts";
import { readStickyDateTime, writeStickyDateTime } from "../sticky-datetime.ts";
import { errorMessage } from "../error-message.ts";
import { useFeedback } from "../use-feedback.ts";
import AmountInput from "./AmountInput.vue";
import CategoryCombobox from "./CategoryCombobox.vue";
import DateTimeInput from "./DateTimeInput.vue";

// 記録・編集の入力フォーム。キーボードだけで次々と記録できるようにする。
// - Tab 順は 日時 → 金額 → 商品名 → カテゴリ → 追加。どの入力欄でも Enter で送信できる。
// - 成功したら金額と商品名だけを空にし、フォーカスを金額に戻す。日時とカテゴリは直前の値を保つ。
// - 送信ボタンは disabled にしない（フォーカスを失うため）。二重送信は内部で防ぐ。
const props = defineProps<{
  categories: { id: number; name: string }[];
  defaultSpentAt: string;
  editing: ExpenseRow | null;
}>();
const emit = defineEmits<{ finished: [id: number]; cancel: [] }>();

type Fields = { spentAt: string; amount: string | number; itemName: string; categoryId: number | null };
const blank = (): Fields => ({ spentAt: props.defaultSpentAt, amount: "", itemName: "", categoryId: null });

const createForm = useForm("/", blank());
const updateForm = useForm("/?update", { id: 0, ...blank() });
const isEditing = computed(() => props.editing !== null);
const form = computed(() => (isEditing.value ? updateForm : createForm));

const router = useRouter();
const feedback = useFeedback();
const busy = ref(false);
const inherited = ref(false);
const formEl = useTemplateRef<HTMLFormElement>("formEl");
const amountEl = useTemplateRef<{ focus: () => void }>("amountEl");

// 直前に記録した日時を引き継ぐ（タブ単位）。サーバーの描画と食い違わないよう、マウント後に反映する。
onMounted(() => {
  const sticky = readStickyDateTime();
  if (sticky) {
    createForm.data.spentAt = sticky;
    inherited.value = true;
  }
});

function resetToNow() {
  createForm.data.spentAt = toJstLocalInput(new Date());
  inherited.value = false;
}

// 編集する行が選ばれたら、フォームに読み込んで金額にフォーカスする。
watch(
  () => props.editing,
  async (row) => {
    if (!row) return;
    updateForm.clearErrors();
    updateForm.clearError();
    Object.assign(updateForm.data, {
      id: row.id,
      spentAt: row.spentAtInput,
      amount: String(row.amount),
      itemName: row.itemName,
      categoryId: row.categoryId,
    });
    await nextTick();
    amountEl.value?.focus();
  },
);

function focusFirstInvalid() {
  formEl.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}

async function submit() {
  if (busy.value) return;
  busy.value = true;
  const current = form.value;
  current.clearErrors();
  current.clearError();
  const editingId = props.editing?.id ?? null;
  const summary = `${current.data.itemName.trim()}（${current.data.amount}円）`;
  try {
    // preserveState: ページを作り直さず、入力途中の値とフォーカスを保つ。
    if (isEditing.value) await updateForm.put({ preserveScroll: true, preserveState: true });
    else await createForm.post({ preserveScroll: true, preserveState: true });
  } catch {
    feedback.error("通信に失敗しました", "ネットワークを確認して、もう一度お試しください。");
    busy.value = false;
    return;
  }
  busy.value = false;

  const fieldErrors = Object.values(current.errors).filter(Boolean);
  if (current.error || fieldErrors.length > 0) {
    feedback.error("保存できませんでした", fieldErrors[0] ?? errorMessage(current.error));
    await nextTick();
    focusFirstInvalid();
    return;
  }

  if (editingId !== null) {
    feedback.success("更新しました", summary);
    emit("finished", editingId);
    return;
  }
  feedback.success("追加しました", summary);
  writeStickyDateTime(createForm.data.spentAt);
  inherited.value = true;
  createForm.data.amount = "";
  createForm.data.itemName = "";
  await nextTick();
  amountEl.value?.focus();
}

// カテゴリ欄から、その場で作成して選択する（ページは作り直さない）。
async function createCategory(name: string) {
  if (!name) return;
  try {
    const created = await fetch("/api/categories", { method: "POST", body: { name } });
    await router.refresh({ preserveScroll: true, preserveState: true });
    form.value.data.categoryId = created.id;
    feedback.success(`カテゴリ「${created.name}」を作成しました`);
  } catch (error) {
    feedback.error("カテゴリを作成できませんでした", errorMessage(error));
  }
}

function cancelEdit() {
  updateForm.clearErrors();
  updateForm.clearError();
  emit("cancel");
}
</script>

<template>
  <form ref="formEl" novalidate class="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-[14rem_10rem_minmax(0,1fr)_14rem_auto] lg:items-start" @submit.prevent="submit">
    <UFormField label="日時（JST）" name="spentAt" :error="form.errors.spentAt" required>
      <DateTimeInput v-model="form.data.spentAt" :inherited="!isEditing && inherited" @reset="resetToNow" />
    </UFormField>
    <UFormField label="金額" name="amount" :error="form.errors.amount" required>
      <AmountInput ref="amountEl" v-model="form.data.amount" />
    </UFormField>
    <UFormField label="商品名" name="itemName" :error="form.errors.itemName" required>
      <UInput v-model="form.data.itemName" autocomplete="off" maxlength="100" class="w-full" />
    </UFormField>
    <UFormField label="カテゴリ（任意）" name="categoryId" :error="form.errors.categoryId" help="入力して「作成」を選ぶと追加できます">
      <CategoryCombobox v-model="form.data.categoryId" :categories="categories" @create="createCategory" />
    </UFormField>
    <div class="flex items-end gap-2 sm:col-span-2 lg:col-span-1 lg:pt-[1.625rem]">
      <UButton type="submit" :aria-disabled="busy">
        {{ busy ? "送信中…" : isEditing ? "更新" : "追加" }}
      </UButton>
      <UButton v-if="isEditing" type="button" color="neutral" variant="outline" @click="cancelEdit">キャンセル</UButton>
    </div>
  </form>
</template>
