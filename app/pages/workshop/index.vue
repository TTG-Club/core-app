<script setup lang="ts">
  import {
    SectionBackgrounds,
    SectionBestiary,
    SectionClasses,
    SectionFeats,
    SectionGlossary,
    SectionItem,
    SectionMagicItem,
    SectionSpecies,
    SectionSpells,
  } from '~workshop/section';
</script>

<template>
  <NuxtLayout
    name="detail"
    title="Мастерская"
  >
    <div
      class="grid [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))] gap-4 sm:[grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]"
    >
      <SectionSpecies />

      <SectionClasses />

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
