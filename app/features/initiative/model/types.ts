/** Статус трекера: подготовка энкаунтера или активный бой. */
export type TrackerStatus = 'PREPARING' | 'ACTIVE';

/** Тип участника боя. */
export type ParticipantType = 'PLAYER' | 'CREATURE';

/**
 * Участник трекера. Приходит от бэка уже в порядке хода.
 * Поля броска отсутствуют, пока инициатива не прокинута.
 */
export interface TrackerParticipant {
  id: string;
  type: ParticipantType;
  typeName: string;
  name: string;
  /** Повержен: остаётся в списке на своей позиции, но пропускается в очереди хода. */
  dead: boolean;
  initiativeBonus: number;
  initiativeRoll?: number;
  initiativeTotal?: number;
  creatureUrl?: string;

  /** Текущие хиты; не задано — существо на полных, у игрока хитов нет. */
  currentHitPoints?: number;

  /** Максимум хитов, заданный мастером; не задано — среднее из статблока. */
  maxHitPoints?: number;

  /** КД игрока; не задано — не задан (у существа берётся из статблока). */
  armorClass?: number;

  /** Цвет иконки; не задано — цвет по умолчанию. */
  color?: ParticipantColor;

  /** Привязка игрока к листу персонажа; не задано — заведён вручную. */
  sheetLink?: ParticipantSheetLink;

  /** Наложенные состояния. */
  conditions: Array<ParticipantCondition>;
}

/**
 * Полное состояние трекера — единый ответ на `GET /{id}` и все мутации.
 * После любого действия фронт перерисовывается из этого объекта.
 */
export interface TrackerDetailed {
  id: string;
  name: string;
  status: TrackerStatus;
  statusName: string;
  round: number;

  /**
   * Новая инициатива каждый раунд: в начале раунда бэк сам перебрасывает её
   * всем живым участникам и передаёт ход первому по новому порядку.
   */
  rerollEachRound: boolean;
  currentParticipantId?: string;
  /** Приходит ЕДИНСТВЕННЫЙ раз — в ответе на создание анонимного трекера. */
  accessKey?: string;
  createdAt: string;
  updatedAt: string;
  participants: Array<TrackerParticipant>;
}

/** Короткий объект трекера в списке `GET /`. */
export interface TrackerListItem {
  id: string;
  name: string;
  status: TrackerStatus;
  statusName: string;
  round: number;

  /** Новая инициатива каждый раунд. */
  rerollEachRound: boolean;

  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Тело запроса создания/правки трекера — применяются присланные поля. */
export interface TrackerUpdateRequest {
  name?: string;

  /** Новая инициатива каждый раунд; поля нет — опция не меняется. */
  rerollEachRound?: boolean;
}

/** Добавление игрока (по одному). */
export interface AddPlayerRequest {
  type: 'PLAYER';
  name: string;
  initiativeBonus?: number;

  /** Хиты игрока — приходят с листа персонажа. */
  currentHitPoints?: number;
  maxHitPoints?: number;

  /** КД игрока: задаёт мастер или лист персонажа. */
  armorClass?: number;

  /** Привязка к листу персонажа. */
  sheetLink?: ParticipantSheetLink;
}

/** Добавление существ из бестиария (пачкой). */
export interface AddCreatureRequest {
  type: 'CREATURE';
  creatureUrl: string;
  count?: number;
  name?: string;
}

/** Тело запроса добавления участников. */
export type AddParticipantRequest = AddPlayerRequest | AddCreatureRequest;

/** Правка участника — применяются только заполненные поля. */
export interface UpdateParticipantRequest {
  name?: string;
  initiativeBonus?: number;
  initiativeRoll?: number;
  dead?: boolean;
  currentHitPoints?: number;
  maxHitPoints?: number;
  armorClass?: number;
  color?: ParticipantColor;
  sheetLink?: ParticipantSheetLink;

  /** Состояния целиком: присланный список заменяет прежний, пустой — снимает все. */
  conditions?: Array<ParticipantCondition>;
}

/** Слот единственного анонимного трекера в localStorage. */
export interface AnonTrackerSlot {
  trackerId: string;
  accessKey: string;
}

/** Плоская опция существа для автокомплита (из бестиария). */
export interface CreatureOption {
  url: string;
  label: string;
  challengeRating: string;
}

/**
 * Состояние участника: пятнадцать состояний PHB 2024 и частые эффекты боя,
 * которые состояниями по правилам не являются, но мастеру их отмечать так же
 * нужно (концентрация, ускорение, увеличение и прочее).
 */
export type ConditionKey =
  | 'blinded'
  | 'charmed'
  | 'deafened'
  | 'exhaustion'
  | 'frightened'
  | 'grappled'
  | 'incapacitated'
  | 'invisible'
  | 'paralyzed'
  | 'petrified'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'stunned'
  | 'unconscious'
  | 'concentration'
  | 'hasted'
  | 'slowed'
  | 'enlarged'
  | 'reduced'
  | 'polymorphed';

/** Состояние в справочнике: подпись и иконка. */
export interface ConditionOption {
  label: string;
  icon: string;
}

/**
 * Момент, когда состояние спадает само: на границе раунда (у всех разом), в
 * начале или в конце хода того, на кого оно наложено. «Начало раунда» и «конец
 * раунда» — один и тот же момент, поэтому вариант один.
 */
export type ConditionExpiry = 'round-end' | 'turn-start' | 'turn-end';

/** Состояние, наложенное на участника трекера. */
export interface ParticipantCondition {
  key: ConditionKey;

  /**
   * Раунд, к которому состояние спадает само (раунд наложения плюс
   * длительность); `null` — держится, пока мастер не снимет его вручную.
   */
  expiresAtRound: number | null;

  /** Когда именно спадает состояние с вышедшим сроком. */
  expiresOn: ConditionExpiry;
}

/**
 * Цвет иконки участника без картинки. Значения — семантические цвета темы: свои
 * оттенки в проекте не заводятся, а этих хватает, чтобы отряд различался в
 * ленте боя.
 */
export type ParticipantColor =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warning'
  | 'error';

/** Откуда взят лист персонажа: свой лист или сохранённый чужой по ссылке. */
export type SheetPlayerSource = 'own' | 'saved';

/**
 * Лист персонажа как вариант добавления игрока. Числа посчитаны заранее (лист
 * считает их сам), поэтому трекеру не нужен весь документ персонажа.
 */
export interface SheetPlayerOption {
  /** Идентификатор листа — им же вариант выбирается в селекте. */
  sheetId: string;
  source: SheetPlayerSource;

  /** Имя персонажа, обрезанное до предела имени участника. */
  name: string;

  /** Подпись варианта: классы с уровнями либо общий уровень персонажа. */
  subtitle: string;

  /** Бонус инициативы листа в допустимых для трекера пределах. */
  initiativeBonus: number;

  /** Класс доспеха листа в допустимых для трекера пределах. */
  armorClass: number;

  /** Максимум хитов листа; `0` — на листе хиты не заданы. */
  maxHitPoints: number;

  /** Текущие хиты листа. */
  currentHitPoints: number;

  /** Аватар персонажа; null — не загружен. */
  avatarUrl: string | null;

  /** Токен ссылки «поделиться»; null — свой лист, он открывается по id. */
  shareToken: string | null;

  /**
   * Идентификатор сохранённой записи чужого листа — им мастер пишет в него
   * текущие хиты. `null` — свой лист (пишется по своему id).
   */
  savedId?: string | null;
}

/**
 * Привязка участника к листу персонажа в localStorage мастера: на бэке трекера
 * листов нет, а строке нужны аватар и ссылка на сам лист.
 */
export interface ParticipantSheetLink {
  sheetId: string;
  source: SheetPlayerSource;

  /** Токен ссылки «поделиться»; null — свой лист. */
  shareToken: string | null;

  /**
   * Идентификатор сохранённой записи чужого листа — по нему пишутся его текущие
   * хиты. `null` — свой лист; поля нет — привязка сделана до появления записи
   * хитов в чужой лист, и хиты в него не уйдут, пока игрока не добавят заново.
   */
  savedId?: string | null;

  /** Аватар персонажа; null — не загружен. */
  avatarUrl: string | null;
}

/**
 * Сводка существа из детального ответа бестиария для строки трекера:
 * картинка аватара, строка КД статблока (например, `15 (кожаный доспех)`),
 * показатель опасности (CR), максимум хитов (`0` — неизвестен) и формула
 * броска хитов (например, `8к8 + 16`; пустая строка — формулы нет).
 */
export interface CreatureSummary {
  image: string;
  armorClass: string;
  challengeRating: string;
  maxHitPoints: number;
  hitFormula: string;
}
