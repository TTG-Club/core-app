<script setup lang="ts">
  import {
    CreatureImmunities,
    CreatureResistances,
    CreatureVulnerabilities,
  } from './ui';

  import type { CreatureDefenses } from '~bestiary/types';

  const defenses = defineModel<CreatureDefenses>({
    required: true,
  });
</script>

<template>
  <UCard
    variant="subtle"
    class="col-span-full"
  >
    <template #header>
      <h2 class="truncate text-base text-highlighted">Защита</h2>
    </template>

    <div class="col-span-full grid grid-cols-24 gap-4">
      <CreatureVulnerabilities v-model="defenses.vulnerabilities" />

      <CreatureResistances v-model="defenses.resistances" />

      <CreatureImmunities v-model="defenses.immunities" />
    </div>
  </UCard>
</template>
