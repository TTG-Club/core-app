import type { CharacterFeature, CharacterSpell } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import { findFeatureSpell } from '~character-sheet/model';

const DAYLIGHT_URL = 'daylight';

/**
 * «Дневной свет» в записи умения с нужной пометкой подготовки.
 *
 * @param alwaysPrepared держит ли выдача заклинание готовым.
 * @returns заклинание записи.
 */
function createDaylight(alwaysPrepared: boolean): CharacterSpell {
  return {
    url: DAYLIGHT_URL,
    name: 'Дневной свет',
    level: 3,
    school: 'evocation',
    alwaysPrepared,
    prepared: alwaysPrepared,
  };
}

/**
 * Умение класса с выданными заклинаниями.
 *
 * @param id идентификатор умения.
 * @param spells выданные заклинания.
 * @returns особенность листа.
 */
function createFeature(id: string, spells: CharacterSpell[]): CharacterFeature {
  return {
    id,
    name: id,
    description: [],
    origin: 'class',
    originName: '',
    level: null,
    choice: null,
    spells,
  };
}

// Список жреца игрок готовит сам, домен Света держит «Дневной свет» готовым
const classList = createFeature('class:cleric:spells', [createDaylight(false)]);

const domainSpells = createFeature('class:cleric:light-domain:spells', [
  createDaylight(true),
]);

describe('дубли выданных заклинаний', () => {
  it('выдача подкласса «готово всегда» сильнее списка класса', () => {
    expect(
      findFeatureSpell([classList, domainSpells], DAYLIGHT_URL)?.alwaysPrepared,
    ).toBe(true);
  });

  it('порядок записей на выбор не влияет', () => {
    expect(
      findFeatureSpell([domainSpells, classList], DAYLIGHT_URL)?.alwaysPrepared,
    ).toBe(true);
  });

  it('без дубля остаётся единственная запись', () => {
    expect(findFeatureSpell([classList], DAYLIGHT_URL)?.alwaysPrepared).toBe(
      false,
    );
  });
});
