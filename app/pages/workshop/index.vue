<script setup lang="ts">
  import {
    SectionSpecies,
    SectionSpells,
    SectionFeats,
    SectionGlossary,
    SectionBackgrounds,
    SectionMagicItem,
    SectionBestiary,
    SectionItem,
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

      <SectionItem />
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
