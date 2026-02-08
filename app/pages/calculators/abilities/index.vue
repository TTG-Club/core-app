<script setup lang="ts">
  import { CalculatorAbilities } from '~calculator/abilities';

  useSeoMeta({
    title: 'Калькулятор характеристик',
    description:
      'Калькулятор характеристик — инструмент для распределения характеристик персонажа D&D 5 (редакция 2024 года).',
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    title="Калькулятор характеристик"
  >
    <CalculatorAbilities />
  </NuxtLayout>
</template>
