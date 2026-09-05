<script setup lang="ts">
  import { CURRENT_SELECTION_LABELS } from '../../model';

  const { title, name, removeLabel, removeDescription } = defineProps<{
    /** Подпись плашки («Сейчас выбран вид»). */
    title: string;

    /** Название уже выбранного вида или предыстории. */
    name: string;

    /** Подпись кнопки снятия («Удалить вид»). */
    removeLabel: string;

    /** Что именно уйдёт с листа — текст подтверждения. */
    removeDescription: string;
  }>();

  const emit = defineEmits<{
    remove: [];
  }>();

  const isConfirming = ref(false);

  /**
   * Спрашивает подтверждение: снятие забирает умения и выданные владения, а
   * вернуть их можно только повторным выбором.
   */
  function handleRemoveClick() {
    isConfirming.value = true;
  }

  /** Отменяет снятие: плашка возвращается к обычному виду. */
  function handleRemoveCancel() {
    isConfirming.value = false;
  }

  /** Подтверждает снятие — само снятие ведёт мастер, плашка только просит. */
  function handleRemoveConfirm() {
    isConfirming.value = false;

    emit('remove');
  }
</script>

<template>
  <div
    class="flex flex-col gap-2 rounded-lg border border-default/50 bg-elevated/20 p-3"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex min-w-0 flex-col">
        <span class="text-[10px] font-bold tracking-wider text-muted uppercase">
          {{ title }}
        </span>

        <span class="text-sm font-bold wrap-break-word text-highlighted">
          {{ name }}
        </span>
      </div>

      <UButton
        icon="tabler:trash"
        color="error"
        variant="subtle"
        size="xs"
        :label="removeLabel"
        :disabled="isConfirming"
        @click.left.exact.prevent="handleRemoveClick"
      />
    </div>

    <!-- Подтверждение прямо в плашке: вложенная модалка оказалась бы под
    `aria-hidden` мастера (так же сделано снятие класса) -->
    <div
      v-if="isConfirming"
      class="flex flex-col gap-2 border-t border-default/50 pt-2"
    >
      <span class="text-xs text-toned">{{ removeDescription }}</span>

      <div class="flex justify-end gap-2">
        <UButton
          :label="CURRENT_SELECTION_LABELS.removeCancel"
          color="neutral"
          variant="ghost"
          size="xs"
          @click.left.exact.prevent="handleRemoveCancel"
        />

        <UButton
          :label="CURRENT_SELECTION_LABELS.removeConfirm"
          icon="tabler:trash"
          color="error"
          size="xs"
          @click.left.exact.prevent="handleRemoveConfirm"
        />
      </div>
    </div>
  </div>
</template>
