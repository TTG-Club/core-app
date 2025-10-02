<script setup lang="ts">
  import type { LegendItems } from '~ui/page';
  import { PageLegend } from '~ui/page';

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
