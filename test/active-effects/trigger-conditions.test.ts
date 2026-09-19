import { describe, expect, it } from 'vitest';

import {
  DEFAULT_TAG_COUNT_THRESHOLD,
  describeTriggerCondition,
  listTriggerConditionKinds,
  MIN_TAG_COUNT_THRESHOLD,
  normalizeTagCountThreshold,
  parseTriggerConditionPart,
  readTriggerConditionParts,
  triggerConditionHasAmount,
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

  it('хиты, размер, состояние и приём оружия: разбор, сборка и фразы', () => {
    const condition =
      'self.hp.value <= 50 && self.size >= "large" && self.condition === "poisoned" && source.weaponMastery === true';

    const parts = readTriggerConditionParts(condition);

    expect(parts).toEqual([
      { kind: 'selfHpAtMost', value: '50' },
      { kind: 'selfSizeAtLeast', value: 'large' },
      { kind: 'selfCondition', value: 'poisoned' },
      { kind: 'sourceWeaponMastery' },
    ]);

    // Число пишется без кавычек, иначе VTTG сравнил бы строку
    expect(writeTriggerCondition(parts)).toBe(condition);

    expect(describeTriggerCondition(condition)).toBe(
      'у носителя не больше 50 хитов и носитель размером не меньше «Большой» '
        + 'и носитель в состоянии «Отравленный» и наложивший владеет приёмом оружия',
    );

    // «Окровавлен» — своя часть, а не «хитов не больше»
    expect(
      parseTriggerConditionPart('self.hp.value <= (self.hp.max / 2)'),
    ).toEqual({ kind: 'selfBloodied' });

    expect(parseTriggerConditionPart('self.size >= "крошечный"')).toBeNull();
    expect(parseTriggerConditionPart('self.hp.value <= -5')).toBeNull();
  });

  it('счётчик отметок: ключ в скобках и порог', () => {
    const condition = 'self.tagCount["провал"] >= 3';

    expect(parseTriggerConditionPart(condition)).toEqual({
      kind: 'selfTagCountAtLeast',
      value: 'провал',
      amount: 3,
    });

    expect(
      writeTriggerCondition([
        { kind: 'selfTagCountAtLeast', value: 'провал', amount: 3 },
      ]),
    ).toBe(condition);

    // Без порога пишется значение по умолчанию: строка остаётся разбираемой
    expect(
      writeTriggerCondition([{ kind: 'selfTagCountAtLeast', value: 'провал' }]),
    ).toBe(`self.tagCount["провал"] >= ${DEFAULT_TAG_COUNT_THRESHOLD}`);

    expect(describeTriggerCondition(condition)).toBe(
      'отметок «провал» на носителе не меньше 3',
    );

    expect(triggerConditionHasAmount('selfTagCountAtLeast')).toBe(true);
    expect(triggerConditionHasAmount('selfTag')).toBe(false);
    expect(normalizeTagCountThreshold(null)).toBe(MIN_TAG_COUNT_THRESHOLD);
    expect(normalizeTagCountThreshold(0)).toBe(MIN_TAG_COUNT_THRESHOLD);
    expect(normalizeTagCountThreshold(4.7)).toBe(4);
    expect(parseTriggerConditionPart('self.tagCount["a b"] >= 3')).toBeNull();
  });

  it('отметка от наложившего и приём оружия — по событию «При наложении»', () => {
    expect(readTriggerConditionParts('self.tagFromSource === "charm"')).toEqual(
      [{ kind: 'selfTagFromSource', value: 'charm' }],
    );

    expect(listTriggerConditionKinds('applied')).toContain(
      'sourceWeaponMastery',
    );

    expect(listTriggerConditionKinds('turnStart')).not.toContain(
      'sourceWeaponMastery',
    );

    expect(listTriggerConditionKinds('turnStart')).toContain('selfHpAtMost');
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
