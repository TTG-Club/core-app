import { computed } from 'vue';

import {
  CasterType,
  FULL_CASTER_SPELL_SLOTS,
  getClassProficiencyBonus,
  HALF_CASTER_SPELL_SLOTS,
  THIRD_CASTER_SPELL_SLOTS,
} from '../../../model';

interface UseDndMechanicsOptions {
  casterType: MaybeRefOrGetter<CasterType>;
}

/**
 * Механики заклинателя для таблицы прогрессии: ячейки заклинаний по типу
 * заклинателя и бонус мастерства.
 *
 * @param options - Тип заклинателя (реактивный)
 * @returns Таблица ячеек, флаги типа заклинателя и бонус мастерства
 */
export function useDndMechanics(options: UseDndMechanicsOptions) {
  const { casterType } = options;

  const spellSlots = computed(() => {
    const type = toValue(casterType);

    if (type === CasterType.FULL) {
      return FULL_CASTER_SPELL_SLOTS;
    }

    if (type === CasterType.HALF) {
      return HALF_CASTER_SPELL_SLOTS;
    }

    if (type === CasterType.THIRD) {
      return THIRD_CASTER_SPELL_SLOTS;
    }

    return null;
  });

  const isSpellcaster = computed(() => toValue(casterType) !== CasterType.NONE);

  const isPactSpellcaster = computed(
    () => toValue(casterType) === CasterType.PACT,
  );

  const isRegularSpellcaster = computed(
    () => isSpellcaster.value && !isPactSpellcaster.value,
  );

  return {
    spellSlots,

    isSpellcaster,
    isPactSpellcaster,
    isRegularSpellcaster,

    getProficiencyBonus: getClassProficiencyBonus,
  };
}
