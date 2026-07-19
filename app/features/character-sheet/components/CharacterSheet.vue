<script setup lang="ts">
  import type { Character } from '../types';

  import CharacterHeader from './CharacterHeader.vue';
  import CharacterMainStats from './CharacterMainStats.vue';
  import CharacterPassives from './CharacterPassives.vue';
  import CharacterProficiencies from './CharacterProficiencies.vue';
  import CharacterSaves from './CharacterSaves.vue';
  import CharacterSkills from './CharacterSkills.vue';
  import CharacterTabs from './CharacterTabs.vue';
  import CharacterVitals from './CharacterVitals.vue';

  defineProps<{
    character: Character;
  }>();
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-[1400px] flex-col gap-6 p-4 text-default"
  >
    <CharacterHeader :character="character" />

    <div
      class="my-2 h-px w-full bg-linear-to-r from-transparent via-[color-mix(in_oklch,var(--vttg-gold)_50%,transparent)] to-transparent"
    />

    <!-- Main Grid Layout -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <!-- Column 1: Vitals, Saves, Proficiencies (Left Sidebar) -->
      <div class="flex min-w-[260px] flex-col gap-4 lg:col-span-3">
        <CharacterVitals :params="character.params" />

        <CharacterSaves :saving-throws="character.savingThrows" />

        <CharacterProficiencies :proficiencies="character.proficiencies" />
      </div>

      <!-- Column 2: Skills & Passives (Middle Column) -->
      <div class="flex min-w-[260px] flex-col gap-4 lg:col-span-3">
        <CharacterSkills :skills="character.skills" />

        <CharacterPassives :passive-senses="character.passiveSenses" />
      </div>

      <!-- Column 3: Stats & Main Content (Right Content Area) -->
      <div class="flex grow flex-col gap-6 lg:col-span-6">
        <CharacterMainStats :stats="character.stats" />

        <CharacterTabs />
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* Optional: Add custom scrollbar styling if needed here */
</style>
