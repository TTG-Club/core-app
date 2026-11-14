<script setup lang="ts">
  import {
    DICE_CALCULATOR_SEO,
    DICE_CALCULATOR_TITLE,
  } from '~calculator/dice/model';
  import {
    DiceAnalysisCard,
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
  <NuxtLayout
    name="detail"
    :title="DICE_CALCULATOR_TITLE"
  >
    <ClientOnly>
      <div class="flex flex-col gap-4">
        <DiceFormulaCard />

        <DiceResultCard />

        <DiceAnalysisCard />

        <DiceHelpCard />
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
  </NuxtLayout>
</template>
