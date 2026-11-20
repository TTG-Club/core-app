import type { FeatEditorRows, FeatMechanics } from '~feats/model';

import { describe, expect, it } from 'vitest';

import {
  createFeatMechanics,
  createPrerequisiteDetails,
  fromFeatEditorRows,
  parseLoadedMechanics,
  toFeatEditorRows,
} from '~feats/model';

/** «Огненный шар» черты «Адепт воплощения»: открывается по ячейкам. */
const FIREBALL = { url: 'fireball-phb', name: 'Огненный шар' };

/** Заклинание той же черты без условия — тот же уровень открытия. */
const MAGIC_MISSILE = { url: 'magic-missile-phb', name: 'Волшебная стрела' };

/**
 * Прогоняет сохранённую механику через редактор туда и обратно.
 *
 * @param raw механика в том виде, в каком её отдаёт справочник.
 * @returns механика, которую форма отправит обратно.
 */
function roundTrip(raw: unknown): {
  editorRows: FeatEditorRows;
  mechanics: FeatMechanics;
} {
  const editorRows = toFeatEditorRows(
    parseLoadedMechanics(raw),
    createPrerequisiteDetails(),
  );

  return {
    editorRows,
    mechanics: fromFeatEditorRows(editorRows, createFeatMechanics()).mechanics,
  };
}

describe('выданные заклинания «по ячейкам»', () => {
  it('отметка переживает редактор и не сливает группы одного уровня', () => {
    const { editorRows, mechanics } = roundTrip({
      spells: {
        spells: [{ ...FIREBALL, limitedBySlots: true }, MAGIC_MISSILE],
      },
    });

    expect(
      editorRows.grantedSpells.groups.map((group) => group.limitedBySlots),
    ).toEqual([true, false]);

    expect(mechanics.spells.spells).toEqual([
      expect.objectContaining({ url: FIREBALL.url, limitedBySlots: true }),
      expect.objectContaining({
        url: MAGIC_MISSILE.url,
        limitedBySlots: undefined,
      }),
    ]);
  });

  it('null и отсутствие поля — выключено, старые ссылки не меняются', () => {
    const { editorRows, mechanics } = roundTrip({
      spells: {
        spells: [{ ...FIREBALL, limitedBySlots: null }, MAGIC_MISSILE],
      },
    });

    expect(editorRows.grantedSpells.groups).toHaveLength(1);
    expect(editorRows.grantedSpells.groups[0]?.limitedBySlots).toBe(false);

    expect(
      mechanics.spells.spells.every(
        (spell) => spell.limitedBySlots === undefined,
      ),
    ).toBe(true);
  });
});
