<script setup lang="ts">
  import type { MulticlassDetailResponse } from '../model';

  import { UiDetailLayout } from '~ui/detail-layout';

  import {
    ClassProficiency,
    FeatureCollapse,
    MulticlassLevelInfo,
    MulticlassSpellSlots,
    MulticlassStatsBlock,
    MulticlassTable,
  } from './ui';
  import { getIndexedFeatureAnchorId } from './ui/constants';

  const { detail } = defineProps<{
    detail: MulticlassDetailResponse;
  }>();
</script>

<template>
  <UiDetailLayout>
    <template #aside>
      <div class="flex flex-col gap-4 @min-xl:@max-3xl:flex-row">
        <MulticlassLevelInfo
          v-if="detail.characterLevel && detail.multiclass"
          :spellcasting-level="detail.spellcastingLevel"
          :multiclass="detail.multiclass || []"
        />

        <MulticlassStatsBlock
          :saving-throws="detail.savingThrows"
          :requirements="detail.requirements"
          :primary-characteristics="detail.primaryCharacteristics"
          :multiclass="detail.multiclass"
        />
      </div>
    </template>

    <div class="flex flex-col gap-6">
      <div class="flex min-w-0 flex-col gap-2">
        <MulticlassTable
          :table="detail.table"
          :caster-type="detail.casterType"
          :features="detail.features"
          :multiclass="detail.multiclass"
        />

        <MulticlassSpellSlots
          :caster-type="detail.casterType"
          :spellcasting-level="detail.spellcastingLevel"
          :multiclass="detail.multiclass"
        />
      </div>

      <ClassProficiency
        :proficiency="detail.proficiency"
        :multiclass-proficiency="detail.multiclassProficiency"
        :saving-throws="detail.savingThrows"
      />

      <FeatureCollapse
        v-for="(feature, featureIndex) in detail.features"
        :key="getIndexedFeatureAnchorId(feature.key, featureIndex)"
        :anchor-id="getIndexedFeatureAnchorId(feature.key, featureIndex)"
        :feature
      />
    </div>
  </UiDetailLayout>
</template>
