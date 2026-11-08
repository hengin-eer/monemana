<script setup lang="ts">
import type { ExpenseRow } from "../expense-filter.ts";
import { formatYen } from "../format.ts";

// 支出の一覧表。編集・削除ボタンの名前に商品名を含める（同じ「編集」が並ばないように）。
defineProps<{ rows: ExpenseRow[]; caption: string }>();
const emit = defineEmits<{ edit: [row: ExpenseRow]; delete: [row: ExpenseRow] }>();
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[36rem] text-sm">
      <caption class="sr-only">{{ caption }}</caption>
      <thead class="text-left text-muted">
        <tr>
          <th scope="col" class="py-2 pe-4 font-medium">日時</th>
          <th scope="col" class="py-2 pe-4 font-medium">商品名</th>
          <th scope="col" class="py-2 pe-4 font-medium">カテゴリ</th>
          <th scope="col" class="py-2 pe-4 text-right font-medium">金額</th>
          <th scope="col" class="py-2 text-right font-medium"><span class="sr-only">操作</span></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :id="`expense-${row.id}`"
          :key="row.id"
          tabindex="-1"
          class="border-t border-default align-top focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        >
          <td class="py-2 pe-4 whitespace-nowrap tabular-nums"><time :datetime="row.spentAt">{{ row.spentAtLabel }}</time></td>
          <td class="py-2 pe-4 font-medium break-words">{{ row.itemName }}</td>
          <td class="py-2 pe-4">{{ row.categoryName ?? "未分類" }}</td>
          <td class="py-2 pe-4 text-right whitespace-nowrap tabular-nums">{{ formatYen(row.amount) }}</td>
          <td class="py-1 text-right whitespace-nowrap">
            <UButton size="sm" variant="ghost" color="neutral" :aria-label="`「${row.itemName}」を編集`" @click="emit('edit', row)">編集</UButton>
            <UButton size="sm" variant="ghost" color="error" :aria-label="`「${row.itemName}」を削除`" @click="emit('delete', row)">削除</UButton>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
