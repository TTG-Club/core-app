import type { ComputedRef } from 'vue';

import type { CreatureOption } from '~initiative/model';

import type {
  EncounterResult,
  GenerationCandidate,
  GenerationDifficulty,
} from '../model';

import { BESTIARY_SEARCH_PATH, parseCreatureOptions } from '~initiative/model';

import {
  generateCreatures,
  GENERATION_BUDGET_SPENT_DESCRIPTION,
  GENERATION_BUDGET_SPENT_TITLE,
  GENERATION_ERROR_DESCRIPTION,
  GENERATION_ERROR_TITLE,
  GENERATION_NOT_FOUND_DESCRIPTION,
  GENERATION_NOT_FOUND_TITLE,
  getAffordableExperienceValues,
  getExperienceByChallengeRating,
  getGenerationCreatureLimit,
  getGenerationWindow,
  HABITAT_ANY,
} from '../model';

/**
 * Превращает опцию поиска бестиария в кандидата генератора: опыт берём из
 * ответа, а если бэкенд его не прислал — по уровню опасности.
 * @param option Опция поиска бестиария.
 */
function toCandidate(option: CreatureOption): GenerationCandidate {
  return {
    ...option,
    experience:
      option.experience
      ?? getExperienceByChallengeRating(option.challengeRating),
  };
}

/**
 * Генератор столкновений: добирает случайных существ из бестиария до
 * выбранной сложности с учётом уже добавленных.
 * @param result Текущий итог калькулятора (бюджет и опыт).
 * @param addCreature Добавляет существо в калькулятор.
 */
export function useEncounterGenerator(
  result: ComputedRef<EncounterResult>,
  addCreature: (option: CreatureOption, count: number) => void,
) {
  const toast = useToast();
  const isGenerating = ref(false);

  /**
   * Подбирает и добавляет существ.
   * @param difficulty Целевая сложность.
   * @param habitat Среда обитания (значение словаря); пусто — любая.
   */
  async function generate(
    difficulty: GenerationDifficulty,
    habitat: string | undefined,
  ): Promise<void> {
    const window = getGenerationWindow(
      difficulty,
      result.value.budget,
      result.value.totalExperience,
    );

    if (!window) {
      toast.add({
        title: GENERATION_BUDGET_SPENT_TITLE,
        description: GENERATION_BUDGET_SPENT_DESCRIPTION,
        color: 'warning',
        icon: 'tabler:alert-triangle',
      });

      return;
    }

    isGenerating.value = true;

    try {
      const response = await $fetch<unknown>(BESTIARY_SEARCH_PATH, {
        method: 'GET',
        query: {
          cr: getAffordableExperienceValues(window.max).join(','),
          // Существа «любой» среды обитания подходят к любой местности.
          habitat: habitat ? `${habitat},${HABITAT_ANY}` : undefined,
        },
        retry: 0,
      });

      const picks = generateCreatures(
        parseCreatureOptions(response).map(toCandidate),
        window,
        getGenerationCreatureLimit(result.value.characterCount),
      );

      if (!picks.length) {
        toast.add({
          title: GENERATION_NOT_FOUND_TITLE,
          description: GENERATION_NOT_FOUND_DESCRIPTION,
          color: 'warning',
          icon: 'tabler:alert-triangle',
        });

        return;
      }

      picks.forEach(({ candidate, count }) => addCreature(candidate, count));
    } catch (error) {
      consola.error('Ошибка генерации столкновения:', error);

      toast.add({
        title: GENERATION_ERROR_TITLE,
        description: GENERATION_ERROR_DESCRIPTION,
        color: 'error',
        icon: 'tabler:alert-triangle',
      });
    } finally {
      isGenerating.value = false;
    }
  }

  return {
    isGenerating,
    generate,
  };
}
