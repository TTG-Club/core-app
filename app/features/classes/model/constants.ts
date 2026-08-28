import type { ClassTableColumnPurpose } from './create';
import type { ClassResourceRecovery } from './detail';

/**
 * Минимальное значение ключевой характеристики, необходимое для взятия уровня
 * в классе при мультиклассировании (правило D&D 2024).
 */
export const MULTICLASS_ABILITY_REQUIREMENT = 13;

/**
 * Пояснение к требованиям мультиклассирования в статблоке класса.
 */
export const MULTICLASS_REQUIREMENT_HINT = `Чтобы взять уровень в этом классе вдобавок к уже имеющемуся, нужно значение ${MULTICLASS_ABILITY_REQUIREMENT} в его ключевых характеристиках`;

export const CLASS_RESOURCE_RECOVERY_OPTIONS: Array<{
  label: string;
  value: ClassResourceRecovery;
}> = [
  { label: 'Не является ресурсом', value: 'NONE' },
  { label: 'Короткий отдых', value: 'SHORT_REST' },
  { label: 'Продолжительный отдых', value: 'LONG_REST' },
];

/** Вкладки формы класса — в порядке показа. */
export const CLASS_EDITOR_TABS = {
  main: 'Основное',
  spellcasting: 'Заклинательство',
  proficiencies: 'Владения',
  equipment: 'Снаряжение',
  features: 'Умения',
  table: 'Таблица',
  grants: 'Дары',
  effects: 'Эффекты',
  images: 'Изображения',
} as const;

/** Подписи полей формы класса. */
export const CLASS_EDITOR_LABELS = {
  descriptionTitle: 'Описание',
  descriptionPlaceholder: 'Введи описание',

  spellcastingTitle: 'Заклинательство',
  casterType: 'Тип заклинателя',
  spellcastingAbility: 'Заклинательная характеристика',
  spellcastingAbilityHint:
    'Чем класс колдует. Пусто — потребитель угадывает характеристику по ключу класса и у переведённого или самописного класса не находит её вовсе.',
  spellcastingStartLevel: 'Уровень начала',
  spellcastingStartLevelHint:
    'Уровень класса, с которого работает заклинательство. Пусто — с первого; у трети-заклинателей это третий.',

  subclassesTitle: 'Подклассы',
  subclassLabel: 'Название группы подклассов',
  subclassLabelPlaceholder: 'Например: Воинский архетип',
  subclassLevel: 'Уровень выбора подкласса',
  subclassLevelHint:
    'Пусто — уровень берётся из уровня первого умения подкласса.',

  equipmentTitle: 'Стартовое снаряжение',
  equipmentPlaceholder: 'Опиши стартовое снаряжение',

  grantsTitle: 'Дары класса',
  grantsHint:
    'То, что даёт взятие класса целиком и чему не нашлось места во владениях. Дары конкретного умения задаются у самого умения.',
  modifiersTitle: 'Постоянные правки листа',
  countersTitle: 'Ресурсы со счётчиком',
  countersHint:
    'Ресурсы, максимум которых задан формулой. Ресурсу с колонкой таблицы прогрессии здесь дублироваться не нужно: колонка и есть его прогрессия.',
  spellsTitle: 'Выдаваемые заклинания',

  effectsHint:
    'Активные эффекты класса в вокабуляре виртуального стола: бонусы, флаги, иммунитеты. Дары лист проставляет сам, а эффект меняет числа готовой формулой.',

  featureInformationalOnly: 'Только информирует?',
  featureInformationalOnlyHint:
    'Строка таблицы вроде «Подкласс» нужна в книге, но записью умения на листе она была бы шумом.',
  featureAdvanced: 'Механика и эффекты',
  featureGrantsTitle: 'Дары умения',
  featureModifiersTitle: 'Правки листа от умения',
  featureCountersTitle: 'Ресурсы умения',
  featureSpellsTitle: 'Заклинания умения',
  featureEffectsTitle: 'Эффекты умения',

  columnKey: 'Ключ',
  columnKeyHint:
    'Пусто — ключ выводится из названия. Заполняй, когда переводишь или меняешь подпись: по ключу лист хранит потраченный остаток ресурса.',
  columnShortName: 'Краткое название',
  columnShortNameHint:
    'Для компактной плитки ресурса; пусто — берётся название.',
  columnPurpose: 'Назначение',
  columnPurposeHint:
    'По колонке заговоров и заклинаний мастер повышения уровня спрашивает выбор. Остальные колонки только показываются.',
} as const;

/** Значения назначения колонки таблицы прогрессии. */
export const CLASS_TABLE_COLUMN_PURPOSE_OPTIONS: Array<{
  label: string;
  value: ClassTableColumnPurpose;
}> = [
  { label: 'Обычная колонка', value: 'NONE' },
  { label: 'Известные заговоры', value: 'CANTRIPS_KNOWN' },
  { label: 'Известные заклинания', value: 'SPELLS_KNOWN' },
  { label: 'Подготовленные заклинания', value: 'PREPARED_SPELLS' },
];

/** Границы уровня заклинательства и выбора подкласса. */
export const CLASS_LEVEL_BOUNDS = {
  min: 1,
  max: 20,
} as const;
