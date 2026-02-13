<script setup lang="ts">
  import { DescriptionsBlock, StatsBlock } from './ui';

  import type { BackgroundDetailResponse } from '~backgrounds/model';

  defineProps<{
    background: BackgroundDetailResponse;
  }>();
</script>

<template>
  <div :class="$style.container">
    <div :class="$style.body">
      <div
        class="flex flex-col gap-3"
        :class="$style.info"
      >
        <StatsBlock
          :ability-scores="background.abilityScores"
          :feat="background.feat"
          :skill-proficiencies="background.skillProficiencies"
          :tool-proficiency="background.toolProficiency"
          :equipment="background.equipment"
        />
      </div>

      <div class="flex flex-auto flex-col gap-3">
        <DescriptionsBlock :description="background.description" />
      </div>
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
