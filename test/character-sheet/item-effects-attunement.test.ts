import type { Character } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CHARACTER,
  getCharacterEffectFlags,
  parseCharacter,
} from '~character-sheet/model';

import { createEffect } from '../active-effects/fixtures';

/** Флаг сопротивления урону силовым полем — эффект «Броши защиты». */
const FORCE_RESISTANCE_FLAG = 'resistance.force';

/** Идентификатор листа в тестах. */
const SHEET_ID = 'sheet';

/**
 * Собирает персонажа с «Брошью защиты» в инвентаре.
 *
 * @param broochFields поля предмета поверх надетой ненастроенной броши.
 * @returns персонаж, разобранный схемой листа.
 */
function createBroochOwner(broochFields: Record<string, unknown>): Character {
  return parseCharacter(
    {
      ...structuredClone(DEFAULT_CHARACTER),
      inventory: [
        {
          id: 'magic-item:brooch-of-shielding-dmg',
          name: 'Брошь защиты',
          equipped: true,
          requiresAttunement: true,
          attuned: false,
          activeEffects: [createEffect({ flags: [FORCE_RESISTANCE_FLAG] })],
          ...broochFields,
        },
      ],
    },
    SHEET_ID,
  );
}

describe('эффекты предмета, требующего настройки', () => {
  it('надетый без настройки предмет эффектов не даёт', () => {
    const flags = getCharacterEffectFlags(createBroochOwner({}));

    expect(flags.has(FORCE_RESISTANCE_FLAG)).toBe(false);
  });

  it('настроенный надетый предмет даёт эффект', () => {
    const flags = getCharacterEffectFlags(createBroochOwner({ attuned: true }));

    expect(flags.has(FORCE_RESISTANCE_FLAG)).toBe(true);
  });

  it('предмет без требования настройки работает, пока надет', () => {
    const flags = getCharacterEffectFlags(
      createBroochOwner({ requiresAttunement: false }),
    );

    expect(flags.has(FORCE_RESISTANCE_FLAG)).toBe(true);
  });

  it('снятый настроенный предмет эффектов не даёт', () => {
    const flags = getCharacterEffectFlags(
      createBroochOwner({ attuned: true, equipped: false }),
    );

    expect(flags.has(FORCE_RESISTANCE_FLAG)).toBe(false);
  });

  it('кончившийся предмет эффектов не даёт', () => {
    const flags = getCharacterEffectFlags(
      createBroochOwner({ attuned: true, quantity: 0 }),
    );

    expect(flags.has(FORCE_RESISTANCE_FLAG)).toBe(false);
  });
});
