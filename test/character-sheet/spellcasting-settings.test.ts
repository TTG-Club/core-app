import type {
  Character,
  CharacterClass,
  CharacterSpell,
  SpellAttackEffectFields,
} from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CHARACTER,
  getSpellAttackRoll,
  getSpellcastingBreakdown,
  getSpellcastingValues,
  isSpellAttackEffect,
  NEW_CUSTOM_BONUS,
  parseCharacter,
  toStoredSpellcastingSettings,
} from '~character-sheet/model';

const WIZARD: CharacterClass = {
  url: 'wizard',
  name: 'Волшебник',
  level: 1,
  subclassUrl: null,
  subclassName: null,
  casterType: null,
  hitDie: 6,
  spellcastingAbility: null,
  preparedSpells: [],
  preparedCantrips: [],
  startingEquipment: null,
};

/** Волшебник 1 уровня с Интеллектом 20: бонус мастерства +2, модификатор +5. */
function createWizard(characterClass: CharacterClass = WIZARD): Character {
  return {
    ...structuredClone(DEFAULT_CHARACTER),
    level: 1,
    characterClass,
    abilities: { ...DEFAULT_CHARACTER.abilities, intelligence: 20 },
  };
}

const FIRE_BOLT: CharacterSpell = {
  url: 'fire-bolt',
  name: 'Огненный снаряд',
  level: 0,
  school: 'Воплощение',
};

const EMPTY_EFFECT: SpellAttackEffectFields = {
  deliveryType: null,
  attackType: null,
  autoHit: false,
  savingThrows: [],
  damageFormulas: [],
};

describe('числа заклинательства', () => {
  it('по правилам: Сл 8 + мастерство + модификатор, атака без восьмёрки', () => {
    const values = getSpellcastingValues(
      createWizard(),
      'intelligence',
      undefined,
    );

    expect(values.saveDc.value).toBe(15);
    expect(values.attack.value).toBe(7);
  });

  it('своё число заменяет расчёт, свои бонусы ложатся сверху', () => {
    const values = getSpellcastingValues(createWizard(), 'intelligence', {
      saveDc: {
        base: 12,
        bonuses: [{ ...NEW_CUSTOM_BONUS, id: 'flat', kind: 'flat', value: 1 }],
      },
      attack: {
        base: null,
        bonuses: [{ ...NEW_CUSTOM_BONUS, id: 'pb', kind: 'proficiency' }],
      },
    });

    expect(values.saveDc).toMatchObject({
      ruleValue: 15,
      base: 12,
      isCustomBase: true,
      customBonus: 1,
      value: 13,
    });

    expect(values.attack.value).toBe(9);
  });

  it('истощение снимается только с атаки', () => {
    const character = createWizard();

    const tired: Character = {
      ...character,
      health: { ...character.health, exhaustion: 1 },
    };

    const values = getSpellcastingValues(tired, 'intelligence', undefined);

    expect(values.saveDc.value).toBe(15);
    expect(values.attack.value).toBe(5);
    expect(values.attack.penalty).toBe(2);
  });

  it('плитка вкладки берёт настройку класса', () => {
    const character = createWizard({
      ...WIZARD,
      spellcastingSettings: {
        saveDc: { base: 20, bonuses: [] },
        attack: { base: null, bonuses: [] },
      },
    });

    const [row] = getSpellcastingBreakdown(character).rows;

    expect(row?.saveDc).toBe(20);
    expect(row?.attackBonus).toBe(7);
  });

  it('у мистического рыцаря авто-характеристика — Интеллект', () => {
    const character = createWizard({
      ...WIZARD,
      url: 'fighter',
      name: 'Воин',
      subclassName: 'Мистический рыцарь',
    });

    const [row] = getSpellcastingBreakdown(character).rows;

    expect(row?.ability).toBe('intelligence');
    expect(row?.saveDc).toBe(15);
  });
});

describe('запись настройки заклинательства', () => {
  it('настройка по правилам не хранится', () => {
    expect(
      toStoredSpellcastingSettings({
        saveDc: { base: null, bonuses: [] },
        attack: { base: null, bonuses: [] },
      }),
    ).toBeUndefined();
  });

  it('своё число приводится к пределам поля', () => {
    expect(
      toStoredSpellcastingSettings({
        saveDc: { base: 99, bonuses: [] },
        attack: { base: -50, bonuses: [] },
      }),
    ).toEqual({
      saveDc: { base: 40, bonuses: [] },
      attack: { base: -20, bonuses: [] },
    });
  });

  it('старый лист без настройки читается, битая настройка — по правилам', () => {
    const parsed = parseCharacter({
      ...createWizard(),
      characterClass: {
        ...WIZARD,
        spellcastingSettings: { saveDc: 'битое', attack: { base: 3 } },
      },
    });

    expect(parsed.characterClass?.spellcastingSettings).toEqual({
      saveDc: { base: null, bonuses: [] },
      attack: { base: 3, bonuses: [] },
    });

    expect(
      parseCharacter(createWizard()).characterClass?.spellcastingSettings,
    ).toBeUndefined();
  });
});

describe('бросок атаки заклинания', () => {
  it('способ применения решает сам', () => {
    expect(
      isSpellAttackEffect({ ...EMPTY_EFFECT, deliveryType: 'ranged' }),
    ).toBe(true);

    expect(
      isSpellAttackEffect({
        ...EMPTY_EFFECT,
        deliveryType: 'touch',
        attackType: 'MELEE',
      }),
    ).toBe(false);
  });

  it('без способа решает тип атаки', () => {
    expect(
      isSpellAttackEffect({ ...EMPTY_EFFECT, attackType: 'MELEE_OR_RANGE' }),
    ).toBe(true);

    expect(isSpellAttackEffect(EMPTY_EFFECT)).toBe(false);
  });

  it('автопопадание, лечение и спасбросок без урона не атакуют', () => {
    expect(
      isSpellAttackEffect({
        ...EMPTY_EFFECT,
        deliveryType: 'ranged',
        autoHit: true,
      }),
    ).toBe(false);

    expect(
      isSpellAttackEffect({
        ...EMPTY_EFFECT,
        deliveryType: 'melee',
        damageFormulas: ['2к8@heal'],
      }),
    ).toBe(false);

    expect(
      isSpellAttackEffect({
        ...EMPTY_EFFECT,
        attackType: 'RANGE',
        savingThrows: ['WISDOM'],
      }),
    ).toBe(false);
  });

  it('атака берёт бонус строки заклинательства', () => {
    const character = createWizard();

    const roll = getSpellAttackRoll(
      character,
      getSpellcastingBreakdown(character).rows,
      FIRE_BOLT,
    );

    expect(roll).toMatchObject({ ability: 'intelligence', modifier: 7 });
  });

  it('своя характеристика заклинания считается от неё', () => {
    const character = createWizard();

    const roll = getSpellAttackRoll(
      { ...character, abilities: { ...character.abilities, charisma: 14 } },
      getSpellcastingBreakdown(character).rows,
      { ...FIRE_BOLT, spellcastingAbility: 'charisma' },
    );

    expect(roll).toMatchObject({ ability: 'charisma', modifier: 4 });
  });
});
