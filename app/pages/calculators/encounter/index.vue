<script setup lang="ts">
  import { CalculatorEncounter } from '~calculator/encounter';

  useSeoMeta({
    title: 'Калькулятор столкновений',
    description:
      'Калькулятор столкновений — оценка сложности боя для группы персонажей D&D 5 по правилам редакции 2024 года.',
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    title="Калькулятор столкновений"
  >
    <ClientOnly>
      <CalculatorEncounter />

      <template #fallback>
        <div class="flex flex-col gap-6">
          <USkeleton class="h-40 w-full rounded-xl" />

          <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <USkeleton class="h-64 w-full rounded-xl" />

            <USkeleton class="h-64 w-full rounded-xl" />
          </div>
        </div>
      </template>
    </ClientOnly>
  </NuxtLayout>
</template>
