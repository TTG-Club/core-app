<script setup lang="ts">
  const props = defineProps<{
    title?: string;
    /** Короткая подпись: подменяет `title`, когда рамка слишком узкая. */
    shortTitle?: string;
    /** Центрирование заголовка на рамке (для плиток-показателей). */
    centerTitle?: boolean;
    /** Подсветка всего блока при наведении (для кликабельных блоков). */
    interactive?: boolean;
  }>();

  const frameClass = computed(() => [
    props.interactive
      ? 'transition-colors hover:border-warning/60 hover:bg-elevated/40'
      : undefined,

    // Свой @container только с короткой подписью: подпись переключаем по
    // ширине самой рамки, а не всего листа, и не меняем контекст остальным
    // панелям (внутри них есть свои @-утилиты)
    props.shortTitle ? '@container' : undefined,
  ]);

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
      <template v-if="shortTitle">
        <!-- Обе подписи в разметке: полная упирается в углы узкой плитки,
          поэтому ниже 11rem показываем короткую. Скринридеру название группы
          читается полностью в любом состоянии — из sr-only-дубля -->
        <span class="@max-[11rem]:hidden">{{ title }}</span>

        <span class="@min-[11rem]:hidden">
          <span aria-hidden="true">{{ shortTitle }}</span>

          <span class="sr-only">{{ title }}</span>
        </span>
      </template>

      <template v-else>{{ title }}</template>

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
