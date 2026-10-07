<script setup lang="ts">
  import { CalculatorDice, DICE_CALCULATOR_TITLE } from '~calculator/dice';

  useSeoMeta({
    title: 'Калькулятор бросков [Dice Calculator] — D&D 5',
    description:
      'Калькулятор бросков для D&D 5: бросайте кости по формуле, считайте шансы попадания и урона и смотрите распределение результатов.',
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="DICE_CALCULATOR_TITLE"
  >
    <ClientOnly>
      <CalculatorDice />

      <template #fallback>
        <div class="flex justify-center py-16">
          <UIcon
            name="tabler:loader-2"
            class="size-8 animate-spin text-muted"
          />
        </div>
      </template>
    </ClientOnly>
  </NuxtLayout>
</template>
