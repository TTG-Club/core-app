<script setup lang="ts">
  import type { BackgroundDetailResponse } from '../model';

  import { useBackgroundToolCategories } from '../composable';
  import { getBackgroundFeatNode, getBackgroundToolNodes } from '../model';
  import { DescriptionsBlock, StatsBlock } from './ui';

  const { background } = defineProps<{
    background: BackgroundDetailResponse;
  }>();

  /** Черта: названная предысторией либо список на выбор игрока. */
  const featNode = computed<string>(() => getBackgroundFeatNode(background));

  /** Категории инструментов: выбор из всей категории называется ею. */
  const { toolCategories, isPending: isToolCategoriesPending } =
    useBackgroundToolCategories(() => background);

  /** Владение инструментами: ссылки мастерской либо прежний свободный текст. */
  const toolNodes = computed<Array<string>>(() =>
    getBackgroundToolNodes(background, toolCategories.value),
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
          :is-tool-proficiency-pending="isToolCategoriesPending"
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
