<script setup lang="ts">
  import type { BackgroundDetailResponse } from '../model';

  import { UiDetailLayout } from '~ui/detail-layout';

  import { useBackgroundToolCategories } from '../composable';
  import {
    getBackgroundFeatNode,
    getBackgroundSkillNode,
    getBackgroundToolNodes,
  } from '../model';
  import { DescriptionsBlock, StatsBlock } from './ui';

  const { background } = defineProps<{
    background: BackgroundDetailResponse;
  }>();

  /** Черта: названная предысторией либо список на выбор игрока. */
  const featNode = computed<string>(() => getBackgroundFeatNode(background));

  /** Навыки: ссылки на статьи глоссария. */
  const skillNode = computed<string>(() => getBackgroundSkillNode(background));

  /** Категории инструментов: выбор из всей категории называется ею. */
  const { toolCategories, isPending: isToolCategoriesPending } =
    useBackgroundToolCategories(() => background);

  /** Владение инструментами: ссылки мастерской либо прежний свободный текст. */
  const toolNodes = computed<Array<string>>(() =>
    getBackgroundToolNodes(background, toolCategories.value),
  );
</script>

<template>
  <UiDetailLayout>
    <template #aside>
      <div class="flex flex-col gap-3">
        <StatsBlock
          :ability-scores="background.abilityScores"
          :feat="featNode"
          :skill-proficiencies="skillNode"
          :tool-proficiency="toolNodes"
          :is-tool-proficiency-pending="isToolCategoriesPending"
          :equipment="background.equipment"
        />
      </div>
    </template>

    <div class="flex flex-col gap-3">
      <DescriptionsBlock :description="background.description" />
    </div>
  </UiDetailLayout>
</template>
