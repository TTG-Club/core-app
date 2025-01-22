<script setup lang="ts">
  import { PageHeader } from '~/features/page';
  import { SectionSpecies, SectionSpells } from '~/features/workshop';
</script>

<template>
  <AFlex
    :gap="16"
    vertical
  >
    <PageHeader title="Мастерская" />

    <div :class="$style.workshop">
      <SectionSpecies />

      <SectionSpells />
    </div>
  </AFlex>
</template>

<style module lang="scss">
  .workshop {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
</style>
