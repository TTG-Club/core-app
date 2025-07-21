<script setup lang="ts">
  import { PageLegend } from '~ui/page';
  import type { LegendItems } from '~ui/page';

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
