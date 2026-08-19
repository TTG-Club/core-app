/**
 * Механика: то, что лист персонажа считает сам, а не показывает текстом.
 *
 * Зеркало пакета `common/model/mechanics` из core-api. Блоки общие для всего,
 * что наделяет персонажа постоянными свойствами: и черта (`FeatMechanics`), и
 * вид с его умениями (`SpeciesMechanics`) собираются из них же, поэтому формы
 * редакторов и лист работают с одной моделью, а не с двумя похожими.
 */

/** Что именно выбирает игрок, получая черту или выбирая вид. */
export type MechanicChoiceType =
  | 'ABILITY'
  | 'SAVING_THROW'
  | 'SKILL'
  | 'TOOL'
  | 'LANGUAGE'
  | 'DAMAGE_TYPE'
  | 'SPELL'
  | 'CANTRIP'
  | 'SPELL_LIST'
  | 'SPELLCASTING_ABILITY'
  | 'WEAPON'
  | 'OPTION';

/** Ссылка на сущность справочника: url и снимок названия. */
export interface MechanicEntityRef {
  url: string;
  name?: string;
}

/**
 * Что даёт сделанный выбор. `EXPERTISE` — безусловная компетентность («Знаток»);
 * условная замена «владеешь — получишь компетентность» описана отдельным флагом
 * `expertiseIfProficient` («Наблюдательный»).
 */
export type MechanicChoiceGrant = 'PROFICIENCY' | 'EXPERTISE';

/** Допустимое значение выбора: код словаря либо url сущности. */
export interface MechanicChoiceOption {
  value: string;
  name?: string;
}

/** Чем ограничен выбор заклинания или заговора. */
export interface MechanicSpellFilter {
  level: number | undefined;
  maxLevel: number | undefined;
  schools: Array<string>;

  /** Классы, из списков заклинаний которых можно выбирать. */
  classes: Array<MechanicEntityRef>;

  /**
   * Ключ выбора, из ответа на который берётся класс. «Посвящённый в магию»
   * сначала спрашивает список — жреца, друида или волшебника, — и только потом
   * даёт выбрать из него заговоры: пул сужается до выбранного класса, а не до
   * всех трёх. Пусто — пул задан `classes` напрямую.
   */
  classesFromChoiceKey: string;

  castingTime: string | undefined;
}

/**
 * Выбор, который игрок делает один раз, получая источник эффекта: беря черту
 * или выбирая вид.
 *
 * Выборы по ходу игры («выберите существо в пределах 30 футов») сюда не идут:
 * лист их не запоминает, они остаются в описании.
 */
export interface MechanicChoice {
  key: string;
  type: MechanicChoiceType | undefined;
  label: string;
  count: number | undefined;
  countEqualsProficiencyBonus: boolean;
  options: Array<MechanicChoiceOption>;
  spellFilter: MechanicSpellFilter | undefined;
  onlyIfNotProficient: boolean;

  /**
   * Выбирать можно только то, чем персонаж уже владеет («Знаток» — навык, в
   * котором есть владение). Обратен `onlyIfNotProficient`: вместе они оставляют
   * пустой пул, поэтому форма даёт отметить только один из двух.
   */
  onlyIfProficient: boolean;

  /**
   * Что даёт выбор: владение или компетентность. Компетентность удваивает бонус
   * мастерства, поэтому это не «владение посильнее», а другой исход.
   *
   * `undefined` — владение: так поле уходит из отправляемой механики, когда
   * исход обычный, и так же читаются записи, сделанные до его появления.
   */
  grants: MechanicChoiceGrant | undefined;

  expertiseIfProficient: boolean;
  rechooseOnLongRest: boolean;
}

/**
 * Прибавка к максимуму хитов.
 *
 * Итог: `flat + perAcquisitionLevel × уровень взятия +
 * perLevelAfterAcquisition × (текущий уровень − уровень взятия)`. Из-за двух
 * последних лист обязан хранить уровень, на котором черта взята. У умения вида
 * уровень взятия всегда первый.
 */
export interface HitPointsModifier {
  flat: number | undefined;
  perAcquisitionLevel: number | undefined;
  perLevelAfterAcquisition: number | undefined;
}

/** Постоянное изменение скоростей в футах. */
export interface SpeedModifier {
  walkBonus: number | undefined;
  fly: number | undefined;
  climb: number | undefined;
  swim: number | undefined;
  flyEqualsWalk: boolean;
  climbEqualsWalk: boolean;
  swimEqualsWalk: boolean;
}

/** Чувство с дистанцией в футах. */
export interface SenseGrant {
  type: string | undefined;
  range: number | undefined;
}

/** Сопротивления, иммунитеты и уязвимости к урону. */
export interface DamageAffinity {
  resistances: Array<string>;
  immunities: Array<string>;
  vulnerabilities: Array<string>;
  /** Ключ выбора типа урона, к которому даётся сопротивление. */
  resistanceFromChoiceKey: string;
}

/**
 * Постоянные модификаторы листа.
 *
 * Условные эффекты сюда не попадают: «Оборона» даёт +1 к КД только в доспехе,
 * полёт гарпии не работает в средних и тяжёлых доспехах. Они остаются в
 * описании.
 */
export interface SheetModifiers {
  hitPoints: HitPointsModifier;
  speed: SpeedModifier;
  armorClassBonus: number | undefined;
  senses: Array<SenseGrant>;
  telepathyRange: number | undefined;
  damage: DamageAffinity;
  conditionImmunities: Array<string>;
  creatureType: string | undefined;

  /**
   * Прибавка к инициативе: числом — «Бдительный» издания 2014 даёт +5, — и
   * бонусом мастерства, как «Бдительный» издания 2024. Слагаемые независимы:
   * лист складывает оба, а не выбирает одно.
   */
  initiativeBonus: number | undefined;
  initiativeProficiencyBonus: boolean;
}

/**
 * Владения, которые черта или умение вида выдаёт сразу и целиком: «Вы получаете
 * владение воинским оружием», «Вы получаете владение навыком Внимательность».
 * Выбираемые владения сюда не идут — у них есть количество и пул значений,
 * поэтому они живут в {@link MechanicChoice}.
 *
 * Спасбросков здесь нет: спасбросками наделяют выбором.
 */
export interface ProficiencyGrant {
  /** Навыки справочника (`PERCEPTION` и подобные). */
  skills: Array<string>;

  /** Категории оружия справочника (`MATERIAL_MELEE` и подобные). */
  weaponCategories: Array<string>;

  /** Категории доспехов справочника (`MEDIUM`, `SHIELD`). */
  armorCategories: Array<string>;

  /**
   * Языки справочника (`COMMON`, `DWARVISH`) — константами и ровно в том
   * написании, в каком их отдаёт справочник: среди них есть `Celestial`, и
   * приведение регистра сломало бы сверку. Со словарём языков листа справочник
   * сводит выгрузка компендиума.
   */
  languages: Array<string>;

  /** Инструменты из раздела «Предметы». */
  tools: Array<MechanicEntityRef>;
}

/** Новый выбор при получении черты или вида. */
export function createMechanicChoice(): MechanicChoice {
  return {
    key: '',
    type: undefined,
    label: '',
    count: 1,
    countEqualsProficiencyBonus: false,
    options: [],
    spellFilter: undefined,
    onlyIfNotProficient: false,
    onlyIfProficient: false,
    grants: 'PROFICIENCY',
    expertiseIfProficient: false,
    rechooseOnLongRest: false,
  };
}

/** Новое чувство. */
export function createSenseGrant(): SenseGrant {
  return {
    type: undefined,
    range: 10,
  };
}

/** Пустой фильтр заклинаний. */
export function createSpellFilter(): MechanicSpellFilter {
  return {
    level: undefined,
    maxLevel: undefined,
    schools: [],
    classes: [],
    classesFromChoiceKey: '',
    castingTime: undefined,
  };
}

/** Пустые постоянные модификаторы листа. */
export function createSheetModifiers(): SheetModifiers {
  return {
    hitPoints: {
      flat: undefined,
      perAcquisitionLevel: undefined,
      perLevelAfterAcquisition: undefined,
    },
    speed: {
      walkBonus: undefined,
      fly: undefined,
      climb: undefined,
      swim: undefined,
      flyEqualsWalk: false,
      climbEqualsWalk: false,
      swimEqualsWalk: false,
    },
    armorClassBonus: undefined,
    senses: [],
    telepathyRange: undefined,
    damage: {
      resistances: [],
      immunities: [],
      vulnerabilities: [],
      resistanceFromChoiceKey: '',
    },
    conditionImmunities: [],
    creatureType: undefined,
    initiativeBonus: undefined,
    initiativeProficiencyBonus: false,
  };
}

/** Пустая выдача владений. */
export function createProficiencyGrant(): ProficiencyGrant {
  return {
    skills: [],
    weaponCategories: [],
    armorCategories: [],
    languages: [],
    tools: [],
  };
}

/**
 * Ссылки на сущности к списку url: селекты справочников хранят только их.
 *
 * @param refs ссылки на сущности.
 * @returns url сущностей.
 */
export function toEntityRefUrls(refs: Array<MechanicEntityRef>): Array<string> {
  return refs.map((reference) => reference.url);
}

/**
 * Url к ссылкам: core-api хранит ссылку как есть и название сам не подставляет,
 * но предусловию снимок имени и не нужен — выбранное показывают пикеры по url.
 * Там, где имя читает лист персонажа (инструменты в выдаваемых владениях),
 * ссылка собирается вместе с названием.
 *
 * @param urls url сущностей.
 * @returns ссылки на сущности.
 */
export function toEntityRefs(urls: Array<string>): Array<MechanicEntityRef> {
  return urls.map((url) => ({ url }));
}

/**
 * Значение селекта к списку: одиночный выбор приходит строкой, пустой — ничем.
 *
 * @param value значение селекта.
 * @returns выбранные значения списком.
 */
export function toUrlList(
  value: string | Array<string> | undefined,
): Array<string> {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}
