<script setup lang="ts">
  import SheetPanel from './SheetPanel.vue';

  // Панель листа на время загрузки: рамка — та же `SheetPanel`, что и у готового
  // листа, поэтому подложка не разъедется, если панели переоформят. Вместо
  // подписи в легенду уходит серая плашка.
  const { centerTitle = false, titleClass = 'w-16' } = defineProps<{
    /** Ширина серой плашки вместо заголовка рамки. */
    titleClass?: string;

    /** Плашка заголовка по центру рамки — как у плиток-показателей. */
    centerTitle?: boolean;
  }>();
</script>

<template>
  <SheetPanel :center-title="centerTitle">
    <template #title>
      <USkeleton
        as="span"
        class="block h-2.5 rounded-sm"
        :class="titleClass"
      />
    </template>

    <slot />
  </SheetPanel>
</template>
