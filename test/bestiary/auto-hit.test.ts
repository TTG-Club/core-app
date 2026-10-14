import { describe, expect, it } from 'vitest';

import {
  createEmptyCreatureActionEffect,
  CREATURE_ACTION_EFFECT_CONTEXTS,
  getCreatureActionCombatFilledCount,
  normalizeCreatureActionEffect,
  parseLoadedCreatureActionEffect,
} from '~bestiary/model';

describe('автопопадание записи существа', () => {
  it('у новой записи выключено', () => {
    expect(createEmptyCreatureActionEffect().autoHit).toBe(false);
  });

  it('читается из ответа бэкенда', () => {
    expect(parseLoadedCreatureActionEffect({ autoHit: true }).autoHit).toBe(
      true,
    );
  });

  it('без поля или с битым значением выключено', () => {
    expect(parseLoadedCreatureActionEffect({}).autoHit).toBe(false);

    expect(parseLoadedCreatureActionEffect({ autoHit: 'yes' }).autoHit).toBe(
      false,
    );
  });

  it('уходит в запрос как есть', () => {
    const effect = { ...createEmptyCreatureActionEffect(), autoHit: true };

    expect(
      normalizeCreatureActionEffect(
        effect,
        CREATURE_ACTION_EFFECT_CONTEXTS.actions,
      ).autoHit,
    ).toBe(true);
  });

  it('считается заполненной стороной механики', () => {
    const effect = { ...createEmptyCreatureActionEffect(), autoHit: true };

    expect(getCreatureActionCombatFilledCount(effect)).toBe(1);
  });
});
