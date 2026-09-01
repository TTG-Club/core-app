<script setup lang="ts">
  import type { BackgroundDetailResponse } from '~backgrounds/model';

  import {
    getBackgroundFeatNode,
    getBackgroundToolNodes,
  } from '~backgrounds/model';

  import { DescriptionsBlock, StatsBlock } from './ui';

  const { background } = defineProps<{
    background: BackgroundDetailResponse;
  }>();

  /** Черта: названная предысторией либо список на выбор игрока. */
  const featNode = computed<string>(() => getBackgroundFeatNode(background));

  /** Владение инструментами: ссылки мастерской либо прежний свободный текст. */
  const toolNodes = computed<Array<string>>(() =>
    getBackgroundToolNodes(background),
  );
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
          :feat="featNode"
          :skill-proficiencies="background.skillProficiencies"
          :tool-proficiency="toolNodes"
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
      flex-shrink: 0;
      width: 320px;
    }
  }
</style>
