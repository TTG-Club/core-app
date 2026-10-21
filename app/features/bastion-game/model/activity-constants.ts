import type {
  BastionEventType,
  BastionGuestKind,
  FacilitySpaceCode,
  LedgerReason,
} from './schema';

/** Дней в ходе бастиона. */
export const DAYS_PER_TURN = 7;

/**
 * Отступы карточек бастиона: одинаковые и компактные в шапке и теле, вместо
 * крупных отступов `UCard` по умолчанию.
 */
export const BASTION_CARD_UI = {
  header: 'p-3 sm:px-3',
  body: 'p-3 sm:p-3',
} as const;

/**
 * Цена и срок базового сооружения по пространству — из правил бастиона, те же,
 * что у сервера (`FacilitySpace`).
 */
export const BASIC_BUILD_TERMS: Record<
  FacilitySpaceCode,
  { cost: number; days: number }
> = {
  CRAMPED: { cost: 500, days: 20 },
  ROOMY: { cost: 1000, days: 45 },
  VAST: { cost: 3000, days: 125 },
};

export const SPACE_LABELS: Record<FacilitySpaceCode, string> = {
  CRAMPED: 'Тесное',
  ROOMY: 'Вместительное',
  VAST: 'Просторное',
};

export const ORDER_STATUS_COLORS = {
  ACTIVE: 'info',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
} as const;

export const LEDGER_REASON_LABELS: Record<LedgerReason, string> = {
  DEPOSIT: 'Пополнение',
  WITHDRAWAL: 'Списание',
  ORDER: 'Приказ',
  REFUND: 'Возврат',
  BUILD: 'Постройка',
  ENLARGE: 'Расширение',
  WALL: 'Защитная стена',
  EVENT: 'Событие',
  SALE: 'Продажа',
};

export const BASTION_EVENT_ICONS: Record<BastionEventType, string> = {
  ALL_IS_WELL: 'tabler:mood-smile',
  ATTACK: 'tabler:swords',
  CRIMINAL_HIRELING: 'tabler:fingerprint',
  EXTRAORDINARY_OPPORTUNITY: 'tabler:confetti',
  FRIENDLY_VISITORS: 'tabler:users-group',
  GUEST: 'tabler:door-enter',
  LOST_HIRELINGS: 'tabler:user-question',
  MAGICAL_DISCOVERY: 'tabler:flask',
  REFUGEES: 'tabler:tent',
  REQUEST_FOR_AID: 'tabler:lifebuoy',
  TREASURE: 'tabler:diamond',
};

/** Цвет события: угроза, выгода или ничего особенного. */
export const BASTION_EVENT_COLORS: Record<
  BastionEventType,
  'error' | 'warning' | 'success' | 'info' | 'neutral'
> = {
  ALL_IS_WELL: 'neutral',
  ATTACK: 'error',
  CRIMINAL_HIRELING: 'warning',
  EXTRAORDINARY_OPPORTUNITY: 'info',
  FRIENDLY_VISITORS: 'success',
  GUEST: 'info',
  LOST_HIRELINGS: 'warning',
  MAGICAL_DISCOVERY: 'success',
  REFUGEES: 'info',
  REQUEST_FOR_AID: 'warning',
  TREASURE: 'success',
};

export const BASTION_GUEST_ICONS: Record<BastionGuestKind, string> = {
  CELEBRITY: 'tabler:crown',
  SANCTUARY: 'tabler:home-heart',
  DEFENDER: 'tabler:user-shield',
  MONSTER: 'tabler:paw',
  REFUGEES: 'tabler:tent',
};

export const EVENT_LABELS = {
  tab: 'События',
  empty: 'Событий пока не было: их бросают после приказа «Обслуживать».',
  pendingTitle: 'События ждут решения',
  terms: 'Ход {turn} · {character} · 1к100: {roll}',
  termsNoCharacter: 'Ход {turn} · 1к100: {roll}',
  pending: 'Ждёт решения',
  dice: 'Кости: {dice}',
  waiting: 'Решение принимает игрок персонажа или Мастер.',
  pay: 'Заплатить {cost} зм',
  refuse: 'Отказаться',
  arrest: 'Пусть арестуют',
  send: 'Отправить',
  sendDefenders: 'Защитников',
  sendHint: 'Доступно защитников: {count}',
  noDefenders: 'Защитников нет — помочь нельзя.',
  record: 'Записать',
  recordLabel: 'Какой предмет получен',
  recordPlaceholder: 'Выбери магический предмет',
  recordDiscoveryPlaceholder: 'Выбери необычное зелье или свиток',
  recordItem: 'Получено:',
  decided: 'Решение принято',
  guestsTitle: 'Гости бастиона',
  guestTerms: '{name} · с хода {turn}',
  guestCount: '{name}: {count} · с хода {turn}',
  guestLeaves: ', уедет через {left}',
  dismiss: 'Отослать',
  dismissRefugees: 'Нашли новый дом',
  dismissed: 'Гость уехал',
} as const;

export const ACTIVITY_LABELS = {
  journal: 'Журнал бастиона',
  /** Формат даты и времени записей журнала. */
  journalDateFormat: 'DD.MM.YYYY HH:mm',
  ordersTab: 'Приказы',
  turnsTab: 'Ходы',
  ledgerTab: 'Казна',
  noOrders: 'Приказов пока не было',
  noTurns: 'Ходов пока не было',
  noLedger: 'Движений казны пока не было',
  turnLabel: 'Ход {turn}',
  orderTerms: 'ходы {given}–{completes}',
  orderTermsActive: 'с хода {given}, {left}',
  maintain: 'Обслуживание',
  maintainOrder: 'Обслуживать',
  maintainHint:
    '«Обслуживать» отдаётся всему бастиону вместо остальных приказов хода.',
  cancel: 'Отменить',
  cancelled: 'Приказ отменён',
  maintainCancelTitle: 'Отменить текущие приказы?',
  maintainCancelDescription:
    '«Обслуживать» отдаётся вместо остальных приказов, поэтому эти приказы будут отменены: {orders}. Цена приказов этого хода вернётся в казну.',
  maintainCancelNo: 'Нет',
  status: {
    ACTIVE: 'Выполняется',
    COMPLETED: 'Выполнен',
    CANCELLED: 'Отменён',
  },
  giveOrder: 'Приказ',
  giveOrderTitle: 'Приказ сооружению',
  order: 'Приказ',
  option: 'Вариант',
  optionPlaceholder: 'Без варианта',
  optionTerms: '{days} дн. · {cost}',
  free: 'бесплатно',
  barrackRecruit:
    'Барак бесплатно нанимает до 4 защитников. Сейчас защитников: {count} из {capacity}.',
  barrackFull: 'Барак полон: защитников {count} из {capacity}.',
  costNote: 'цена по правилу: {note}',
  craftItem: 'Предмет',
  craftItemPlaceholder: 'Выберите предмет',
  craftItemEmpty: 'Выбранные инструменты мастерской ничего не создают',
  craftItemTerms: '{name} — {days} дн.',
  craftDays:
    'Изготовление: {price} зм / 10 зм в день, наёмников: {hirelings} — {days} дн. (ходов: {turns})',
  craftDaysUnknown:
    'У предмета нет числовой цены в справочнике — срок берётся из варианта приказа',
  creature: 'Существо',
  creaturePlaceholder: 'Выберите существо',
  creatureTerms: '{name} — {size}, {cost} зм',
  creatureCustom: 'Другое существо (с согласия Мастера)',
  creatureName: 'Название',
  creatureSize: 'Размер',
  creatureChallenge: 'Показатель опасности',
  creatureChallengeTerms: 'ПО {challenge} — {cost} зм',
  menagerieRecruit:
    'Наёмники вербуют существо за 7 дней. Свободно мест: {free} из {capacity} больших.',
  menagerieNoRoom: 'Для этого существа в вольерах нет места.',
  menagerie: 'Вольеры',
  menagerieTitle: 'Вольеры зверинца',
  menagerieOccupied: 'Занято {occupied} из {capacity} больших мест',
  menagerieEmpty: 'В вольерах пока нет существ.',
  menagerieDefender: 'Защитник',
  menagerieDefenderHint:
    'Существо не защитник: его не призывают на защиту бастиона, оно действует по своей природе.',
  menagerieCreatureTerms: '{size}',
  menagerieCreatureChallenge: '{size}, ПО {challenge}',
  menagerieRemove: 'Убрать',
  menagerieUpdated: 'Вольеры обновлены',
  note: 'Пояснение',
  notePlaceholder: 'Тема исследования, что изготовить',
  submitOrder: 'Отдать приказ',
  orderGiven: 'Приказ отдан',
  turn: 'Сделать ход',
  turnTitle: 'Сделать ход {turn}?',
  turnHint:
    'Пройдут 7 дней: достроятся сооружения, завершатся приказы со сроком.',
  turnCompleting: 'Завершатся: {orders}.',
  resultWrite: 'Записать итог',
  resultEdit: 'Изменить итог',
  resultPlaceholder: 'Что получили или узнали',
  resultSave: 'Сохранить',
  resultSaved: 'Итог записан',
  turnDone: 'Ход сделан',
  treasury: 'Казна',
  treasuryTitle: 'Казна бастиона',
  treasuryAmount: 'Сумма, зм',
  treasuryAmountHint: 'Плюс — пополнение, минус — списание',
  treasuryNote: 'За что',
  treasuryDone: 'Казна обновлена',
  build: 'Построить',
  buildTitle: 'Новое базовое сооружение',
  buildHint: 'Строится за деньги из казны; готово через несколько ходов.',
  buildFacility: 'Сооружение',
  buildSpace: 'Пространство',
  buildTerms: '{cost} зм · {days} дн. (ходов: {turns})',
  buildDone: 'Стройка началась',
  addSpecial: 'Новое специализированное',
  addSpecialTitle: 'Новое специализированное сооружение',
  addSpecialHint:
    'Персонаж дорос до следующего лимита — сооружение появляется сразу и бесплатно.',
  addSpecialDone: 'Сооружение добавлено',
  enlarge: 'Расширить',
  enlargeDone: 'Расширение началось',
  remove: 'Разрушить',
  idle: 'Простаивает',
  busyOrder: '{order}, {left}',
  busyOrderOption: '{order}: {option}, {left}',
  orderBusy: 'Сооружение уже выполняет приказ',
  orderBuilding: 'Сооружение ещё строится',
  orderPrerequisite: 'Мастер ещё не подтвердил требование',
  orderAfterStart: 'Приказы отдаются, когда бастион запущен',
  unavailable: 'Не работает в ход {turn}: {reason}',
  unavailableBadge: 'Не работает',
  removeTitle: 'Разрушить сооружение?',
  removeDescription:
    'Незавершённые приказы сооружения отменятся без возврата денег, клетки исчезнут с плана.',
  removeDone: 'Сооружение разрушено',
  building: 'Строится, {left}',
  enlarging: 'Расширяется до «{space}», {left}',
  actionError: 'Не удалось выполнить действие',
  confirm: 'Подтвердить',
  gold: 'зм',
  specialOption: '{name} ({level} ур.)',
  cancelAction: 'Отмена',
} as const;

export const STABLE_LABELS = {
  open: 'Стойло',
  title: 'Стойло конюшни',
  occupied: 'Занято {occupied} из {capacity} больших мест',
  hint: 'Конюшня: {names}. Свободно {free} из {capacity} больших мест',
  hintEmpty: 'Конюшня пуста. Свободно {free} из {capacity} больших мест',
  empty: 'В конюшне пока нет животных.',
  bonded:
    'Живёт в конюшне 14 дней и больше: проверки Мудрости (Уход за животными) с преимуществом',
  remove: 'Забрать из конюшни',
  removed: 'Животное забрали из конюшни',
  mode: 'Сделка',
  buy: 'Купить',
  sell: 'Продать',
  kind: 'Животное',
  kindPlaceholder: 'Выбери животное',
  kindTerms: '{name} ({size}) — {cost} зм',
  custom: 'Другое животное',
  customName: 'Название',
  customSize: 'Размер',
  customCost: 'Обычная цена, зм',
  sellAnimal: 'Какое животное продать',
  sellItem: '{name} — {cost} зм',
  sellPlaceholder: 'Выбери животное',
  sellTerms:
    'Покупатель заплатит {price} зм: обычная цена {cost} зм и {bonus}% сверху.',
  buyTerms:
    'Займёт 7 дней, полная цена списывается сразу. Свободно {free} из {capacity} больших мест.',
  noRoom: 'Для этого животного в конюшне нет места.',
  nothingToSell: 'В конюшне нет животных на продажу.',
} as const;

export const LAST_TURN_LABELS = {
  title: 'Итоги хода {turn}',
  hide: 'Скрыть итоги хода',
  nothing: 'За ход ничего не произошло',
  pendingNow: 'За ход выпало событие — оно ниже и ждёт решения',
  pendingEarlier:
    'Новых итогов за ход нет. Ниже ждут решения события прошлых ходов: {count}',
} as const;

/** Формы слова «ход» для «осталось N ходов». */
export const TURN_FORMS: [string, string, string] = ['ход', 'хода', 'ходов'];

export const TURNS_LEFT_LABELS = {
  left: 'осталось {count} {turns}',
  leftOne: 'остался {count} {turns}',
  span: '{count} {turns}',
} as const;

/** Защитная стена: цена и срок 5-футового квадрата (`BastionRules` core-api). */
export const DEFENSE_WALL_COST_PER_SQUARE = 250;
export const DEFENSE_WALL_DAYS_PER_SQUARE = 10;
/** Больше блоков за раз сервер не строит. */
export const DEFENSE_WALL_MAX_SQUARES = 1000;

export const DEFENSE_WALL_LABELS = {
  title: 'Защитные стены',
  hint: 'Стена высотой 20 футов вокруг бастиона. Блок — 5-футовый квадрат: 250 зм и 10 дней стройки, блоки строятся друг за другом. На план ставятся только достроенные блоки. Если бастион полностью окружён стенами, при атаке потери защитников бросаются на 2 кубика меньше.',
  built: 'Построено блоков: {count}',
  none: 'Стен пока нет',
  building: 'Строится блоков: {count}, {left}',
  enclosed: 'Бастион окружён стенами',
  build: 'Построить стену',
  buildTitle: 'Защитная стена',
  squares: 'Сколько блоков построить',
  terms: '{cost} зм · {days} дн. (ходов: {turns})',
  buildDone: 'Стройка стены началась',
  busy: 'Новые блоки можно заказать, когда достроится текущая партия',
} as const;

export const BASTION_EDIT_LABELS = {
  edit: 'Редактировать',
  done: 'Готово',
  hint: 'Режим редактирования: можно строить, добавлять и разрушать сооружения',
} as const;
