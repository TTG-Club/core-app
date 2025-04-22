<script setup lang="ts">
  import { StatsBlock, DescriptionsBlock } from './ui';

  import type { BackgroundDetailResponse } from '~/shared/types';

  defineProps<{
    background: BackgroundDetailResponse;
  }>();
</script>

<template>
  <div :class="$style.container">
    <div :class="$style.body">
      <AFlex
        vertical
        :gap="12"
        :class="$style.info"
      >
        <StatsBlock
          :ability-scores="background.abilityScores"
          :feat="background.feat"
          :skill-proficiencies="background.skillProficiencies"
          :tool-proficiency="background.toolProficiency"
          :equipment="background.equipment"
        />
      </AFlex>

      <AFlex
        vertical
        :gap="12"
        flex="1 1 auto"
      >
        <DescriptionsBlock :description="background.description" />
      </AFlex>
    </div>
  </div>
</template>

<style module lang="scss">
  .container {
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 12px;

    @container (width > 800px) {
      flex-direction: row;
      gap: 28px;
    }
  }

  .info {
    width: 100%;
    max-width: 100%;

    @container (width > 800px) {
      max-width: 320px;
    }
  }
</style>
