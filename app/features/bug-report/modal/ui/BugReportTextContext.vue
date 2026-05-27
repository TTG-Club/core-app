<script setup lang="ts">
  import type { TextSelection } from '../../model';

  defineProps<{
    /** Контекст выделенного текста с окружением */
    selection: TextSelection;
  }>();

  const emit = defineEmits<{
    /** Удалить контекст выделенного текста */
    clear: [];
  }>();
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-1.5 text-xs text-muted">
      <UIcon
        name="tabler:text-scan-2"
        class="size-4 shrink-0"
      />

      <span class="font-medium">Выделенный текст</span>

      <UButton
        icon="tabler:x"
        variant="ghost"
        color="neutral"
        size="xs"
        class="ml-auto"
        @click.left.exact.prevent="emit('clear')"
      />
    </div>

    <div
      class="max-h-30 overflow-x-auto overflow-y-auto rounded-lg border border-default bg-elevated p-3 text-xs leading-5 break-words whitespace-pre-wrap"
    >
      <span
        v-if="selection.before"
        class="text-muted"
        >…{{ selection.before }}</span
      >

      <span
        class="font-semibold text-highlighted underline decoration-error underline-offset-3"
        >{{ selection.selected }}</span
      >

      <span
        v-if="selection.after"
        class="text-muted"
        >{{ selection.after }}…</span
      >
    </div>
  </div>
</template>
