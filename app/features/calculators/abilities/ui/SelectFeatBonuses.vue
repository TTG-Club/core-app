<script setup lang="ts">
  import { SelectFeat } from '~ui/select';

  import { AbilityKey, getAbilityInfo } from '~/shared/types';

  import type { BaseAbilityScores, FeatSelectResponse } from '~/shared/types';

  const bonus = defineModel<BaseAbilityScores>('bonus', { required: true });
  const level = defineModel<number | undefined>('level', { required: true });

  const featSlots = computed(() => {
    const currentLevel = level.value || 1;

    if (currentLevel >= 19) {
      return 5;
    }

    if (currentLevel >= 16) {
      return 4;
    }

    if (currentLevel >= 12) {
      return 3;
    }

    if (currentLevel >= 8) {
      return 2;
    }

    if (currentLevel >= 4) {
      return 1;
    }

    return 0;
  });

  const selectedFeats = ref<Array<string | undefined>>([]);

  // Ensure selectedFeats matches slot count
  watch(
    featSlots,
    (count) => {
      if (selectedFeats.value.length > count) {
        selectedFeats.value = selectedFeats.value.slice(0, count);
      } else {
        while (selectedFeats.value.length < count) {
          selectedFeats.value.push(undefined);
        }
      }
    },
    { immediate: true },
  );

  const { data: feats } = await useAsyncData<FeatSelectResponse[]>(
    'feats-select',
    () => $fetch('/api/v2/feats/select'),
  );

  // Map: slotIndex -> choiceIndex -> AbilityKey
  const featChoices = ref<Record<number, Record<number, AbilityKey>>>({});

  function getFeat(url: string | undefined) {
    if (!url) {
      return undefined;
    }

    return feats.value?.find((f) => f.url === url);
  }

  // Clear choices when feat changes
  watch(
    selectedFeats,
    (newFeats, oldFeats) => {
      newFeats.forEach((featUrl, index) => {
        if (oldFeats && featUrl !== oldFeats[index]) {
          featChoices.value[index] = {};
        }
      });
    },
    { deep: true },
  );

  watchEffect(() => {
    const newBonus: BaseAbilityScores = {
      [AbilityKey.STRENGTH]: 0,
      [AbilityKey.DEXTERITY]: 0,
      [AbilityKey.CONSTITUTION]: 0,
      [AbilityKey.INTELLIGENCE]: 0,
      [AbilityKey.WISDOM]: 0,
      [AbilityKey.CHARISMA]: 0,
    };

    selectedFeats.value.forEach((url, index) => {
      if (!url) {
        return;
      }

      const feat = getFeat(url);

      if (!feat) {
        return;
      }

      if (feat.increase > 0 && feat.abilities.length > 0) {
        if (feat.abilities.length === feat.increase) {
          // Automatic
          feat.abilities.forEach((key) => {
            if (Object.values(AbilityKey).includes(key as AbilityKey)) {
              newBonus[key as AbilityKey] += 1;
            }
          });
        } else {
          // Choices
          const choices = featChoices.value[index] || {};

          for (let i = 0; i < feat.increase; i++) {
            const chosen = choices[i];

            if (chosen) {
              newBonus[chosen] += 1;
            }
          }
        }
      }
    });

    bonus.value = newBonus;
  });

  function needsChoice(index: number): boolean {
    const url = selectedFeats.value[index];
    const feat = getFeat(url);

    if (!feat) {
      return false;
    }

    return (
      feat.increase > 0 &&
      feat.abilities.length > 0 &&
      feat.abilities.length > feat.increase
    );
  }

  function getChoiceOptions(index: number, choiceIdx: number) {
    const url = selectedFeats.value[index];
    const feat = getFeat(url);

    if (!feat) {
      return [];
    }

    // Filter out already chosen abilities for this feat (if multiple choices)
    // But allow changing the current choice
    const currentChoices = featChoices.value[index] || {};

    const otherChoices = Object.entries(currentChoices)
      .filter(([k]) => Number(k) !== choiceIdx)
      .map(([, v]) => v);

    return feat.abilities
      .map((key) => key as AbilityKey)
      .filter((key) => !otherChoices.includes(key))
      .map((key) => ({
        label: getAbilityInfo(key).label,
        value: key,
      }));
  }

  function updateChoice(index: number, choiceIdx: number, value: AbilityKey) {
    if (!featChoices.value[index]) {
      featChoices.value[index] = {};
    }

    featChoices.value[index][choiceIdx] = value;
  }
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="(feat, index) in selectedFeats"
      :key="index"
      class="space-y-2"
    >
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium">Слот {{ index + 1 }}</span>
      </div>

      <SelectFeat v-model="selectedFeats[index]" />

      <div
        v-if="needsChoice(index)"
        class="ml-3 space-y-2 border-l-2 border-default pl-3"
      >
        <div
          v-for="choiceIdx in getFeat(selectedFeats[index])?.increase || 0"
          :key="choiceIdx"
        >
          <USelect
            :model-value="featChoices[index]?.[choiceIdx - 1]"
            :items="getChoiceOptions(index, choiceIdx - 1)"
            placeholder="Выберите характеристику"
            option-attribute="label"
            @update:model-value="
              (v) => updateChoice(index, choiceIdx - 1, v as AbilityKey)
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>
