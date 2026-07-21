<script setup lang="ts">
  const props = defineProps<{
    title?: string;
    /** Центрирование заголовка на рамке (для плиток-показателей). */
    centerTitle?: boolean;
    /** Подсветка всего блока при наведении (для кликабельных блоков). */
    interactive?: boolean;
  }>();

  const frameClass = computed(() =>
    props.interactive
      ? 'transition-colors hover:border-warning/60 hover:bg-elevated/40'
      : undefined,
  );

  const legendClass = computed(() =>
    props.centerTitle ? 'mx-auto' : undefined,
  );
</script>

<template>
  <fieldset
    class="relative min-w-0 rounded-lg border border-default/50 px-3 pt-1 pb-3"
    :class="frameClass"
  >
    <legend
      v-if="title"
      class="relative px-2 text-[10px] font-bold tracking-wider text-muted uppercase"
      :class="legendClass"
    >
      {{ title }}

      <!-- Абсолютное позиционирование: скрытые действия не расширяют легенду
        и не оставляют дыру в обводке рамки -->
      <span
        v-if="$slots['title-actions']"
        class="absolute top-1/2 left-full mt-px flex -translate-y-1/2 items-center"
      >
        <slot name="title-actions" />
      </span>
    </legend>

    <slot />
  </fieldset>
</template>
