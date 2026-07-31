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

/** Прирост максимума хитов за один уровень. */
export interface CharacterLevelHitPoints {
  /** Уровень, на котором получен прирост. */
  level: number;

  /** Сколько максимума хитов дал уровень. */
  amount: number;
}

/** Здоровье персонажа. */
export interface CharacterHealth {
  /** Текущие хиты. */
  current: number;

  /** Максимум хитов. */
  max: number;

  /** Временные хиты. */
  temporary: number;

  /**
   * Прирост максимума за каждый уровень: при снижении уровня из максимума
   * снимается ровно то, что этот уровень дал. Уровни без записи (лист собран
   * до появления учёта или уровень взят без известной кости хитов) максимум
   * не двигают.
   */
  levelGains: CharacterLevelHitPoints[];
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

/** Вид отдыха, восстанавливающего ресурсы и ячейки. */
export type ResourceRecovery = 'short-rest' | 'long-rest';

/** Сколько зарядов возвращает отдых: ничего, все или заданное число. */
export type ResourceRecoveryMode = 'none' | 'all' | 'amount';

/** Восстановление ресурса на одном виде отдыха. */
export interface ResourceRecoveryRule {
  mode: ResourceRecoveryMode;

  /** Число возвращаемых зарядов; учитывается только при режиме `amount`. */
  amount: number;
}

/** Ресурс класса (счётчик). */
export interface CharacterClassResource {
  id: string;
  name: string;

  /** Короткая подпись для строки на листе (например, «НС»). */
  shortLabel: string;

  /** Что возвращает короткий отдых. */
  shortRest: ResourceRecoveryRule;

  /** Что возвращает продолжительный отдых. */
  longRest: ResourceRecoveryRule;

  current: number;
  max: number;
}

/** Правило восстановления ресурса как поле формы и строка панели. */
export interface ResourceRecoveryField {
  /** Ключ правила в ресурсе класса. */
  key: 'shortRest' | 'longRest';

  /** Вид отдыха, к которому относится правило. */
  rest: ResourceRecovery;
}

/** Компактная пометка восстановления ресурса в строке панели листа. */
export interface ClassResourceRecoveryBadge {
  /** Вид отдыха — он же ключ строки. */
  rest: ResourceRecovery;

  icon: string;

  /** Короткая подпись: «все» или число зарядов. */
  text: string;

  /** Подсказка целиком: «Короткий отдых: 1 заряд». */
  hint: string;
}

/** Класс доспеха персонажа. */
export interface CharacterArmorClass {
  /** Базовое значение КД без модификатора характеристики. */
  base: number;

  /**
   * Характеристики, чьи модификаторы прибавляются к КД; пустой список — без
   * модификаторов. По правилам это Ловкость, но безброневая защита варвара и
   * монаха и песнь клинка добавляют вторую характеристику.
   */
  abilities: AbilityKey[];

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

  /**
   * Урон свойства «Универсальное» — кость побольше, если взять оружие двумя
   * руками; null — свойства у оружия нет (или лист сохранён до его появления).
   */
  versatileDamage: InventoryWeaponDamage | null;
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

/** Группа костей урона одного номинала («2к6»). */
export interface DamageDiceGroup {
  /** Количество костей. */
  count: number;

  /** Номинал кости (6 — к6). */
  faces: number;
}

/**
 * Исходные данные броска урона для модалки настройки. Собирается и из оружия,
 * и из заклинания: модалка не знает, откуда пришёл бросок, — ей нужны кости,
 * бонусы и характеристика, чтобы дать их поменять.
 */
export interface DamageRollSource {
  /** Нотация костей базового урона без бонусов («1к8», «8к6»). */
  diceNotation: string;

  /** Бонус урона, не зависящий от характеристики (собственный бонус оружия). */
  flatBonus: number;

  /** Характеристика, чей модификатор идёт в урон; null — модификатора нет. */
  ability: AbilityKey | null;

  /** Сколько раз модификатор характеристики входит в базовый урон. */
  abilityModifierCount: number;

  /** Название типа урона («Рубящий»); пустая строка — тип не указан. */
  typeLabel: string;
}

/** Вклад одной характеристики в класс доспеха. */
export interface ArmorClassAbilityBonus {
  /** Характеристика, чей модификатор идёт в КД. */
  ability: AbilityKey;

  /** Модификатор характеристики. */
  modifier: number;
}

/** Разбор итогового класса доспеха для модалки настройки. */
export interface ArmorClassBreakdown {
  /** Итоговое значение КД. */
  value: number;

  /** Взято ручное значение (режим «Использовать своё»). */
  custom: boolean;

  /** Название учтённой брони; null — без брони (безброневой КД). */
  bodyArmorName: string | null;

  /**
   * КД тела: лучшая надетая броня либо безброневой `10 + Ловкость`. В ручном
   * режиме — само базовое значение, без модификаторов характеристик: они идут
   * отдельными строками в `extraAbilities`.
   */
  bodyArmorValue: number;

  /** Фактически применённый бонус Ловкости. */
  dexBonus: number;

  /** Модификатор Ловкости был урезан правилом брони. */
  dexCapped: boolean;

  /** Бонус к КД от надетого щита; 0 — щита нет. */
  shieldBonus: number;

  /**
   * Характеристики КД, кроме Ловкости: их модификаторы идут сверх доспеха, ведь
   * правило доспеха ограничивает только Ловкость. В ручном режиме — все
   * выбранные характеристики.
   */
  extraAbilities: ArmorClassAbilityBonus[];
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

/**
 * Владение инструментом. В отличие от прочих владений хранится не строкой:
 * инструменты живут в разделе «Предметы», и ссылка на предмет нужна, чтобы
 * открыть его описание в дровере прямо из листа.
 */
export interface CharacterToolProficiency {
  /** Подпись инструмента (она же попадает в PDF). */
  name: string;

  /**
   * Относительный url предмета каталога (`thieves-tools-phb`); null —
   * инструмента нет на сайте (свой инструмент игрока) либо он не распознан.
   */
  url: string | null;
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
  tools: CharacterToolProficiency[];

  /** Языки. */
  languages: string[];
}

/** Ключ группы владений персонажа. */
export type ProficiencyGroupKey = keyof CharacterProficiencies;

/** Ключ группы владений, хранящейся плоским списком названий. */
export type PlainProficiencyGroupKey = Exclude<ProficiencyGroupKey, 'tools'>;

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

/**
 * Признак оружия, которым проза владений класса сужает группу: «воинское оружие
 * со свойством фехтовальное или лёгкое» (плут), «воинское рукопашное» (друид).
 */
export type WeaponTraitKey = 'finesse' | 'light' | 'melee' | 'ranged';

/** Ключ группы каталога инструментов (категория раздела «Предметы»). */
export type ToolProficiencyGroupKey =
  | 'artisan'
  | 'gaming'
  | 'musical'
  | 'other';

/** Запись каталога инструментов: подпись и ссылка на предмет раздела. */
export interface ToolCatalogEntry {
  name: string;

  /** url предмета каталога — по нему открывается описание. */
  url: string;
}

/**
 * Группа каталога инструментов для модалки владения. Своего списка инструментов
 * у листа нет: группы целиком собираются из раздела «Предметы».
 */
export interface ToolCatalogGroup {
  key: ToolProficiencyGroupKey;
  title: string;

  /** Виды инструментов группы. */
  items: ToolCatalogEntry[];
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

  /** Заклинания вида и происхождения с уровнем, на котором они открываются. */
  innateSpells: CharacterInnateSpell[];
}

/** Врождённое заклинание и минимальный уровень персонажа для его получения. */
export interface CharacterInnateSpell {
  spell: CharacterSpell;
  requiredLevel: number;
}

/** Черновик особенности или умения в форме создания своего вида или класса. */
export interface CustomFeatureDraft {
  /**
   * Идентификатор строки формы; он же становится частью id особенности листа,
   * поэтому две особенности с одинаковым названием не схлопываются.
   */
  id: string;

  name: string;

  /** Описание в хранимой разметке редактора. */
  description: string;
}

/**
 * Черновик строки «тип + дистанция» в форме своего вида: передвижение и зрение
 * заводятся по одному нужному типу, а не всем списком сразу.
 */
export interface DistanceRowDraft {
  /** Идентификатор строки формы; он же ключ списка. */
  id: string;

  /**
   * Тип передвижения или зрения. Строкой, а не объединением ключей: строки
   * общие для обоих списков, а сужение до точного набора делают
   * `buildSpeedValuesFromRows` и `buildVisionValuesFromRows`.
   */
  key: string;

  /** Дистанция в футах. */
  value: number;
}

/** Выбранный класс персонажа. */
/**
 * Выданное источником стартовое снаряжение — то, что снимается с листа при
 * смене класса или предыстории. Без этой записи повторный выбор копил бы
 * предметы и монеты: инвентарь, в отличие от умений и владений, источник не
 * переписывает целиком (купленное игроком должно остаться на месте).
 */
export interface GrantedStartingEquipment {
  /** Строки инвентаря с выданным количеством. */
  items: Array<{ id: string; quantity: number }>;

  /** Выданное количество монет; 0 — монет не было. */
  coins: number;

  /** Денежная единица выданных монет. */
  coinKey: CurrencyKey;
}

/** Стартовое снаряжение к выдаче листу: готовые предметы и монеты варианта. */
export interface StartingEquipmentGrant {
  items: CharacterInventoryItem[];
  coins: number;
  coinKey: CurrencyKey;
}

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

  /**
   * Прогрессия числа подготовленных заклинаний из таблицы класса и подкласса;
   * пусто — класс подготовку не считает либо лист сохранён до появления поля
   * (тогда число подготовленных заклинаний задаётся вручную).
   */
  preparedSpells: PreparedSpellsScaling[];

  /**
   * Выданное классом стартовое снаряжение (для снятия при смене класса);
   * null — не выдавалось, в том числе у листов, сохранённых до появления поля.
   */
  startingEquipment: GrantedStartingEquipment | null;
}

/** Число подготовленных заклинаний, доступное с указанного уровня. */
export interface PreparedSpellsScaling {
  /** Уровень персонажа, с которого действует значение. */
  level: number;

  /** Сколько заклинаний можно подготовить начиная с этого уровня. */
  value: number;
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

  /**
   * Выданное предысторией стартовое снаряжение (для снятия при её смене);
   * null — не выдавалось, в том числе у листов, сохранённых до появления поля.
   */
  startingEquipment: GrantedStartingEquipment | null;
}

/** Происхождение особенности персонажа; none — добавлена вручную без источника. */
export type FeatureOrigin = 'species' | 'lineage' | 'class' | 'feat' | 'none';

/**
 * Группа отбора особенностей по источнику: подвид отбирается вместе с видом —
 * отдельного чипа под него на вкладке нет.
 */
export type FeatureOriginGroup = Exclude<FeatureOrigin, 'lineage'>;

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

  /**
   * Уровень класса, на котором получена особенность; null — уровень не при чём
   * (особенность вида, черта, ручная запись) либо лист собран до учёта уровней.
   * По нему снятие уровня забирает ровно те умения, которые эти уровни дали.
   */
  level: number | null;

  /** Выбор игрока в особенности (например, цвет драконорождённого). */
  choice: string | null;
}

/** Отбор особенностей на вкладке особенностей. */
export interface FeatureTabFilter {
  /** Отобранные группы источников; пусто — список не сужается. */
  origins: FeatureOriginGroup[];
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

  /** Описание в разметке сайта (строки и блочные узлы верхнего уровня). */
  description: FeatureDescriptionNode[];
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

  /**
   * Заклинание подготовлено (помечено значком на вкладке); нет у записей,
   * добавленных до этого поля. Заговоры и врождённые заклинания подготовки не
   * требуют, поэтому флага у них не бывает.
   */
  prepared?: boolean;

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

/**
 * Разбор одного броска урона заклинания из формул справочника
 * (`8к6@dmg.fire`). Модификаторы характеристик в урон заклинания сами по себе
 * не идут, поэтому формула — это то, что записал справочник.
 */
export interface SpellDamage {
  /** Формула броска для дайс-роллера («8к6»). */
  formula: string;

  /**
   * Нотация костей урона до подстановки модификатора заклинательной
   * характеристики («8к6»): модалка настройки подставляет его сама, чтобы дать
   * выбрать другую характеристику.
   */
  diceNotation: string;

  /** Сколько раз модификатор заклинательной характеристики входит в формулу. */
  abilityModifierCount: number;

  /** Названия типов урона через «/» («Огненный»); '' — тип не распознан. */
  typeLabel: string;

  /**
   * Условие, при котором катится именно этот бросок («Цель с полными хитами»);
   * '' — условия нет. У заклинания бывает несколько взаимоисключающих формул.
   */
  conditionLabel: string;
}

/** Бросок урона заклинанием со всем, что нужно окну настройки и накладыванию. */
export interface SpellDamageRoll {
  /** Заголовок окна настройки («Урон: Огненный шар»). */
  title: string;

  /** Разбор броска урона. */
  damage: DamageRollSource;

  /** Круг заклинания: при броске тратится его ячейка. */
  level: number;
}

/** Группа заклинаний одного круга для списка с разделителями. */
export interface CharacterSpellGroup {
  level: number;
  label: string;
  spells: CharacterSpell[];
}

/** Отбор заклинаний на вкладке заклинаний. */
export interface SpellTabFilter {
  /** Показывать только подготовленные заклинания. */
  preparedOnly: boolean;

  /** Отобранные круги заклинаний; пусто — круги не сужаются. */
  levels: number[];
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

/**
 * Начальный выбор фильтров каталога заклинаний по персонажу: круги, доступные
 * на его уровне класса, и сам класс. Считается от листа, поэтому смена уровня
 * или класса сразу меняет и пресет.
 */
export interface SpellCatalogPreset {
  /** Доступные круги (0 — заговоры); пусто — класс заклинаний не даёт. */
  levels: number[];

  /** Слаг класса (он же id значения фильтра `className`); '' — класса нет. */
  classUrl: string;
}

/** Настройки заклинательства персонажа. */
export interface CharacterSpellcasting {
  /**
   * Заклинательная характеристика; null — авто (определяется по классу
   * персонажа).
   */
  ability: AbilityKey | null;

  /** Настройка числа подготовленных заклинаний. */
  prepared: CharacterPreparedSpells;
}

/** Настройка числа подготовленных заклинаний. */
export interface CharacterPreparedSpells {
  /**
   * Своё число подготовленных заклинаний; null — считается по таблице класса.
   */
  custom: number | null;

  /** Бонус к числу из таблицы класса (в режиме подсчёта по классу). */
  bonus: number;
}

/** Разбор числа подготовленных заклинаний для вкладки и модалки настройки. */
export interface PreparedSpellsBreakdown {
  /**
   * Итоговое число подготовленных заклинаний; null — не определено (класс его
   * не считает, а своё значение не задано).
   */
  value: number | null;

  /** Сколько заклинаний книги отмечено подготовленными сейчас. */
  count: number;

  /** Число из таблицы класса на текущем уровне; null — класс его не даёт. */
  classValue: number | null;

  /** Взято своё число: подсчёт по таблице класса выключен. */
  custom: boolean;

  /** Бонус к числу из таблицы класса. */
  bonus: number;
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

  /**
   * Свой бонус мастерства сверх бонуса по уровню (0 — нет). Складывается с
   * бонусом по уровню везде, где тот участвует: спасброски, навыки, атака
   * оружием, заклинательство.
   */
  customProficiencyBonus: number;

  /** Свой бонус к инициативе сверх модификатора Ловкости (0 — нет). */
  customInitiativeBonus: number;
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

  /** Число подготовленных заклинаний с разбором его источников. */
  prepared: PreparedSpellsBreakdown;
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

  /** Описание в разметке сайта (строки и блочные узлы верхнего уровня). */
  description: FeatureDescriptionNode[];
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

  innateSpells: CharacterInnateSpell[];
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

  /** Умение даёт выбор одной черты категории «Боевой стиль». */
  fightingStyleChoice: boolean;

  /**
   * Умение даёт выбор черты за улучшение характеристик (D&D 2024 «Улучшение
   * характеристик»): игрок берёт черту, а черта «Улучшение характеристик» ещё и
   * распределяет прибавки к характеристикам.
   */
  abilityImprovement: boolean;

  /**
   * Уровни повторного получения умения из таблицы прогрессии: справочник даёт
   * умение один раз, а повторы (у улучшения характеристик — 6, 8, 12 …) кладёт
   * в `scaling`.
   */
  scalingLevels: number[];
}

/** Колонка таблицы прогрессии класса (для вывода ресурсов). */
export interface ClassTableColumn {
  name: string;

  /** Когда восстанавливается ресурс; NONE — колонка не является ресурсом. */
  resourceRecovery: ClassResourceRecovery;

  /** Значения колонки по уровням. */
  scaling: Array<{ level: number; value: string }>;
}

/** Позиция варианта стартового снаряжения класса или предыстории. */
export interface StartingEquipmentItem {
  /** Слаг предмета в разделе «Предметы»; '' — позиции нет в каталоге. */
  url: string;

  /** Название позиции. */
  name: string;

  /** Уточнение из ответа (например, «по истории»); '' — нет. */
  hint: string;

  /** Количество штук. */
  quantity: number;
}

/**
 * Вариант стартового снаряжения («А», «Б», …) класса или предыстории: набор
 * предметов и монеты, которые персонаж получает, выбрав именно его.
 */
export interface StartingEquipmentOption {
  /** Метка варианта из ответа («А»); служит и значением переключателя. */
  label: string;

  items: StartingEquipmentItem[];

  /** Количество монет варианта; 0 — монет нет. */
  coins: number;

  /** Денежная единица монет варианта. */
  coinKey: CurrencyKey;
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

  /** Варианты стартового снаряжения; пустой список — справочник их не даёт. */
  startingEquipment: StartingEquipmentOption[];
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

  /**
   * Группы каталога инструментов, из которых идёт выбор («один вид ремесленных
   * инструментов»); пусто — выбор из всего каталога. Только для `kind: 'tool'`.
   */
  toolGroups?: ToolProficiencyGroupKey[];
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

/** Строка умения класса в карточке визарда. */
export interface ClassFeatureRow {
  /** Идентификатор умения на листе (`class:<key>`). */
  id: string;

  name: string;

  /** Уровень получения умения. */
  level: number;

  description: FeatureDescriptionNode[];

  /** Подпись источника («Класс: Бард», «Подкласс: Коллегия знаний»). */
  originLabel: string;

  /** Распознанный выбор внутри умения; null — свободный текст. */
  choice: ClassChoice | null;

  /** Умение даёт выбор черты за улучшение характеристик. */
  abilityImprovement: boolean;
}

/** Опция черты для выбора за классовое улучшение характеристик. */
export interface FeatSelectOption {
  url: string;
  name: string;

  /** Категория черты (`GENERAL`, `ORIGIN`, `FIGHTING_STYLE`, …). */
  category: string;

  /** Подпись источника черты; '' — не задан. */
  sourceLabel: string;

  /** Черту можно брать несколько раз. */
  repeatability: boolean;

  /** Характеристики, среди которых распределяется прибавка; пусто — черта их не даёт. */
  abilities: AbilityKey[];

  /** Сколько +1 к характеристикам даёт черта (у «Улучшения характеристик» — 2); 0 — не даёт. */
  abilityIncreaseCount: number;
}

/** Выбор черты за классовое улучшение характеристик на шаге мастера. */
export interface LevelUpFeatChoice {
  /** URL выбранной черты; '' — не выбрана. */
  featUrl: string;

  /** Характеристики для улучшения (по одному +1 за элемент; null — слот не заполнен). */
  abilities: (AbilityKey | null)[];
}

/** Черновик одного шага мастера повышения уровня — один взятый уровень. */
export interface LevelUpStepDraft {
  /** Уровень, который берётся на этом шаге. */
  level: number;

  /** Способ прироста максимума хитов за уровень. */
  gainMode: HitPointsGainMode;

  /** Результат броска кости хитов; null — в режиме броска кость ещё не брошена. */
  roll: HitDieRollResult | null;

  /** Значения пикеров по идентификатору выбора. */
  selections: Record<string, string[]>;

  /** Свободный текст выбора по идентификатору умения. */
  notes: Record<string, string>;

  /** Выбор черты за улучшение характеристик по идентификатору умения. */
  featChoices: Record<string, LevelUpFeatChoice>;
}

/** Шаг мастера повышения уровня, готовый к отрисовке. */
export interface LevelUpStepView {
  /** Порядковый номер шага с нуля. */
  index: number;

  level: number;

  /** Умения класса и подкласса, которые даёт этот уровень. */
  features: ClassFeatureRow[];

  /** На этом шаге выбирается подкласс. */
  isSubclassStep: boolean;

  /** Прирост максимума хитов по текущему выбору шага. */
  hitPointsGain: number;
}

/** Итог мастера повышения уровня для применения к листу. */
export interface LevelUpPayload {
  level: number;

  /** Суммарный опыт персонажа. */
  experience: number;

  /** Прирост максимума хитов за каждый взятый уровень по порядку. */
  hitPointsGains: number[];

  /** Умения взятых уровней (и подкласса, если он выбран в мастере). */
  features: CharacterFeature[];

  /** Ресурсы класса, пересчитанные на новый уровень. */
  classResources: CharacterClassResource[];

  /**
   * Прогрессия подготовленных заклинаний класса и подкласса: мастер грузит
   * деталь класса, поэтому обновляет её и у листов, сохранённых без неё.
   */
  preparedSpells: PreparedSpellsScaling[];

  /** Выбранный в мастере подкласс; null — подкласс не менялся. */
  subclass: {
    url: string;
    name: string;
    casterType: CasterType | null;
  } | null;

  /** Навыки, выбранные в умениях уровней. */
  skills: { proficient: string[]; expertise: string[] };

  /** Языки, выбранные в умениях уровней. */
  languages: string[];

  /**
   * Прибавки к характеристикам от выбранных за улучшение характеристик черт.
   * Применяются с потолком в 20 (значение выше 20 выбор не поднимает).
   */
  abilityIncreases: Partial<Record<AbilityKey, number>>;
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

  /** Фиксированные инструменты со ссылками каталога (применяются как есть). */
  toolFixed: CharacterToolProficiency[];

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

  /** Варианты стартового снаряжения; пустой список — справочник их не даёт. */
  startingEquipment: StartingEquipmentOption[];
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
   * Универсальное оружие взято двумя руками — урон катится по большей кости.
   * У остального снаряжения хват значения не имеет и остаётся false.
   */
  twoHanded: boolean;

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

  /**
   * Магический предмет — попадает в группу «Магические предметы» независимо от
   * вида; параметры оружия и доспеха при этом сохраняются.
   */
  magic: boolean;

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

/** Варианты группировки каталога магических предметов в модалке добавления. */
export type MagicItemCatalogGrouping = 'RARITY' | 'CATEGORY' | 'NONE';

/** Порядок предметов внутри группы каталога: выбора нет, только по названию. */
export type MagicItemCatalogSorting = 'NAME';

/** Группа каталога магических предметов для списка с разделителями. */
export interface MagicItemCatalogGroup<TItem extends MagicItemCatalogItem> {
  /** Значение поля группировки; '' — предметы без значения. */
  key: string;

  /** Подпись разделителя; '' — разделитель не нужен (без группировки). */
  label: string;

  items: TItem[];
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

/** Заметка игрока на листе персонажа. */
export interface CharacterNote {
  /** Идентификатор записи. */
  id: string;

  /** Заголовок заметки; пустой — заметка без названия. */
  title: string;

  /** Текст заметки в хранимой форме редактора `MarkupEditor`. */
  content: string;
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

  /** Заметки игрока отдельными записями. */
  notes: CharacterNote[];

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
  /** Максимум активных листов (серверный, зависит от действующей подписки). */
  limit: number;

  /**
   * Максимум активных листов по подписке; 0 — сервер поле не прислал. Равен
   * `limit`, когда подписка уже действует: по этому равенству и понятно,
   * предлагать её или нет.
   */
  subscriberLimit: number;

  /** Максимум листов в истории удалённых; 0 — сервер лимит не прислал. */
  historyLimit: number;

  /** Глубина истории по подписке; 0 — сервер поле не прислал. */
  subscriberHistoryLimit: number;

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
  /** Максимум сохранённых ссылок (серверный, зависит от действующей подписки). */
  limit: number;

  /**
   * Максимум сохранённых ссылок по подписке; 0 — сервер поле не прислал. Равен
   * `limit`, когда подписка уже действует.
   */
  subscriberLimit: number;

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

  /** Характеристика навыка: модалка броска даёт подменить её на другую. */
  ability: AbilityKey;

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
