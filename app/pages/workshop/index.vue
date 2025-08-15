<script setup lang="ts">
  import {
    SectionSpecies,
    SectionSpells,
    SectionFeats,
    SectionGlossary,
    SectionBackgrounds,
    SectionMagicItem,
    SectionBestiary,
  } from '~workshop/section';
</script>

<template>
  <NuxtLayout
    name="detail"
    title="Мастерская"
  >
    <div :class="$style.workshop">
      <SectionSpecies />

      <SectionSpells />

      <SectionFeats />

      <SectionGlossary />

      <SectionBackgrounds />

      <SectionMagicItem />

      <SectionBestiary />
    </div>
  </NuxtLayout>
</template>

<style module lang="scss">
  .workshop {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
</style>
