<script setup lang="ts">
  import type { FeatDetailResponse } from '../model';

  import { AffiliationBlock } from '~ui/affiliation';

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
  <div class="@container flex flex-col gap-4">
    <div class="flex flex-col gap-3 @min-3xl:flex-row @min-3xl:gap-7">
      <div class="flex flex-col gap-3 @min-3xl:max-w-80 @min-3xl:min-w-68">
        <TopBar :category="feat.category" />

        <StatsBlock
          v-if="hasPrerequisite"
          :prerequisite="feat.prerequisite"
          :prerequisite-details="feat.prerequisiteDetails"
        />
      </div>

      <div class="flex flex-auto flex-col gap-3">
        <DescriptionsBlock :description="feat.description" />

        <AffiliationBlock
          v-if="feat.backgrounds"
          :items="feat.backgrounds"
          :label="FEAT_BODY_LABELS.backgrounds"
          section="backgrounds"
        />
      </div>
    </div>
  </div>
</template>
