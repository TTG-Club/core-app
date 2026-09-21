import type { TriggerConditionPart } from '~active-effects/model';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ABILITY_THRESHOLD,
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

  it('[TC01] части словаря 0.8.66: собрал в форме → строка → разобрал — те же части', () => {
    const parts: TriggerConditionPart[] = [
      { kind: 'selfTempHpZero' },
      { kind: 'selfGrounded' },
      { kind: 'otherIsSource' },
      { kind: 'otherBloodied' },
      { kind: 'selfSpecies', value: 'Эльф' },
      { kind: 'selfAbilityAtLeast', value: 'strength', amount: 13 },
      { kind: 'selfAbilityAtMost', value: 'dexterity', amount: 8 },
      { kind: 'otherHpAtMost', value: '25' },
      { kind: 'damageAtLeast', value: '10' },
      { kind: 'sourceWithin', value: '30' },
      { kind: 'attackKind', value: 'melee' },
      { kind: 'attackAbility', value: 'strength' },
      { kind: 'attackLanded' },
      { kind: 'attackMissed' },
      { kind: 'combatRoundIs', value: '2' },
      { kind: 'combatRoundAtLeast', value: '3' },
      { kind: 'movementOwn' },
      { kind: 'movementForced' },
    ];

    const condition = writeTriggerCondition(parts);

    expect(readTriggerConditionParts(condition)).toEqual(parts);

    expect(condition).toBe(
      [
        'self.hp.temp === 0',
        'self.grounded === true',
        'target.isSource === true',
        'target.hp.value <= (target.hp.max / 2)',
        'self.species === "Эльф"',
        'self.ability["strength"] >= 13',
        'self.ability["dexterity"] <= 8',
        'target.hp.value <= 25',
        'damage.amount >= 10',
        'source.distance <= 30',
        'attack.kind === "melee"',
        'attack.ability === "strength"',
        'attack.landed === true',
        'attack.landed === false',
        'combat.round === 2',
        'combat.round >= 3',
        'move.forced === false',
        'move.forced === true',
      ].join(' && '),
    );

    expect(triggerConditionHasAmount('selfAbilityAtLeast')).toBe(true);

    // Без порога пишется порог по умолчанию: строка остаётся разбираемой
    expect(
      writeTriggerCondition([{ kind: 'selfAbilityAtMost', value: 'wisdom' }]),
    ).toBe(`self.ability["wisdom"] <= ${DEFAULT_ABILITY_THRESHOLD}`);
  });

  it('[TC02] незнакомая часть и чужое значение остаются строкой, соседние разбираются', () => {
    const condition = 'self.hp.temp === 0 && self.чужое === "x"';

    expect(readTriggerConditionParts(condition)).toEqual([
      { kind: 'selfTempHpZero' },
      'self.чужое === "x"',
    ]);

    expect(parseTriggerConditionPart('self.ability["luck"] >= 10')).toBeNull();
    expect(parseTriggerConditionPart('attack.kind === "psionic"')).toBeNull();
    expect(parseTriggerConditionPart('self.species === ""')).toBeNull();

    // «Окровавлена другая сторона» — своя часть, а не «хитов не больше»
    expect(
      parseTriggerConditionPart('target.hp.value <= (target.hp.max / 2)'),
    ).toEqual({ kind: 'otherBloodied' });
  });

  it('[TC06] часть предлагается только там, где на событии есть её данные', () => {
    const turnKinds = listTriggerConditionKinds('turnStart');
    const attackKinds = listTriggerConditionKinds('attackRoll');
    const movedKinds = listTriggerConditionKinds('moved');
    const restKinds = listTriggerConditionKinds('rest');

    expect(turnKinds).toContain('selfTempHpZero');
    expect(turnKinds).toContain('sourceWithin');
    expect(turnKinds).toContain('combatRoundIs');
    expect(turnKinds).not.toContain('attackKind');
    expect(turnKinds).not.toContain('otherIsSource');
    expect(turnKinds).not.toContain('movementOwn');
    expect(attackKinds).toContain('attackLanded');
    expect(attackKinds).toContain('otherBloodied');
    expect(attackKinds).not.toContain('damageAtLeast');
    expect(listTriggerConditionKinds('damageTaken')).toContain('damageAtLeast');
    expect(listTriggerConditionKinds('applied')).toContain('attackAbility');
    expect(listTriggerConditionKinds('downedOther')).toContain('otherHpAtMost');
    expect(movedKinds).toContain('movementForced');
    expect(movedKinds).not.toContain('attackKind');
    // Отдых идёт вне боя: номера раунда у него нет
    expect(restKinds).not.toContain('combatRoundAtLeast');
  });

  it('фразы новых частей условия', () => {
    expect(
      describeTriggerCondition(
        'self.ability["strength"] >= 13 && attack.kind === "melee" && attack.ability === "dexterity"',
      ),
    ).toBe(
      'Сила носителя не меньше 13 и атака рукопашная и атака считается '
        + 'характеристикой «Ловкость»',
    );

    expect(
      describeTriggerCondition(
        'self.species === "Эльф" && combat.round >= 3 && move.forced === false',
      ),
    ).toBe('вид носителя — «Эльф» и с 3-го раунда боя и носитель шёл сам');

    expect(
      describeTriggerCondition(
        'target.hp.value <= 25 && source.distance <= 30 && damage.amount >= 10',
      ),
    ).toBe(
      'у другой стороны не больше 25 хитов и наложивший в пределах 30 фт и '
        + 'урон не меньше 10',
    );
  });
});
