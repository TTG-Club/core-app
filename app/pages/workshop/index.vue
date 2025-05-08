<script setup lang="ts">
  import { PageContainer, PageHeader } from '~ui/page';
  import {
    SectionSpecies,
    SectionSpells,
    SectionFeats,
    SectionBackgrounds,
    SectionMagicItem,
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

        <SectionBackgrounds />

        <SectionMagicItem />
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
