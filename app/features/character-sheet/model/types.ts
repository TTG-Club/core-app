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

/** Происхождение особенности персонажа; none — добавлена вручную без источника. */
export type FeatureOrigin = 'species' | 'lineage' | 'class' | 'none';

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

/** Заклинание в книге персонажа (и опция поиска заклинаний). */
export interface CharacterSpell {
  url: string;
  name: string;

  /** Круг заклинания; 0 — заговор. */
  level: number;

  /** Название школы магии. */
  school: string;
}

/** Группа заклинаний одного круга для списка с разделителями. */
export interface CharacterSpellGroup {
  level: number;
  label: string;
  spells: CharacterSpell[];
}

/** Заклинание каталога в модалке добавления (расширенная ссылка). */
export interface SpellCatalogItem extends CharacterSpell {
  /** Английское название — участвует в поиске. */
  nameEng: string;

  concentration: boolean;
  ritual: boolean;

  /** Названия классов, которым доступно заклинание. */
  classes: string[];
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

/** Отображаемый параметр предмета инвентаря (например, «Атака +6»). */
export interface InventoryItemStat {
  label: string;
  value: string;
}

/** Предмет инвентаря. */
export interface CharacterInventoryItem {
  id: string;
  name: string;

  /** Категория предмета (например, «Простое оружие»). */
  category: string;

  /** Иконка предмета в формате `tabler:<имя>`. */
  icon: string;

  stats: InventoryItemStat[];
  quantity: number;

  /** Вес одной единицы в фунтах. */
  weight: number;

  /** Экипирован ли предмет. */
  equipped: boolean;
}

/** Раздел инвентаря (оружие, экипировка, инструменты). */
export interface CharacterInventorySection {
  title: string;
  items: CharacterInventoryItem[];
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

  /** Название класса; null — не выбран. */
  className: string | null;

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
  inventory: CharacterInventorySection[];
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
