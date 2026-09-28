import { describe, expect, it } from 'vitest';

import { getSpellDamage } from '~character-sheet/model';
import {
  getDamageFormulaTypes,
  parseDamageFormulaDice,
  readDamageFormulaTypeChoices,
} from '~ui/damage-formula';

/** Формула «Цветного шарика»: тип выбирает заклинатель. */
const CHROMATIC_ORB_FORMULA = '3к8@dmg.choice(acid,cold,fire)';

/** Формула со случайным типом и модификатором заклинательной характеристики. */
const RANDOM_TYPE_FORMULA = '4к10@dmg.random(force,radiant)+@mod.spell';

describe('тип урона на выбор в формуле', () => {
  it('находит выбор и случайный тип со списком типов', () => {
    expect(readDamageFormulaTypeChoices(CHROMATIC_ORB_FORMULA)).toEqual([
      { random: false, damageTypes: ['acid', 'cold', 'fire'] },
    ]);

    expect(readDamageFormulaTypeChoices(RANDOM_TYPE_FORMULA)).toEqual([
      { random: true, damageTypes: ['force', 'radiant'] },
    ]);

    expect(readDamageFormulaTypeChoices('3к8@dmg.fire')).toEqual([]);
  });

  it('типы формулы берутся из списка выбора, а не из слова choice', () => {
    expect(getDamageFormulaTypes(CHROMATIC_ORB_FORMULA)).toEqual([
      'ACID',
      'COLD',
      'FIRE',
    ]);

    expect(
      getDamageFormulaTypes('2к6@dmg.choice(fire,cold) + 1к6@dmg.thunder'),
    ).toEqual(['FIRE', 'COLD', 'THUNDER']);
  });

  it('кости разбираются без хвоста списка типов', () => {
    expect(parseDamageFormulaDice('1к8+3@dmg.choice(fire,cold)')).toEqual({
      diceCount: 1,
      diceFaces: 8,
      bonus: 3,
      type: '',
    });
  });

  it('лист показывает урон заклинания с типом на выбор', () => {
    const [chromaticOrbDamage] = getSpellDamage(
      { base: [CHROMATIC_ORB_FORMULA], cantripTiers: [] },
      0,
      1,
    );

    expect(chromaticOrbDamage?.formula).toBe('3к8');
    expect(chromaticOrbDamage?.typeLabel.split('/')).toHaveLength(3);
  });

  it('лист подставляет модификатор к формуле со случайным типом', () => {
    const [holyStarDamage] = getSpellDamage(
      { base: [RANDOM_TYPE_FORMULA], cantripTiers: [] },
      4,
      1,
    );

    expect(holyStarDamage?.formula).toBe('4к10+4');
    expect(holyStarDamage?.typeLabel.split('/')).toHaveLength(2);
  });
});
