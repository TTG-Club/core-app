import type {
  DamageFormulaStatusSide,
  DamageFormulaToolSlot,
} from './constants';

import {
  DAMAGE_FORMULA_LABELS,
  DAMAGE_FORMULA_STATUS_OPTIONS,
} from './constants';
import { buildDamageFormulaStatusToken } from './status';

/** Кнопка вставки токена: подпись и вставляемый текст целиком. */
export interface DamageFormulaTokenButton {
  label: string;
  value: string;
}

/** Вкладка-помощник ввода формулы, кроме вкладок состояний. */
interface DamageFormulaPlainTool {
  label: string;
  slot: Exclude<DamageFormulaToolSlot, 'statuses'>;
}

/**
 * Вкладка состояний стороны. Слот у обеих сторон один — сторону несут кнопки,
 * поэтому они лежат на самой вкладке.
 */
interface DamageFormulaStatusTool {
  label: string;
  slot: 'statuses';
  /** Кнопки состояний стороны. */
  statusButtons: Array<DamageFormulaTokenButton>;
  /** Подсказка под кнопками. */
  statusHint: string;
}

/**
 * Вкладка-помощник ввода формулы. Разные виды — разным типом: слот `UTabs`
 * получает вкладку своего вида, и кнопки состояний в нём типизированы.
 */
export type DamageFormulaTool =
  | DamageFormulaPlainTool
  | DamageFormulaStatusTool;

/** Какие вкладки прячет носитель формулы. */
export interface DamageFormulaToolsVisibility {
  hideModifiers: boolean;
  hideHealing: boolean;
  hideConditions: boolean;
}

/**
 * Кнопки состояний стороны: токен вставляется целиком, со стороной — вкладку
 * со стороной выбирают до кнопки, и второго переключателя внутри нет.
 *
 * @param side чьё состояние проверяет токен.
 * @returns подписи и токены кнопок.
 */
function buildStatusButtons(
  side: DamageFormulaStatusSide,
): Array<DamageFormulaTokenButton> {
  return DAMAGE_FORMULA_STATUS_OPTIONS.map((statusOption) => ({
    label: statusOption.label,
    value: buildDamageFormulaStatusToken(side, statusOption.value),
  }));
}

/**
 * Вкладки-помощники редактора формулы. Порядок вкладок системы, но «Кости»
 * впереди: в справочнике формулу набирают с нуля, а не правят готовую —
 * начинают всегда с кости.
 *
 * @param visibility какие вкладки спрятаны.
 * @returns вкладки в порядке показа.
 */
export function buildDamageFormulaTools(
  visibility: DamageFormulaToolsVisibility,
): Array<DamageFormulaTool> {
  const formulaTools: Array<DamageFormulaTool> = [
    { label: DAMAGE_FORMULA_LABELS.dice, slot: 'dice' },
  ];

  if (!visibility.hideModifiers) {
    formulaTools.push({
      label: DAMAGE_FORMULA_LABELS.modifiers,
      slot: 'modifiers',
    });
  }

  formulaTools.push(
    { label: DAMAGE_FORMULA_LABELS.damageTypes, slot: 'damageTypes' },
    { label: DAMAGE_FORMULA_LABELS.typeChoice, slot: 'damageTypeChoice' },
  );

  if (!visibility.hideHealing) {
    formulaTools.push({
      label: DAMAGE_FORMULA_LABELS.healing,
      slot: 'healing',
    });
  }

  if (!visibility.hideConditions) {
    // Состояния и тип существа — такие же условия на слагаемое, как хиты
    // цели, поэтому прячутся тем же пропом.
    formulaTools.push(
      { label: DAMAGE_FORMULA_LABELS.conditions, slot: 'conditions' },
      {
        label: DAMAGE_FORMULA_LABELS.targetStatuses,
        slot: 'statuses',
        statusButtons: buildStatusButtons('target'),
        statusHint: DAMAGE_FORMULA_LABELS.targetStatusesHint,
      },
      {
        label: DAMAGE_FORMULA_LABELS.selfStatuses,
        slot: 'statuses',
        statusButtons: buildStatusButtons('self'),
        statusHint: DAMAGE_FORMULA_LABELS.selfStatusesHint,
      },
      { label: DAMAGE_FORMULA_LABELS.creatureTypes, slot: 'creatureTypes' },
    );
  }

  return formulaTools;
}
