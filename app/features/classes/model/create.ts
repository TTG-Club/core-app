import type { AbilityKey } from '~/shared/types';
import type { ActiveEffect } from '~active-effects/model';
import type { FeatEditorRows, FeatMechanics } from '~feats/model';
import type { EditorBaseInfoState, EquipmentOptionCreate } from '~ui/editor';

import type { ClassResourceRecovery } from './detail';

/**
 * Что колонка таблицы прогрессии означает для мастера повышения уровня.
 *
 * Зеркало `ClassTableColumnPurpose` из core-api. Колонка «Известные заговоры» и
 * колонка «Скрытая атака» выглядят одинаково — подпись и значения по уровням, —
 * но означают разное: по первой мастер спрашивает выбор заговоров, вторая только
 * показывается. Угадывать назначение по подписи нельзя: на переведённом или
 * самописном классе она любая.
 */
export type ClassTableColumnPurpose =
  | 'NONE'
  | 'CANTRIPS_KNOWN'
  | 'SPELLS_KNOWN'
  | 'PREPARED_SPELLS';

export type AbilityDelimiter = 'AND' | 'OR';

export interface ClassFeatureScalingCreate {
  level: number;
  name: string;
  description: string;
  additional: string;
  hideInSubclasses: boolean | undefined;
}

export interface ClassFeatureOptionCreate {
  key?: string;
  name: {
    rus: string;
    eng: string;
  };
  description: string;
  additional: string | undefined;
  prerequisite: string | undefined;
  requiredClassLevel: number | undefined;
  hideInSubclasses: boolean | undefined;
}

/**
 * Выбор владения навыками у самого умения: «Величие гения» паладина даёт один
 * навык из четырёх, и это не тот выбор, что лежит во владениях класса
 * (`proficiency.skill` — выбор при создании персонажа на 1 уровне).
 */
export interface ClassFeatureSkillChoiceCreate {
  count: number;
  skills: Array<string>;
}

export interface ClassFeatureCreate {
  level: number;
  name: string;
  optionsName: string | undefined;
  description: string;
  additional: string;
  hideInSubclasses: boolean | undefined;
  abilityImprovement: boolean | undefined;
  fightingStyleChoice: boolean | undefined;
  scaling: Array<ClassFeatureScalingCreate>;
  options: Array<ClassFeatureOptionCreate>;
  abilityBonus?: ClassFeatureAbilityBonusCreate;
  skillChoice?: ClassFeatureSkillChoiceCreate;

  /**
   * Умение только информирует и в лист персонажа не попадает: строка таблицы
   * прогрессии вроде «Подкласс» или «Улучшение характеристик» нужна в книге, но
   * записью умения на листе она была бы шумом.
   */
  informationalOnly: boolean | undefined;

  /**
   * Дары умения моделью черты — той же, что лежит в core-api
   * (`ClassFeature.mechanics`): набор даров у черты и умения класса один, и
   * вторая копия тех же полей разошлась бы с первой.
   */
  mechanics: FeatMechanics | undefined;

  /** Активные эффекты умения в вокабуляре VTTG. */
  activeEffects: Array<ActiveEffect>;

  /**
   * Строки редактора даров умения. Форма правит их, а не блоки механики; перед
   * отправкой из них пересобирается `mechanics`, а само поле обнуляется.
   */
  editorRows: FeatEditorRows | undefined;
}

export interface ClassFeatureAbilityBonusCreate {
  abilities: Array<AbilityKey>;
  bonus: number;
  upto: number;
}

export interface ClassColumnScalingCreate {
  level: number;
  value: string;
}

export interface ClassColumnCreate {
  name: string;
  resourceRecovery: ClassResourceRecovery;
  scaling: Array<ClassColumnScalingCreate>;

  /**
   * Стабильный ключ колонки. Пусто — ключ выводится из подписи, как было до его
   * появления; заполняют его, когда подпись переводят или меняют: по ключу лист
   * хранит потраченный остаток ресурса, и перевод не должен обнулять счётчики.
   */
  key: string | undefined;

  /** Краткая подпись для компактной плитки ресурса; пусто — берётся название. */
  shortName: string | undefined;

  /** Что колонка означает для мастера повышения уровня. */
  purpose: ClassTableColumnPurpose | undefined;
}

export interface ArmorProficiencyCreate {
  category: Array<string>;
  custom: string | undefined;
}

export interface WeaponProficiencyCreate {
  category: Array<string>;
  custom: string | undefined;
}

export interface SkillProficiencyCreate {
  count: number;
  skills: Array<string>;
}

export interface ClassProficiencyCreate {
  armor: ArmorProficiencyCreate;
  weapon: WeaponProficiencyCreate;
  tool: string | undefined;
  skill: SkillProficiencyCreate;
}

export interface ClassMulticlassProficiencyCreate {
  armor: ArmorProficiencyCreate;
  weapon: WeaponProficiencyCreate;
  toolProficiency: string | undefined;
  skills: number;
}

export interface ClassPrimaryCharacteristicsCreate {
  values: Array<AbilityKey> | undefined;
  delimiter: AbilityDelimiter | undefined;
}

export interface ClassCreate extends EditorBaseInfoState {
  gallery: Array<string>;
  description: string | undefined;
  parentUrl: string | undefined;
  hitDice: string | undefined;
  savingThrows: Array<AbilityKey>;
  proficiency: ClassProficiencyCreate;
  multiclassProficiency: ClassMulticlassProficiencyCreate;
  equipment: string | undefined;
  startingEquipment: Array<EquipmentOptionCreate>;
  features: Array<ClassFeatureCreate>;
  table: Array<ClassColumnCreate>;
  casterType: string | undefined;
  image: string | undefined;
  primaryCharacteristics: ClassPrimaryCharacteristicsCreate;
  abilityTemplate: AbilityTemplateCreate | undefined;

  /**
   * Характеристика, которой класс колдует.
   *
   * До её появления потребители выводили характеристику по каноническому ключу
   * класса, и у самописного или переведённого класса она молча пропадала.
   */
  spellcastingAbility: AbilityKey | undefined;

  /** Уровень класса, с которого работает заклинательство; пусто — с первого. */
  spellcastingStartLevel: number | undefined;

  /** Подпись группы подклассов: «Воинский архетип», «Магическая традиция». */
  subclassLabel: string | undefined;

  /** Уровень, на котором выбирается подкласс. */
  subclassLevel: number | undefined;

  /**
   * Дары самого класса: то, что даёт взятие класса целиком и чему не нашлось
   * места в отдельных полях владений.
   */
  mechanics: FeatMechanics | undefined;

  /** Активные эффекты класса в вокабуляре VTTG. */
  activeEffects: Array<ActiveEffect>;

  /** Строки редактора даров класса; в теле запроса им места нет. */
  editorRows: FeatEditorRows | undefined;
}

export type AbilityTemplateCreate = [
  number,
  number,
  number,
  number,
  number,
  number,
];
