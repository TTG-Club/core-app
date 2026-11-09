<script setup lang="ts">
  const { fluid = false } = defineProps<{
    /** Заголовок секции */
    title: string;
    /**
     * Колонка во всю ширину своей панели: ширину задаёт разделитель широкого
     * режима, а линию между колонками рисует он же.
     */
    fluid?: boolean;
  }>();

  const rootClass = computed(() =>
    fluid
      ? 'h-full w-full overflow-y-auto hidden-scrollbar'
      : 'sticky top-0 left-0 z-1 shrink-0 border-default backdrop-blur-lg md:left-auto lg:hidden-scrollbar lg:h-dvh lg:border-r lg:backdrop-blur-none',
  );

  const bodyClass = computed(() => (fluid ? 'pt-6' : 'md:pt-6 lg:w-75'));
</script>

<template>
  <div :class="rootClass">
    <div
      class="flex w-full flex-col gap-4 p-4"
      :class="bodyClass"
    >
      <h2 class="text-2xl text-highlighted">{{ title }}</h2>

      <slot name="default" />
    </div>
  </div>
</template>
