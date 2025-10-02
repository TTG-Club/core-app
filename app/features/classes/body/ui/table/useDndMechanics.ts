import { computed, type ComputedRef } from 'vue';
import { CasterType } from '~classes/types';
import { MAX_CHARACTER_LEVEL, SPELL_SLOTS_TABLE } from './const';

interface SpellcastingData {
  spellSlots: number[];
}

interface UseDndMechanicsOptions {
  casterType: CasterType;
}

export function useDndMechanics(options: UseDndMechanicsOptions) {
  const { casterType } = options;

  // Функции расчета
  function getProficiencyBonus(level: number): number {
    return Math.ceil(level / 4) + 1;
  }

  function getCasterLevel(level: number): number {
    switch (casterType) {
      case CasterType.FULL:
        return level;
      case CasterType.HALF:
        return Math.floor(level / 2);
      case CasterType.THIRD:
        return Math.floor(level / 3);
      case CasterType.PACT:
        return level;
      case CasterType.NONE:
      default:
        return 0;
    }
  }

  function getWarlockSpellSlots(level: number): number[] {
    const slots = [0, 0, 0, 0, 0, 0, 0, 0, 0];

    if (level >= 1) {
      const slotLevel = Math.min(Math.ceil(level / 2), 5);

      let slotCount: number;
      if (level < 2) slotCount = 1;
      else if (level < 11) slotCount = 2;
      else if (level < 17) slotCount = 3;
      else slotCount = 4;

      slots[slotLevel - 1] = slotCount;
    }

    return slots;
  }

  function getSpellSlots(level: number): number[] {
    if (casterType === CasterType.NONE) {
      return [];
    }

    if (casterType === CasterType.PACT) {
      return getWarlockSpellSlots(level);
    }

    const casterLevel = getCasterLevel(level);

    return casterLevel > 0 && casterLevel <= MAX_CHARACTER_LEVEL
      ? [...(SPELL_SLOTS_TABLE[casterLevel] ?? [])]
      : [];
  }

  // Получение данных ячеек заклинаний для уровня
  function getSpellcastingData(level: number): SpellcastingData {
    return {
      spellSlots: getSpellSlots(level),
    };
  }

  // Проверка, является ли класс заклинателем
  const isSpellcaster: ComputedRef<boolean> = computed(
    () => casterType !== CasterType.NONE,
  );

  return {
    isSpellcaster,

    getProficiencyBonus,
    getCasterLevel,
    getSpellSlots,
    getSpellcastingData,
  };
}
