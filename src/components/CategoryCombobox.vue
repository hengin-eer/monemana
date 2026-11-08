<script setup lang="ts">
import { computed, ref } from "vue";

// カテゴリの select + search。検索・矢印キーでの選択・その場での新規作成ができる。
// - 閉じているとき: Space / Enter / ↓ で開く。文字（半角）を打つと開いて検索が始まる。
//   日本語はまず Space / Enter / ↓ で開いてから入力する（閉じたボタンは IME の入力先にならない）。
// - 開いているとき: ↑↓ で移動、Enter で選択、Esc で閉じる。一致するものがなければ「"○○"を作成」が出る。
// - 選択を外して「未分類」に戻せる。
const props = defineProps<{ categories: { id: number; name: string }[] }>();
const model = defineModel<number | null>({ required: true });
const emit = defineEmits<{ create: [name: string] }>();

const open = ref(false);
const searchTerm = ref("");
const items = computed(() => props.categories.map((c) => ({ label: c.name, value: c.id })));

function onTriggerKeydown(event: KeyboardEvent) {
  if (open.value || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
  // 印字できる 1 文字（Space は SelectMenu が開く）で、開いて検索を始める。
  if (event.key.length === 1 && event.key !== " ") {
    searchTerm.value = event.key;
    open.value = true;
    event.preventDefault();
  }
}
</script>

<template>
  <USelectMenu
    v-model:open="open"
    v-model:search-term="searchTerm"
    :model-value="model ?? undefined"
    :items="items"
    value-key="value"
    placeholder="未分類（選択しない）"
    :search-input="{ placeholder: 'カテゴリを検索・作成' }"
    create-item
    clear
    class="w-full"
    @update:model-value="(value: number | undefined) => (model = value ?? null)"
    @create="(name: string) => emit('create', name.trim())"
    @keydown="onTriggerKeydown"
  />
</template>
