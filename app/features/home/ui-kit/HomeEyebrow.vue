<script setup lang="ts">
  /**
   * Микро-подпись блока: моноширинный капс с широким трекингом.
   * Единственный вид заголовка второго уровня на главной — вместо разнобоя
   * из иконок и жирных строк, который был в карточках раньше.
   */
  defineProps<{
    /** Текст подписи, пишется как есть — регистр задаёт CSS */
    label: string;
    /** Необязательная иконка слева (коллекции `ttg` или `tabler`) */
    icon?: string;
  }>();
</script>

<template>
  <span
    class="flex min-w-0 items-center gap-1.5 font-mono text-[11px] leading-none font-medium tracking-[0.18em] text-dimmed uppercase"
  >
    <UIcon
      v-if="icon"
      :name="icon"
      class="size-3.5 shrink-0 text-primary"
    />

    <span class="truncate">{{ label }}</span>
  </span>
</template>
