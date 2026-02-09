<script setup lang="ts">
  import {
    ABILITY_LABELS,
    ABILITY_SHORT_LABELS,
    isAbilityKey,
  } from '~/shared/types';

  import { EPIC_BOON_LEVEL, STANDARD_ASI_LEVELS } from '../model';

  import {
    BonusBackgrounds,
    BonusClassLevel,
    BonusEpicBoon,
    BonusGeneralFeats,
  } from './components';

  import type { AbilityKey } from '~/shared/types/abilities';

  import type {
    AbilityScores,
    BonusSource,
    CalculatorAbilitiesBackground,
    CalculatorAbilitiesClass,
    CalculatorAbilitiesFeat,
    CalculatorAbilityOption,
    CalculatorBackgroundOption,
    CalculatorClassOption,
    CalculatorFeatOption,
  } from '../model';

  const level = defineModel<number>({ required: true });

  const emit = defineEmits<{
    (e: 'update:feat-sources', value: BonusSource[]): void;
    (e: 'update:background-sources', value: BonusSource[]): void;
  }>();

  // --- Background Selection ---
  const selectedBackgroundUrl = ref<string>();

  const { data: allBackgrounds, pending: backgroundsPending } = await useFetch<
    CalculatorAbilitiesBackground[]
  >('/api/v2/backgrounds/select', {
    dedupe: 'defer',
    lazy: true,
    default: () => [],
  });

  const backgroundsByUrl = computed(() => {
    const map: Record<string, CalculatorAbilitiesBackground> = {};

    if (allBackgrounds.value) {
      for (const background of allBackgrounds.value) {
        map[background.url] = background;
      }
    }

    return map;
  });

  const backgroundOptions = computed<CalculatorBackgroundOption[]>(() => {
    return (
      allBackgrounds.value?.map((backgroundLink) => {
        const abilities =
          backgroundLink.abilityScores
            ?.filter(isAbilityKey)
            .map((key) => ABILITY_LABELS[key])
            .join(', ') || '';

        const description = [backgroundLink.name.eng, abilities]
          .filter(Boolean)
          .join(' • ');

        return {
          label: backgroundLink.name.rus,
          value: backgroundLink.url,
          description,
          sourceLabel: backgroundLink.source.name.label,
        };
      }) || []
    );
  });

  const currentBackground = computed(() => {
    if (!selectedBackgroundUrl.value) {
      return undefined;
    }

    return backgroundsByUrl.value[selectedBackgroundUrl.value];
  });

  // --- Class Selection ---
  const selectedClassUrl = ref<string>();

  const { data: allClasses, pending: classesPending } = await useFetch<
    CalculatorAbilitiesClass[]
  >('/api/v2/classes/ability-improvement', {
    dedupe: 'defer',
    lazy: true,
    default: () => [],
  });

  const classAsiLevels = computed(() => {
    if (selectedClassUrl.value && allClasses.value) {
      const selectedClass = allClasses.value.find(
        (classItem) => classItem.url === selectedClassUrl.value,
      );

      if (selectedClass) {
        return selectedClass.levels.filter(
          (classLevel) => classLevel !== EPIC_BOON_LEVEL,
        );
      }
    }

    return STANDARD_ASI_LEVELS;
  });

  const allAsiLevels = computed(() => {
    if (!allClasses.value || !selectedClassUrl.value) {
      return STANDARD_ASI_LEVELS;
    }

    const levels = new Set<number>(STANDARD_ASI_LEVELS);

    if (classAsiLevels.value) {
      classAsiLevels.value.forEach((asiLevel) => levels.add(asiLevel));
    }

    return Array.from(levels).sort((a, b) => a - b);
  });

  // --- Slots Calculation ---
  const hasEpicBoon = computed(() => level.value >= EPIC_BOON_LEVEL);

  // --- Feat Selection ---
  const selectedFeats = ref<Map<number, string | undefined>>(new Map());
  const selectedEpicFeatUrl = ref<string>();

  const featAbilityChoices = ref<Map<string | number, AbilityKey>>(new Map());

  const { data: allFeats, pending: featsPending } = await useFetch<
    CalculatorAbilitiesFeat[]
  >('/api/v2/feats/select', {
    query: {
      categories: ['GENERAL', 'DRAGONMARK', 'EPIC_BOON'],
    },
    dedupe: 'defer',
    lazy: true,
    default: () => [],
  });

  const featsByUrl = computed(() => {
    const map: Record<string, CalculatorAbilitiesFeat> = {};

    if (allFeats.value) {
      for (const feat of allFeats.value) {
        map[feat.url] = feat;
      }
    }

    return map;
  });

  const baseFeatOptions = computed(() => {
    return (
      allFeats.value
        ?.filter(
          (feat) =>
            feat.category === 'GENERAL' || feat.category === 'DRAGONMARK',
        )
        .map(mapFeats) || []
    );
  });

  function getOptionsForLevel(featLevel: number): CalculatorFeatOption[] {
    const otherSelections = new Set<string>();

    for (const [lvl, url] of selectedFeats.value.entries()) {
      if (lvl !== featLevel && url) {
        otherSelections.add(url);
      }
    }

    return baseFeatOptions.value.filter((option) => {
      if (option.repeatability) {
        return true;
      }

      return !otherSelections.has(option.value);
    });
  }

  const epicFeatsOptions = computed<CalculatorFeatOption[]>(() => {
    return (
      allFeats.value
        ?.filter((feat) => feat.category === 'EPIC_BOON')
        .map(mapFeats) || []
    );
  });

  function mapFeats(feat: CalculatorAbilitiesFeat): CalculatorFeatOption {
    const sourceLabel = feat.source.name.label;

    const abilities =
      feat.abilities
        ?.filter(isAbilityKey)
        .map((key) => ABILITY_SHORT_LABELS[key])
        .join(', ') || '';

    const description = [feat.name.eng, abilities].filter(Boolean).join(' • ');

    return {
      label: feat.name.rus,
      value: feat.url,
      description,
      source: sourceLabel,
      prerequisite: feat.prerequisite ?? undefined,
      repeatability: feat.repeatability,
    };
  }

  const classOptions = computed<CalculatorClassOption[]>(() => {
    return (
      allClasses.value?.map((classLink) => ({
        label: classLink.name.rus,
        value: classLink.url,
        description: `${classLink.name.eng} • Уровни: ${classLink.levels.join(', ')}`,
        source: classLink.source.name.label,
      })) || []
    );
  });

  function getFirstAbility(
    feat: CalculatorAbilitiesFeat,
  ): AbilityKey | undefined {
    if (!feat.abilities || feat.abilities.length === 0) {
      return undefined;
    }

    const first = feat.abilities[0];

    if (!first) {
      return undefined;
    }

    return isAbilityKey(first) ? first : undefined;
  }

  // --- Computed Sources ---
  const selectedSources = computed<BonusSource[]>(() => {
    const sources: BonusSource[] = [];

    // General Feats
    for (const [featLevel, url] of selectedFeats.value.entries()) {
      if (!url) {
        continue;
      }

      const feat = featsByUrl.value[url];

      if (!feat) {
        continue;
      }

      const bonuses: Partial<AbilityScores> = {};

      let chosenAbility: AbilityKey | undefined;

      if (feat.abilities && feat.abilities.length > 0 && feat.increase) {
        if (feat.abilities.length > 1) {
          chosenAbility = featAbilityChoices.value.get(featLevel);
        } else {
          chosenAbility = getFirstAbility(feat);
        }

        if (chosenAbility) {
          bonuses[chosenAbility] = feat.increase;
        }
      }

      sources.push({
        id: `${url}-${featLevel}`,
        label: `Черта: ${feat.name.rus}`,
        scores: bonuses,
      });
    }

    // Epic Feat
    if (selectedEpicFeatUrl.value && hasEpicBoon.value) {
      const feat = featsByUrl.value[selectedEpicFeatUrl.value];

      if (feat) {
        const bonuses: Partial<AbilityScores> = {};

        let chosenAbility: AbilityKey | undefined;

        if (feat.abilities && feat.abilities.length > 0 && feat.increase) {
          if (feat.abilities.length > 1) {
            chosenAbility = featAbilityChoices.value.get('epic');
          } else {
            chosenAbility = getFirstAbility(feat);
          }

          if (chosenAbility) {
            bonuses[chosenAbility] = feat.increase;
          }
        }

        sources.push({
          id: `${feat.url}-epic`,
          label: `Эпический дар: ${feat.name.rus}`,
          scores: bonuses,
        });
      }
    }

    return sources;
  });

  watch(selectedSources, (newVal) => {
    emit('update:feat-sources', newVal);
  });

  function getFeatAbilities(url: string | undefined): AbilityKey[] {
    if (!url) {
      return [];
    }

    const feat = featsByUrl.value[url];

    if (!feat?.abilities) {
      return [];
    }

    return feat.abilities.filter(isAbilityKey);
  }

  function getAbilityOptions(
    url: string | undefined,
  ): CalculatorAbilityOption[] {
    if (!url) {
      return [];
    }

    return getFeatAbilities(url).map((key) => ({
      label: ABILITY_LABELS[key],
      value: key,
    }));
  }

  function updateSelectedFeat(featLevel: number, value: string | undefined) {
    if (value) {
      selectedFeats.value.set(featLevel, value);
    } else {
      selectedFeats.value.delete(featLevel);
    }

    featAbilityChoices.value.delete(featLevel);
    featAbilityChoices.value = new Map(featAbilityChoices.value);

    selectedFeats.value = new Map(selectedFeats.value);
  }

  function updateFeatAbilityChoice(
    key: string | number,
    value: AbilityKey | undefined,
  ) {
    if (value) {
      featAbilityChoices.value.set(key, value);
    } else {
      featAbilityChoices.value.delete(key);
    }

    featAbilityChoices.value = new Map(featAbilityChoices.value);
  }

  function getFeatAbilityChoice(key: string | number) {
    return featAbilityChoices.value.get(key);
  }

  function isFeatHasMultipleAbilities(url: string | undefined) {
    if (!url) {
      return false;
    }

    const abilities = getFeatAbilities(url);

    return abilities.length > 1;
  }

  function handleEpicAbilityUpdate(value: unknown) {
    if (isAbilityKey(value)) {
      updateFeatAbilityChoice('epic', value);
    }
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Top Controls: Two Blocks -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Block 1: Class & Level -->
      <BonusClassLevel
        v-model:selected-class-url="selectedClassUrl"
        v-model:level="level"
        :class-options="classOptions"
        :classes-pending="classesPending"
      >
        <template #epic-boon>
          <BonusEpicBoon
            v-model:model-value="selectedEpicFeatUrl"
            :ability-choice="getFeatAbilityChoice('epic')"
            :options="epicFeatsOptions"
            :ability-options="getAbilityOptions(selectedEpicFeatUrl)"
            :loading="featsPending"
            :disabled="!hasEpicBoon"
            :has-multiple-abilities="
              isFeatHasMultipleAbilities(selectedEpicFeatUrl)
            "
            @update:ability-choice="handleEpicAbilityUpdate"
          />
        </template>
      </BonusClassLevel>

      <!-- Block 2: Background & Settings -->
      <BonusBackgrounds
        v-model:selected-background-url="selectedBackgroundUrl"
        :background="currentBackground"
        :background-options="backgroundOptions"
        :loading="backgroundsPending"
        @update:sources="emit('update:background-sources', $event)"
      />
    </div>

    <!-- Main Grid Container (Bordered) -->
    <div class="rounded-xl border border-default bg-muted p-4">
      <BonusGeneralFeats
        :all-asi-levels="allAsiLevels"
        :class-asi-levels="classAsiLevels"
        :level="level"
        :selected-feats="selectedFeats"
        :feat-ability-choices="featAbilityChoices"
        :loading="featsPending"
        :get-options-for-level="getOptionsForLevel"
        :get-ability-options="getAbilityOptions"
        :is-feat-has-multiple-abilities="isFeatHasMultipleAbilities"
        @update:selected-feat="updateSelectedFeat"
        @update:ability-choice="updateFeatAbilityChoice"
      />
    </div>
  </div>
</template>
