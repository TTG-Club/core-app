<script setup lang="ts">
  /**
   * Рамка блока листа.
   *
   * Обводка непрозрачным `border-default`: своей заливки у панели нет, и рамка
   * читается только за счёт контраста с фоном страницы. Приглушённый бордер
   * остаётся у внутренних элементов — там их отделяет ещё и заливка.
   *
   * ВАЖНО: перед `fieldset` в шаблоне не должно быть ничего, даже комментария.
   * Дев-сборка Vue комментарии сохраняет, корень панели становится фрагментом, и
   * `$el` у неё — якорь фрагмента, а не сам элемент. Всё, что достаёт элемент по
   * ссылке на компонент (`onLongPress` здесь и в ресурсах класса,
   * `useElementHover` в плитке характеристики), тогда молча вешается на пустой
   * узел — и ломается только разработка, потому что прод комментарии вырезает.
   */
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
        <!-- Обе подписи в разметке: полная в узкой плитке переносится на вторую
          строку и разрывает обводку, поэтому короткую показываем только там, где
          полная уже не влезает. Порог мерится по внутренней ширине рамки (так
          работает container-query), а самой длинной подписи листа («Класс
          доспеха») хватает 6.75rem вместе с отбивкой легенды — 7rem даёт запас
          на другой шрифт. Скринридеру название группы читается полностью в
          любом состоянии — из sr-only-дубля -->
        <span class="whitespace-nowrap @max-[7rem]:hidden">{{ title }}</span>

        <span class="@min-[7rem]:hidden">
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
