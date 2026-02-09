import { computed } from 'vue';

import { ABILITY_KEYS } from '~/shared/types';
import { getFormattedModifier, getModifier } from '~/utils/modifier';

import { DEFAULT_SCORES } from '../model';

import type { Ref } from 'vue';

import type { AbilityScores, BonusSource } from '../model';

/**
 * Калькулятор характеристик персонажа.
 * Вычисляет итоговые значения характеристик на основе базовых значений и бонусов.
 *
 * @param baseScores - Реактивный объект с базовыми значениями характеристик (например, от Point Buy или Standard Array).
 * @param bonusSources - Реактивный массив источников бонусов (раса, черты и т.д.).
 * @returns Объект с вычисленными значениями и отформатированными для отображения данными.
 */
export function useAbilitiesCalculator(
  baseScores: Ref<AbilityScores>,
  bonusSources: Ref<BonusSource[]>,
) {
  const finalScores = computed<AbilityScores>(() => {
    const scores = { ...DEFAULT_SCORES };

    for (const key of ABILITY_KEYS) {
      scores[key] = baseScores.value[key] ?? scores[key];
    }

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
        label: key,
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
