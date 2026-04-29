<script setup lang="ts">
  import type { MulticlassDetailResponse } from '../model';

  import {
    ClassProficiency,
    FeatureCollapse,
    MulticlassLevelInfo,
    MulticlassTable,
    StatsBlock,
  } from './ui';

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
          :multiclass="detail.multiclass || []"
        />

        <StatsBlock
          :hit-dice="detail.hitDice"
          :saving-throws="detail.savingThrows"
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
        </div>

        <ClassProficiency
          :proficiency="detail.proficiency"
          :multiclass-proficiency="detail.multiclassProficiency"
          :saving-throws="detail.savingThrows"
        />

        <FeatureCollapse
          v-for="feature in detail.features"
          :key="feature.key"
          :feature
        />
      </div>
    </div>
  </div>
</template>
