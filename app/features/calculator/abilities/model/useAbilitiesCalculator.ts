import { computed } from 'vue';

import { getFormattedModifier, getModifier } from '~/utils/modifier';

import { ABILITY_KEYS, DEFAULT_SCORES } from './consts';

import type { Ref } from 'vue';

import type { AbilityScores, BonusSource } from './types';

export function useAbilitiesCalculator(
  baseScores: Ref<AbilityScores>,
  bonusSources: Ref<BonusSource[]>,
) {
  const finalScores = computed<AbilityScores>(() => {
    const scores = { ...DEFAULT_SCORES };

    // Start with base scores
    for (const key of ABILITY_KEYS) {
      scores[key] = baseScores.value[key] ?? scores[key];
    }

    // Add bonuses
    for (const source of bonusSources.value) {
      for (const key of ABILITY_KEYS) {
        const bonusValue = source.scores[key];

        if (typeof bonusValue === 'number') {
          scores[key] += bonusValue;
        }
      }
    }

    return scores;
  });

  const formattedScores = computed(() => {
    return ABILITY_KEYS.map((key) => {
      const finalValue = finalScores.value[key];
      const baseValue = baseScores.value[key] || 0;
      const modifier = getModifier(finalValue);
      const formattedMod = getFormattedModifier(finalValue);

      const bonuses = bonusSources.value
        .map((source) => ({
          label: source.label,
          value: source.scores[key],
        }))
        .filter(
          (item): item is { label: string; value: number } =>
            typeof item.value === 'number' && item.value !== 0,
        );

      let breakdown;

      if (bonuses.length > 0) {
        breakdown = bonuses
          .map(
            (bonus) =>
              `${bonus.label} (${bonus.value > 0 ? '+' : ''}${bonus.value})`,
          )
          .join(', ');
      }

      return {
        key,
        label: key, // Should be mapped to localized label in UI
        value: finalValue,
        modifier,
        baseValue,
        formattedModifier: formattedMod,
        breakdown,
      };
    });
  });

  return {
    finalScores,
    formattedScores,
  };
}
