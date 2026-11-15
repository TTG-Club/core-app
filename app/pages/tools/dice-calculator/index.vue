<script setup lang="ts">
  import { DICE_CALCULATOR_SEO } from '~calculator/dice/model';
  import {
    DiceAnalysisCard,
    DiceCalculatorHeader,
    DiceFormulaCard,
    DiceHelpCard,
    DiceResultCard,
  } from '~calculator/dice/ui';

  useSeoMeta({
    title: DICE_CALCULATOR_SEO.title,
    description: DICE_CALCULATOR_SEO.description,
  });
</script>

<template>
  <NuxtLayout name="default">
    <div class="flex flex-col gap-3 pt-4 lg:gap-4 lg:pt-0">
      <DiceCalculatorHeader />

      <ClientOnly>
        <!-- С `lg` — две колонки: слева формула и справка, справа результат
          и анализ. Ниже колонки растворяются (`contents`), и порядок задаёт
          `order`: результат броска должен идти сразу за формулой, а справка —
          последней -->
        <div
          class="grid gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-4"
        >
          <div class="flex flex-col gap-3 max-lg:contents lg:gap-4">
            <DiceFormulaCard class="order-1" />

            <DiceHelpCard class="order-4" />
          </div>

          <div class="flex flex-col gap-3 max-lg:contents lg:gap-4">
            <DiceResultCard class="order-2" />

            <DiceAnalysisCard class="order-3" />
          </div>
        </div>

        <template #fallback>
          <div class="flex justify-center py-16">
            <UIcon
              name="tabler:loader-2"
              class="size-8 animate-spin text-muted"
            />
          </div>
        </template>
      </ClientOnly>
    </div>
  </NuxtLayout>
</template>
