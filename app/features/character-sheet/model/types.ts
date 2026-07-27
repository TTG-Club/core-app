import type { CasterType, ClassResourceRecovery } from '~classes/model';
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

/** Пользовательская денежная единица (сверх пяти стандартных). */
export interface CharacterCustomCurrency {
  /** Устойчивый идентификатор (ключи списка и обновления). */
  id: string;

  /** Полное название (показывается в тултипе). */
  name: string;

  /** Сокращение (подпись в ряду валют). */
  label: string;

  /** Количество. */
  amount: number;
}

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

/** Способ прироста максимума хитов за взятые уровни в модалке опыта. */
export type HitPointsGainMode = 'average' | 'roll' | 'max';

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

  /**
   * Использовать ручное значение (`base` + модификатор `ability`) вместо
   * автоподсчёта по надетой броне. false — КД считается по инвентарю.
   */
  custom: boolean;
}

/** Способ применения модификатора Ловкости к КД доспеха. */
export type ArmorDexterityMod = 'full' | 'capped' | 'none';

/** Параметры доспеха предмета инвентаря для подсчёта класса доспеха. */
export interface InventoryArmor {
  /** Базовый КД брони; у щита — его бонус к КД. */
  baseArmorClass: number;

  /** Как применяется модификатор Ловкости (штраф средней/тяжёлой брони). */
  dexterityMod: ArmorDexterityMod;

  /** Щит: складывается поверх лучшей брони, а не заменяет её. */
  shield: boolean;
}

/** Урон оружия из справочника: кости, собственный бонус и тип. */
export interface InventoryWeaponDamage {
  /** Количество костей урона. */
  diceCount: number;

  /** Количество граней кости урона (8 — к8). */
  diceFaces: number;

  /** Собственный бонус урона оружия (0 — нет). */
  bonus: number;

  /** Тип урона из справочника (`SLASHING`); пустая строка — не указан. */
  type: string;
}

/** Категория владения оружием. */
export type WeaponCategory = 'simple' | 'martial';

/** Параметры оружия предмета инвентаря для подсчёта бонуса атаки. */
export interface InventoryWeapon {
  /** Категория владения: простое или воинское. */
  category: WeaponCategory;

  /** Дальнобойное оружие (атака от Ловкости). */
  ranged: boolean;

  /** Фехтовальное свойство (можно бить от Ловкости вместо Силы). */
  finesse: boolean;

  /** Урон оружия; null — справочник его не отдал. */
  damage: InventoryWeaponDamage | null;
}

/** Разбор бонуса атаки оружием. */
export interface WeaponAttack {
  /** Итоговый бонус к броску атаки. */
  value: number;

  /** Характеристика, от которой считается атака. */
  ability: AbilityKey;
}

/** Разбор броска урона оружием. */
export interface WeaponDamage {
  /** Формула броска для дайс-роллера с учётом всех бонусов («1к8+3»). */
  formula: string;

  /** Нотация костей урона без бонусов («1к8»). */
  diceNotation: string;

  /** Собственный бонус урона оружия (0 — нет). */
  weaponBonus: number;

  /** Характеристика, чей модификатор идёт в урон. */
  ability: AbilityKey;

  /** Название типа урона («Рубящий»); пустая строка — тип не указан. */
  typeLabel: string;
}

/** Разбор итогового класса доспеха для модалки настройки. */
export interface ArmorClassBreakdown {
  /** Итоговое значение КД. */
  value: number;

  /** Взято ручное значение (режим «Использовать своё»). */
  custom: boolean;

  /** Название учтённой брони; null — без брони (безброневой КД). */
  bodyArmorName: string | null;

  /** КД тела: лучшая надетая броня либо безброневой `10 + Ловкость`. */
  bodyArmorValue: number;

  /** Фактически применённый бонус Ловкости. */
  dexBonus: number;

  /** Модификатор Ловкости был урезан правилом брони. */
  dexCapped: boolean;

  /** Бонус к КД от надетого щита; 0 — щита нет. */
  shieldBonus: number;
}

/** Ключ типа зрения. */
export type VisionKey =
  | 'normal'
  | 'darkvision'
  | 'blindsight'
  | 'tremorsense'
  | 'truesight';

/** Зрение персонажа. */
export interface CharacterVision {
  /** Дистанция обычного зрения; 0 — не задана. */
  normal: number;

  /** Дистанция тёмного зрения; 0 — нет тёмного зрения. */
  darkvision: number;

  /** Дистанция слепого зрения; 0 — нет слепого зрения. */
  blindsight: number;

  /** Дистанция чувства вибрации; 0 — нет чувства вибрации. */
  tremorsense: number;

  /** Дистанция истинного зрения; 0 — нет истинного зрения. */
  truesight: number;

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

  /**
   * Тип заклинательства класса (`casterType` из справочника, у треть-заклинателей
   * берётся у подкласса); null — класс ячеек не даёт либо лист сохранён до
   * появления поля (тогда тип определяется по названию класса).
   */
  casterType: CasterType | null;

  /** Номинал кости хитов класса (например, 10). */
  hitDie: number;
}

/** Режим распределения прибавок к характеристикам от предыстории. */
export type AbilityBonusMode = '2-1' | '1-1-1';

/** Выбранная предыстория персонажа. */
export interface CharacterBackground {
  url: string;
  name: string;

  /** URL черты происхождения; null — не распознана. */
  featUrl: string | null;

  /** Применённые прибавки к характеристикам (для отката при смене предыстории). */
  abilityBonuses: Partial<Record<AbilityKey, number>>;
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

  /** Черту можно брать несколько раз (флаг `repeatability` с бэка). */
  repeatability: boolean;
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
  /** Ссылка каталога; у своих заклинаний — `custom:<uuid>`. */
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

  /** Время накладывания; только у своих заклинаний. */
  castingTime?: string;

  /** Дистанция; только у своих заклинаний. */
  range?: string;

  /** Компоненты; только у своих заклинаний. */
  components?: string;

  /** Длительность; только у своих заклинаний. */
  duration?: string;

  /**
   * Описание в разметке сайта; только у своих заклинаний (у каталожных оно
   * приходит с сервера в дровере раздела).
   */
  description?: FeatureDescriptionNode[];
}

/**
 * Дозагруженная деталь каталожного заклинания. Поля повторяют форму своего
 * заклинания: так карточка справочника рисуется одним кодом для обоих видов
 * записей.
 */
export type CatalogSpellDetail = Required<
  Pick<
    CharacterSpell,
    'castingTime' | 'range' | 'components' | 'duration' | 'description'
  >
>;

/** Ключ текстового поля своего заклинания. */
export type CustomSpellFieldKey =
  | 'castingTime'
  | 'range'
  | 'components'
  | 'duration';

/** Текстовое поле своего заклинания: подпись формы и развёрнутой карточки. */
export interface CustomSpellField {
  key: CustomSpellFieldKey;
  label: string;

  /** Подсказка поля формы. */
  placeholder: string;
}

/** Заполненная характеристика своего заклинания в развёрнутой карточке. */
export interface CustomSpellStatRow {
  key: CustomSpellFieldKey;
  label: string;
  value: string;
}

/** Значения формы своего заклинания (добавление и редактирование). */
export interface CustomSpellDraft {
  name: string;
  level: number;

  /** Школа магии; '' — не выбрана. */
  school: string;

  castingTime: string;
  range: string;
  components: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;

  /** Описание в разметке сайта. */
  description: FeatureDescriptionNode[];
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

/** Настройки заклинательства персонажа. */
export interface CharacterSpellcasting {
  /**
   * Заклинательная характеристика; null — авто (определяется по классу
   * персонажа).
   */
  ability: AbilityKey | null;
}

/** Потраченные ячейки заклинаний одного круга. */
export interface CharacterSpellSlot {
  /** Круг ячеек (1..9). */
  level: number;

  /** Сколько ячеек круга потрачено. */
  used: number;
}

/** Ряд ячеек заклинаний одного круга для разделителя списка заклинаний. */
export interface SpellSlotRow {
  /** Круг ячеек (1..9). */
  level: number;

  /** Всего ячеек круга по таблице класса. */
  max: number;

  /** Потрачено ячеек (не больше `max`). */
  used: number;

  /** Чем восстанавливаются ячейки; у колдуна — короткий отдых. */
  recovery: ResourceRecovery;
}

/** Кружок ячейки заклинаний в разделителе круга. */
export interface SpellSlotCircle {
  /** Порядковый номер ячейки в круге (с нуля). */
  index: number;

  /** Ячейка потрачена (кружок закрашен). */
  used: boolean;

  /** Подпись кнопки для скринридера. */
  label: string;
}

/** Настройки листа персонажа (правила подсчёта, общие для всего листа). */
export interface CharacterSettings {
  /**
   * Базовая характеристика бонуса атаки оружием; null — по умолчанию (Сила).
   * Фехтовальное и дальнобойное оружие всё равно бьёт от Ловкости.
   */
  weaponAttackAbility: AbilityKey | null;
}

/** Разбор заклинательства для вкладки заклинаний и модалки настройки. */
export interface SpellcastingBreakdown {
  /** Заклинательная характеристика; null — не определена (нет класса-заклинателя). */
  ability: AbilityKey | null;

  /** Характеристика определена автоматически по классу (не задана вручную). */
  auto: boolean;

  /** Модификатор заклинательной характеристики; 0 — характеристика не определена. */
  abilityModifier: number;

  /** Бонус мастерства персонажа. */
  proficiencyBonus: number;

  /** Сложность спасброска от заклинаний. */
  saveDc: number;

  /** Бонус на попадание атакой заклинанием. */
  attackBonus: number;
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

  /** Когда восстанавливается ресурс; NONE — колонка не является ресурсом. */
  resourceRecovery: ClassResourceRecovery;

  /** Значения колонки по уровням. */
  scaling: Array<{ level: number; value: string }>;
}

/** Деталь класса или подкласса из ответа API (нужные листу поля). */
export interface ClassSummary {
  url: string;
  name: string;
  hasSubclasses: boolean;

  /**
   * Тип заклинательства из справочника (`casterType`); null — значение не
   * пришло или неизвестно.
   */
  casterType: CasterType | null;

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

/** Контекст резолюции опций выбора (навыки/языки/инструменты) в визарде. */
export interface ChoiceOptionContext {
  /** Все имена навыков персонажа. */
  skillNames: string[];

  /** Навыки, которыми персонаж уже владеет. */
  proficientSkillNames: string[];

  /** Навыки, выбранные во владение в этом визарде (для опций экспертизы). */
  chosenProficientSkills: string[];

  /** Уже известные языки. */
  knownLanguages: string[];

  /** Уже известные инструменты. */
  knownTools: string[];

  /** Все языки каталога. */
  allLanguages: string[];

  /** Все инструменты каталога. */
  allTools: string[];
}

/** Опция предыстории в списке визарда. */
export interface BackgroundOption {
  url: string;
  name: string;
  sourceLabel: string;
}

/** Деталь предыстории из ответа API (нужные листу поля). */
export interface BackgroundSummary {
  url: string;
  name: string;

  /** Характеристики для прибавок (3 из ответа). */
  abilities: AbilityKey[];

  /** Характеристики прозой. */
  abilitiesText: string;

  /** Фиксированные навыки предыстории (владение). */
  skills: string[];

  /** Навыки прозой. */
  skillsText: string;

  /** Фиксированные инструменты (применяются как есть). */
  toolFixed: string[];

  /** Выбор инструмента; null — инструмент фиксирован. */
  toolChoice: ClassChoice | null;

  /** URL черты происхождения; null — не распознана. */
  featUrl: string | null;

  /** Название черты для отображения. */
  featName: string;

  /** Уточнение черты в скобках (например, «Жрец»); '' — нет. */
  featSubchoice: string;

  /** Стартовое снаряжение в разметке (справка). */
  equipment: string[];
}

/**
 * Категория предмета инвентаря: категории раздела «Предметы» плюс отдельная
 * группа для магических предметов.
 */
export type InventoryItemCategory = 'WEAPON' | 'ARMOR' | 'ITEM' | 'MAGIC_ITEM';

/** Раздел-источник предмета инвентаря. */
export type InventoryItemOrigin = 'item' | 'magic-item';

/**
 * Вид своего предмета: от него зависят и поля формы, и параметры записи
 * инвентаря (оружие даёт атаку с уроном, доспех — класс доспеха, безделушка —
 * только описание).
 */
export type CustomInventoryKind = 'weapon' | 'armor' | 'trinket';

/** Тип доспеха своего предмета: правило Ловкости и признак щита. */
export type CustomArmorType = 'light' | 'medium' | 'heavy' | 'shield';

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

  /** Параметры доспеха; заданы только у доспехов раздела «Предметы». */
  armor: InventoryArmor | null;

  /** Параметры оружия; заданы только у оружия раздела «Предметы». */
  weapon: InventoryWeapon | null;

  /** Доспех надет — учитывается в автоподсчёте класса доспеха. */
  equipped: boolean;

  /**
   * Описание в разметке сайта; только у своих предметов (у каталожных оно
   * приходит с сервера в дровере раздела).
   */
  description?: FeatureDescriptionNode[];
}

/** Значения формы своего предмета (добавление и редактирование). */
export interface CustomInventoryItemDraft {
  kind: CustomInventoryKind;
  name: string;

  /** Подпись стоимости как её ввёл игрок (например, «75 зм»); '' — не указана. */
  cost: string;

  /** Вес одной единицы в фунтах; 0 — не указан. */
  weight: number;

  quantity: number;

  /** Тип доспеха (вид «Доспех»). */
  armorType: CustomArmorType;

  /** Базовый КД доспеха, у щита — его бонус к КД (вид «Доспех»). */
  baseArmorClass: number;

  /** Категория владения оружием (вид «Оружие»). */
  weaponCategory: WeaponCategory;

  /** Дальнобойное оружие — атака от Ловкости (вид «Оружие»). */
  ranged: boolean;

  /** Фехтовальное оружие — атака от Ловкости (вид «Оружие»). */
  finesse: boolean;

  /** Количество костей урона; 0 — урон не задан (вид «Оружие»). */
  damageDiceCount: number;

  /** Количество граней кости урона (вид «Оружие»). */
  damageDiceFaces: number;

  /** Собственный бонус урона оружия (вид «Оружие»). */
  damageBonus: number;

  /** Ключ типа урона из справочника; '' — не указан (вид «Оружие»). */
  damageType: string;

  /** Описание в разметке сайта. */
  description: FeatureDescriptionNode[];
}

/** Правила доспеха своего предмета по его типу. */
export interface CustomArmorTypeMeta {
  /** Подпись типа для селекта формы. */
  label: string;

  /** Подпись поля значения КД: у щита это бонус, а не полный класс доспеха. */
  armorClassLabel: string;

  /** Пояснение, как тип считает КД (подсказка под селектом). */
  hint: string;

  /** Как применяется модификатор Ловкости. */
  dexterityMod: ArmorDexterityMod;

  /** Щит: складывается поверх лучшей брони, а не заменяет её. */
  shield: boolean;

  /** Подпись типов предмета для строки инвентаря. */
  typesLabel: string;
}

/** Бросок, который запускает нажатие на плитку параметра предмета. */
export type InventoryStatRollKind = 'attack' | 'damage';

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

  /** Параметры доспеха из «сырого» ответа; null — не доспех или нет данных. */
  armor: InventoryArmor | null;

  /** Параметры оружия из «сырого» ответа; null — не оружие или нет данных. */
  weapon: InventoryWeapon | null;
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

  /** Настройки заклинательства (заклинательная характеристика). */
  spellcasting: CharacterSpellcasting;

  /**
   * Потраченные ячейки заклинаний по кругам. Максимум ячеек считается по классу
   * и уровню, поэтому хранится только трата; круги без трат в список не входят.
   */
  spellSlots: CharacterSpellSlot[];

  /** Класс персонажа; null — не выбран. */
  characterClass: CharacterClass | null;

  /** Предыстория персонажа; null — не выбрана. */
  characterBackground: CharacterBackground | null;

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

  /** Пользовательские денежные единицы (сверх пяти стандартных). */
  customCurrencies: CharacterCustomCurrency[];

  inventory: CharacterInventoryItem[];

  /** Заметки игрока в разметке сайта (хранимая форма редактора `MarkupEditor`). */
  notes: string;

  /** Настройки листа (правила подсчёта). */
  settings: CharacterSettings;
}

/** Статус автосохранения листа персонажа. */
export type SheetSaveStatus = 'saved' | 'saving' | 'error';

/** Лист персонажа в списке пользователя. */
export interface CharacterSheetListItem {
  id: string;
  name: string;

  /** Лист удалён (строка истории с возможностью восстановления). */
  deleted: boolean;

  /** Персонаж листа; null — у удалённых (сервер не отдаёт документ). */
  data: Character | null;

  /** Токен ссылки «поделиться»; null — доступ по ссылке выключен. */
  shareToken: string | null;

  /** Дата создания (ISO); null — не пришла. */
  createdAt: string | null;

  /** Дата последнего изменения (ISO); null — не пришла. */
  updatedAt: string | null;
}

/** Список листов пользователя с серверными лимитами. */
export interface CharacterSheetListPage {
  /** Максимум активных листов (серверный, в будущем зависит от подписки). */
  limit: number;

  /** Максимум листов в истории удалённых; 0 — сервер лимит не прислал. */
  historyLimit: number;

  /** Число активных (неудалённых) листов. */
  count: number;

  sheets: CharacterSheetListItem[];
}

/** Чужой лист, сохранённый по ссылке «поделиться». */
export interface SavedCharacterSheet {
  /** Идентификатор сохранённой записи (им же она и удаляется). */
  id: string;

  /** Идентификатор самого листа персонажа. */
  sheetId: string;

  /** Токен ссылки: по нему лист открывается на чтение. */
  shareToken: string;

  /** Название: живое у доступного листа, снимок сохранения — у остальных. */
  name: string;

  /** Персонаж листа; null — доступ к листу закрыт. */
  data: Character | null;

  /** Лист всё ещё открыт по этой ссылке: не удалён и токен не отозван. */
  available: boolean;
}

/** Список сохранённых чужих листов с серверным лимитом. */
export interface SavedCharacterSheetListPage {
  /** Максимум сохранённых ссылок (серверный, в будущем зависит от подписки). */
  limit: number;

  /** Число сохранённых записей, включая ставшие недоступными. */
  count: number;

  sheets: SavedCharacterSheet[];
}

/** Полный лист персонажа из ответа API. */
export interface CharacterSheetDetail {
  id: string;
  name: string;
  data: Character;

  /**
   * Токен ссылки «поделиться»; null — доступ по ссылке выключен. Приходит только
   * владельцу: у листа, открытого по ссылке, поля нет.
   */
  shareToken: string | null;
}

/** Раздел листа персонажа — значение вкладки и ключ её содержимого. */
export type SheetTabSlot =
  | 'main'
  | 'equipment'
  | 'spells'
  | 'features'
  | 'notes';

/** Вкладка правой панели листа персонажа. */
export interface SheetTab {
  slot: SheetTabSlot;
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

/**
 * Кости хитов одного номинала: классовые и дополнительные считаются вместе,
 * потому что на отдыхе они равнозначны.
 */
export interface HitDicePool {
  /** Номинал кости (8 — к8). */
  die: number;

  /** Подпись номинала («к8»). */
  label: string;

  /** Осталось костей номинала. */
  current: number;

  /** Всего костей номинала. */
  max: number;
}

/** Пул костей хитов с пределом выбора для строки выбора костей на отдыхе. */
export interface HitDiceSelectPool extends HitDicePool {
  /** Сколько костей номинала разрешено выбрать. */
  limit: number;
}

/** Количество костей хитов одного номинала: трата или возврат на отдыхе. */
export interface HitDiceAmount {
  /** Номинал кости. */
  die: number;

  /** Сколько костей номинала затронуто. */
  count: number;
}

/** Результат броска одной кости хитов на отдыхе. */
export interface HitDieRollResult {
  /** Идентификатор строки журнала бросков. */
  id: string;

  /** Подпись номинала («к8»). */
  label: string;

  /** Выпавшее на кости значение. */
  rolled: number;

  /** Модификатор Телосложения со знаком, прибавленный к броску. */
  formattedModifier: string;

  /** Восстановленные хиты за кость (не меньше нуля). */
  restored: number;
}
