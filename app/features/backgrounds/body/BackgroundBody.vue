<script setup lang="ts">
  import type { RenderNode } from '~ui/markup';

  import type { BackgroundDetailResponse } from '../model';

  import { UiDetailLayout } from '~ui/detail-layout';

  import { useBackgroundToolCatalog } from '../composable';
  import {
    getBackgroundEquipmentNode,
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

  /**
   * Каталог инструментов: выбор из всей категории называется ею, ссылки без
   * снимка названия — названием карточки.
   */
  const { toolCatalog, isPending: isToolCatalogPending } =
    useBackgroundToolCatalog(() => background);

  /** Владение инструментами: ссылки мастерской либо прежний свободный текст. */
  const toolNodes = computed<Array<string>>(() =>
    getBackgroundToolNodes(background, toolCatalog.value),
  );

  /** Снаряжение: варианты «А или Б» либо прежний свободный текст. */
  const equipmentNode = computed<RenderNode>(() =>
    getBackgroundEquipmentNode(background),
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
          :is-tool-proficiency-pending="isToolCatalogPending"
          :equipment="equipmentNode"
        />
      </div>
    </template>

    <div class="flex flex-col gap-3">
      <DescriptionsBlock :description="background.description" />
    </div>
  </UiDetailLayout>
</template>
