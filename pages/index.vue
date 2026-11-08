<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useForm, useRouter } from "@void/vue";
import { fetch } from "void/client";
import type { Props } from "./index.server";
import AppHeader from "../src/components/AppHeader.vue";
import ConfirmDialog from "../src/components/ConfirmDialog.vue";
import ExpenseForm from "../src/components/ExpenseForm.vue";
import ExpenseTable from "../src/components/ExpenseTable.vue";
import MonthNav from "../src/components/MonthNav.vue";
import SummaryPanel from "../src/components/SummaryPanel.vue";
import type { ExpenseRow } from "../src/expense-filter.ts";
import { formatYen } from "../src/format.ts";
import { errorMessage } from "../src/error-message.ts";
import { useFeedback } from "../src/use-feedback.ts";

const props = defineProps<Props>();
const router = useRouter();
const feedback = useFeedback();

const editing = ref<ExpenseRow | null>(null);
const status = ref(""); // 画面読み上げ用（role="status"）

// ---- 一覧: 「さらに 30 件読み込む」（keyset ページング）-----------------------------------
// ページの再読み込み（記録・更新・削除のあと）で、追加読み込み分は破棄して先頭 30 件から出し直す。
const extra = ref<ExpenseRow[]>([]);
const extraCursor = ref<string | null | undefined>(undefined); // undefined = loader が返した nextCursor
const loadingMore = ref(false);
watch(
  () => props.expenses,
  () => {
    extra.value = [];
    extraCursor.value = undefined;
  },
);
const rows = computed(() => [...props.expenses, ...extra.value]);
const cursor = computed(() => (extraCursor.value === undefined ? props.nextCursor : extraCursor.value));

async function loadMore() {
  if (loadingMore.value || !cursor.value) return;
  loadingMore.value = true;
  try {
    const query: { month: string; cursor: string; category?: string } = {
      month: props.filter.month,
      cursor: cursor.value,
    };
    if (props.filter.category !== null) query.category = String(props.filter.category);
    const result = await fetch("/api/expenses", { query });
    const firstNew = result.items[0];
    extra.value = [...extra.value, ...result.items];
    extraCursor.value = result.nextCursor;
    status.value = `${result.items.length}件追加しました（全${props.totalCount}件中${rows.value.length}件を表示）`;
    await nextTick();
    if (firstNew) document.getElementById(`expense-${firstNew.id}`)?.focus();
  } catch (error) {
    feedback.error("読み込めませんでした", errorMessage(error));
  } finally {
    loadingMore.value = false;
  }
}

// ---- 絞り込み -----------------------------------------------------------------------------
function onCategoryFilter(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  const params = new URLSearchParams({ month: props.filter.month });
  if (value) params.set("category", value);
  router.visit(`/?${params.toString()}`, { preserveScroll: true });
}
const categoryFilter = computed(() => (props.filter.category === null ? "" : String(props.filter.category)));

// ---- 編集 ---------------------------------------------------------------------------------
function startEdit(row: ExpenseRow) {
  editing.value = row;
  document.getElementById("form-heading")?.scrollIntoView({ block: "center" });
}

async function finishEdit(id: number) {
  editing.value = null;
  await nextTick();
  document.getElementById(`expense-${id}`)?.focus();
}

// ---- 削除（確認ダイアログ）-----------------------------------------------------------------
const deleting = ref<ExpenseRow | null>(null);
const deleteForm = useForm("/?delete", { id: 0 });
const deletingBusy = ref(false);

async function confirmDelete() {
  const row = deleting.value;
  if (!row || deletingBusy.value) return;
  deletingBusy.value = true;
  deleteForm.data.id = row.id;
  deleteForm.clearError();
  try {
    await deleteForm.delete({ preserveScroll: true, preserveState: true });
  } catch {
    feedback.error("通信に失敗しました", "ネットワークを確認して、もう一度お試しください。");
    deletingBusy.value = false;
    return;
  }
  deletingBusy.value = false;
  if (deleteForm.error) {
    feedback.error("削除できませんでした", errorMessage(deleteForm.error));
    return;
  }
  deleting.value = null;
  if (editing.value?.id === row.id) editing.value = null;
  feedback.success("削除しました", `${row.itemName}（${formatYen(row.amount)}）`);
  await nextTick();
  document.getElementById("expenses-heading")?.focus();
}
</script>

<template>
  <main class="mx-auto max-w-5xl px-4 pb-16">
    <AppHeader :email="email" current="expenses" />
    <h1 class="mt-6 text-2xl font-bold">支出</h1>

    <section aria-labelledby="form-heading" class="mt-4 rounded-lg border border-default p-4">
      <h2 id="form-heading" class="text-lg font-bold">{{ editing ? `「${editing.itemName}」を編集` : "支出を記録" }}</h2>
      <ExpenseForm
        :categories="categories"
        :default-spent-at="defaultSpentAt"
        :editing="editing"
        @finished="finishEdit"
        @cancel="editing = null"
      />
    </section>

    <div class="mt-8 space-y-4">
      <MonthNav :nav="nav" :category="filter.category" />
      <SummaryPanel :label="nav.label" :month="filter.month" :summary="summary" />
    </div>

    <section aria-labelledby="expenses-heading" class="mt-8">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <h2 id="expenses-heading" tabindex="-1" class="text-lg font-bold">支出の一覧</h2>
        <label class="text-sm">
          <span class="me-2">カテゴリで絞り込み</span>
          <select
            class="rounded-md bg-default px-2 py-1.5 text-sm ring ring-inset ring-accented focus-visible:outline-2 focus-visible:outline-primary"
            :value="categoryFilter"
            @change="onCategoryFilter"
          >
            <option value="">すべて</option>
            <option value="none">未分類</option>
            <option v-for="category in categories" :key="category.id" :value="String(category.id)">{{ category.name }}</option>
          </select>
        </label>
      </div>
      <p class="mt-1 text-sm text-muted">全{{ totalCount }}件中{{ rows.length }}件を表示</p>

      <p v-if="totalCount === 0" class="mt-4 rounded-lg border border-dashed border-default p-6 text-center text-sm text-muted">
        この条件の支出はありません。上のフォームから記録できます。
      </p>
      <ExpenseTable v-else class="mt-2" :rows="rows" :caption="`${nav.label}の支出一覧`" @edit="startEdit" @delete="deleting = $event" />

      <div v-if="cursor" class="mt-4 text-center">
        <UButton type="button" variant="outline" :aria-disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? "読み込み中…" : "さらに30件読み込む" }}
        </UButton>
      </div>
    </section>

    <p class="sr-only" role="status">{{ status }}</p>

    <ConfirmDialog
      :open="deleting !== null"
      title="この支出を削除しますか？"
      :description="deleting ? `${deleting.spentAtLabel}　${deleting.itemName}（${formatYen(deleting.amount)}）を削除します。この操作は取り消せません。` : ''"
      confirm-label="削除する"
      :busy="deletingBusy"
      @confirm="confirmDelete"
      @cancel="deleting = null"
    />
  </main>
</template>
