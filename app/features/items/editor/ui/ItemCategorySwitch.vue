<script setup lang="ts">
  import type { ItemCategory } from '~items/model';

  import { ITEM_CATEGORY_OPTIONS } from '~items/model';

  const model = defineModel<ItemCategory>({ required: true });
</script>

<template>
  <!--
    Рамка карточек — `border-default`, как у остальных блоков редактора.

    Иконку `item.icon` при скрытом индикаторе рисует сама тема, своей в слоте
    не нужно. Тема же ставит иконку столбиком над подписью по центру — здесь
    иконка и подпись в одной строке слева, а описание прижато к низу карточки:
    подписи в одну и в две строки иначе разъезжаются по высоте.
  -->
  <URadioGroup
    v-model="model"
    :items="ITEM_CATEGORY_OPTIONS"
    variant="card"
    orientation="horizontal"
    indicator="hidden"
    :ui="{
      fieldset: 'grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6',
      item: 'cursor-pointer items-stretch border-default p-3 has-data-[state=checked]:bg-elevated/50',
      wrapper:
        'grid h-full w-full grid-cols-[auto_1fr] grid-rows-[auto_1fr] items-center gap-x-1.5 gap-y-1 text-left',
      icon: 'text-dimmed',
      label: 'cursor-pointer',
      description: 'col-span-2 self-end text-xs text-balance',
    }"
  />
</template>
