import type { CasterType, ClassResourceRecovery } from '~classes/model';
import type { MagicItemBonuses } from '~magic-items/model';
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
  /**
   * Общий уровень персонажа, на котором получен прирост. Пометка для чтения
   * человеком: снятие идёт по классу и порядку записей, а не по этому номеру —
   * у мультикласса уровни разных классов берутся вперемешку.
   */
  level: number;

  /** Сколько максимума хитов дал уровень. */
  amount: number;

  /**
   * URL класса, за уровень в котором получен прирост; null — класс неизвестен
   * (лист сохранён до появления поля либо прирост записан вручную). Нужен, чтобы
   * удаление класса и понижение его уровня вернули ровно свой максимум.
   */
  classUrl: string | null;
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

  /**
   * Уровень истощения (PHB 2024): от 0 (истощения нет) до 6 (персонаж
   * умирает). Листы, собранные до появления учёта, читаются с нулём.
   */
  exhaustion: number;
}

/** Что даёт персонажу текущий уровень истощения (PHB 2024). */
export interface CharacterExhaustionEffects {
  /** Уровень истощения в допустимых границах. */
  level: number;

  /** Насколько снижены все проверки к20 (число вычитается из броска). */
  d20Penalty: number;

  /** На сколько футов снижена скорость. */
  speedPenalty: number;

  /** Уровень смертельный: персонаж умирает. */
  isLethal: boolean;
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
   * Свой предел бонуса Ловкости от надетого доспеха вместо правила доспеха
   * (средний — не больше +2, тяжёлый — без Ловкости); null — по правилу.
   * Нужен умениям вроде «Воин в средних доспехах» и своим доспехам.
   */
  dexLimit: number | null;

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

/**
 * Дополнительный урон предмета: кости своего типа поверх основного броска
 * («2к6 огнём» Огненного языка). Собственного бонуса у него нет — плоскую
 * надбавку предмет даёт основным уроном.
 */
export interface InventoryExtraDamage {
  /** Количество костей дополнительного урона. */
  diceCount: number;

  /** Количество граней кости дополнительного урона (6 — к6). */
  diceFaces: number;

  /** Тип дополнительного урона (`FIRE`); пустая строка — не указан. */
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

  /**
   * Бонус к броску атаки сверх мастерства и характеристики: его даёт магия
   * оружия (меч +1). 0 — обычное оружие.
   */
  attackBonus: number;

  /** Урон оружия; null — справочник его не отдал. */
  damage: InventoryWeaponDamage | null;

  /**
   * Урон свойства «Универсальное» — кость побольше, если взять оружие двумя
   * руками; null — свойства у оружия нет (или лист сохранён до его появления).
   */
  versatileDamage: InventoryWeaponDamage | null;

  /**
   * Дополнительный урон предмета — кости своего типа поверх основного броска;
   * null — предмет его не даёт.
   */
  extraDamage: InventoryExtraDamage | null;
}

/** Разбор бонуса атаки оружием. */
export interface WeaponAttack {
  /** Итоговый бонус к броску атаки. */
  value: number;

  /** Характеристика, от которой считается атака. */
  ability: AbilityKey;

  /** Собственный бонус оружия (магия); 0 — обычное оружие. */
  weaponBonus: number;
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

  /** Нотация дополнительного урона предмета («2к6»); '' — его нет. */
  extraNotation: string;

  /** Название типа дополнительного урона («Огонь»); '' — не указан. */
  extraTypeLabel: string;
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

  /**
   * Полный модификатор Ловкости персонажа (0 — Ловкость в КД не идёт): с ним
   * сравнивается применённый бонус, когда доспех или свой предел его урезали.
   */
  dexModifier: number;

  /** Модификатор Ловкости был урезан правилом брони или своим пределом листа. */
  dexCapped: boolean;

  /** Ловкость урезал свой предел листа, а не правило брони. */
  dexLimited: boolean;

  /** Бонус к КД от надетого щита; 0 — щита нет. */
  shieldBonus: number;

  /**
   * Сумма плоских бонусов к КД от надетых предметов без брони (плащ и кольцо
   * защиты складываются друг с другом); 0 — таких предметов нет.
   */
  itemBonus: number;

  /**
   * Сумма постоянных прибавок к КД от черт листа; 0 — таких черт нет. Идёт и в
   * ручном режиме: прибавка черты не зависит от того, откуда взята основа.
   */
  featBonus: number;

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

/**
 * Способы передвижения, которые черта выдаёт: полёт, лазание и плавание.
 * Ходьбе черта только прибавляет, а норы в её механике нет вовсе.
 */
export type FeatGrantedSpeedKey = Exclude<SpeedTypeKey, 'walk' | 'burrow'>;

/** Изменение скоростей чертами листа, приведённое к его единицам измерения. */
export interface FeatSpeedModifiers {
  /** Прибавка к скорости ходьбы; 0 — черты ходьбу не ускоряют. */
  walkBonus: number;

  /**
   * Скорости, выданные чертой числом: это само значение, а не прибавка к своей
   * скорости персонажа («Дар совершенного полёта» — полёт 40). 0 — черта такой
   * скорости не даёт.
   */
  granted: Record<FeatGrantedSpeedKey, number>;

  /** Способы передвижения, приравненные чертой к скорости ходьбы. */
  equalsWalk: Record<FeatGrantedSpeedKey, boolean>;
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

/**
 * Вид своего бонуса: модификатор характеристики, число или бонус мастерства.
 * Последний, в отличие от числа, растёт с уровнем — им описан «Бдительный»,
 * прибавляющий бонус мастерства к инициативе.
 */
export type CustomBonusKind = 'ability' | 'flat' | 'proficiency';

/**
 * Источник своего бонуса одним значением — для селектора, где число, бонус
 * мастерства и характеристики стоят в общем списке: `flat` и `proficiency`
 * отвечают одноимённым видам, ключ характеристики — виду `ability`.
 */
export type CustomBonusSource = AbilityKey | 'flat' | 'proficiency';

/**
 * Источник ОСНОВЫ значения (инициативы): характеристика либо своё число. Бонус
 * мастерства сюда не входит — он бывает прибавкой сверх основы
 * («Бдительный»), а не самой основой броска.
 */
export type CustomBonusBaseSource = AbilityKey | 'flat';

/**
 * Источник основы бонуса мастерства: расчёт по уровню персонажа либо своё
 * число вместо него.
 */
export type ProficiencyBaseSource = 'level' | 'flat';

/**
 * Своя прибавка сверх правил (предмет, умение, эффект): бонус навыка, бонус
 * мастерства листа, бонус инициативы. Запись хранит оба источника разом —
 * характеристику и число: в счёт идёт тот, что выбран видом, а второй ждёт
 * переключения, и введённое не теряется, пока игрок примеряет бонус.
 */
export interface CharacterCustomBonus {
  /** Идентификатор записи: ключ списка и адрес правки. */
  id: string;

  /** Что даёт бонус: модификатор характеристики или своё число. */
  kind: CustomBonusKind;

  /** Характеристика-источник (для вида `ability`). */
  ability: AbilityKey;

  /** Своё число (для вида `flat`). */
  value: number;

  /** Пометка источника («Плащ ловкости»); пустая строка — без пометки. */
  label: string;
}

/**
 * Спасбросок персонажа. Записей всегда шесть — по одной на характеристику:
 * спасброски, в отличие от навыков, правилами закрыты, и своих игрок не заводит.
 */
export interface CharacterSavingThrow {
  /** Спасбросок какой характеристики: ключ записи и подпись строки. */
  key: AbilityKey;

  /**
   * Характеристика, чей модификатор идёт в спасбросок. По правилам совпадает с
   * `key`, но умения и предметы дают катить спасбросок от другой.
   */
  ability: AbilityKey;

  /** Персонаж владеет спасброском: в счёт идёт бонус мастерства. */
  proficient: boolean;

  /**
   * Свои бонусы спасброска сверх правил (пустой список — спасбросок считается
   * по правилам). Бонусы, общие для всех шести, живут отдельно — в
   * `commonSavingThrowBonuses` персонажа.
   */
  bonuses: CharacterCustomBonus[];
}

/** Навык персонажа. */
export interface CharacterSkill {
  name: string;
  ability: AbilityKey;
  proficiency: SkillProficiencyLevel;

  /**
   * Дополнительные бонусы навыка: складываются со значением по правилам и
   * попадают в пассивное значение. Пустой список — навык считается по правилам.
   */
  bonuses: CharacterCustomBonus[];
}

/**
 * Слагаемое значения для разбора: откуда взялась часть бонуса. Одинаково у
 * навыка и спасброска — обоим разбор нужен, чтобы итог сходился с подписью.
 */
export interface BonusBreakdownPart {
  /** Ключ строки разбора: часть по правилам или идентификатор бонуса. */
  id: string;

  /** Подпись источника («Ловкость», «Владение», пометка бонуса). */
  label: string;

  /** Вклад источника со знаком. */
  formattedValue: string;
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

/**
 * Набор владений, выданный источником. Мастерство оружием сюда не входит: его
 * выдают отдельные умения по одному виду, а не наборами.
 */
export interface GrantedProficiencies {
  armor: string[];
  weapons: string[];
  tools: CharacterToolProficiency[];
  languages: string[];

  /**
   * Названия навыков, которыми наделил источник. Лежат в журнале наравне с
   * прочим выданным, но применяются иначе: навык — не строка в списке владений,
   * а запись со своим уровнем (`CharacterSkill.proficiency`).
   */
  skills: string[];
}

/**
 * Запись журнала выдач: что именно выдал один источник. По ней снятие класса,
 * предыстории, вида или черты забирает ровно своё и не трогает ни чужого, ни
 * отмеченного игроком вручную.
 *
 * Устроено как `health.levelGains`: общий журнал листа с пометкой источника, а не
 * запись на самой сущности. Источников четыре, а журнал один — так снятие любого
 * из них считается одинаково.
 *
 * У листов, сохранённых до появления журнала, записей нет: там всё считается
 * отмеченным вручную и не снимается — ровно прежнее поведение.
 */
export interface ProficiencyGrant extends GrantedProficiencies {
  /**
   * Кто выдал: `class:<url>`, `background:<url>`, `species:<url>` либо
   * `feature:<id>` (у черты — идентификатор её записи, поэтому копии
   * повторяемой черты снимаются независимо).
   */
  source: string;
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

  /**
   * Уровень В ЭТОМ классе (1..20). Сумма уровней всех классов персонажа —
   * общий уровень (`Character.level`), по нему считаются бонус мастерства и опыт.
   */
  level: number;

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
   * Заклинательная характеристика класса: у мультикласса она своя у каждого
   * класса, поэтому и Сл спасброска с бонусом атаки считаются порознь.
   * null — определяется автоматически по названию класса.
   */
  spellcastingAbility: AbilityKey | null;

  /**
   * Прогрессия числа подготовленных заклинаний из таблицы класса и подкласса;
   * пусто — класс подготовку не считает либо лист сохранён до появления поля
   * (тогда число подготовленных заклинаний задаётся вручную).
   */
  preparedSpells: PreparedSpellsScaling[];

  /**
   * Прогрессия числа заговоров из таблицы класса и подкласса (колонка
   * «Заговоры»); пусто — колонки у класса нет либо лист сохранён до появления
   * поля (тогда число подготовленных заговоров задаётся вручную).
   */
  preparedCantrips: PreparedSpellsScaling[];

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

/**
 * Прибавка к максимуму хитов от черты. Итог:
 * `flat + perAcquisitionLevel × уровень взятия +
 * perLevelAfterAcquisition × (текущий уровень − уровень взятия)`. Из-за двух
 * последних слагаемых лист обязан помнить уровень, на котором черта взята
 * (`CharacterFeature.level`).
 */
export interface FeatureHitPointsModifier {
  /** Постоянная прибавка, не зависящая от уровня («Дар стойкости» — +40). */
  flat?: number;

  /** Прибавка за каждый уровень персонажа на момент взятия черты. */
  perAcquisitionLevel?: number;

  /** Прибавка за каждый уровень, полученный после взятия черты. */
  perLevelAfterAcquisition?: number;
}

/**
 * Постоянное изменение скоростей чертой, в футах. Ходьбе черта прибавляет
 * («Подвижный» — +10), а остальные скорости задаёт числом — это значение
 * скорости, а не прибавка к ней («Дар совершенного полёта» — полёт 40).
 */
export interface FeatureSpeedModifier {
  /** Прибавка к скорости ходьбы. */
  walkBonus?: number;

  /** Скорость полёта. */
  fly?: number;

  /** Скорость лазания. */
  climb?: number;

  /** Скорость плавания. */
  swim?: number;

  /** Скорость полёта равна итоговой скорости ходьбы (а не своему числу). */
  flyEqualsWalk?: boolean;

  /** Скорость лазания равна итоговой скорости ходьбы. */
  climbEqualsWalk?: boolean;

  /** Скорость плавания равна итоговой скорости ходьбы. */
  swimEqualsWalk?: boolean;
}

/** Чувство с дистанцией, выданное чертой. */
export interface FeatureSenseGrant {
  /** Код чувства из справочника (например, `DARKVISION`). */
  type?: string;

  /** Дистанция чувства в футах. */
  range?: number;
}

/** Сопротивления, иммунитеты и уязвимости к урону от черты. */
export interface FeatureDamageAffinity {
  /** Коды типов урона, к которым черта даёт сопротивление. */
  resistances?: string[];

  /** Коды типов урона, к которым черта даёт иммунитет. */
  immunities?: string[];

  /** Коды типов урона, к которым черта даёт уязвимость. */
  vulnerabilities?: string[];

  /** Ключ выбора типа урона, к которому даётся сопротивление. */
  resistanceFromChoiceKey?: string;
}

/**
 * Постоянные модификаторы листа от черты — снимок `mechanics.modifiers` из
 * справочника на момент взятия. Зеркало `FeatModifiers` из `~feats/model`, но
 * все поля необязательны: снимок хранится в документе листа и мог быть записан
 * версией справочника, где части полей ещё не было.
 *
 * Лист берёт снимок, а не ходит за механикой в справочник: черта на листе
 * должна считаться одинаково и в оффлайне, и после того, как запись черты в
 * каталоге поправят.
 */
export interface CharacterFeatureModifiers {
  hitPoints?: FeatureHitPointsModifier;
  speed?: FeatureSpeedModifier;

  /** Постоянная прибавка к КД. */
  armorClassBonus?: number;

  senses?: FeatureSenseGrant[];

  /** Дальность телепатии в футах. */
  telepathyRange?: number;

  damage?: FeatureDamageAffinity;
  conditionImmunities?: string[];

  /** Новый тип существа, если черта его меняет. */
  creatureType?: string;

  /** К броску инициативы прибавляется бонус мастерства («Бдительный»). */
  initiativeProficiencyBonus?: boolean;
}

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

  /**
   * Постоянные модификаторы листа от черты; null — черта лист не двигает.
   * Поля нет у записей, добавленных до появления механики черт, и у
   * особенностей вида, класса и заведённых вручную — им двигать лист нечем.
   */
  modifiers?: CharacterFeatureModifiers | null;

  /**
   * Владения, которые черта выдаёт без выбора; null — не выдаёт. Снимок, как и
   * `modifiers`: по нему сверка ведёт запись журнала выдач, а снятие черты
   * забирает ровно выданное.
   */
  proficiencies?: GrantedProficiencies | null;
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

  /**
   * Постоянные модификаторы листа из `mechanics.modifiers`; null — черта лист
   * не двигает либо механика у записи каталога не заполнена.
   */
  modifiers: CharacterFeatureModifiers | null;

  /**
   * Владения из `mechanics.proficiencies`, уже приведённые к справочнику листа
   * (категории справочника — к записям вида «Всё воинское оружие»); null —
   * черта владений не выдаёт.
   */
  proficiencies: GrantedProficiencies | null;
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
   * добавленных до этого поля. Заговоры подготавливаются наравне с остальными
   * заклинаниями, но считаются отдельным счётчиком (см. `PreparedSpellKind`).
   * У врождённых заклинаний вида отсчёт обратный: без флага запись считается
   * подготовленной (см. `isInnateSpellPrepared`), а места среди подготовленных
   * она не занимает.
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
  /** Показывать только подготовленные заклинания (вместе с заговорами). */
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
  /** Настройка числа подготовленных заклинаний (круги 1 и выше). */
  prepared: CharacterPreparedSpells;

  /** Настройка числа подготовленных заговоров (свой счётчик). */
  preparedCantrips: CharacterPreparedSpells;
}

/**
 * Вид подготовки: заговоры подготавливаются наравне с заклинаниями, но их число
 * задаёт своя колонка таблицы класса, поэтому счётчики идут порознь.
 */
export type PreparedSpellKind = 'spells' | 'cantrips';

/** Подписи блока и модалки подготовки, зависящие от её вида. */
export interface PreparedKindLabels {
  /**
   * Подпись плитки в шапке вкладки заклинаний: ряд узкий, поэтому она бывает
   * сокращённой — целиком слово остаётся в подсказке плитки.
   */
  stat: string;

  /** Подпись целиком: для подсказок, предупреждений и прочей прозы. */
  statFull: string;

  /** Значок плитки: на узком листе он остаётся вместо подписи. */
  icon: string;

  /** Подпись кнопки плитки для скринридера. */
  ariaLabel: string;

  /** Заголовок модалки настройки. */
  title: string;

  /** Подпись поля своего числа в модалке. */
  customValue: string;

  /** Пояснение модалки, когда класс числа не даёт. */
  unknownClassValue: string;

  /** Начало подсказки плитки: сколько уже подготовлено. */
  countHint: string;

  /** Подсказки плитки: откуда взялось число. */
  hints: Record<'auto' | 'custom' | 'unknown', string>;

  /** Заголовок предупреждения о достигнутом пределе. */
  limitToastTitle: string;
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

/**
 * Вид ячеек заклинаний: обычные ячейки и ячейки договора колдуна. По правилам
 * 2024 у мультикласса они существуют порознь — договор не входит в общий счёт
 * уровня заклинателя и возвращается коротким отдыхом.
 */
export type SpellSlotKind = 'standard' | 'pact';

/** Потраченные ячейки заклинаний одного круга. */
export interface CharacterSpellSlot {
  /** Круг ячеек (1..9). */
  level: number;

  /** Сколько ячеек круга потрачено. */
  used: number;

  /** Вид ячеек; листы до появления поля читаются как обычные. */
  kind: SpellSlotKind;
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

  /** Вид ячеек: обычные либо договор колдуна. */
  kind: SpellSlotKind;
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

/**
 * Настройки листа персонажа (правила подсчёта и вывода, общие для всего листа).
 */
export interface CharacterSettings {
  /**
   * Базовая характеристика бонуса атаки оружием; null — по умолчанию (Сила).
   * Фехтовальное и дальнобойное оружие всё равно бьёт от Ловкости.
   */
  weaponAttackAbility: AbilityKey | null;

  /**
   * Своё значение бонуса мастерства вместо расчёта по уровню; null — считать
   * по правилам.
   */
  customProficiencyBase: number | null;

  /**
   * Свои бонусы мастерства сверх основы (пустой список — нет). Складываются с
   * бонусом мастерства везде, где тот участвует: спасброски, навыки, атака
   * оружием, заклинательство.
   */
  customProficiencyBonuses: CharacterCustomBonus[];

  /**
   * Характеристика, чей модификатор идёт в инициативу; null — Ловкость по
   * правилам.
   */
  initiativeAbility: AbilityKey | null;

  /**
   * Своё значение основы инициативы вместо модификатора характеристики; null —
   * считать по правилам.
   */
  customInitiativeBase: number | null;

  /** Свои бонусы инициативы сверх основы (пустой список — нет). */
  customInitiativeBonuses: CharacterCustomBonus[];

  /**
   * Навыки в списке идут группами по своим характеристикам, а не общим списком
   * по алфавиту — как они уже напечатаны в PDF. Считается только характеристика
   * самого навыка: свои бонусы от других характеристик группу не задают.
   * Настройка вывода — значения навыков от неё не меняются.
   */
  groupSkillsByAbility: boolean;
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

  /**
   * Заклинательство по классам: у мультикласса характеристика своя у каждого
   * класса, поэтому Сл и бонус атаки считаются порознь. Пусто — классов на листе
   * нет; один класс — одна строка.
   */
  rows: SpellcastingClassRow[];

  /** Число подготовленных заклинаний с разбором его источников. */
  prepared: PreparedSpellsBreakdown;

  /** Число подготовленных заговоров с разбором его источников. */
  preparedCantrips: PreparedSpellsBreakdown;
}

/** Заклинательство одного класса персонажа (строка блока вкладки заклинаний). */
export interface SpellcastingClassRow {
  /** URL класса — по нему модалка настройки знает, чью характеристику менять. */
  classUrl: string;

  /** Название класса (без подкласса) — подпись строки. */
  className: string;

  /** Заклинательная характеристика класса; null — не определена. */
  ability: AbilityKey | null;

  /** Характеристика определена автоматически по классу (не задана вручную). */
  auto: boolean;

  /** Модификатор заклинательной характеристики; 0 — характеристика не определена. */
  abilityModifier: number;

  /** Сложность спасброска от заклинаний этого класса. */
  saveDc: number;

  /** Бонус на попадание атакой заклинанием этого класса. */
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
   * Выбор владения навыками, заданный у умения структурно: сколько навыков и из
   * какого пула. `null` — справочник его не задал, и выбор распознаётся по прозе
   * описания. Пустой пул означает выбор из всех навыков.
   */
  skillChoice: ClassFeatureSkillChoice | null;

  /**
   * Уровни повторного получения умения из таблицы прогрессии: справочник даёт
   * умение один раз, а повторы (у улучшения характеристик — 6, 8, 12 …) кладёт
   * в `scaling`.
   */
  scalingLevels: number[];
}

/** Структурный выбор владения навыками, заданный у умения в справочнике. */
export interface ClassFeatureSkillChoice {
  count: number;

  /** Навыки на выбор русскими названиями; пусто — выбор из всех навыков. */
  skills: string[];
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

  /**
   * Ключевые характеристики класса прозой («Харизма и Сила»): из них выводится
   * требование мультиклассирования — 13 в каждой.
   */
  primaryCharacteristics: string;

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

/** Повышение уровня в одном классе: с какого уровня на какой. */
export interface LevelUpTarget {
  /** URL класса, уровень в котором растёт. */
  classUrl: string;

  /** Нынешний уровень в классе. */
  from: number;

  /** Уровень в классе после повышения. */
  to: number;
}

/** Черновик одного шага мастера повышения уровня — один взятый уровень. */
export interface LevelUpStepDraft {
  /** URL класса, уровень в котором берётся на этом шаге. */
  classUrl: string;

  /** Уровень В КЛАССЕ, который берётся на этом шаге. */
  classLevel: number;

  /** Общий уровень персонажа после этого шага. */
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

  /** Общий уровень персонажа после этого шага. */
  level: number;

  /** URL класса, уровень в котором берётся на этом шаге. */
  classUrl: string;

  /** Название класса — подпись шага у мультикласса. */
  className: string;

  /** Уровень В КЛАССЕ, который берётся на этом шаге. */
  classLevel: number;

  /** Номинал кости хитов класса этого шага. */
  hitDie: number;

  /** Умения класса и подкласса, которые даёт этот уровень. */
  features: ClassFeatureRow[];

  /** На этом шаге выбирается подкласс. */
  isSubclassStep: boolean;

  /** Прирост максимума хитов по текущему выбору шага. */
  hitPointsGain: number;
}

/** Итог мастера повышения уровня для применения к листу. */
export interface LevelUpPayload {
  /** Суммарный опыт персонажа. */
  experience: number;

  /** Новые уровни классов по их URL — общий уровень считается их суммой. */
  classLevels: Record<string, number>;

  /** Прирост максимума хитов за каждый взятый уровень по порядку. */
  hitPointsGains: LevelUpHitPointsGain[];

  /** Изменения самих классов (подкласс, прогрессии подготовки) по их URL. */
  classPatches: Record<string, LevelUpClassPatch>;

  /** Умения взятых уровней (и подкласса, если он выбран в мастере). */
  features: CharacterFeature[];

  /** Ресурсы классов, пересчитанные на новые уровни. */
  classResources: CharacterClassResource[];

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

/**
 * Прирост максимума хитов за один взятый уровень. Класс нужен, чтобы понижение
 * его уровня и удаление класса вернули ровно свой максимум.
 */
export interface LevelUpHitPointsGain {
  /** URL класса, за уровень в котором получен прирост. */
  classUrl: string;

  /** Сколько максимума хитов дал уровень. */
  amount: number;
}

/** Изменения записи класса по итогу мастера повышения уровня. */
export interface LevelUpClassPatch {
  /** Выбранный в мастере подкласс; null — подкласс не менялся. */
  subclass: {
    url: string;
    name: string;
    casterType: CasterType | null;
  } | null;

  /**
   * Прогрессия подготовленных заклинаний класса и подкласса: мастер грузит
   * деталь класса, поэтому обновляет её и у листов, сохранённых без неё.
   */
  preparedSpells: PreparedSpellsScaling[];

  /** Прогрессия числа заговоров класса и подкласса (та же логика). */
  preparedCantrips: PreparedSpellsScaling[];
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
  equipment: FeatureDescriptionNode[];

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

/**
 * Заряды магического предмета: остаток и максимум. Максимум приходит из
 * каталога, остаток — состояние конкретного экземпляра на листе.
 */
export interface InventoryCharges {
  current: number;
  max: number;
}

/**
 * Куда бьёт бонус предмета. Цели с уточнением (характеристика, навык, скорость)
 * дополняются ключом в самой записи бонуса, остальные говорят сами за себя.
 */
export type InventoryBonusTargetKind =
  /** Значение характеристики (пояс силы великанов). */
  | 'ability'
  /** Проверки характеристики — само её значение при этом не меняется. */
  | 'ability-check'
  /** Проверки одного навыка (перчатки вора). */
  | 'skill'
  /** Спасбросок одной характеристики. */
  | 'saving-throw'
  /** Все шесть спасбросков сразу (плащ защиты). */
  | 'all-saving-throws'
  /** Одна скорость передвижения (сапоги скорости, крылатые сапоги). */
  | 'speed'
  /** Все скорости передвижения сразу. */
  | 'all-speeds'
  /** Класс доспеха. */
  | 'armor-class'
  /** Сложность спасброска от заклинаний персонажа. */
  | 'spell-save-dc'
  /** Бросок атаки заклинанием. */
  | 'spell-attack'
  /** Бонус инициативы. */
  | 'initiative';

/**
 * Пассивный бонус предмета листу: он работает, пока предмет надет (а если тот
 * требует настройки — пока персонаж на него настроен). Бонусы к попаданию и
 * урону сюда не входят: они принадлежат самому оружию (`InventoryWeapon`) и
 * работают, когда им бьют.
 */
export interface InventoryItemBonus {
  /** Устойчивый идентификатор записи: ключ строки формы и строки разбора. */
  id: string;

  /** Куда идёт прибавка. */
  kind: InventoryBonusTargetKind;

  /**
   * Уточнение цели: ключ характеристики (`strength`), ключ скорости (`fly`)
   * или название навыка. Пустая строка — цель уточнения не требует.
   */
  key: string;

  /** Величина прибавки; отрицательная — предмет проклят. */
  value: number;
}

/** Вариант цели бонуса для селектора формы. */
export interface InventoryBonusTargetOption {
  /** Составной идентификатор варианта (`kind:key`). */
  value: string;

  /** Подпись варианта («Спасбросок: Ловкость»). */
  label: string;
}

/** Группа вариантов цели бонуса — заголовок и его варианты. */
export interface InventoryBonusTargetGroup {
  label: string;
  items: InventoryBonusTargetOption[];
}

/** Вклад одного предмета в бонус листа — строка разбора значения. */
export interface InventoryBonusSource {
  /** Идентификатор предмета: ключ строки разбора. */
  id: string;

  /** Название предмета: подпись строки разбора. */
  name: string;

  /** Величина бонуса от этого предмета. */
  value: number;
}

/**
 * Состояние магического предмета на листе: настройка, включение и заряды.
 * Вынесено отдельным типом, потому что одинаково заводится у всех записей
 * инвентаря — и у каталожных, и у своих.
 */
export interface InventoryMagicState {
  /**
   * Предмет требует настройки (свойство каталога, не состояние игрока).
   * false — настраиваться не на что, и лист настройку не предлагает.
   */
  requiresAttunement: boolean;

  /** Персонаж настроен на предмет. */
  attuned: boolean;

  /**
   * Предмет включён вручную — для свойств, которые работают не постоянно
   * (зажжённый фонарь, поднятый щит из магии, активированный жезл).
   */
  active: boolean;

  /** Заряды предмета; null — зарядов у него нет. */
  charges: InventoryCharges | null;
}

/** Предмет инвентаря (добавлен из раздела «Предметы» или «Магические предметы»). */
export interface CharacterInventoryItem extends InventoryMagicState {
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

  /**
   * Плоский бонус к КД надетого предмета, который сам бронёй не является
   * (плащ и кольцо защиты). У магического доспеха и щита бонус входит в
   * `armor.baseArmorClass`, иначе он ломал бы правило «в зачёт идёт лучший».
   * 0 — предмет КД не добавляет.
   */
  armorClassBonus: number;

  /** Параметры оружия; заданы только у оружия раздела «Предметы». */
  weapon: InventoryWeapon | null;

  /**
   * Предмет надет: доспех и щит идут в автоподсчёт класса доспеха, плащ и
   * кольцо защиты добавляют свой плоский бонус, остальным магическим предметам
   * отметка нужна, чтобы включались их эффекты.
   */
  equipped: boolean;

  /**
   * Универсальное оружие взято двумя руками — урон катится по большей кости.
   * У остального снаряжения хват значения не имеет и остаётся false.
   */
  twoHanded: boolean;

  /**
   * Пассивные бонусы предмета листу (характеристики, навыки, спасброски,
   * скорости, заклинательство); пустой список — предмет их не даёт.
   */
  bonuses: InventoryItemBonus[];

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

  /** Универсальное оружие: второй бросок урона для хвата двумя руками. */
  versatile: boolean;

  /** Количество костей урона двумя руками (свойство «Универсальное»). */
  versatileDiceCount: number;

  /** Количество граней кости урона двумя руками (свойство «Универсальное»). */
  versatileDiceFaces: number;

  /** Бонус к броску атаки этим оружием (магия оружия); 0 — нет. */
  attackBonus: number;

  /** Количество костей дополнительного урона; 0 — его нет. */
  extraDamageDiceCount: number;

  /** Количество граней кости дополнительного урона. */
  extraDamageDiceFaces: number;

  /** Ключ типа дополнительного урона; '' — не указан. */
  extraDamageType: string;

  /**
   * Пассивные бонусы предмета: заводятся построчно, по одному на цель. Сюда же
   * попадает и бонус к классу доспеха (плащ и кольцо защиты, магия доспеха).
   */
  bonuses: InventoryItemBonus[];

  /** Предмет требует настройки — без неё его пассивные бонусы не работают. */
  requiresAttunement: boolean;

  /** Максимум зарядов предмета; 0 — зарядов у него нет. */
  maxCharges: number;

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

/**
 * Настройка грузоподъёмности листа: своё значение предела вместо расчёта по
 * правилам, размер для поправки и свой бонус сверху.
 */
export interface CharacterCarryingCapacity {
  /**
   * Размер, по которому берётся поправка (русская подпись); null — размер
   * персонажа. Нужен умениям вроде «Мощного телосложения»: существо считается
   * на категорию крупнее только для переносимого веса.
   */
  size: string | null;

  /**
   * Своё значение предела вместо расчёта по правилам (в фунтах); null —
   * считать по правилам.
   */
  custom: number | null;

  /**
   * Свой бонус к пределу в фунтах: складывается и со своим значением, и с
   * расчётом по правилам. Отрицательный — предел уменьшается.
   */
  bonus: number;
}

/** Разбор грузоподъёмности для модалки настройки. */
export interface CarryingCapacityBreakdown {
  /** Итоговый предел переносимого веса в фунтах (не меньше нуля). */
  value: number;

  /** Основа взята из своего значения, а не из расчёта по правилам. */
  custom: boolean;

  /** Значение Силы, от которого считается предел по правилам. */
  strength: number;

  /** Поправка на размер (множитель расчёта по правилам). */
  sizeMultiplier: number;

  /** Расчёт по правилам: Сила × 15 с поправкой на размер. */
  ruleValue: number;

  /** Свой бонус к пределу; 0 — бонуса нет. */
  bonus: number;
}

/** Настройка предела настройки на магические предметы. */
export interface CharacterAttunement {
  /**
   * Своё число настроенных предметов вместо подсчёта; null — считать основу по
   * правилам либо по характеристике.
   */
  custom: number | null;

  /**
   * Характеристика, чей модификатор идёт в основу предела (домашние правила и
   * умения вроде артифайсерских); null — основа по правилам (три предмета).
   */
  ability: AbilityKey | null;

  /**
   * Бонус к основе предела: складывается с подсчётом, но не со своим числом —
   * оно и есть предел целиком.
   */
  bonus: number;
}

/** Разбор предела настройки на предметы для плитки снаряжения и модалки. */
export interface AttunementBreakdown {
  /** Итоговый предел настроенных предметов (не меньше нуля). */
  value: number;

  /** Сколько предметов настроено сейчас. */
  count: number;

  /** Основа взята из своего числа, а не посчитана. */
  custom: boolean;

  /** Характеристика основы; null — основа по правилам. */
  ability: AbilityKey | null;

  /** Модификатор характеристики основы; 0 — характеристика не выбрана. */
  abilityModifier: number;

  /** Основа предела до бонуса: три предмета либо модификатор характеристики. */
  baseValue: number;

  /** Свой бонус к пределу; 0 — бонуса нет. */
  bonus: number;
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

/** Редкость магического предмета — значения справочника `/dictionaries/rarity`. */
export type MagicItemRarityKey =
  | 'COMMON'
  | 'UNCOMMON'
  | 'RARE'
  | 'VERY_RARE'
  | 'LEGENDARY'
  | 'ARTIFACT'
  | 'VARIES'
  | 'UNKNOWN';

/** Магический предмет из «сырого» ответа раздела (нужные листу поля). */
export interface MagicItemRawDetail {
  rarity: MagicItemRarityKey;

  /** Слаги немагических предметов, на основе которых сделан магический. */
  baseItemUrls: string[];

  /** Бонусы мастерской: к атаке, к урону и к КД. Нули — бонусов нет. */
  bonuses: MagicItemBonuses;

  /** Предмет требует настройки. */
  requiresAttunement: boolean;

  /** Максимум зарядов; 0 — зарядов у предмета нет. */
  maxCharges: number;
}

/** Справочные данные магического предмета, которых нет в ответе поиска. */
export interface MagicItemSummary {
  /** Редкость — по ней считается цена магии. */
  rarity: MagicItemRarityKey;

  /** Бонусы мастерской: к атаке, к урону и к КД. Нули — бонусов нет. */
  bonuses: MagicItemBonuses;

  /** Предмет требует настройки. */
  requiresAttunement: boolean;

  /** Максимум зарядов; 0 — зарядов у предмета нет. */
  maxCharges: number;

  /**
   * Деталь немагической основы: вес и боевые параметры магический предмет
   * берёт у неё. null — связи нет, их несколько или деталь не загрузилась.
   */
  baseItem: ItemSummary | null;
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

/** Ключ короткого поля вкладки «Личность». */
export type PersonalityFieldKey =
  | 'alignment'
  | 'age'
  | 'height'
  | 'weight'
  | 'eyes'
  | 'hair'
  | 'skin';

/** Ключ свободного поля «Личности» — всё, кроме мировоззрения из словаря. */
export type PersonalityTextFieldKey = Exclude<PersonalityFieldKey, 'alignment'>;

/** Свободное поле «Личности»: подпись плитки и подсказка ввода. */
export interface PersonalityTextField {
  key: PersonalityTextFieldKey;
  label: string;
  placeholder: string;
}

/** Плитка короткого поля на вкладке «Личность». */
export interface PersonalityFieldRow {
  key: PersonalityFieldKey;
  label: string;

  /** Значение поля либо прочерк, когда игрок его не заполнил. */
  value: string;

  /** Поле заполнено: прочерк показывается приглушённым. */
  filled: boolean;
}

/** Личность персонажа: приметы, мировоззрение и подробное описание. */
export interface CharacterPersonality {
  /** Мировоззрение (русская подпись словаря); '' — не выбрано. */
  alignment: string;

  /** Возраст; '' — не указан. */
  age: string;

  /** Рост; '' — не указан. */
  height: string;

  /** Вес; '' — не указан. */
  weight: string;

  /** Цвет глаз; '' — не указан. */
  eyes: string;

  /** Цвет волос; '' — не указан. */
  hair: string;

  /** Цвет кожи; '' — не указан. */
  skin: string;

  /** Подробное описание в хранимой форме редактора `MarkupEditor`; '' — пусто. */
  description: string;
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

  /**
   * Основной (первый) класс персонажа; null — не выбран. Он один даёт стартовое
   * снаряжение и максимум кости хитов на первом уровне.
   */
  characterClass: CharacterClass | null;

  /**
   * Дополнительные классы мультикласса (второй и далее). Пусто — обычный
   * одноклассовый персонаж.
   */
  additionalClasses: CharacterClass[];

  /** Предыстория персонажа; null — не выбрана. */
  characterBackground: CharacterBackground | null;

  /** Общий уровень персонажа — сумма уровней всех его классов. */
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

  /** Спасброски: владение, характеристика и свои бонусы каждого из шести. */
  savingThrows: CharacterSavingThrow[];

  /**
   * Свои бонусы ко всем спасброскам сразу (плащ защиты, аура паладина): идут в
   * каждый из шести сверх его собственных бонусов.
   */
  commonSavingThrowBonuses: CharacterCustomBonus[];

  skills: CharacterSkill[];
  health: CharacterHealth;

  /** Кости хитов из классов. */
  hitDice: CharacterHitDie[];

  /** Дополнительные кости хитов. */
  extraHitDice: CharacterExtraHitDie[];

  /** Ресурсы класса (счётчики с восстановлением на отдыхе). */
  classResources: CharacterClassResource[];

  proficiencies: CharacterProficiencies;

  /**
   * Журнал выдач владений: кто и что выдал. Сами владения лежат в
   * `proficiencies` одним списком, а выданные навыки — записями в `skills`;
   * журнал нужен только затем, чтобы снятие источника забрало ровно своё.
   */
  proficiencyGrants: ProficiencyGrant[];

  currency: CharacterCurrency;

  /** Пользовательские денежные единицы (сверх пяти стандартных). */
  customCurrencies: CharacterCustomCurrency[];

  inventory: CharacterInventoryItem[];

  /** Настройка грузоподъёмности (предел переносимого веса). */
  carryingCapacity: CharacterCarryingCapacity;

  /** Настройка предела настройки на магические предметы. */
  attunement: CharacterAttunement;

  /** Заметки игрока отдельными записями. */
  notes: CharacterNote[];

  /** Личность персонажа: приметы, мировоззрение и подробное описание. */
  personality: CharacterPersonality;

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
  | 'personality'
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

  /**
   * Сколько в значении характеристики дали предметы; 0 — значение записано в
   * листе как есть.
   */
  itemBonus: number;
}

/** Строка блока спасбросков. */
export interface SavingThrowRow {
  key: AbilityKey;
  label: string;

  /** Характеристика спасброска: модалка броска даёт подменить её на другую. */
  ability: AbilityKey;

  proficient: boolean;

  /** Числовое значение спасброска для броска кубов. */
  value: number;

  formattedValue: string;

  /**
   * Разбор значения для подсказки; null — спасбросок считается по правилам, и
   * объяснять в блоке нечего.
   */
  bonusHint: string | null;
}

/** Строка списка навыков. */
export interface SkillRow {
  name: string;

  /** Характеристика навыка: модалка броска даёт подменить её на другую. */
  ability: AbilityKey;

  /**
   * Характеристики, которые дают навыку свои бонусы (вид «модификатор
   * характеристики»), кроме характеристики самого навыка. Список пуст, когда
   * навык считается только от неё.
   */
  bonusAbilities: AbilityKey[];

  abilityLabel: string;
  proficiency: SkillProficiencyLevel;

  /** Числовое значение навыка для броска кубов. */
  value: number;

  formattedModifier: string;
  passiveValue: number;

  /**
   * Разбор значения для подсказки; null — навык считается по правилам, и
   * объяснять в списке нечего.
   */
  bonusHint: string | null;
}

/**
 * Группа списка навыков: разделитель с характеристикой и её навыки. Без
 * группировки список остаётся одной группой без разделителя. Параметр типа —
 * запись навыка: список листа группирует строки, а модалка настройки — сами
 * навыки черновика.
 */
export interface SkillRowGroup<Row = SkillRow> {
  /** Ключ группы для списка: характеристика либо общий список навыков. */
  key: string;

  /**
   * Характеристика группы; null — список без группировки (группа общая, и
   * характеристики у неё нет).
   */
  ability: AbilityKey | null;

  /** Подпись разделителя; null — разделитель не рисуется. */
  title: string | null;

  rows: Row[];
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
