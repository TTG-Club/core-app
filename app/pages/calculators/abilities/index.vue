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
    <ClientOnly>
      <CalculatorAbilities />

      <template #fallback>
        <div class="flex flex-col gap-6">
          <USkeleton class="h-96 w-full rounded-xl" />

          <div class="grid gap-6 lg:grid-cols-2">
            <USkeleton class="h-64 w-full rounded-xl" />

            <USkeleton class="h-64 w-full rounded-xl" />
          </div>

          <USkeleton class="h-48 w-full rounded-xl" />
        </div>
      </template>
    </ClientOnly>
  </NuxtLayout>
</template>
