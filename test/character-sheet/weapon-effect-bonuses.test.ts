import type { Character, InventoryWeapon } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  buildFeatFeature,
  DEFAULT_CHARACTER,
  getWeaponAttackBonus,
  getWeaponDamage,
  getWeaponDamageSource,
  parseFeatDetail,
} from '~character-sheet/model';

/** Прибавка «Стрельбы» к атаке и «Дуэлянта» к урону. */
const FIGHTING_STYLE_BONUS = 2;

/** Прибавка «Ярости» к урону на первых уровнях варвара. */
const RAGE_BONUS = 2;

const LONGSWORD: InventoryWeapon = {
  category: 'martial',
  ranged: false,
  finesse: false,
  heavy: false,
  attackBonus: 0,
  damage: { diceCount: 1, diceFaces: 8, bonus: 0, type: 'SLASHING' },
  versatileDamage: null,
  extraDamage: null,
};

const RAPIER: InventoryWeapon = { ...LONGSWORD, finesse: true };

const LONGBOW: InventoryWeapon = { ...LONGSWORD, ranged: true };

/**
 * Постоянный эффект с одним изменением — в том виде, в каком его отдаёт
 * справочник черт.
 *
 * @param name название эффекта.
 * @param change изменение эффекта.
 * @param change.key ключ изменения.
 * @param change.value значение изменения.
 * @param change.condition условие изменения; не задано — действует всегда.
 * @returns эффект записи справочника.
 */
function buildEffect(
  name: string,
  change: { key: string; value: string; condition?: string },
): Record<string, unknown> {
  return {
    id: `effect-${name}`,
    name,
    description: '',
    disabled: false,
    origin: 'feature',
    transfer: false,
    duration: { type: 'permanent' },
    changes: [{ ...change, mode: 'add', priority: 20 }],
    flags: [],
    effectTarget: 'self',
  };
}

/**
 * Персонаж с одной чертой из справочника: черта проходит тот же путь, что и
 * при выборе в листе, — разбор ответа и сборку записи.
 *
 * @param name название черты.
 * @param effect эффект черты из справочника.
 * @param abilities показатели характеристик поверх персонажа по умолчанию.
 * @returns персонаж с чертой.
 */
function buildCharacterWithFeat(
  name: string,
  effect: Record<string, unknown>,
  abilities: Partial<Character['abilities']> = {},
): Character {
  const summary = parseFeatDetail({
    url: `${name}-phb`,
    name: { rus: name, eng: name },
    category: 'FIGHTING_STYLE',
    description: [],
    activeEffects: [effect],
  });

  if (!summary) {
    throw new Error(`Черта «${name}» не разобралась`);
  }

  return {
    ...structuredClone(DEFAULT_CHARACTER),
    abilities: { ...DEFAULT_CHARACTER.abilities, ...abilities },
    features: [buildFeatFeature(summary)],
  };
}

describe('прибавки боевых стилей к броскам оружия', () => {
  it('«Стрельба» прибавляет к атаке дальнобойным оружием', () => {
    const archer = buildCharacterWithFeat(
      'Стрельба',
      buildEffect('Стрельба', { key: 'attack.ranged', value: '2' }),
    );

    expect(getWeaponAttackBonus(archer, LONGBOW, false, null).effectBonus).toBe(
      FIGHTING_STYLE_BONUS,
    );

    expect(
      getWeaponAttackBonus(archer, LONGSWORD, false, null).effectBonus,
    ).toBe(0);
  });

  it('«Дуэлянт» прибавляет к урону рукопашным оружием', () => {
    const duelist = buildCharacterWithFeat(
      'Дуэлянт',
      buildEffect('Дуэлянт', { key: 'damage.melee', value: '2' }),
    );

    const damage = getWeaponDamage(duelist, LONGSWORD, false, null);

    expect(damage?.effectBonus).toBe(FIGHTING_STYLE_BONUS);
    expect(damage?.formula).toBe('1к8+2');

    expect(
      getWeaponDamageSource(duelist, LONGSWORD, false, null)?.effectBonus,
    ).toBe(FIGHTING_STYLE_BONUS);
  });

  it('урон дальнобойным оружием «Дуэлянт» не трогает', () => {
    const duelist = buildCharacterWithFeat(
      'Дуэлянт',
      buildEffect('Дуэлянт', { key: 'damage.melee', value: '2' }),
    );

    expect(getWeaponDamage(duelist, LONGBOW, false, null)?.effectBonus).toBe(0);
  });

  it('условие о характеристике удара проверяется по оружию', () => {
    const barbarian = buildCharacterWithFeat(
      'Ярость',
      buildEffect('Ярость', {
        key: 'damage.melee',
        value: '2 + steps(@classLevel, 9, 16)',
        condition: 'attack.ability === "strength"',
      }),
      { strength: 10, dexterity: 16 },
    );

    expect(
      getWeaponDamage(barbarian, LONGSWORD, false, null)?.effectBonus,
    ).toBe(RAGE_BONUS);

    // Рапира бьёт от Ловкости — она выше Силы, и условие не выполнено.
    expect(getWeaponDamage(barbarian, RAPIER, false, null)?.effectBonus).toBe(
      0,
    );
  });

  it('кость и условие о цели остаются броску за столом', () => {
    const hunter = buildCharacterWithFeat(
      'Охотник',
      buildEffect('Охотник', {
        key: 'damage.melee',
        value: '1к6',
      }),
    );

    const slayer = buildCharacterWithFeat(
      'Убийца нежити',
      buildEffect('Убийца нежити', {
        key: 'damage.all',
        value: '2',
        condition: 'target.creatureType === "undead"',
      }),
    );

    expect(getWeaponDamage(hunter, LONGSWORD, false, null)?.effectBonus).toBe(
      0,
    );

    expect(getWeaponDamage(slayer, LONGSWORD, false, null)?.effectBonus).toBe(
      0,
    );
  });

  it('выключенный эффект урона не прибавляет', () => {
    const duelist = buildCharacterWithFeat('Дуэлянт', {
      ...buildEffect('Дуэлянт', { key: 'damage.melee', value: '2' }),
      disabled: true,
    });

    expect(getWeaponDamage(duelist, LONGSWORD, false, null)?.effectBonus).toBe(
      0,
    );
  });
});
