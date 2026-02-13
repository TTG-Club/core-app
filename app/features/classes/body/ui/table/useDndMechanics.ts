import { computed } from 'vue';
import { CasterType } from '~classes/model';

import {
  FULL_CASTER_SPELL_SLOTS,
  HALF_CASTER_SPELL_SLOTS,
  THIRD_CASTER_SPELL_SLOTS,
} from './const';

interface UseDndMechanicsOptions {
  casterType: MaybeRefOrGetter<CasterType>;
}

export function useDndMechanics(options: UseDndMechanicsOptions) {
  const { casterType } = options;

  function getProficiencyBonus(level: number): number {
    return Math.ceil(level / 4) + 1;
  }

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

  const isSpellcaster = computed(() => casterType !== CasterType.NONE);

  const isPactSpellcaster = computed(() => casterType === CasterType.PACT);

  const isRegularSpellcaster = computed(
    () => isSpellcaster.value && !isPactSpellcaster.value,
  );

  return {
    spellSlots,

    isSpellcaster,
    isPactSpellcaster,
    isRegularSpellcaster,

    getProficiencyBonus,
  };
}
