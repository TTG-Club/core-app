<script setup lang="ts">
  import {
    DiceAnalysisCard,
    DiceFormulaCard,
    DiceHelpCard,
    DiceResultCard,
  } from './ui';
</script>

<template>
  <div class="flex flex-col gap-4">
    <DiceFormulaCard />

    <DiceResultCard />

    <DiceAnalysisCard />

    <DiceHelpCard />
  </div>
</template>
