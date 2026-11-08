<script setup lang="ts">
// 日時の入力（JST）。直前の日時を引き継いでいる間は、そのことと「現在時刻に戻す」を出す。
const model = defineModel<string>({ required: true });
defineProps<{ inherited: boolean }>();
const emit = defineEmits<{ reset: [] }>();
</script>

<template>
  <div>
    <UInput v-model="model" type="datetime-local" class="w-full" />
    <p v-if="inherited" class="mt-1 text-xs text-muted">
      前回の日時を引き継ぎ中 ·
      <button
        type="button"
        class="rounded-sm text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="emit('reset')"
      >
        現在時刻に戻す
      </button>
    </p>
  </div>
</template>
