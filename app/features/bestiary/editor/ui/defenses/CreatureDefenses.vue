<script setup lang="ts">
  import {
    CreatureVulnerabilities,
    CreatureResistances,
    CreatureImmunities,
  } from './ui';
  import type { CreatureDefenses } from '~bestiary/types';

  const defenses = defineModel<CreatureDefenses>({
    required: true,
  });
</script>

<template>
  <USeparator>
    <span class="font-bold text-secondary">Защита</span>
  </USeparator>

  <div class="col-span-full grid grid-cols-24 gap-4">
    <CreatureVulnerabilities v-model="defenses.vulnerabilities" />

    <CreatureResistances v-model="defenses.resistances" />

    <CreatureImmunities v-model="defenses.immunities" />
  </div>
</template>
