import type { MaybeRefOrGetter } from 'vue';

import type { ClassChoice } from '../model';

import {
  getChoiceHints,
  getChosenSpellNames,
  getKnownSpellNames,
} from '../model';
import { useCharacterSheet } from './useCharacterSheet';

interface ChoiceHintsOptions {
  /**
   * Все выборы окна: по ним видно, что персонаж берёт соседним выбором. Одно и
   * то же заклинание спрашивают не по одному разу — «Посвящённый в магию»
   * просит и заговоры, и заклинание круга, а повышение сразу на несколько
   * уровней задаёт вопрос на каждом.
   */
  choices: MaybeRefOrGetter<ClassChoice[]>;

  /** Ответы игрока по идентификаторам выборов. */
  selections: MaybeRefOrGetter<Record<string, string[]>>;
}

interface ChoiceHints {
  /** Пометки по названиям опций одного выбора. */
  getHints: (choice: ClassChoice) => Record<string, string>;
}

/**
 * Пометки вариантов единого пикера: навыки, которыми персонаж уже владеет, и
 * заклинания, которые он уже знает. Один код на все окна выбора — мастер
 * повышения уровня, визарды класса, вида и предыстории и окно черт спрашивают
 * одно и то же и помечают повторы одинаково.
 *
 * Известные заклинания считаются один раз на все выборы окна: сбор идёт по
 * книге и всем записям листа, и на каждый пикер его повторять незачем.
 *
 * @param options выборы окна и ответы игрока.
 * @returns пометки опций выбора.
 */
export function useChoiceHints(options: ChoiceHintsOptions): ChoiceHints {
  const { character } = useCharacterSheet();

  const knownSpellNames = computed(() => getKnownSpellNames(character.value));

  /**
   * Пометки опций одного выбора.
   *
   * @param choice распознанный выбор записи.
   * @returns пометки по названиям опций.
   */
  function getHints(choice: ClassChoice): Record<string, string> {
    return getChoiceHints(choice, {
      skills: character.value.skills,
      knownSpellNames: knownSpellNames.value,
      chosenSpellNames: getChosenSpellNames(
        choice,
        toValue(options.choices),
        toValue(options.selections),
      ),
    });
  }

  return { getHints };
}
