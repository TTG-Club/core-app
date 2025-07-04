<script setup lang="ts">
  import { type LegendItems, PageLegend } from '~ui/page';

  const items: LegendItems = [
    {
      label: 'Basic',
      title: 'Тип источника',
    },
  ];
</script>

<template>
  <PageLegend :items />
</template>
