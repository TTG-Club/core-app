import {
  ABILITY_MAX_SCORE,
  EPIC_BOON_LEVEL,
  STANDARD_ASI_LEVELS,
} from '../model';

import type { Ref } from 'vue';

import type {
  AbilityScores,
  BonusSource,
  CalculatorAbilitiesClass,
  CalculatorClassOption,
} from '../model';

/**
 * Composable для выбора класса и расчёта уровней ASI.
 *
 * @param level - Реактивная ссылка на уровень персонажа.
 * @returns Объект с реактивным состоянием выбора класса и уровнями ASI.
 */
export function useClassSelect(level: Ref<number>) {
  const selectedUrl = ref<string>();

  const { data: classes, pending } = useFetch<CalculatorAbilitiesClass[]>(
    '/api/v2/classes/ability-improvement',
    {
      dedupe: 'defer',
      lazy: true,
      default: () => [],
    },
  );

  const classAsiLevels = computed(() => {
    if (selectedUrl.value && classes.value) {
      const selectedClass = classes.value.find(
        (classItem) => classItem.url === selectedUrl.value,
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
    if (!classes.value || !selectedUrl.value) {
      return STANDARD_ASI_LEVELS;
    }

    const levels = new Set<number>(STANDARD_ASI_LEVELS);

    if (classAsiLevels.value) {
      classAsiLevels.value.forEach((asiLevel) => levels.add(asiLevel));
    }

    return Array.from(levels).sort((sortA, sortB) => sortA - sortB);
  });

  const hasEpicBoon = computed(() => level.value >= EPIC_BOON_LEVEL);

  const selectedClassSources = computed<BonusSource[]>(() => {
    if (!selectedUrl.value || !classes.value) {
      return [];
    }

    const selectedClass = classes.value.find(
      (classItem) => classItem.url === selectedUrl.value,
    );

    if (!selectedClass?.abilityBonus) {
      return [];
    }

    return selectedClass.abilityBonus
      .filter((bonus) => level.value >= bonus.level)
      .map((bonus, index) => {
        const scores: Partial<AbilityScores> = {};
        const maxScoreIncreases: Partial<AbilityScores> = {};
        const increase = Math.max(0, bonus.upto - ABILITY_MAX_SCORE);

        for (const ability of bonus.abilities) {
          scores[ability] = bonus.bonus;

          if (increase > 0) {
            maxScoreIncreases[ability] = increase;
          }
        }

        return {
          id: `class-${selectedClass.url}-${index}`,
          label: `Класс: ${selectedClass.name.rus}`,
          type: 'class',
          scores,
          upto: bonus.upto,
          maxScoreIncreases:
            Object.keys(maxScoreIncreases).length > 0
              ? maxScoreIncreases
              : undefined,
        };
      });
  });

  const options = computed<CalculatorClassOption[]>(() => {
    return (
      classes.value?.map((classLink) => ({
        label: classLink.name.rus,
        value: classLink.url,
        description: `${classLink.name.eng} • Уровни: ${classLink.levels.join(', ')}`,
        source: classLink.source.name.label,
      })) || []
    );
  });

  return {
    selectedUrl,
    pending,
    options,
    classAsiLevels,
    allAsiLevels,
    hasEpicBoon,
    selectedClassSources,
  };
}
