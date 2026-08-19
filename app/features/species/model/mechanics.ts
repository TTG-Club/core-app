import type {
  MechanicChoice,
  ProficiencyGrant,
  SheetModifiers,
} from '~/shared/types';

import { createProficiencyGrant, createSheetModifiers } from '~/shared/types';

/**
 * Механика влияния вида на лист персонажа: то, что лист считает сам, а не
 * показывает текстом.
 *
 * Зеркало `SpeciesMechanics` из core-api. Одна модель на два места: у самой
 * записи (`species.mechanics`) — то, что даёт выбор вида или происхождения
 * целиком, у умения (`features[].mechanics`) — то, что даёт конкретное умение.
 * Блоки те же, что у черты, — лист применяет их одинаково, поэтому и модель
 * общая (`~/shared/types`).
 *
 * Повышения характеристик здесь нет, в отличие от черты: по правилам 2024 года
 * характеристики поднимает предыстория, а вид не поднимает их ни одной записью
 * справочника.
 *
 * Блока выдаваемых заклинаний здесь тоже нет, хотя в core-api он есть:
 * заклинания вида живут в `innateSpells` со своей таблицей и уровнями, их и
 * читает лист. Появится запись, которой мало `innateSpells`, — блок добавится
 * вместе с полями формы.
 */
export interface SpeciesMechanics {
  modifiers: SheetModifiers;
  proficiencies: ProficiencyGrant;
  choices: Array<MechanicChoice>;
}

/**
 * Пустая механика вида или его умения.
 *
 * @returns механика со всеми блоками, но без заполненных значений.
 */
export function createSpeciesMechanics(): SpeciesMechanics {
  return {
    modifiers: createSheetModifiers(),
    proficiencies: createProficiencyGrant(),
    choices: [],
  };
}
