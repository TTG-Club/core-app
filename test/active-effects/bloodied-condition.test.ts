import { describe, expect, it } from 'vitest';

import {
  BLOODIED_CONDITION_KEY,
  EFFECT_CONDITION_NAMES,
  EFFECT_CONDITION_OPTIONS,
  EFFECT_CONDITION_TEMPLATES,
  EFFECT_FLAG_LABELS,
  EFFECT_SAVE_CONDITION_OPTIONS,
  isEffectConditionKey,
} from '~active-effects/model';
import { CONDITION_CATALOG, CONDITION_KEYS } from '~initiative/model';
import { DAMAGE_FORMULA_STATUS_OPTIONS } from '~ui/damage-formula';

/** Название состояния «Окровавленный». */
const BLOODIED_LABEL = 'Окровавленный';

describe('состояние «Окровавленный»', () => {
  it('есть в канонических списках порта эффектов', () => {
    expect(EFFECT_CONDITION_OPTIONS).toContainEqual({
      label: BLOODIED_LABEL,
      value: BLOODIED_CONDITION_KEY,
    });

    expect(isEffectConditionKey(BLOODIED_CONDITION_KEY)).toBe(true);
    expect(EFFECT_CONDITION_NAMES.bloodied).toBe(BLOODIED_LABEL);

    // Механики у состояния нет — шаблон пустой, как в системе
    const bloodiedTemplate = EFFECT_CONDITION_TEMPLATES.find(
      (conditionTemplate) => conditionTemplate.key === BLOODIED_CONDITION_KEY,
    );

    expect(bloodiedTemplate?.flags).toEqual([]);
    expect(bloodiedTemplate?.changes).toEqual([]);
  });

  it('есть в справочнике трекера инициативы', () => {
    expect(CONDITION_KEYS).toContain(BLOODIED_CONDITION_KEY);
    expect(CONDITION_CATALOG.bloodied.label).toBe(BLOODIED_LABEL);
  });

  it('есть среди кнопок состояний формулы урона', () => {
    expect(DAMAGE_FORMULA_STATUS_OPTIONS).toContainEqual({
      label: BLOODIED_LABEL,
      value: BLOODIED_CONDITION_KEY,
    });
  });

  it('нет среди спасбросков против состояния', () => {
    expect(
      EFFECT_SAVE_CONDITION_OPTIONS.map((condition) => condition.value),
    ).not.toContain(BLOODIED_CONDITION_KEY);

    expect(EFFECT_FLAG_LABELS).not.toHaveProperty('save.advantage.vsBloodied');

    expect(EFFECT_FLAG_LABELS).not.toHaveProperty(
      'save.disadvantage.vsBloodied',
    );

    // Прочие состояния на месте
    expect(EFFECT_FLAG_LABELS).toHaveProperty('save.advantage.vsPoisoned');
  });
});
