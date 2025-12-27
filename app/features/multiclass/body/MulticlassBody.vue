<script setup lang="ts">
  import {
    StatsBlock,
    ClassProficiency,
    FeatureCollapse,
    MulticlassLevelInfo,
    MulticlassTable,
  } from '~classes/body/ui';

  import type { MulticlassDetailResponse } from '~multiclass/types';
  import { useMulticlassClasses } from '~multiclass/composable';

  interface Props {
    detail: MulticlassDetailResponse;
  }

  const props = defineProps<Props>();

  const {
    sidebarClasses,
    containerClasses,
    contentClasses,
    tableWrapperClasses,
  } = useMulticlassClasses(props);

  const hasCharacterLevel = computed(() => {
    return Boolean(props.detail.characterLevel && props.detail.multiclass);
  });

  const multiclassList = computed(() => {
    return props.detail.multiclass || [];
  });
</script>

<template>
  <div class="@container">
    <div :class="containerClasses">
      <div :class="sidebarClasses">
        <MulticlassLevelInfo
          v-if="hasCharacterLevel"
          :character-level="props.detail.characterLevel"
          :multiclass="multiclassList"
        />

        <StatsBlock
          :hit-dice="props.detail.hitDice"
          :saving-throws="props.detail.savingThrows"
          :primary-characteristics="props.detail.primaryCharacteristics"
          :multiclass="props.detail.multiclass"
        />
      </div>

      <div :class="contentClasses">
        <div :class="tableWrapperClasses">
          <MulticlassTable
            :table="props.detail.table"
            :caster-type="props.detail.casterType"
            :features="props.detail.features"
            :multiclass="props.detail.multiclass"
          />
        </div>

        <ClassProficiency
          :proficiency="props.detail.proficiency"
          :saving-throws="props.detail.savingThrows"
        />

        <FeatureCollapse
          v-for="feature in props.detail.features"
          :key="feature.key"
          :feature
        />
      </div>
    </div>
  </div>
</template>
