<script setup lang="ts">
  import { PageContainer, PageHeader } from '~ui/page';
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
  <PageContainer>
    <template #header>
      <PageHeader title="Мастерская" />
    </template>

    <template #default>
      <div :class="$style.workshop">
        <SectionSpecies />

        <SectionSpells />

        <SectionFeats />

        <SectionGlossary />

        <SectionBackgrounds />

        <SectionMagicItem />

        <SectionBestiary />
      </div>
    </template>
  </PageContainer>
</template>

<style module lang="scss">
  .workshop {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
</style>
