<script setup lang="ts">
  import { PageLegend } from '~ui/page';
  import type { LegendItems } from '~ui/page';

  const items: LegendItems = [
    {
      label: '◐',
      title: 'Заговор',
    },
    {
      label: 'К',
      title: 'Концентрация',
    },
    {
      label: 'Р',
      title: 'Ритуал',
    },
    {
      label: 'В С М',
      title:
        'Вербальный компонент, Соматический компонент, Материальный компонент',
    },
    {
      label: 'Basic',
      title: 'Тип источника',
    },
  ];
</script>

<template>
  <PageLegend :items="items" />
</template>
