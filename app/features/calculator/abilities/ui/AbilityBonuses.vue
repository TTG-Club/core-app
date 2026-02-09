<script setup lang="ts">
  import {
    useBackgroundSelect,
    useClassSelect,
    useFeatSelect,
  } from '../composables';

  import {
    BackgroundSelect,
    ClassLevelSelect,
    EpicBoonSelect,
    GeneralFeatsGrid,
  } from './components';

  import type { BonusSource } from '../model';

  const level = defineModel<number>({ required: true });

  const emit = defineEmits<{
    (e: 'update:feat-sources', value: BonusSource[]): void;
    (e: 'update:background-sources', value: BonusSource[]): void;
  }>();

  const background = useBackgroundSelect();
  const classSelect = useClassSelect(level);
  const featSelect = useFeatSelect(classSelect.hasEpicBoon);

  watch(featSelect.selectedSources, (sources) => {
    emit('update:feat-sources', sources);
  });
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ClassLevelSelect
        v-model:selected-class-url="classSelect.selectedUrl.value"
        v-model:level="level"
        :class-options="classSelect.options.value"
        :classes-pending="classSelect.pending.value"
      >
        <template #epic-boon>
          <EpicBoonSelect
            v-model:model-value="featSelect.selectedEpicFeatUrl.value"
            :ability-choice="featSelect.getAbilityChoice('epic')"
            :options="featSelect.epicFeatOptions.value"
            :ability-options="
              featSelect.getAbilityOptions(featSelect.selectedEpicFeatUrl.value)
            "
            :loading="featSelect.pending.value"
            :disabled="!classSelect.hasEpicBoon.value"
            :has-multiple-abilities="
              featSelect.hasMultipleAbilities(
                featSelect.selectedEpicFeatUrl.value,
              )
            "
            @update:ability-choice="featSelect.handleEpicAbilityUpdate"
          />
        </template>
      </ClassLevelSelect>

      <BackgroundSelect
        v-model:selected-background-url="background.selectedUrl.value"
        :background="background.current.value"
        :background-options="background.options.value"
        :loading="background.pending.value"
        @update:sources="emit('update:background-sources', $event)"
      />
    </div>

    <div class="rounded-xl border border-default bg-muted p-4">
      <GeneralFeatsGrid
        :all-asi-levels="classSelect.allAsiLevels.value"
        :class-asi-levels="classSelect.classAsiLevels.value"
        :level="level"
        :selected-feats="featSelect.selectedFeats.value"
        :feat-ability-choices="featSelect.featAbilityChoices.value"
        :loading="featSelect.pending.value"
        :get-options-for-level="featSelect.getOptionsForLevel"
        :get-ability-options="featSelect.getAbilityOptions"
        :is-feat-has-multiple-abilities="featSelect.hasMultipleAbilities"
        @update:selected-feat="featSelect.updateSelectedFeat"
        @update:ability-choice="featSelect.updateAbilityChoice"
      />
    </div>
  </div>
</template>
