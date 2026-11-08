<script setup lang="ts">
import { ref, watch } from "vue";

// 削除などの確認ダイアログ。<dialog> の showModal() で、フォーカスの閉じ込めと Esc での取り消しが付く。
// 最初のフォーカスは「キャンセル」（誤って確定しないように）。
const props = defineProps<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  busy?: boolean;
}>();
const emit = defineEmits<{ confirm: []; cancel: [] }>();

const dialog = ref<HTMLDialogElement | null>(null);

watch(
  () => props.open,
  (open) => {
    const el = dialog.value;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  },
);

// Esc で閉じられた場合も、取り消しとして親に伝える。
function onClose() {
  if (props.open) emit("cancel");
}
</script>

<template>
  <dialog
    ref="dialog"
    aria-labelledby="confirm-title"
    aria-describedby="confirm-description"
    class="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-lg bg-default p-6 text-default shadow-xl backdrop:bg-black/50"
    @close="onClose"
  >
    <h2 id="confirm-title" class="text-lg font-bold">{{ title }}</h2>
    <p id="confirm-description" class="mt-2 text-sm text-muted">{{ description }}</p>
    <div class="mt-6 flex justify-end gap-2">
      <UButton type="button" color="neutral" variant="outline" autofocus @click="emit('cancel')">キャンセル</UButton>
      <UButton type="button" color="error" :aria-disabled="busy" @click="emit('confirm')">
        {{ busy ? "処理中…" : confirmLabel }}
      </UButton>
    </div>
  </dialog>
</template>
