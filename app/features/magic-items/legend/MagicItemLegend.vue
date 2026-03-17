<script setup lang="ts">
  import type { LegendItems } from '~ui/page';

  import { PageLegend } from '~ui/page';

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
