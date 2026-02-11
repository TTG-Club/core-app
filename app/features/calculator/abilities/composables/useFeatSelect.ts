import {
  ABILITY_LABELS,
  ABILITY_SHORT_LABELS,
  isAbilityKey,
} from '~/shared/types';

import type { Ref } from 'vue';

import type { AbilityKey } from '~/shared/types';

import type {
  AbilityScores,
  BonusSource,
  CalculatorAbilitiesFeat,
  CalculatorAbilityOption,
  CalculatorFeatOption,
} from '../model';

/**
 * Composable для выбора черт и расчёта бонусов характеристик.
 *
 * @param hasEpicBoon - Реактивная ссылка на доступность эпического дара.
 * @returns Объект с реактивным состоянием выбора черт и функциями управления.
 */
export function useFeatSelect(hasEpicBoon: Ref<boolean>) {
  const selectedFeats = ref<Map<number, string | undefined>>(new Map());
  const selectedEpicFeatUrl = ref<string>();
  const featAbilityChoices = ref<Map<string | number, AbilityKey[]>>(new Map());

  const { data: feats, pending } = useFetch<CalculatorAbilitiesFeat[]>(
    '/api/v2/feats/select',
    {
      query: {
        categories: ['GENERAL', 'DRAGONMARK', 'EPIC_BOON'],
      },
      dedupe: 'defer',
      lazy: true,
      default: () => [],
    },
  );

  const featsByUrl = computed(() => {
    const map: Record<string, CalculatorAbilitiesFeat> = {};

    if (feats.value) {
      for (const feat of feats.value) {
        map[feat.url] = feat;
      }
    }

    return map;
  });

  function mapFeatToOption(
    feat: CalculatorAbilitiesFeat,
  ): CalculatorFeatOption {
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
      abilityScoreIncreaseOptions:
        feat.abilityScoreIncreaseOptions ?? undefined,
    };
  }

  const baseFeatOptions = computed(() => {
    return (
      feats.value
        ?.filter(
          (feat) =>
            feat.category === 'GENERAL' || feat.category === 'DRAGONMARK',
        )
        .map(mapFeatToOption) || []
    );
  });

  const epicFeatOptions = computed<CalculatorFeatOption[]>(() => {
    return (
      feats.value
        ?.filter((feat) => feat.category === 'EPIC_BOON')
        .map(mapFeatToOption) || []
    );
  });

  function getOptionsForLevel(featLevel: number): CalculatorFeatOption[] {
    const otherSelections = new Set<string>();

    for (const [level, url] of selectedFeats.value.entries()) {
      if (level !== featLevel && url) {
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

  function hasMultipleAbilities(url: string | undefined): boolean {
    if (!url) {
      return false;
    }

    const abilities = getFeatAbilities(url);

    return abilities.length > 1;
  }

  function getAbilityChoice(key: string | number): AbilityKey[] | undefined {
    return featAbilityChoices.value.get(key);
  }

  function updateAbilityChoice(
    key: string | number,
    value: AbilityKey[] | AbilityKey | undefined,
  ) {
    if (value) {
      const arr = Array.isArray(value) ? value : [value];

      featAbilityChoices.value.set(key, arr);
    } else {
      featAbilityChoices.value.delete(key);
    }

    featAbilityChoices.value = new Map(featAbilityChoices.value);
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

  function handleEpicAbilityUpdate(value: unknown) {
    if (Array.isArray(value)) {
      const validKeys = value.filter((item): item is AbilityKey =>
        isAbilityKey(item),
      );

      updateAbilityChoice('epic', validKeys);
    } else if (isAbilityKey(value)) {
      updateAbilityChoice('epic', [value]);
    }
  }

  const selectedSources = computed<BonusSource[]>(() => {
    const sources: BonusSource[] = [];

    for (const [featLevel, url] of selectedFeats.value.entries()) {
      if (!url) {
        continue;
      }

      const feat = featsByUrl.value[url];

      if (!feat) {
        continue;
      }

      const bonuses: Partial<AbilityScores> = {};

      if (
        feat.abilities &&
        feat.abilities.length > 0 &&
        feat.abilityScoreIncreaseOptions
      ) {
        let chosenAbilities: AbilityKey[] = [];

        if (feat.abilities.length > 1) {
          chosenAbilities = featAbilityChoices.value.get(featLevel) || [];
        } else {
          const first = getFirstAbility(feat);

          if (first) {
            for (let i = 0; i < feat.abilityScoreIncreaseOptions; i++) {
              chosenAbilities.push(first);
            }
          }
        }

        for (const ability of chosenAbilities) {
          bonuses[ability] = (bonuses[ability] || 0) + 1;
        }
      }

      sources.push({
        id: `${url}-${featLevel}`,
        label: `Черта: ${feat.name.rus}`,
        scores: bonuses,
      });
    }

    if (selectedEpicFeatUrl.value && hasEpicBoon.value) {
      const feat = featsByUrl.value[selectedEpicFeatUrl.value];

      if (feat) {
        const bonuses: Partial<AbilityScores> = {};

        if (
          feat.abilities &&
          feat.abilities.length > 0 &&
          feat.abilityScoreIncreaseOptions
        ) {
          let chosenAbilities: AbilityKey[] = [];

          if (feat.abilities.length > 1) {
            chosenAbilities = featAbilityChoices.value.get('epic') || [];
          } else {
            const first = getFirstAbility(feat);

            if (first) {
              for (let i = 0; i < feat.abilityScoreIncreaseOptions; i++) {
                chosenAbilities.push(first);
              }
            }
          }

          for (const ability of chosenAbilities) {
            bonuses[ability] = (bonuses[ability] || 0) + 1;
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

  return {
    selectedFeats,
    selectedEpicFeatUrl,
    featAbilityChoices,
    pending,
    epicFeatOptions,
    selectedSources,
    getOptionsForLevel,
    getAbilityOptions,
    hasMultipleAbilities,
    getAbilityChoice,
    updateAbilityChoice,
    updateSelectedFeat,
    handleEpicAbilityUpdate,
  };
}
