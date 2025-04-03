<script setup lang="ts">
  import {
    SectionSpecies,
    SectionSpells,
    SectionFeats,
  } from '~workshop/section';
  import { PageContainer, PageHeader } from '~ui/page';
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
