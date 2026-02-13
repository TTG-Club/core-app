<script setup lang="ts">
  import {
    useBackgroundSelect,
    useClassSelect,
    useFeatSelect,
  } from '../composables';

  import {
    BackgroundSelect,
    ClassLevelSelect,
    FeatSlot,
    GeneralFeatsGrid,
  } from './components';

  import type { BonusSource } from '../model';

  const model = defineModel<number>({ required: true });

  const emit = defineEmits<{
    (e: 'update:feat-sources', value: BonusSource[]): void;
    (e: 'update:background-sources', value: BonusSource[]): void;
    (e: 'update:class-sources', value: BonusSource[]): void;

    (e: 'update:selected-class-url', value: string | undefined): void;
    (e: 'update:class-ability-template', value: Array<number>): void;
  }>();

  const {
    selectedUrl: backgroundSelectedUrl,
    current: backgroundCurrent,
    options: backgroundOptions,
    pending: backgroundPending,
  } = useBackgroundSelect();

  const {
    selectedUrl: classSelectedUrl,
    options: classOptions,
    pending: classesPending,
    hasEpicBoon,
    allAsiLevels,
    classAsiLevels,
    selectedClassSources,
    selectedClassAbilityTemplate,
  } = useClassSelect(model);

  watch(
    selectedClassSources,
    (sources) => {
      emit('update:class-sources', sources);
    },
    { immediate: true },
  );

  watch(
    classSelectedUrl,
    (url) => {
      emit('update:selected-class-url', url);
    },
    { immediate: true },
  );

  watch(
    selectedClassAbilityTemplate,
    (template) => {
      emit('update:class-ability-template', template);
    },
    { immediate: true },
  );

  const {
    selectedEpicFeatUrl,
    epicFeatOptions,
    pending: featPending,
    selectedSources: featSelectedSources,
    selectedFeats,
    featAbilityChoices,
    getAbilityChoice,
    getAbilityOptions,
    hasMultipleAbilities,
    handleEpicAbilityUpdate,
    getOptionsForLevel,
    updateSelectedFeat,
    updateAbilityChoice,
  } = useFeatSelect(hasEpicBoon);

  watch(
    featSelectedSources,
    (sources) => {
      emit('update:feat-sources', sources);
    },
    { immediate: true },
  );
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="grid gap-6 lg:grid-cols-2">
      <ClassLevelSelect
        v-model:selected-class-url="classSelectedUrl"
        v-model:level="model"
        :class-options="classOptions"
        :classes-pending="classesPending"
      >
        <template #epic-boon>
          <FeatSlot
            v-model="selectedEpicFeatUrl"
            label="Эпический дар"
            placeholder="Выберите эпический дар"
            :ability-choice="getAbilityChoice('epic')"
            :options="epicFeatOptions"
            :ability-options="getAbilityOptions(selectedEpicFeatUrl)"
            :loading="featPending"
            :disabled="!hasEpicBoon"
            :has-multiple-abilities="hasMultipleAbilities(selectedEpicFeatUrl)"
            @update:ability-choice="handleEpicAbilityUpdate"
          />
        </template>
      </ClassLevelSelect>

      <BackgroundSelect
        v-model:selected-background-url="backgroundSelectedUrl"
        :background="backgroundCurrent"
        :background-options="backgroundOptions"
        :loading="backgroundPending"
        @update:sources="emit('update:background-sources', $event)"
      />
    </div>

    <div class="rounded-xl border border-default bg-muted p-4">
      <GeneralFeatsGrid
        :all-asi-levels="allAsiLevels"
        :class-asi-levels="classAsiLevels"
        :level="model"
        :selected-feats="selectedFeats"
        :feat-ability-choices="featAbilityChoices"
        :loading="featPending"
        :get-options-for-level="getOptionsForLevel"
        :get-ability-options="getAbilityOptions"
        :is-feat-has-multiple-abilities="hasMultipleAbilities"
        @update:selected-feat="updateSelectedFeat"
        @update:ability-choice="updateAbilityChoice"
      />
    </div>
  </div>
</template>
