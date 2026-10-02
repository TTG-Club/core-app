import type { FeatEditorRows } from '~feats/model';

import { omit } from 'es-toolkit';
import { describe, expect, it } from 'vitest';

import { AbilityKey } from '~/shared/types';
import {
  buildCounterMaxFormula,
  createFeatMechanics,
  createPrerequisiteDetails,
  fromFeatEditorRows,
  getCounterMaxKind,
  isCounterRestAmount,
  parseCounterMaxFormula,
  parseLoadedMechanics,
  resolveCounterRestRules,
  switchCounterMaxKind,
  toFeatEditorRows,
  toLegacyCounterRecovery,
  updateCounterMaxRule,
} from '~feats/model';

/**
 * «Очки мутации» друида: отдых ресурс не возвращает, а появляется он пустым —
 * запись в том виде, в каком её отдаёт справочник.
 */
const MUTATION_POINTS = {
  key: 'mutation-points',
  name: 'Очки мутации',
  max: '9 + max(1, @mod.wis)',
  recovery: 'LONG_REST',
  shortRest: { mode: 'NONE', amount: 1 },
  longRest: { mode: 'NONE', amount: 1 },
  startsEmpty: true,
};

/** Формула вдохновения барда: модификатор Харизмы. */
const CHARISMA_FORMULA = '@mod.cha';

/** Формула «Возложения рук»: пять за уровень в классе. */
const LAY_ON_HANDS_FORMULA = '@classLevel * 5';

/**
 * «Открыл запись в форме»: ресурс записи проходит разбор и становится строками
 * редактора.
 *
 * @param storedCounter ресурс из записи справочника.
 * @returns строки редактора.
 */
function openCounterInEditor(
  storedCounter: Record<string, unknown>,
): FeatEditorRows {
  return toFeatEditorRows(
    parseLoadedMechanics({ counters: [storedCounter] }),
    createPrerequisiteDetails(),
  );
}

/**
 * «Сохранил форму»: первый ресурс в том виде, в каком он уйдёт в теле запроса —
 * поля без значения в JSON не попадают.
 *
 * @param editorRows строки редактора.
 * @returns ресурс из тела запроса.
 */
function submitFirstCounter(editorRows: FeatEditorRows): unknown {
  const { mechanics } = fromFeatEditorRows(editorRows, createFeatMechanics());

  return JSON.parse(JSON.stringify(mechanics.counters[0]));
}

describe('формула максимума ресурса', () => {
  it('разбирает источник, множитель и прибавку', () => {
    expect(parseCounterMaxFormula('@prof - 1')).toMatchObject({
      source: 'proficiency',
      offset: -1,
      multiplier: 1,
    });

    expect(parseCounterMaxFormula(LAY_ON_HANDS_FORMULA)).toMatchObject({
      source: 'classLevel',
      offset: 0,
      multiplier: 5,
    });

    expect(parseCounterMaxFormula(CHARISMA_FORMULA)).toMatchObject({
      source: 'ability',
      ability: AbilityKey.CHARISMA,
    });

    expect(parseCounterMaxFormula('@mod.spell')?.source).toBe('spellAbility');

    expect(parseCounterMaxFormula('3')).toMatchObject({
      source: 'fixed',
      offset: 3,
    });
  });

  it('не разбирает формулу, написанную руками', () => {
    expect(parseCounterMaxFormula('@prof + @mod.cha')).toBeUndefined();
    expect(parseCounterMaxFormula('@mod.xyz')).toBeUndefined();
    expect(parseCounterMaxFormula('')).toBeUndefined();
  });

  it('собирает формулу обратно без потерь', () => {
    for (const formula of [
      '@prof - 1',
      LAY_ON_HANDS_FORMULA,
      CHARISMA_FORMULA,
      '@level + 2',
      '4',
    ]) {
      const rule = parseCounterMaxFormula(formula);

      expect(rule && buildCounterMaxFormula(rule)).toBe(formula);
    }
  });

  it('определяет вид максимума для селекта', () => {
    expect(getCounterMaxKind('', false)).toBe('fixed');
    expect(getCounterMaxKind('', true)).toBe('formula');
    expect(getCounterMaxKind('@prof * 2 + @level', false)).toBe('formula');
    expect(getCounterMaxKind('@prof', false)).toBe('proficiency');
  });

  it('при смене вида переносит прибавку и множитель', () => {
    expect(switchCounterMaxKind('@prof * 2 - 1', 'level')).toBe(
      '@level * 2 - 1',
    );

    expect(switchCounterMaxKind('@prof - 1', 'fixed')).toBe('1');
    expect(switchCounterMaxKind('3', 'proficiency')).toBe('@prof');
    expect(switchCounterMaxKind('@prof', 'formula')).toBe('');
  });

  it('правит одно поле разобранного правила', () => {
    expect(
      updateCounterMaxRule(CHARISMA_FORMULA, { ability: AbilityKey.WISDOM }),
    ).toBe('@mod.wis');

    expect(updateCounterMaxRule('@prof + @level', { offset: 2 })).toBe(
      '@prof + @level',
    );
  });
});

describe('восстановление ресурса на отдыхе', () => {
  it('выводит правила из отката одним словом', () => {
    expect(resolveCounterRestRules({ recovery: 'SHORT_REST_ONE' })).toEqual({
      shortRest: { mode: 'AMOUNT', amount: 1 },
      longRest: { mode: 'ALL', amount: 1 },
    });

    expect(resolveCounterRestRules({ recovery: 'LONG_REST' })).toMatchObject({
      shortRest: { mode: 'NONE' },
      longRest: { mode: 'ALL' },
    });
  });

  it('раздельные правила главнее отката, недостающее — «ничего»', () => {
    expect(
      resolveCounterRestRules({
        recovery: 'SHORT_REST',
        longRest: { mode: 'AMOUNT', amount: 2 },
      }),
    ).toEqual({
      shortRest: { mode: 'NONE', amount: 1 },
      longRest: { mode: 'AMOUNT', amount: 2 },
    });
  });

  it('спрашивает число зарядов только у «своего числа»', () => {
    expect(isCounterRestAmount({ mode: 'AMOUNT', amount: 2 })).toBe(true);
    expect(isCounterRestAmount({ mode: 'ALL', amount: 1 })).toBe(false);
  });

  it('подбирает ближайший откат одним словом', () => {
    expect(toLegacyCounterRecovery({ mode: 'ALL', amount: 1 })).toBe(
      'SHORT_REST',
    );

    expect(toLegacyCounterRecovery({ mode: 'AMOUNT', amount: 2 })).toBe(
      'SHORT_REST_ONE',
    );

    expect(toLegacyCounterRecovery({ mode: 'NONE', amount: 1 })).toBe(
      'LONG_REST',
    );
  });
});

describe('ресурс в форме: открыть и сохранить', () => {
  it('«отдых не восстанавливает» и «появляется пустым» не теряются', () => {
    expect(
      submitFirstCounter(openCounterInEditor(MUTATION_POINTS)),
    ).toMatchObject(MUTATION_POINTS);
  });

  it('отметка без `true` в записи в неё и не пишется', () => {
    for (const storedCounter of [
      { ...MUTATION_POINTS, startsEmpty: false },
      omit(MUTATION_POINTS, ['startsEmpty']),
    ]) {
      expect(
        submitFirstCounter(openCounterInEditor(storedCounter)),
      ).not.toHaveProperty('startsEmpty');
    }
  });

  it('снятая в форме галочка в запись не пишется', () => {
    const editorRows = openCounterInEditor(MUTATION_POINTS);

    // Чекбокс пишет `false`, а не убирает поле
    const uncheckedRows: FeatEditorRows = {
      ...editorRows,
      counters: editorRows.counters.map((counterRow) => ({
        ...counterRow,
        startsEmpty: false,
      })),
    };

    expect(submitFirstCounter(uncheckedRows)).not.toHaveProperty('startsEmpty');
  });
});
