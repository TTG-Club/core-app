import { computed } from 'vue';

import { ABILITY_KEYS } from '~/shared/types';
import { getFormattedModifier, getModifier } from '~/utils/modifier';

import { ABILITY_MAX_SCORE, DEFAULT_SCORES } from '../model';

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
      const formattedModifier = getFormattedModifier(finalValue);

      let maxScore = ABILITY_MAX_SCORE;

      for (const source of bonusSources.value) {
        const increase = source.maxScoreIncreases?.[key] || 0;

        maxScore += increase;
      }

      // Validation Logic
      let currentTotal = baseValue;
      let isError = false;

      const breakdownItems: VNode[] = [];

      const formatBonus = (
        label: string,
        val: number,
        isViolation: boolean,
        extraInfo = '',
      ) => {
        const sign = val > 0 ? '+' : '';
        const content = `${label} (${sign}${val})${extraInfo}`;

        return h('span', { class: { 'text-error': isViolation } }, content);
      };

      // 1. Base + Background + Feats (limit 20)
      const step1Sources = bonusSources.value.filter(
        (s) => s.type === 'background' || s.type === 'feat',
      );

      for (const source of step1Sources) {
        const val = source.scores[key];

        if (typeof val === 'number' && val !== 0) {
          currentTotal += val;

          const violated = !isError && currentTotal > 20;

          if (violated) {
            isError = true;
          }

          breakdownItems.push(formatBonus(source.label, val, violated));
        }
      }

      // 2. Class (limit upto)
      const step2Sources = bonusSources.value.filter((s) => s.type === 'class');

      for (const source of step2Sources) {
        const val = source.scores[key];

        if (typeof val === 'number' && val !== 0) {
          currentTotal += val;

          const limit = source.upto ?? 20;
          const violated = !isError && currentTotal > limit;

          if (violated) {
            isError = true;
          }

          const extra = violated ? ` [Лимит: ${limit}]` : '';

          breakdownItems.push(formatBonus(source.label, val, violated, extra));
        }
      }

      // 3. Epic (limit 30)
      const step3Sources = bonusSources.value.filter((s) => s.type === 'epic');

      for (const source of step3Sources) {
        const val = source.scores[key];

        if (typeof val === 'number' && val !== 0) {
          currentTotal += val;

          const violated = !isError && currentTotal > 30;

          if (violated) {
            isError = true;
          }

          breakdownItems.push(formatBonus(source.label, val, violated));
        }
      }

      return {
        key,
        label: key,
        value: finalValue,
        modifier,
        baseValue,
        formattedModifier,
        breakdownItems,
        maxScore,
        isError,
      };
    });
  });

  return {
    finalScores,
    formattedScores,
  };
}
