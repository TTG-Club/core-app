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
      ? 'transition-colors hover:border-primary/60 hover:bg-elevated/40'
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
  <!-- Обводка непрозрачным `border-default`: своей заливки у панели нет, и
    рамка читается только за счёт контраста с фоном страницы. Приглушённый
    бордер остаётся у внутренних элементов — там их отделяет ещё и заливка -->
  <fieldset
    class="relative min-w-0 rounded-lg border border-default px-3 pt-1 pb-3"
    :class="frameClass"
  >
    <!-- Слот заголовка нужен скелетону: там на месте подписи серая плашка,
      а рамка должна остаться той же самой, а не её копией -->
    <legend
      v-if="title || $slots.title"
      class="relative px-2 text-[10px] font-bold tracking-wider text-muted uppercase"
      :class="legendClass"
    >
      <slot name="title" />

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
