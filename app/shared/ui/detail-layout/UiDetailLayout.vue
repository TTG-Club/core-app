<script setup lang="ts">
  /**
   * Единая раскладка карточки раздела: узкая колонка свойств слева и текст
   * справа. Раскладка зависит от ширины КОНТЕЙНЕРА, а не окна: в дровере и
   * на телефоне колонки идут столбиком, на широкой странице — рядом.
   *
   * Ширина левой колонки фиксирована и не зависит от содержимого: колонка
   * не сжимается под длинный текст справа, поэтому у всех разделов и записей
   * она одинаковая.
   *
   * Раскладка отвечает только за колонки; внутреннее устройство каждой
   * колонки (отступы, ряды на средней ширине) задаёт сама карточка.
   */
  const { stacked = false } = defineProps<{
    /**
     * Колонки всегда столбиком, как в узком контейнере: свойства сверху,
     * текст под ними во всю ширину.
     */
    stacked?: boolean;
  }>();

  const rowClass = computed(() => [
    'flex flex-col gap-4',
    { '@min-3xl:flex-row @min-3xl:gap-7': !stacked },
  ]);

  const asideClass = computed(() => [
    'flex w-full flex-col',
    { '@min-3xl:w-80 @min-3xl:shrink-0': !stacked },
  ]);

  defineSlots<{
    /** Колонка свойств слева; без слота текст занимает всю ширину */
    aside?: () => unknown;
    /** Основной текст справа */
    default: () => unknown;
  }>();
</script>

<template>
  <div class="@container w-full min-w-0">
    <div :class="rowClass">
      <div
        v-if="$slots.aside"
        :class="asideClass"
      >
        <slot name="aside" />
      </div>

      <div class="min-w-0 flex-auto">
        <slot />
      </div>
    </div>
  </div>
</template>
