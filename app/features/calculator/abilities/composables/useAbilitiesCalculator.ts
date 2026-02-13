import { computed, h } from 'vue';

import { ABILITY_KEYS } from '~/shared/types';
import { getFormattedModifier, getModifier } from '~/utils/modifier';

import { ABILITY_MAX_SCORE, DEFAULT_SCORES } from '../model';

import type { Ref, VNode } from 'vue';

import type { AbilityKey } from '~/shared/types';

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
  const finalScores = computed<AbilityScores>(() =>
    calculateFinalScores(baseScores.value, bonusSources.value),
  );

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

      const { isError, items: breakdownItems } = calculateBreakdown(
        key,
        baseValue,
        bonusSources.value,
      );

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

function calculateFinalScores(
  baseScores: AbilityScores,
  bonusSources: BonusSource[],
): AbilityScores {
  const scores = { ...DEFAULT_SCORES };

  for (const key of ABILITY_KEYS) {
    scores[key] = baseScores[key] ?? scores[key];
  }

  for (const source of bonusSources) {
    for (const key of ABILITY_KEYS) {
      const bonusValue = source.scores[key];

      if (typeof bonusValue === 'number') {
        scores[key] += bonusValue;
      }
    }
  }

  return scores;
}

function formatBonusItem(
  label: string,
  val: number,
  isViolation: boolean,
  key: string,
  extraInfo = '',
) {
  const sign = val > 0 ? '+' : '';
  const content = `${label} (${sign}${val})${extraInfo}`;

  return h('span', { class: { 'text-error': isViolation }, key }, content);
}

function processBonusSource(
  source: BonusSource,
  key: AbilityKey,
  currentTotal: number,
  isError: boolean,
  limitFn: (source: BonusSource) => number,
  getExtraInfo?: (limit: number) => string,
): { newTotal: number; newIsError: boolean; item?: VNode } {
  const val = source.scores[key];

  let newTotal = currentTotal;
  let newIsError = isError;
  let item: VNode | undefined;

  if (typeof val === 'number' && val !== 0) {
    newTotal += val;

    const limit = limitFn(source);
    const violated = !isError && newTotal > limit;

    if (violated) {
      newIsError = true;
    }

    const extra = violated && getExtraInfo ? getExtraInfo(limit) : '';

    item = formatBonusItem(
      source.label,
      val,
      violated,
      `${source.id}-${key}`,
      extra,
    );
  }

  return { newTotal, newIsError, item };
}

function calculateBreakdown(
  key: AbilityKey,
  baseValue: number,
  bonusSources: BonusSource[],
) {
  let currentTotal = baseValue;
  let isError = false;

  const items: VNode[] = [];

  // 1. Base + Background + Feats (limit 20)
  const step1Sources = bonusSources.filter(
    (source) => source.type === 'background' || source.type === 'feat',
  );

  for (const source of step1Sources) {
    const result = processBonusSource(
      source,
      key,
      currentTotal,
      isError,
      () => 20,
    );

    currentTotal = result.newTotal;
    isError = result.newIsError;

    if (result.item) {
      items.push(result.item);
    }
  }

  // 2. Class (limit upto)
  const step2Sources = bonusSources.filter((source) => source.type === 'class');

  for (const source of step2Sources) {
    const result = processBonusSource(
      source,
      key,
      currentTotal,
      isError,
      (item) => item.upto ?? 20,
      (limit) => ` [Лимит: ${limit}]`,
    );

    currentTotal = result.newTotal;
    isError = result.newIsError;

    if (result.item) {
      items.push(result.item);
    }
  }

  // 3. Epic (limit 30)
  const step3Sources = bonusSources.filter((source) => source.type === 'epic');

  for (const source of step3Sources) {
    const result = processBonusSource(
      source,
      key,
      currentTotal,
      isError,
      () => 30,
    );

    currentTotal = result.newTotal;
    isError = result.newIsError;

    if (result.item) {
      items.push(result.item);
    }
  }

  return {
    isError,
    items,
  };
}
