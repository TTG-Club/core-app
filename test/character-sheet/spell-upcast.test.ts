import type { SpellSlotRow } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  addDamageDice,
  EMPTY_SPELL_DAMAGE_FORMULAS,
  getDamageFormula,
  getSpellDamage,
  getSpellUpcastBonus,
  getSpellUpcastHelp,
  getSpellUpcastHint,
  getSpellUpcastSlotLevels,
  normalizeSpellUpcastNotation,
  parseSpellCatalogMechanics,
} from '~character-sheet/model';

/**
 * Строка ячеек круга.
 *
 * @param level круг.
 * @param max всего ячеек.
 * @param used потрачено.
 * @param kind вид ячеек.
 * @returns строка ячеек.
 */
function getSlotRow(
  level: number,
  max: number,
  used: number,
  kind: SpellSlotRow['kind'] = 'standard',
): SpellSlotRow {
  return { level, max, used, kind, recovery: 'long-rest' };
}

describe('усиление из справочника', () => {
  it('«Псевдожизнь»: число временных хитов за круг', () => {
    const { damage } = parseSpellCatalogMechanics({
      effect: {
        targetType: 'SELF',
        damageFormulas: ['2к4@heal.temp+4'],
        scaling: {
          additionalDice: '5',
          description: 'Дополнительные 5 временных хитов…',
        },
      },
    });

    expect(damage.upcastNotation).toBe('5');
  });

  it('«Лечение ран»: кости за круг', () => {
    const { damage } = parseSpellCatalogMechanics({
      effect: {
        damageFormulas: ['2к8@heal+@mod.spell'],
        scaling: { additionalDice: '2к8' },
      },
    });

    expect(damage.upcastNotation).toBe('2к8');
  });

  it('усиление целями или текстом костей не даёт', () => {
    const { damage } = parseSpellCatalogMechanics({
      effect: {
        damageFormulas: ['2к6@dmg.fire'],
        scaling: { additionalTargets: 1, description: 'Один луч…' },
      },
    });

    expect(damage.upcastNotation).toBeNull();
    expect(parseSpellCatalogMechanics(null).damage.upcastNotation).toBeNull();
  });

  it('нотация приводится к дайс-роллеру, мусор отбрасывается', () => {
    expect(normalizeSpellUpcastNotation(' 1d6 ')).toBe('1к6');
    expect(normalizeSpellUpcastNotation('1к6 + 2')).toBe('1к6+2');
    expect(normalizeSpellUpcastNotation('один дротик')).toBeNull();
    expect(normalizeSpellUpcastNotation('')).toBeNull();
  });
});

describe('усиление в бросках заклинания', () => {
  it('у обычного заклинания плитка несёт усиление', () => {
    const [damage] = getSpellDamage(
      {
        ...EMPTY_SPELL_DAMAGE_FORMULAS,
        base: ['8к6@dmg.fire'],
        upcastNotation: '1к6',
      },
      3,
      5,
    );

    expect(damage?.upcastNotation).toBe('1к6');
  });

  it('заговор с тирами растёт от уровня, а не от ячейки', () => {
    const [damage] = getSpellDamage(
      {
        ...EMPTY_SPELL_DAMAGE_FORMULAS,
        base: ['1к10@dmg.fire'],
        cantripTiers: [{ level: 5, formulas: ['2к10@dmg.fire'] }],
        upcastNotation: '1к10',
      },
      3,
      5,
    );

    expect(damage?.upcastNotation).toBeNull();
  });
});

describe('прибавка от высокой ячейки', () => {
  it('«Псевдожизнь» ячейкой 3 круга: +10 временных хитов', () => {
    const bonus = getSpellUpcastBonus('5', 2);

    expect(bonus).toEqual({ dice: [], flatBonus: 10 });

    expect(
      getDamageFormula([{ count: 2, faces: 4 }], 4 + bonus.flatBonus),
    ).toBe('2к4+14');
  });

  it('«Лечение ран» ячейкой 2 круга: 2к8 складываются с костями', () => {
    const bonus = getSpellUpcastBonus('2к8', 1);

    expect(addDamageDice([{ count: 2, faces: 8 }], bonus.dice)).toEqual([
      { count: 4, faces: 8 },
    ]);
  });

  it('новый номинал встаёт в конец, исходные кости не меняются', () => {
    const dice = [{ count: 2, faces: 10 }];

    expect(addDamageDice(dice, [{ count: 1, faces: 6 }])).toEqual([
      { count: 2, faces: 10 },
      { count: 1, faces: 6 },
    ]);

    expect(dice).toEqual([{ count: 2, faces: 10 }]);
  });

  it('ячейка своего круга и пустое усиление ничего не дают', () => {
    expect(getSpellUpcastBonus('2к8', 0)).toEqual({ dice: [], flatBonus: 0 });
    expect(getSpellUpcastBonus(null, 3)).toEqual({ dice: [], flatBonus: 0 });
  });

  it('подпись под формулой', () => {
    expect(getSpellUpcastHint(3, getSpellUpcastBonus('2к8', 2))).toBe(
      'ячейка 3 круга +4к8',
    );

    expect(getSpellUpcastHint(1, getSpellUpcastBonus('2к8', 0))).toBe('');
  });

  it('подсказка под выбором ячейки', () => {
    expect(getSpellUpcastHelp('5', 1)).toBe('+5 за каждый круг выше 1');

    expect(getSpellUpcastHelp(null, 2)).toBe(
      'Усиления костями в справочнике нет',
    );
  });
});

describe('круги ячеек на выбор', () => {
  it('только свободные круги не ниже круга заклинания', () => {
    const rows = [
      getSlotRow(1, 4, 1),
      getSlotRow(2, 3, 3),
      getSlotRow(3, 2, 0),
    ];

    expect(getSpellUpcastSlotLevels(rows, 1)).toEqual([1, 3]);
    expect(getSpellUpcastSlotLevels(rows, 2)).toEqual([3]);
  });

  it('обычные ячейки и договор одного круга — один вариант', () => {
    const rows = [getSlotRow(2, 3, 0), getSlotRow(2, 2, 0, 'pact')];

    expect(getSpellUpcastSlotLevels(rows, 1)).toEqual([2]);
  });

  it('без ячеек выбирать нечего', () => {
    expect(getSpellUpcastSlotLevels([], 1)).toEqual([]);
  });
});
