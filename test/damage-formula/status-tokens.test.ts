import { describe, expect, it } from 'vitest';

import { describeEffectDamageParts } from '~active-effects/model';
import { getSpellDamage } from '~character-sheet/model';
import {
  buildDamageFormulaTools,
  DAMAGE_FORMULA_LABELS,
  insertIntoDamageFormula,
  labelDamageFormulaStatusTerms,
  listDamageFormulaStatusTokens,
  parseDamageFormulaDice,
} from '~ui/damage-formula';

/** Все вкладки редактора видны. */
const ALL_TOOLS_VISIBLE = {
  hideModifiers: false,
  hideHealing: false,
  hideConditions: false,
};

/** Название состояния «Лежащий ничком». */
const PRONE_LABEL = 'Лежащий ничком';

/** Токен «цель лежит ничком». */
const TARGET_PRONE_TOKEN = '@target.status.prone';

/** Пометка слагаемого «цель лежит ничком». */
const TARGET_PRONE_CAPTION = `цель: ${PRONE_LABEL}`;

/**
 * Находит вкладку состояний по подписи.
 *
 * @param toolLabel подпись вкладки.
 * @returns вкладка состояний.
 */
function findStatusTool(toolLabel: string) {
  const statusTool = buildDamageFormulaTools(ALL_TOOLS_VISIBLE).find(
    (formulaTool) => formulaTool.label === toolLabel,
  );

  if (statusTool?.slot !== 'statuses') {
    throw new Error(`Нет вкладки состояний «${toolLabel}»`);
  }

  return statusTool;
}

/**
 * Подписи вкладок редактора формулы.
 *
 * @param hideConditions спрятаны ли условия.
 * @returns подписи в порядке показа.
 */
function listToolLabels(hideConditions: boolean): Array<string> {
  return buildDamageFormulaTools({ ...ALL_TOOLS_VISIBLE, hideConditions }).map(
    (formulaTool) => formulaTool.label,
  );
}

describe('вкладки состояний редактора формулы', () => {
  it('стоят между «Условия» и «Тип существ»', () => {
    const toolLabels = listToolLabels(false);

    const conditionsIndex = toolLabels.indexOf(
      DAMAGE_FORMULA_LABELS.conditions,
    );

    expect(toolLabels.slice(conditionsIndex, conditionsIndex + 4)).toEqual([
      DAMAGE_FORMULA_LABELS.conditions,
      DAMAGE_FORMULA_LABELS.targetStatuses,
      DAMAGE_FORMULA_LABELS.selfStatuses,
      DAMAGE_FORMULA_LABELS.creatureTypes,
    ]);
  });

  it('прячутся вместе с условиями', () => {
    const toolLabels = listToolLabels(true);

    expect(toolLabels).not.toContain(DAMAGE_FORMULA_LABELS.targetStatuses);
    expect(toolLabels).not.toContain(DAMAGE_FORMULA_LABELS.selfStatuses);
  });

  it('«Статусы цели» вставляют токен состояния цели', () => {
    const proneButton = findStatusTool(
      DAMAGE_FORMULA_LABELS.targetStatuses,
    ).statusButtons.find((statusButton) => statusButton.label === PRONE_LABEL);

    expect(proneButton?.value).toBe(TARGET_PRONE_TOKEN);

    const formula = '1к8 + 2к6';

    expect(
      insertIntoDamageFormula(
        formula,
        proneButton?.value ?? '',
        formula.length,
        formula.length,
      ).formula,
    ).toBe(`1к8 + 2к6${TARGET_PRONE_TOKEN}`);
  });

  it('«Статусы атакующего» вставляют токен состояния атакующего', () => {
    const bloodiedButton = findStatusTool(
      DAMAGE_FORMULA_LABELS.selfStatuses,
    ).statusButtons.find(
      (statusButton) => statusButton.label === 'Окровавленный',
    );

    expect(bloodiedButton?.value).toBe('@self.status.bloodied');
  });
});

describe('разбор формулы с состояниями', () => {
  it('находит состояния по слагаемым всех формул', () => {
    expect(
      listDamageFormulaStatusTokens([
        `1к8 + 2к6${TARGET_PRONE_TOKEN}`,
        `1к4@self.status.marked-k3j2x9 + 1к6${TARGET_PRONE_TOKEN}`,
      ]),
    ).toEqual([
      { side: 'target', status: 'prone' },
      { side: 'self', status: 'marked-k3j2x9' },
    ]);
  });

  it('читает слагаемое по состоянию словами', () => {
    expect(
      labelDamageFormulaStatusTerms(`1к8 + 2к6${TARGET_PRONE_TOKEN}`),
    ).toBe(`1к8 + 2к6 (${TARGET_PRONE_CAPTION})`);

    expect(
      labelDamageFormulaStatusTerms('1к8 + 1к6@self.status.bloodied'),
    ).toBe('1к8 + 1к6 (атакующий: Окровавленный)');
  });

  it('кости разбираются и с ключом состояния мира', () => {
    expect(
      parseDamageFormulaDice('2к8@dmg.necrotic@self.status.marked-k3j2x9'),
    ).toEqual({ diceCount: 2, diceFaces: 8, bonus: 0, type: 'NECROTIC' });
  });

  it('описание эффекта подписывает слагаемое по состоянию', () => {
    const damageDescription = describeEffectDamageParts([
      {
        formula: `1к8@dmg.fire + 2к6${TARGET_PRONE_TOKEN}`,
        target: 'selected',
      },
    ]);

    expect(damageDescription).toContain(`2к6 (${TARGET_PRONE_CAPTION})`);
    expect(damageDescription).not.toContain('@');
  });

  it('лист персонажа не выбрасывает формулу с состоянием', () => {
    const spellDamage = getSpellDamage(
      {
        base: [`8к6@dmg.fire + 2к6@dmg.fire${TARGET_PRONE_TOKEN}`],
        cantripTiers: [],
      },
      0,
      1,
    );

    expect(spellDamage.map((damageRoll) => damageRoll.conditionLabel)).toEqual([
      '',
      `Цель: ${PRONE_LABEL}`,
    ]);

    expect(spellDamage[1]?.formula).toBe('2к6');
  });
});
