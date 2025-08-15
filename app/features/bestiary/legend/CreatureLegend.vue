<script setup lang="ts">
  import { PageLegend } from '~ui/page';
  import type { LegendItems } from '~ui/page';

  const items: LegendItems = [
    {
      label: 'Basic',
      title: 'Тип источника',
    },
  ];
</script>

<template>
  <PageLegend :items="items" />
</template>
