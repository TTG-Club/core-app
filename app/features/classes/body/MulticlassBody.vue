<script setup lang="ts">
  import type { MulticlassDetailResponse } from '../model';

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
  <div class="@container">
    <div class="flex flex-col gap-6 @min-3xl:flex-row @min-3xl:gap-7">
      <div
        :class="[
          'flex w-full shrink-0 flex-col gap-4',
          '@min-xl:@max-3xl:flex-row @min-3xl:w-80',
        ]"
      >
        <MulticlassLevelInfo
          v-if="detail.characterLevel && detail.multiclass"
          :character-level="detail.characterLevel"
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

      <div class="flex min-w-0 flex-auto flex-col gap-6">
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
    </div>
  </div>
</template>
