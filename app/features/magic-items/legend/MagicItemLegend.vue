<script setup lang="ts">
  import { type LegendItems, PageLegend } from '~ui/page';

  const items: LegendItems = [
    {
      label: 'Basic',
      title: 'Тип источника',
    },
    {
      label: 'Н',
      title: 'Требуется настройка',
    },
  ];
</script>

<template>
  <PageLegend :items />
</template>
