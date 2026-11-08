<script setup lang="ts">
import type { ExpenseRow } from "../expense-filter.ts";
import { formatYen } from "../format.ts";

// 支出の一覧表。編集・削除ボタンの名前に商品名を含める（同じ「編集」が並ばないように）。
defineProps<{ rows: ExpenseRow[]; caption: string }>();
const emit = defineEmits<{ edit: [row: ExpenseRow]; delete: [row: ExpenseRow] }>();
</script>

<template>
  <!-- 狭い画面（sm 未満）では行をカード表示にする。display を変えると表の意味が失われるブラウザがあるため role を明示する。 -->
  <div class="sm:overflow-x-auto">
    <table class="w-full text-sm sm:min-w-[36rem] max-sm:block" role="table">
      <caption class="sr-only">{{ caption }}</caption>
      <thead class="text-left text-muted max-sm:sr-only" role="rowgroup">
        <tr role="row">
          <th role="columnheader" scope="col" class="py-2 pe-4 font-medium">日時</th>
          <th role="columnheader" scope="col" class="py-2 pe-4 font-medium">商品名</th>
          <th role="columnheader" scope="col" class="py-2 pe-4 font-medium">カテゴリ</th>
          <th role="columnheader" scope="col" class="py-2 pe-4 text-right font-medium">金額</th>
          <th role="columnheader" scope="col" class="py-2 text-right font-medium"><span class="sr-only">操作</span></th>
        </tr>
      </thead>
      <tbody class="max-sm:block" role="rowgroup">
        <tr
          v-for="row in rows"
          :id="`expense-${row.id}`"
          :key="row.id"
          tabindex="-1"
          role="row"
          class="border-t border-default align-top max-sm:mb-3 max-sm:grid max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:gap-x-3 max-sm:rounded-lg max-sm:border max-sm:p-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        >
          <td role="cell" class="py-2 pe-4 whitespace-nowrap tabular-nums max-sm:order-3 max-sm:col-span-2 max-sm:py-0 max-sm:text-muted"><time :datetime="row.spentAt">{{ row.spentAtLabel }}</time></td>
          <td role="cell" class="py-2 pe-4 font-medium break-words max-sm:order-1 max-sm:py-0">{{ row.itemName }}</td>
          <td role="cell" class="py-2 pe-4 max-sm:order-4 max-sm:col-span-2 max-sm:py-0 max-sm:text-muted">{{ row.categoryName ?? "未分類" }}</td>
          <td role="cell" class="py-2 pe-4 text-right whitespace-nowrap tabular-nums max-sm:order-2 max-sm:py-0 max-sm:pe-0 max-sm:font-bold">{{ formatYen(row.amount) }}</td>
          <td role="cell" class="py-1 text-right whitespace-nowrap max-sm:order-5 max-sm:col-span-2 max-sm:mt-2">
            <UButton size="sm" variant="ghost" color="neutral" :aria-label="`「${row.itemName}」を編集`" @click="emit('edit', row)">編集</UButton>
            <UButton size="sm" variant="ghost" color="error" :aria-label="`「${row.itemName}」を削除`" @click="emit('delete', row)">削除</UButton>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
