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
    <div
      class="grid [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))] gap-4 sm:[grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]"
    >
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
