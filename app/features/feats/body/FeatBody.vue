<script setup lang="ts">
  import type { FeatDetailResponse } from '../model';

  import { AffiliationBlock } from '~ui/affiliation';
  import { UiDetailLayout } from '~ui/detail-layout';

  import { getFeatPrerequisiteParts } from '../model';
  import { FEAT_BODY_LABELS } from './model';
  import { DescriptionsBlock, StatsBlock, TopBar } from './ui';

  const { feat } = defineProps<{
    feat: FeatDetailResponse;
  }>();

  /**
   * Есть ли что показать в условии: либо разобранные требования, либо строка,
   * набранная до разбора. Пусто и то, и другое — черта доступна всем.
   */
  const hasPrerequisite = computed<boolean>(
    () =>
      !!feat.prerequisite
      || getFeatPrerequisiteParts(feat.prerequisiteDetails).length > 0,
  );
</script>

<template>
  <UiDetailLayout>
    <template #aside>
      <div class="flex flex-col gap-3">
        <TopBar :category="feat.category" />

        <StatsBlock
          v-if="hasPrerequisite"
          :prerequisite="feat.prerequisite"
          :prerequisite-details="feat.prerequisiteDetails"
        />
      </div>
    </template>

    <div class="flex flex-col gap-3">
      <DescriptionsBlock :description="feat.description" />

      <AffiliationBlock
        v-if="feat.backgrounds"
        :items="feat.backgrounds"
        :label="FEAT_BODY_LABELS.backgrounds"
        section="backgrounds"
      />
    </div>
  </UiDetailLayout>
</template>
