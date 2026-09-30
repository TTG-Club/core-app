import type { SpellEffect } from '~spells/model';

import { describe, expect, it } from 'vitest';

import {
  createEmptySpellEffect,
  createEmptySpellScaling,
  normalizeLoadedSpell,
  normalizeSpellEffect,
} from '~spells/model';

/** Рост «Туманного облака» за круг, фт. */
const FOG_CLOUD_AREA_GROWTH = 20;

/** Радиус сферы «Туманного облака», фт. */
const FOG_CLOUD_RADIUS = 20;

/**
 * Воздействие заклинания со сферой и ростом области.
 *
 * @param targetType тип цели.
 * @returns воздействие.
 */
function createFogCloudEffect(
  targetType: SpellEffect['targetType'],
): SpellEffect {
  return {
    ...createEmptySpellEffect(),
    targetType,
    areaOfEffect: {
      type: 'SPHERE',
      value1: FOG_CLOUD_RADIUS,
      value2: undefined,
    },
    scaling: {
      ...createEmptySpellScaling(),
      additionalAreaSize: FOG_CLOUD_AREA_GROWTH,
    },
  };
}

describe('рост области за круг (scaling.additionalAreaSize)', () => {
  it('переживает загрузку и сохранение у заклинания с областью', () => {
    const saved = normalizeSpellEffect(createFogCloudEffect('AREA'));

    expect(saved?.scaling?.additionalAreaSize).toBe(FOG_CLOUD_AREA_GROWTH);

    const loaded = normalizeLoadedSpell({ effect: saved });

    expect(loaded.effect).toMatchObject({
      scaling: { additionalAreaSize: FOG_CLOUD_AREA_GROWTH },
    });
  });

  it('без области и без числа не пишется', () => {
    expect(
      normalizeSpellEffect(createFogCloudEffect('CREATURE'))?.scaling,
    ).toBeUndefined();

    const withoutGrowth = createFogCloudEffect('AREA');

    expect(
      normalizeSpellEffect({
        ...withoutGrowth,
        scaling: { ...createEmptySpellScaling(), additionalAreaSize: 0 },
      })?.scaling,
    ).toBeUndefined();
  });
});
