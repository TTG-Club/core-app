import type {
  ConditionExpiry,
  ConditionKey,
  ConditionOption,
  ParticipantColor,
  ParticipantType,
  SheetPlayerSource,
  TrackerStatus,
} from './types';

/** Базовый путь API трекера инициативы (проксируется на core-api). */
export const INITIATIVE_API_PATH = '/api/v2/tools/initiative';

/** Путь поиска существ в бестиарии для автокомплита. */
export const BESTIARY_SEARCH_PATH = '/api/v2/bestiary/search';

/** Публичный путь страницы инструмента. */
export const INITIATIVE_TOOL_ROUTE = '/tools/initiative';

/** Заголовок страницы инструмента. */
export const INITIATIVE_TOOL_TITLE = 'Трекер инициативы';

/**
 * Ключ localStorage для единственного слота анонимного трекера.
 * Формат `domain:key-name` согласно правилам проекта.
 */
export const ANON_SLOT_STORAGE_KEY = 'initiative:anon-slot';

/** Имя HTTP-заголовка с ключом доступа анонимного трекера. */
export const TRACKER_KEY_HEADER = 'X-Tracker-Key';

/**
 * Справочник состояний: подпись и иконка каждого. Названия и рисунки состояний
 * PHB 2024 — те же, что в VTTG (`packages/client/public/assets/status`), чтобы
 * состояние узнавалось одинаково на столе и в трекере. Своей картинки в VTTG
 * нет у двух состояний и у боевых эффектов сверх правил — у них, как и там,
 * иконка из `tabler`.
 */
export const CONDITION_CATALOG: Record<ConditionKey, ConditionOption> = {
  blinded: { label: 'Ослеплённый', icon: 'ttg:status-blinded' },
  charmed: { label: 'Очарованный', icon: 'ttg:status-charmed' },
  deafened: { label: 'Оглохший', icon: 'ttg:status-deafened' },
  exhaustion: { label: 'Истощённый', icon: 'ttg:status-exhaustion' },
  frightened: { label: 'Испуганный', icon: 'ttg:status-frightened' },
  grappled: { label: 'Схваченный', icon: 'ttg:status-grappled' },
  incapacitated: { label: 'Недееспособный', icon: 'tabler:ban' },
  invisible: { label: 'Невидимый', icon: 'tabler:eye-closed' },
  paralyzed: { label: 'Парализованный', icon: 'ttg:status-paralyzed' },
  petrified: { label: 'Окаменевший', icon: 'ttg:status-petrified' },
  poisoned: { label: 'Отравленный', icon: 'ttg:status-poisoned' },
  prone: { label: 'Лежащий ничком', icon: 'ttg:status-prone' },
  restrained: { label: 'Опутанный', icon: 'ttg:status-restrained' },
  stunned: { label: 'Ошеломлённый', icon: 'ttg:status-stunned' },
  unconscious: { label: 'Бессознательный', icon: 'ttg:status-unconscious' },
  concentration: { label: 'Концентрация', icon: 'tabler:brain' },
  hasted: { label: 'Ускоренный', icon: 'tabler:run' },
  slowed: { label: 'Замедленный', icon: 'tabler:hourglass-low' },
  enlarged: { label: 'Увеличенный', icon: 'tabler:arrows-maximize' },
  reduced: { label: 'Уменьшенный', icon: 'tabler:arrows-minimize' },
  polymorphed: { label: 'Превращённый', icon: 'tabler:transform' },
};

/**
 * Порядок состояний в палитре наложения: сперва состояния по правилам
 * (алфавитом, как в книге), затем прочие боевые эффекты.
 */
export const CONDITION_KEYS: Array<ConditionKey> = [
  'blinded',
  'charmed',
  'deafened',
  'exhaustion',
  'frightened',
  'grappled',
  'incapacitated',
  'invisible',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'stunned',
  'unconscious',
  'concentration',
  'hasted',
  'slowed',
  'enlarged',
  'reduced',
  'polymorphed',
];

/** Момент снятия состояния по умолчанию — начало хода того, на кого наложено. */
export const DEFAULT_CONDITION_EXPIRY: ConditionExpiry = 'turn-start';

/**
 * Подписи моментов снятия состояния. «Начало раунда» отдельной подписью не идёт:
 * это тот же миг, что и конец предыдущего.
 */
export const CONDITION_EXPIRY_LABEL: Record<ConditionExpiry, string> = {
  'turn-start': 'В начале своего хода',
  'turn-end': 'В конце своего хода',
  'round-end': 'На границе раунда',
};

/** Варианты момента снятия состояния для переключателя (в порядке показа). */
export const CONDITION_EXPIRY_OPTIONS: Array<{
  value: ConditionExpiry;
  label: string;
}> = [
  { value: 'turn-start', label: CONDITION_EXPIRY_LABEL['turn-start'] },
  { value: 'turn-end', label: CONDITION_EXPIRY_LABEL['turn-end'] },
  { value: 'round-end', label: CONDITION_EXPIRY_LABEL['round-end'] },
];

/** Минимальная длительность состояния в раундах: `0` — до снятия вручную. */
export const MIN_CONDITION_ROUNDS = 0;

/** Максимальная длительность состояния в раундах. */
export const MAX_CONDITION_ROUNDS = 100;

/** Длительность по умолчанию — «до снятия вручную». */
export const DEFAULT_CONDITION_ROUNDS = 0;

/** Тексты блока состояний участника. */
export const CONDITION_LABELS = {
  add: 'Наложить состояние',
  remove: 'Снять состояние',
  rounds: 'Раундов',
  roundsHint: '0 — до снятия вручную',
  expiry: 'Спадает',
  permanent: 'до снятия',
} as const;

/** Формы слова «раунд» для остатка длительности состояния. */
export const CONDITION_ROUNDS_PLURAL: [string, string, string] = [
  'раунд',
  'раунда',
  'раундов',
];

/** Цвет иконки участника по умолчанию. */
export const DEFAULT_PARTICIPANT_COLOR: ParticipantColor = 'neutral';

/** Порядок цветов в палитре выбора. */
export const PARTICIPANT_COLORS: Array<ParticipantColor> = [
  'neutral',
  'primary',
  'success',
  'info',
  'warning',
  'error',
];

/** Подписи цветов — в подсказках палитры и для скринридеров. */
export const PARTICIPANT_COLOR_LABEL: Record<ParticipantColor, string> = {
  neutral: 'Без цвета',
  primary: 'Основной',
  success: 'Зелёный',
  info: 'Синий',
  warning: 'Оранжевый',
  error: 'Красный',
};

/**
 * Оформление иконки участника по цвету: рамка с фоном кружка и цвет самой
 * иконки (или инициалов игрока). Классы записаны целиком — Tailwind собирает
 * их по исходникам и склеенных на лету имён не видит.
 */
export const PARTICIPANT_COLOR_CLASS: Record<
  ParticipantColor,
  { surface: string; content: string }
> = {
  neutral: { surface: 'border-default bg-elevated', content: 'text-secondary' },
  primary: { surface: 'border-primary bg-primary/15', content: 'text-primary' },
  success: { surface: 'border-success bg-success/15', content: 'text-success' },
  info: { surface: 'border-info bg-info/15', content: 'text-info' },
  warning: { surface: 'border-warning bg-warning/15', content: 'text-warning' },
  error: { surface: 'border-error bg-error/15', content: 'text-error' },
};

/** Подпись кнопки выбора цвета иконки участника. */
export const PARTICIPANT_COLOR_TITLE = 'Цвет иконки';

/** КД игрока по умолчанию — базовое значение без брони. */
export const DEFAULT_ARMOR_CLASS = 10;

/** Минимальное значение КД игрока. */
export const MIN_ARMOR_CLASS = 1;

/** Максимальное значение КД игрока. */
export const MAX_ARMOR_CLASS = 50;

/** Максимум трекеров у авторизованного пользователя. */
export const MAX_AUTHORIZED_TRACKERS = 10;

/** Максимум участников-игроков в одном трекере. */
export const MAX_PLAYERS = 50;

/** Максимум участников-существ в одном трекере. */
export const MAX_CREATURES = 100;

/** Имя трекера по умолчанию (совпадает с дефолтом бэка). */
export const DEFAULT_TRACKER_NAME = 'Новый трекер';

/** Максимальная длина имени трекера. */
export const MAX_TRACKER_NAME_LENGTH = 100;

/** Максимальная длина имени участника. */
export const MAX_PARTICIPANT_NAME_LENGTH = 100;

/** Минимальный бонус инициативы участника. */
export const MIN_INITIATIVE_BONUS = -20;

/** Максимальный бонус инициативы участника. */
export const MAX_INITIATIVE_BONUS = 30;

/** Минимальное значение броска d20. */
export const MIN_D20 = 1;

/** Максимальное значение броска d20. */
export const MAX_D20 = 20;

/** Минимальное количество существ в одной пачке добавления. */
export const MIN_CREATURE_BATCH = 1;

/** Количество существ, запрашиваемых для автокомплита. */
export const CREATURE_SEARCH_SIZE = 20;

/** Задержка дебаунса перед запросом автокомплита существ, мс. */
export const CREATURE_SEARCH_DEBOUNCE_MS = 300;

/** Общее сообщение об ошибке, когда бэк не вернул текст. */
export const UNKNOWN_ERROR_MESSAGE = 'Неизвестная ошибка';

/** Иконка участника по типу. */
export const PARTICIPANT_TYPE_ICON: Record<ParticipantType, string> = {
  PLAYER: 'tabler:user',
  CREATURE: 'tabler:paw',
};

/** Подпись типа участника — фолбэк, когда бэк не прислал `typeName`. */
export const PARTICIPANT_TYPE_LABEL: Record<ParticipantType, string> = {
  PLAYER: 'Игрок',
  CREATURE: 'Существо',
};

/** Подпись источника листа персонажа в списке выбора. */
export const SHEET_PLAYER_SOURCE_LABEL: Record<SheetPlayerSource, string> = {
  own: 'Мой лист',
  saved: 'Доступный',
};

/** Тексты формы добавления игрока из листа персонажа. */
export const SHEET_PLAYER_FORM_LABELS = {
  title: 'Из листа персонажа',
  field: 'Лист персонажа',
  placeholder: 'Выберите персонажа…',
  search: 'Найти персонажа…',
  empty: 'Нет доступных листов персонажей',
  error: 'Не удалось загрузить листы персонажей',
  limit: 'Лимит игроков исчерпан — уберите кого-нибудь из боя',
  added: 'уже в бою',
  level: 'Уровень',
  refresh: 'Обновить список листов',
  submit: 'Добавить персонажа из листа',
  hint: 'Имя, КД, бонус инициативы и хиты возьмутся из листа; хиты, изменённые в бою, вернутся в него же.',
} as const;

/**
 * Задержка перед записью хитов в свой лист персонажа, мс. Хиты в бою правят
 * очередями (быстрые шаги урона), и каждый клик отдельным запросом слать незачем.
 */
export const SHEET_HIT_POINTS_SYNC_DELAY = 800;

/** Заголовок тоста, когда хиты не удалось записать в лист персонажа. */
export const SHEET_HIT_POINTS_SYNC_ERROR_TITLE =
  'Не удалось записать хиты в лист персонажа';

/** Пометка в подписи строки: игрок собран из листа персонажа. */
export const SHEET_PLAYER_ROW_LABEL = 'лист персонажа';

/** Пункт меню строки участника: открыть привязанный лист персонажа. */
export const OPEN_SHEET_MENU_LABEL = 'Лист персонажа в новой вкладке';

/** Подпись переключателя переброса инициативы каждый раунд. */
export const REROLL_EACH_ROUND_LABEL = 'Новая инициатива каждый раунд';

/** Пояснение к переключателю переброса инициативы. */
export const REROLL_EACH_ROUND_HINT =
  'В начале каждого раунда все живые участники перебрасывают инициативу, и ход идёт по новому порядку';

/** Заголовок тоста, когда опцию переброса не удалось переключить. */
export const REROLL_EACH_ROUND_ERROR_TITLE =
  'Не удалось изменить настройку инициативы';

/** Заголовок тоста при неудачном добавлении персонажа из листа. */
export const ADD_SHEET_PLAYER_ERROR_TITLE = 'Не удалось добавить персонажа';

/** Оформление бейджа статуса трекера. */
export const TRACKER_STATUS_BADGE: Record<
  TrackerStatus,
  { color: 'neutral' | 'success'; icon: string }
> = {
  PREPARING: { color: 'neutral', icon: 'tabler:swords' },
  ACTIVE: { color: 'success', icon: 'tabler:flame' },
};
