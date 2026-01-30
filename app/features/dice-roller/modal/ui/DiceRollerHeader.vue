<script setup lang="ts">
  defineEmits<{
    (e: 'clear'): void;
    (e: 'close'): void;
  }>();
</script>

<template>
  <div
    class="relative z-10 flex shrink-0 items-center justify-between gap-2 border-b border-default bg-elevated p-4 shadow-sm"
  >
    <div class="min-w-0">
      <p class="m-0 truncate font-semibold text-default">История бросков</p>
    </div>

    <div class="flex items-center gap-1">
      <UButton
        icon="i-fluent-delete-16-regular"
        variant="soft"
        color="neutral"
        size="sm"
        aria-label="Очистить историю"
        @click.left.exact.prevent="$emit('clear')"
      />

      <UButton
        icon="i-ttg-x"
        variant="soft"
        color="neutral"
        size="sm"
        aria-label="Закрыть"
        @click.left.exact.prevent="$emit('close')"
      />
    </div>
  </div>
</template>
