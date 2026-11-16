<script setup lang="ts">
  import { useEncounterCalculator, useEncounterGenerator } from './composables';
  import {
    EncounterCreaturesCard,
    EncounterGeneratorCard,
    EncounterPartyCard,
    EncounterSummary,
  } from './ui';

  const {
    party,
    creatures,
    result,
    canAddPartyRow,
    canAddCreature,
    addPartyRow,
    updatePartyRow,
    removePartyRow,
    addCreature,
    updateCreature,
    removeCreature,
    clearCreatures,
  } = useEncounterCalculator();

  const { isGenerating, generate } = useEncounterGenerator(result, addCreature);

  const canGenerate = computed(
    () => canAddCreature.value && result.value.characterCount > 0,
  );
</script>

<template>
  <div class="flex flex-col gap-6">
    <EncounterSummary :result="result" />

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <EncounterPartyCard
        :party="party"
        :can-add="canAddPartyRow"
        @add="addPartyRow()"
        @update="updatePartyRow"
        @remove="removePartyRow"
      />

      <div class="flex flex-col gap-6">
        <EncounterGeneratorCard
          :loading="isGenerating"
          :disabled="!canGenerate"
          @generate="generate"
        />

        <EncounterCreaturesCard
          :creatures="creatures"
          :can-add="canAddCreature"
          @add="addCreature"
          @update="updateCreature"
          @remove="removeCreature"
          @clear="clearCreatures"
        />
      </div>
    </div>
  </div>
</template>
