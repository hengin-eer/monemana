<script setup lang="ts">
import { Link } from "@void/vue";
import type { ExpenseFilter } from "../expense-filter.ts";
import { formatJstMonth } from "../jst.ts";

// 表示する月の移動。カテゴリの絞り込みは月を移っても保つ。
const props = defineProps<{
  nav: { month: string; label: string; prev: string | null; next: string | null; current: string };
  category: ExpenseFilter["category"];
}>();

function href(month: string) {
  const params = new URLSearchParams({ month });
  if (props.category !== null) params.set("category", String(props.category));
  return `/?${params.toString()}`;
}

const linkClass =
  "inline-flex items-center rounded-md px-2.5 py-1.5 text-sm ring ring-inset ring-accented hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
</script>

<template>
  <nav aria-label="表示する月" class="flex flex-wrap items-center gap-2">
    <Link v-if="nav.prev" :href="href(nav.prev)" :class="linkClass" :aria-label="`前の月（${formatJstMonth(nav.prev)}）`">‹ 前の月</Link>
    <h2 class="px-2 text-lg font-bold">{{ nav.label }}</h2>
    <Link v-if="nav.next" :href="href(nav.next)" :class="linkClass" :aria-label="`次の月（${formatJstMonth(nav.next)}）`">次の月 ›</Link>
    <Link v-if="nav.month !== 'all' && nav.month !== nav.current" :href="href(nav.current)" :class="linkClass">今月</Link>
    <Link v-if="nav.month !== 'all'" :href="href('all')" :class="linkClass">全期間</Link>
    <Link v-else :href="href(nav.current)" :class="linkClass">月ごとに見る</Link>
  </nav>
</template>
