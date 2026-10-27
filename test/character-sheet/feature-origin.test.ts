import type { CharacterFeature, FeatureOrigin } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  getFeatureBadgeOrigin,
  getFeatureOriginGroup,
  getFeatureOriginGroups,
} from '~character-sheet/model';

/**
 * Собирает особенность листа с нужными идентификатором и происхождением;
 * остальные поля на отбор и бейдж не влияют.
 *
 * @param id идентификатор особенности.
 * @param origin происхождение особенности.
 * @returns особенность листа.
 */
function createFeature(id: string, origin: FeatureOrigin): CharacterFeature {
  return {
    id,
    name: id,
    description: [],
    origin,
    originName: '',
    level: null,
    choice: null,
  };
}

const speciesTrait = createFeature('species:universalnost', 'species');

const lineageTrait = createFeature('lineage:ognennoe-nasledie', 'lineage');

const speciesFeat = createFeature(
  'species:universalnost:feat:familyar-drug',
  'species',
);

const lineageFeat = createFeature(
  'lineage:ognennoe-nasledie:feat:nadelyonnyj',
  'lineage',
);

const classFeat = createFeature('class:boevoj-stil:feat:oborona', 'feat');

describe('источник особенности на вкладке', () => {
  it('черта от умения вида отбирается и подписывается как черта', () => {
    expect(getFeatureOriginGroup(speciesFeat)).toBe('feat');
    expect(getFeatureBadgeOrigin(speciesFeat)).toBe('feat');
    expect(getFeatureOriginGroup(lineageFeat)).toBe('feat');
    expect(getFeatureBadgeOrigin(lineageFeat)).toBe('feat');
  });

  it('умения вида и подвида остаются видом, подвид подписан подвидом', () => {
    expect(getFeatureOriginGroup(speciesTrait)).toBe('species');
    expect(getFeatureBadgeOrigin(speciesTrait)).toBe('species');
    expect(getFeatureOriginGroup(lineageTrait)).toBe('species');
    expect(getFeatureBadgeOrigin(lineageTrait)).toBe('lineage');
  });

  it('черта от вида даёт чип «Черта» в ряду отбора', () => {
    expect(getFeatureOriginGroups([speciesTrait, speciesFeat])).toEqual([
      'species',
      'feat',
    ]);

    expect(getFeatureOriginGroups([classFeat])).toEqual(['feat']);
  });
});
