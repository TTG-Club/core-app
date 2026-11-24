import type {
  CharacterSpell,
  SpellDamageFormulas,
  SpellDamageRoll,
} from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  applySpellHealing,
  EMPTY_DAMAGE_ROLL_SOURCE,
  EMPTY_SPELL_DAMAGE_FORMULAS,
  getSpellCastAction,
  getSpellDamage,
  getTemporaryHitPointsKeptDescription,
  isSpellAttackEffect,
  parseSpellCatalogMechanics,
} from '~character-sheet/model';

/** «Псевдожизнь» (PHB 2024) — так её отдаёт `GET /api/v2/spells/{url}/raw`. */
const FALSE_LIFE_RAW = {
  effect: {
    targetType: 'SELF',
    damageFormulas: ['2к4@heal.temp+4'],
    damageFormulaTargets: ['self'],
    deliveryType: 'self',
  },
};

/** «Лечение ран»: цель — существо, адресата у формулы нет. */
const CURE_WOUNDS_RAW = {
  effect: {
    targetType: 'CREATURE',
    damageFormulas: ['2к8@heal+@mod.spell'],
    deliveryType: 'touch',
  },
};

/** «Множественное лечение ран»: адресат формулы — выбранные существа. */
const MASS_CURE_WOUNDS_RAW = {
  effect: {
    targetType: 'AREA',
    damageFormulas: ['5к8@heal+@mod.spell'],
    damageFormulaTargets: ['selected'],
  },
};

/** Заклинание первого круга в книге. */
const FALSE_LIFE_SPELL: CharacterSpell = {
  url: 'false-life-phb',
  name: 'Псевдожизнь',
  level: 1,
  school: 'Некромантия',
};

/**
 * Урон заклинания без тиров заговора: только базовые формулы.
 *
 * @param base формулы справочника.
 * @param baseSelfTargets адресаты формул.
 * @returns урон заклинания.
 */
function getFormulas(
  base: string[],
  baseSelfTargets: boolean[] = [],
): SpellDamageFormulas {
  return { ...EMPTY_SPELL_DAMAGE_FORMULAS, base, baseSelfTargets };
}

describe('адресат формул заклинания', () => {
  it('«Псевдожизнь» адресована самому заклинателю', () => {
    const { damage } = parseSpellCatalogMechanics(FALSE_LIFE_RAW);

    expect(damage.baseSelfTargets).toEqual([true]);
    expect(damage.isSelfTargeted).toBe(true);
  });

  it('без адресата формулы решает цель заклинания', () => {
    const { damage } = parseSpellCatalogMechanics(CURE_WOUNDS_RAW);

    expect(damage.baseSelfTargets).toEqual([false]);
    expect(damage.isSelfTargeted).toBe(false);
  });

  it('адресат формулы важнее цели заклинания', () => {
    const { damage } = parseSpellCatalogMechanics(MASS_CURE_WOUNDS_RAW);

    expect(damage.baseSelfTargets).toEqual([false]);

    const selfFormula = parseSpellCatalogMechanics({
      effect: {
        targetType: 'CREATURE',
        damageFormulas: ['3к6@dmg.necrotic', '1к6@heal'],
        damageFormulaTargets: ['selected', 'self'],
      },
    });

    expect(selfFormula.damage.baseSelfTargets).toEqual([false, true]);
  });

  it('урон заговора по тиру берёт адресат у цели заклинания', () => {
    const [tierDamage] = getSpellDamage(
      {
        base: ['1к4@heal'],
        baseSelfTargets: [false],
        isSelfTargeted: true,
        cantripTiers: [{ level: 5, formulas: ['2к4@heal'] }],
      },
      0,
      5,
    );

    expect(tierDamage?.formula).toBe('2к4');
    expect(tierDamage?.isSelfTargeted).toBe(true);
  });
});

describe('лечение в формулах заклинания', () => {
  it('«Псевдожизнь» даёт плитку временных хитов 2к4+4', () => {
    const { damage } = parseSpellCatalogMechanics(FALSE_LIFE_RAW);

    expect(getSpellDamage(damage, 3, 3)).toEqual([
      {
        formula: '2к4+4',
        diceNotation: '2к4+4',
        abilityModifierCount: 0,
        typeLabel: 'Временные хиты',
        typeChoiceLabels: [],
        conditionLabel: '',
        healKind: 'temp',
        isSelfTargeted: true,
        upcastNotation: null,
      },
    ]);
  });

  it('«Лечение ран» подставляет модификатор и лечит хиты', () => {
    const { damage } = parseSpellCatalogMechanics(CURE_WOUNDS_RAW);

    const [healing] = getSpellDamage(damage, 3, 1);

    expect(healing?.formula).toBe('2к8+3');
    expect(healing?.diceNotation).toBe('2к8');
    expect(healing?.abilityModifierCount).toBe(1);
    expect(healing?.healKind).toBe('hp');
    expect(healing?.typeLabel).toBe('Лечение');
    expect(healing?.isSelfTargeted).toBe(false);
  });

  it('незнакомый хвост тега лечения формулу не пропускает', () => {
    expect(getSpellDamage(getFormulas(['1к8@heal.spell']), 0, 1)).toEqual([]);
  });

  it('урон остаётся уроном', () => {
    const [fireDamage] = getSpellDamage(getFormulas(['8к6@dmg.fire']), 0, 1);

    expect(fireDamage?.healKind).toBeNull();
    expect(fireDamage?.typeLabel).toBe('Огненный');
  });

  it('формула без типа урона и лечения плитки не даёт', () => {
    expect(getSpellDamage(getFormulas(['2к6']), 0, 1)).toEqual([]);
  });
});

describe('applySpellHealing', () => {
  it('лечение поднимает хиты, но не выше максимума', () => {
    expect(
      applySpellHealing({ current: 5, temporary: 2 }, 'hp', 4, 20).health,
    ).toEqual({ current: 9, temporary: 2 });

    expect(
      applySpellHealing({ current: 18, temporary: 0 }, 'hp', 7, 20).health,
    ).toEqual({ current: 20, temporary: 0 });
  });

  it('временные хиты не складываются: остаётся большее', () => {
    expect(
      applySpellHealing({ current: 10, temporary: 3 }, 'temp', 9, 20),
    ).toEqual({
      health: { current: 10, temporary: 9 },
      amount: 9,
      isTemporaryKept: false,
    });

    expect(
      applySpellHealing({ current: 10, temporary: 12 }, 'temp', 9, 20),
    ).toEqual({
      health: { current: 10, temporary: 12 },
      amount: 9,
      isTemporaryKept: true,
    });
  });

  it('пояснение говорит, почему временные хиты не выросли', () => {
    expect(getTemporaryHitPointsKeptDescription(5, 9)).toBe(
      'Выпало 5, а у персонажа уже 9: временные хиты не складываются, остаётся большее.',
    );
  });

  it('временные хиты не трогают текущие и выше максимума не режутся', () => {
    expect(
      applySpellHealing({ current: 20, temporary: 0 }, 'temp', 25, 20).health,
    ).toEqual({ current: 20, temporary: 25 });
  });

  it('отрицательное и дробное число лечением не вредит', () => {
    expect(
      applySpellHealing({ current: 10, temporary: 4 }, 'hp', -3, 20),
    ).toEqual({
      health: { current: 10, temporary: 4 },
      amount: 0,
      isTemporaryKept: false,
    });

    expect(
      applySpellHealing({ current: 10, temporary: 0 }, 'temp', 6.7, 20).amount,
    ).toBe(6);
  });
});

describe('кнопка «Сотворить» у лечащего заклинания', () => {
  it('говорит о броске временных хитов и трате ячейки', () => {
    const roll: SpellDamageRoll = {
      title: 'Временные хиты: Псевдожизнь',
      damage: { ...EMPTY_DAMAGE_ROLL_SOURCE, diceNotation: '2к4+4' },
      level: 1,
      healing: { kind: 'temp', isSelfTargeted: true },
      upcastNotation: '5',
    };

    const castAction = getSpellCastAction(FALSE_LIFE_SPELL, null, roll);

    expect(castAction?.request.damage).toBe(roll);

    expect(castAction?.tooltip).toBe(
      'Сотворить: бросок временных хитов · тратит ячейку 1 круга',
    );
  });
});

describe('лечение и бросок атаки', () => {
  /** «Лечащее слово»: дальнобойное, но лечение атаки не делает. */
  const HEALING_WORD_EFFECT = {
    deliveryType: 'ranged',
    attackType: null,
    autoHit: false,
    savingThrows: [],
    damageFormulas: ['2к4@heal+@mod.spell'],
  };

  it('лечащее заклинание атаку не катит, в каком бы регистре ни был тег', () => {
    expect(isSpellAttackEffect(HEALING_WORD_EFFECT)).toBe(false);

    expect(
      isSpellAttackEffect({
        ...HEALING_WORD_EFFECT,
        damageFormulas: ['2к4@HEAL.TEMP'],
      }),
    ).toBe(false);
  });

  it('`@heal.spell` лечением не считается — то же правило, что у плиток', () => {
    expect(
      isSpellAttackEffect({
        ...HEALING_WORD_EFFECT,
        damageFormulas: ['1к8@heal.spell'],
      }),
    ).toBe(true);
  });
});
