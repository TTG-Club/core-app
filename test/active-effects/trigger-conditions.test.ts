import { describe, expect, it } from 'vitest';

import {
  describeTriggerCondition,
  listTriggerConditionKinds,
  parseTriggerConditionPart,
  readTriggerConditionParts,
  writeTriggerCondition,
} from '~active-effects/model';

describe('словарь условий срабатываний', () => {
  it('разбор и сборка частей: значения из словаря, незнакомое остаётся строкой', () => {
    const condition =
      'damage.type === "fire" && damage.isCritical === false && мутная строка';

    const parts = readTriggerConditionParts(condition);

    expect(parts).toEqual([
      { kind: 'damageType', value: 'fire' },
      { kind: 'damageNotCritical' },
      'мутная строка',
    ]);

    expect(writeTriggerCondition(parts)).toBe(condition);
    expect(writeTriggerCondition([])).toBeUndefined();
    expect(parseTriggerConditionPart('damage.type === "мана"')).toBeNull();

    expect(parseTriggerConditionPart('self.tag !== "огонь"')).toEqual({
      kind: 'selfTagNot',
      value: 'огонь',
    });

    // Ключ отметки без пробелов и кавычек
    expect(parseTriggerConditionPart('self.tag === "a b"')).toBeNull();
  });

  it('тип носителя и другой стороны, помеченная носителем цель', () => {
    expect(
      readTriggerConditionParts(
        'self.creatureType === "undead" && target.creatureType === "humanoid" && target.markedBySelf',
      ),
    ).toEqual([
      { kind: 'selfCreatureType', value: 'undead' },
      { kind: 'otherCreatureType', value: 'humanoid' },
      { kind: 'otherMarkedBySelf' },
    ]);
  });

  it('части по событию: урон — только у событий урона, режим броска — у атаки', () => {
    const turnKinds = listTriggerConditionKinds('turnStart');
    const damageKinds = listTriggerConditionKinds('damageTaken');
    const attackKinds = listTriggerConditionKinds('attackRoll');

    expect(turnKinds).not.toContain('damageType');
    expect(turnKinds).toContain('selfBloodied');
    expect(turnKinds).toContain('selfTag');
    expect(damageKinds).toContain('damageTypeNot');
    expect(damageKinds).toContain('otherCreatureType');
    expect(damageKinds).not.toContain('rollAdvantage');
    expect(attackKinds).toContain('otherMarkedBySelf');
    expect(attackKinds).not.toContain('damageCritical');
  });

  it('подпись условия: части словаря фразой, незнакомое — кодом', () => {
    expect(
      describeTriggerCondition(
        'damage.type === "fire" && self.hp.value <= (self.hp.max / 2) && нечто',
      ),
    ).toBe('урон огненный и у носителя не больше половины хитов и нечто');
  });
});
