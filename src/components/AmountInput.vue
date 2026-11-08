<script setup lang="ts">
import { ref } from "vue";
import { parseAmount } from "../money.ts";

// 金額の入力。全角数字・カンマ・「¥」「円」を許し、フォーカスが外れたら整数にそろえる。
const model = defineModel<string | number>({ required: true });
const input = ref<{ inputRef?: HTMLInputElement | null } | null>(null);

function normalize() {
  const amount = parseAmount(model.value);
  if (amount !== null) model.value = String(amount);
}

defineExpose({
  focus: () => input.value?.inputRef?.focus(),
});
</script>

<template>
  <UInput
    ref="input"
    v-model="model"
    inputmode="numeric"
    autocomplete="off"
    placeholder="1200"
    class="w-full"
    @blur="normalize"
  >
    <template #trailing>
      <span class="text-sm text-muted" aria-hidden="true">円</span>
    </template>
  </UInput>
</template>
