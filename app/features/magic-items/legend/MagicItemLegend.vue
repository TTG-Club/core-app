<script setup lang="ts">
  import { PageLegend } from '~ui/page';

  import type { LegendItems } from '~ui/page';

  const items: LegendItems = [
    {
      label: 'Н',
      title: 'Требуется настройка',
    },
  ];
</script>

<template>
  <PageLegend :items />
</template>
