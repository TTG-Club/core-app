/**
 * Активные эффекты листа персонажа: свои, от умений, от снаряжения и состояния.
 *
 * Свои эффекты живут в документе персонажа и правятся игроком. Эффекты
 * снаряжения читаются у надетых предметов и правке не подлежат — они приезжают
 * со своей записью каталога; эффекты умений, черт, вида и класса лежат в самих
 * записях особенностей и правятся так же мало, зато их можно выключить.
 * Состояния (Отравленный, Опутанный) — те же свои эффекты, только собранные из
 * шаблона состояния: у них задан `conditionKey`, по нему их и отличают.
 *
 * Зеркало `useEntityActiveEffects` из системы D&D, поэтому набор действий тот
 * же: сохранить, удалить, выключить, переключить состояние.
 */

import type { ActiveEffect, EffectConditionKey } from '~active-effects/model';

import type { CharacterFeature } from '../model';

import {
  createEmptyActiveEffect,
  EFFECT_CONDITION_TEMPLATES,
} from '~active-effects/model';

import { useCharacterSheet } from './useCharacterSheet';

/**
 * Подпись источника эффекта умения: сперва запись, которая его дала, затем сама
 * особенность. У записи под эффекты самого класса или вида название и источник
 * совпадают — тогда подпись одна.
 *
 * @param feature особенность с эффектом.
 * @returns подпись источника для строки списка.
 */
function getFeatureEffectSource(feature: CharacterFeature): string {
  return feature.originName && feature.originName !== feature.name
    ? `${feature.originName} · ${feature.name}`
    : feature.name;
}

/**
 * Ведение активных эффектов листа.
 *
 * @returns свои эффекты, эффекты снаряжения, состояния и действия над ними.
 */
export function useSheetActiveEffects() {
  const {
    character,
    canEdit,
    updateActiveEffects,
    toggleFeatureEffectDisabled,
  } = useCharacterSheet();

  /** Свои эффекты персонажа — всё, что не собрано из шаблона состояния. */
  const customEffects = computed(() =>
    character.value.activeEffects.filter(
      (effect) => effect.conditionKey === undefined,
    ),
  );

  /** Наложенные состояния — эффекты с ключом состояния. */
  const conditionEffects = computed(() =>
    character.value.activeEffects.filter(
      (effect) => effect.conditionKey !== undefined,
    ),
  );

  /** Ключи наложенных состояний — для подсветки плиток. */
  const activeConditionKeys = computed(
    () =>
      new Set(
        conditionEffects.value.flatMap((effect) =>
          effect.conditionKey ? [effect.conditionKey] : [],
        ),
      ),
  );

  /**
   * Эффекты надетого снаряжения — только для показа: правятся они в мастерской,
   * а на листе живут ровно столько, сколько предмет надет.
   */
  const equipmentEffects = computed(() =>
    character.value.inventory
      .filter((item) => item.equipped)
      .flatMap((item) =>
        (item.activeEffects ?? [])
          .filter((effect) => !effect.disabled)
          .map((effect) => ({ effect, sourceName: item.name })),
      ),
  );

  /**
   * Эффекты умений, черт, вида и класса — тем же списком, что и свои.
   *
   * Правке не подлежат: приезжают из справочника вместе с самой записью и
   * снимаются только вместе с ней. Выключить их всё же можно — эффект «Защиты
   * без доспехов» не нужен персонажу в доспехе, а само умение при этом
   * остаётся на месте. Выключенные показываются наравне с включёнными: иначе
   * вернуть их было бы нечем.
   */
  const featureEffects = computed(() =>
    character.value.features.flatMap((feature) =>
      (feature.activeEffects ?? []).map((effect) => ({
        effect,
        featureId: feature.id,
        sourceName: getFeatureEffectSource(feature),
      })),
    ),
  );

  /**
   * Наложено ли состояние.
   *
   * @param key ключ состояния.
   * @returns признак наложенного состояния.
   */
  function isConditionActive(key: EffectConditionKey): boolean {
    return activeConditionKeys.value.has(key);
  }

  /**
   * Сохраняет свой эффект: правит существующий по идентификатору либо
   * добавляет новый.
   *
   * @param effect эффект целиком.
   */
  function saveEffect(effect: ActiveEffect): void {
    const exists = character.value.activeEffects.some(
      (item) => item.id === effect.id,
    );

    updateActiveEffects(
      exists
        ? character.value.activeEffects.map((item) =>
            item.id === effect.id ? effect : item,
          )
        : [...character.value.activeEffects, effect],
    );
  }

  /**
   * Удаляет эффект листа.
   *
   * @param effectId идентификатор эффекта.
   */
  function removeEffect(effectId: string): void {
    updateActiveEffects(
      character.value.activeEffects.filter((item) => item.id !== effectId),
    );
  }

  /**
   * Выключает или включает эффект, не удаляя его.
   *
   * @param effectId идентификатор эффекта.
   */
  function toggleEffectDisabled(effectId: string): void {
    updateActiveEffects(
      character.value.activeEffects.map((item) =>
        item.id === effectId ? { ...item, disabled: !item.disabled } : item,
      ),
    );
  }

  /**
   * Накладывает состояние или снимает наложенное.
   *
   * @param key ключ состояния.
   */
  function toggleCondition(key: EffectConditionKey): void {
    if (isConditionActive(key)) {
      updateActiveEffects(
        character.value.activeEffects.filter(
          (item) => item.conditionKey !== key,
        ),
      );

      return;
    }

    const template = EFFECT_CONDITION_TEMPLATES.find(
      (item) => item.key === key,
    );

    if (!template) {
      return;
    }

    updateActiveEffects([
      ...character.value.activeEffects,
      {
        ...createEmptyActiveEffect('condition'),
        name: template.name,
        description: template.description,
        icon: template.icon,
        conditionKey: template.key,
        flags: [...template.flags],
        changes: template.changes.map((change) => ({ ...change })),
        conditionImmunities: template.conditionImmunities
          ? [...template.conditionImmunities]
          : undefined,
        duration: { type: 'special', value: undefined },
        effectTarget: 'self',
      },
    ]);
  }

  return {
    canEdit,
    customEffects,
    conditionEffects,
    activeConditionKeys,
    equipmentEffects,
    featureEffects,
    isConditionActive,
    saveEffect,
    removeEffect,
    toggleEffectDisabled,
    toggleFeatureEffectDisabled,
    toggleCondition,
  };
}
