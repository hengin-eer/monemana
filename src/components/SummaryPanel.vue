<script setup lang="ts">
import { Link } from "@void/vue";
import { formatYen } from "../format.ts";

// 月全体（または全期間）の合計とカテゴリ別の内訳。一覧に読み込んだ件数ではなく、SQL で集計した値。
const props = defineProps<{
  label: string;
  month: string;
  summary: {
    total: number;
    count: number;
    breakdown: { categoryId: number | null; name: string | null; total: number; count: number }[];
  };
}>();

function href(categoryId: number | null) {
  return `/?month=${props.month}&category=${categoryId ?? "none"}`;
}
</script>

<template>
  <section aria-labelledby="summary-heading" class="rounded-lg border border-default p-4">
    <h3 id="summary-heading" class="text-sm font-medium text-muted">{{ label }}の合計</h3>
    <p class="mt-1 text-3xl font-bold tabular-nums">{{ formatYen(summary.total) }}</p>
    <p class="text-sm text-muted">{{ summary.count }}件</p>
    <p v-if="summary.count === 0" class="mt-3 text-sm text-muted">この期間の支出はまだありません。</p>
    <ul v-else class="mt-3 divide-y divide-default text-sm">
      <li v-for="row in summary.breakdown" :key="row.categoryId ?? 'none'" class="flex items-baseline justify-between gap-4 py-1.5">
        <Link
          :href="href(row.categoryId)"
          class="rounded-sm text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >{{ row.name ?? "未分類" }}</Link>
        <span class="tabular-nums">{{ formatYen(row.total) }}<span class="text-muted">（{{ row.count }}件）</span></span>
      </li>
    </ul>
  </section>
</template>
