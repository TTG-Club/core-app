<script setup lang="ts">
  import { PageContainer, PageHeader } from '~/shared/ui';
  import { SectionSpecies, SectionSpells } from '~/features/workshop';
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
