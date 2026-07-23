import type { MarkerNode, SimpleTextNode } from '~ui/markup';

/** Ключ характеристики персонажа. */
export type AbilityKey =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma';

/** Уровень владения навыком. */
export type SkillProficiencyLevel =
  | 'none'
  | 'half'
  | 'proficient'
  | 'expertise';

/** Ключ денежной единицы. */
export type CurrencyKey =
  | 'copper'
  | 'silver'
  | 'electrum'
  | 'gold'
  | 'platinum';

/** Значения характеристик персонажа. */
export type CharacterAbilities = Record<AbilityKey, number>;

/** Кошелёк персонажа. */
export type CharacterCurrency = Record<CurrencyKey, number>;

/** Опыт персонажа. */
export interface CharacterExperience {
  /** Текущее количество опыта. */
  current: number;

  /** Опыт, необходимый для следующего уровня. */
  nextLevel: number;
}

/** Здоровье персонажа. */
export interface CharacterHealth {
  /** Текущие хиты. */
  current: number;

  /** Максимум хитов. */
  max: number;

  /** Временные хиты. */
  temporary: number;
}

/** Кость хитов. */
export interface CharacterHitDie {
  /** Номинал кости (например, 6 для «к6»). */
  die: number;

  /** Оставшееся количество костей. */
  current: number;

  /** Максимальное количество костей. */
  max: number;
}

/** Дополнительная кость хитов (не из классов). */
export interface CharacterExtraHitDie extends CharacterHitDie {
  id: string;
}

/** Режим броска d20. */
export type RollMode = 'normal' | 'advantage' | 'disadvantage';

/** Тип восстановления ресурса класса. */
export type ResourceRecovery = 'short-rest' | 'long-rest';

/** Ресурс класса (счётчик). */
export interface CharacterClassResource {
  id: string;
  name: string;

  /** Короткая подпись для строки на листе (например, «НС»). */
  shortLabel: string;

  recovery: ResourceRecovery;
  current: number;
  max: number;
}

/** Класс доспеха персонажа. */
export interface CharacterArmorClass {
  /** Базовое значение КД без модификатора характеристики. */
  base: number;

  /** Характеристика, чей модификатор прибавляется; null — без модификатора. */
  ability: AbilityKey | null;

  /** Природная ли броня. */
  natural: boolean;
}

/** Ключ типа зрения. */
export type VisionKey = 'normal' | 'darkvision';

/** Зрение персонажа. */
export interface CharacterVision {
  /** Дистанция обычного зрения; 0 — не задана. */
  normal: number;

  /** Дистанция тёмного зрения; 0 — нет тёмного зрения. */
  darkvision: number;

  /** Единица измерения дистанции. */
  unit: SpeedUnit;
}

/** Строка подсказки со зрением персонажа. */
export interface VisionRow {
  key: VisionKey;
  label: string;

  /** Отформатированная дистанция; null — дистанция не задана. */
  formattedValue: string | null;
}

/** Ключ типа передвижения. */
export type SpeedTypeKey = 'walk' | 'burrow' | 'climb' | 'fly' | 'swim';

/** Единица измерения скорости. */
export type SpeedUnit = 'feet' | 'meters' | 'miles' | 'kilometers';

/** Скорости передвижения персонажа. */
export interface CharacterSpeed {
  /** Значения скоростей по типам передвижения. */
  values: Record<SpeedTypeKey, number>;

  /** Парение при полёте. */
  hover: boolean;

  /** Единица измерения. */
  unit: SpeedUnit;
}

/** Основной тип передвижения для плитки на листе. */
export interface PrimarySpeed {
  key: SpeedTypeKey;
  label: string;
  value: number;
  unitLabel: string;
}

/** Строка подсказки со скоростью передвижения. */
export interface SpeedRow {
  key: SpeedTypeKey;
  label: string;
  value: number;
  formattedValue: string;
}

/** Навык персонажа. */
export interface CharacterSkill {
  name: string;
  ability: AbilityKey;
  proficiency: SkillProficiencyLevel;
}

/** Владения персонажа. */
export interface CharacterProficiencies {
  /** Броня и снаряжение. */
  armor: string[];

  /** Оружие. */
  weapons: string[];

  /** Мастерство оружием (D&D 2024) — подмножество владения оружием. */
  weaponMasteries: string[];

  /** Инструменты. */
  tools: string[];

  /** Языки. */
  languages: string[];
}

/** Ключ группы владений персонажа. */
export type ProficiencyGroupKey = keyof CharacterProficiencies;

/** Группа каталога владений: пункт «вся группа целиком» и отдельные виды. */
export interface ProficiencyCatalogGroup {
  key: string;
  title: string;

  /** Подпись пункта «вся группа целиком». */
  all: string;

  /** Виды снаряжения группы. */
  items: string[];
}

/** Группа каталога брони в настройках владения. */
export interface ArmorProficiencyGroup extends ProficiencyCatalogGroup {
  key: 'light' | 'medium' | 'heavy' | 'shields';
}

/** Группа каталога оружия в настройках владения и мастерства. */
export interface WeaponProficiencyGroup extends ProficiencyCatalogGroup {
  key: 'simple' | 'martial';
}

/** Группа каталога инструментов в настройках владения. */
export interface ToolProficiencyGroup extends ProficiencyCatalogGroup {
  key: 'artisan' | 'gaming' | 'musical' | 'other';
}

/** Группа каталога языков в настройках владения. */
export interface LanguageProficiencyGroup extends ProficiencyCatalogGroup {
  key: 'standard' | 'rare' | 'exotic';
}

/** Выбранный вид персонажа. */
export interface CharacterSpecies {
  url: string;
  name: string;

  /** URL подвида; null — у вида нет подвидов. */
  lineageUrl: string | null;

  /** Название подвида; null — у вида нет подвидов. */
  lineageName: string | null;
}

/** Выбранный класс персонажа. */
export interface CharacterClass {
  url: string;
  name: string;

  /** URL подкласса; null — подкласс не выбран. */
  subclassUrl: string | null;

  /** Название подкласса; null — подкласс не выбран. */
  subclassName: string | null;

  /** Номинал кости хитов класса (например, 10). */
  hitDie: number;
}

/** Происхождение особенности персонажа; none — добавлена вручную без источника. */
export type FeatureOrigin = 'species' | 'lineage' | 'class' | 'feat' | 'none';

/** Узел описания особенности (элемент верхнего уровня разметки сайта). */
export type FeatureDescriptionNode = string | SimpleTextNode | MarkerNode;

/** Особенность персонажа (из вида, подвида, класса или своя). */
export interface CharacterFeature {
  id: string;
  name: string;

  /** Описание в разметке сайта (строки и блочные узлы `{@...}`). */
  description: FeatureDescriptionNode[];

  origin: FeatureOrigin;

  /** Название источника особенности (вида, подвида, класса); '' — нет. */
  originName: string;

  /** Выбор игрока в особенности (например, цвет драконорождённого). */
  choice: string | null;
}

/** Черта каталога в модалке добавления (ссылка из поиска раздела «Черты»). */
export interface FeatCatalogItem {
  url: string;

  /** Русское название. */
  name: string;

  /** Английское название (для поиска). */
  nameEng: string;

  /** Категория черты (например, «Общая», «Категория происхождения»). */
  category: string;

  /** Подпись источника черты; '' — не задан. */
  sourceLabel: string;
}

/** Деталь черты из ответа API (нужные листу поля). */
export interface FeatSummary {
  url: string;
  name: string;
  category: string;

  /** Описание в разметке сайта (строки верхнего уровня). */
  description: string[];
}

/** Заклинание в книге персонажа (и опция поиска заклинаний). */
export interface CharacterSpell {
  url: string;
  name: string;

  /** Круг заклинания; 0 — заговор. */
  level: number;

  /** Название школы магии. */
  school: string;

  /** Требует концентрации; нет у записей, добавленных до этого поля. */
  concentration?: boolean;

  /** Ритуальное заклинание; нет у записей, добавленных до этого поля. */
  ritual?: boolean;
}

/** Группа заклинаний одного круга для списка с разделителями. */
export interface CharacterSpellGroup {
  level: number;
  label: string;
  spells: CharacterSpell[];
}

/** Заклинание каталога в модалке добавления (расширенная ссылка). */
export interface SpellCatalogItem extends CharacterSpell {
  concentration: boolean;
  ritual: boolean;
}

/** Опция чипа класса из фильтров заклинаний (`className`). */
export interface SpellClassOption {
  /** Идентификатор значения фильтра, уходит в query `className`. */
  id: string;

  name: string;
}

/** Опция автокомплита выбора вида. */
export interface SpeciesOption {
  url: string;
  name: string;
  sourceLabel: string;
  hasLineages: boolean;
}

/** Особенность вида из ответа API. */
export interface SpeciesFeatureSummary {
  url: string;
  name: string;

  /** Описание в разметке сайта. */
  description: string[];
}

/** Деталь вида или подвида из ответа API (нужные листу поля). */
export interface SpeciesSummary {
  url: string;
  name: string;
  hasLineages: boolean;

  /** Строка размера (например, «Средний или Маленький»). */
  sizeText: string;

  /** Строка скорости (например, «30 футов, полёт 50 футов»). */
  speedText: string;

  features: SpeciesFeatureSummary[];
}

/** Опция класса в списке визарда (аналог `SpeciesOption`). */
export interface ClassOption {
  url: string;
  name: string;
  sourceLabel: string;

  /** Есть ли у класса подклассы (строку можно развернуть). */
  hasSubclasses: boolean;
}

/** Особенность класса из ответа API (для визарда). */
export interface ClassFeatureSummary {
  /** Устойчивый ключ особенности из ответа. */
  key: string;

  /** Уровень получения особенности (1..20). */
  level: number;

  name: string;

  /** Описание в разметке сайта. */
  description: FeatureDescriptionNode[];

  /** Особенность подкласса (а не базового класса). */
  isSubclass: boolean;
}

/** Колонка таблицы прогрессии класса (для вывода ресурсов). */
export interface ClassTableColumn {
  name: string;

  /** Значения колонки по уровням. */
  scaling: Array<{ level: number; value: string }>;
}

/** Деталь класса или подкласса из ответа API (нужные листу поля). */
export interface ClassSummary {
  url: string;
  name: string;
  hasSubclasses: boolean;

  /** Номинал кости хитов (например, 10). */
  hitDie: number;

  /** Подпись кости хитов (например, «к10»). */
  hitDieLabel: string;

  /** Спасброски прозой из ответа. */
  savingThrowsText: string;

  /** Спасброски, распознанные из текста. */
  savingThrows: AbilityKey[];

  /** Владения прозой из ответа (броня/оружие/инструменты/навыки). */
  proficiencyText: {
    armor: string;
    weapon: string;
    tool: string;
    skill: string;
  };

  /** Таблица прогрессии для вывода ресурсов класса. */
  table: ClassTableColumn[];

  features: ClassFeatureSummary[];
}

/** Тип структурированного выбора внутри класса (селектор в визарде). */
export type ClassChoiceKind =
  | 'skill-proficiency'
  | 'skill-expertise'
  | 'language'
  | 'tool';

/** Распознанный выбор класса, отображаемый селектором вместо свободного текста. */
export interface ClassChoice {
  /** Устойчивый id: 'class-skills' | 'class-tools' | `class:${featureKey}`. */
  id: string;

  kind: ClassChoiceKind;

  /** Заголовок пикера. */
  label: string;

  /** Сколько значений нужно выбрать. */
  count: number;

  /** Явные опции из прозы; пусто — резолвятся по типу в визарде. */
  listed: string[];
}

/**
 * Категория предмета инвентаря: категории раздела «Предметы» плюс отдельная
 * группа для магических предметов.
 */
export type InventoryItemCategory = 'WEAPON' | 'ARMOR' | 'ITEM' | 'MAGIC_ITEM';

/** Раздел-источник предмета инвентаря. */
export type InventoryItemOrigin = 'item' | 'magic-item';

/** Предмет инвентаря (добавлен из раздела «Предметы» или «Магические предметы»). */
export interface CharacterInventoryItem {
  id: string;

  /** URL предмета в разделе-источнике. */
  url: string;

  name: string;

  /** Категория предмета — определяет группу и иконку в списке. */
  category: InventoryItemCategory;

  /** Подпись типов предмета (например, «Оружие, Воинское оружие»); '' — нет. */
  typesLabel: string;

  /** Подпись стоимости (например, «75 зм»); '' — не указана. */
  cost: string;

  /** Вес одной единицы в фунтах; 0 — не указан. */
  weight: number;

  quantity: number;
}

/** Группа предметов инвентаря одной категории для списка с разделителями. */
export interface CharacterInventoryGroup {
  category: InventoryItemCategory;
  title: string;
  items: CharacterInventoryItem[];
}

/** Предмет каталога в модалке добавления (ссылка из поиска раздела). */
export interface ItemCatalogItem {
  url: string;

  /** Русское название. */
  name: string;

  /** Английское название (для поиска). */
  nameEng: string;

  /** Подпись стоимости; '' — не указана. */
  cost: string;

  /** Подпись источника предмета; '' — не задан. */
  sourceLabel: string;
}

/** Магический предмет каталога в модалке добавления (ссылка из поиска). */
export interface MagicItemCatalogItem {
  url: string;

  /** Русское название. */
  name: string;

  /** Английское название (для поиска). */
  nameEng: string;

  /** Категория (например, «оружие»); '' — не указана. */
  category: string;

  /** Редкость (например, «редкий»); '' — не указана. */
  rarity: string;

  /** Подпись источника; '' — не задан. */
  sourceLabel: string;
}

/** Деталь предмета из ответа API (нужные листу поля). */
export interface ItemSummary {
  url: string;
  name: string;
  category: InventoryItemCategory;

  /** Подпись типов предмета (например, «Доспехи, Тяжелый доспех»). */
  typesLabel: string;

  cost: string;

  /** Вес одной единицы в фунтах; 0 — не распознан. */
  weight: number;
}

/** Персонаж на листе персонажа. */
export interface Character {
  id: string;
  name: string;

  /** Ссылка на аватар; null — аватар не загружен. */
  avatarUrl: string | null;

  /** Вид персонажа; null — не выбран. */
  species: CharacterSpecies | null;

  /** Размер персонажа (русская подпись); null — не указан. */
  size: string | null;

  /** Особенности персонажа (вид и подвид). */
  features: CharacterFeature[];

  /** Книга заклинаний персонажа. */
  spells: CharacterSpell[];

  /** Класс персонажа; null — не выбран. */
  characterClass: CharacterClass | null;

  /** Предыстория; null — не выбрана. */
  background: string | null;

  level: number;
  experience: CharacterExperience;

  /** Есть ли у персонажа вдохновение. */
  inspiration: boolean;

  /** Класс доспеха. */
  armorClass: CharacterArmorClass;

  /** Скорости передвижения. */
  speed: CharacterSpeed;

  /** Зрение. */
  vision: CharacterVision;

  abilities: CharacterAbilities;

  /** Характеристики, спасбросками которых персонаж владеет. */
  savingThrowProficiencies: AbilityKey[];

  skills: CharacterSkill[];
  health: CharacterHealth;

  /** Кости хитов из классов. */
  hitDice: CharacterHitDie[];

  /** Дополнительные кости хитов. */
  extraHitDice: CharacterExtraHitDie[];

  /** Ресурсы класса (счётчики с восстановлением на отдыхе). */
  classResources: CharacterClassResource[];

  proficiencies: CharacterProficiencies;
  currency: CharacterCurrency;
  inventory: CharacterInventoryItem[];

  /** Заметки игрока в разметке сайта (хранимая форма редактора `MarkupEditor`). */
  notes: string;
}

/** Вкладка правой панели листа персонажа. */
export interface SheetTab {
  slot: string;
  label: string;
}

/** Строка блока характеристик. */
export interface AbilityRow {
  key: AbilityKey;
  label: string;

  /** Сокращённое название для заголовка плитки. */
  shortLabel: string;

  score: number;
  formattedModifier: string;
}

/** Строка блока спасбросков. */
export interface SavingThrowRow {
  key: AbilityKey;
  label: string;
  proficient: boolean;

  /** Числовое значение спасброска для броска кубов. */
  value: number;

  formattedValue: string;
}

/** Строка списка навыков. */
export interface SkillRow {
  name: string;
  abilityLabel: string;
  proficiency: SkillProficiencyLevel;

  /** Числовое значение навыка для броска кубов. */
  value: number;

  formattedModifier: string;
  passiveValue: number;
}
