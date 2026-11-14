import type {
  CodeContentFormState,
  CodeContentRequest,
  CodeContentSummarySource,
  CodeStatus,
  CodeStatusFilterValue,
  CreateCodesFormState,
  CreateCodesRequest,
  RedemptionCodeResponse,
  RewardPerk,
  RewardTier,
  SubscriptionSalesSwitchState,
  SubscriptionType,
} from './types';

import {
  SUBSCRIPTION_MONTHS_MAX,
  SUBSCRIPTION_MONTHS_MIN,
} from '#shared/consts';

/** Эндпоинт кодов: POST — выпуск пачки, GET — список (проксируется как есть). */
export const SUBSCRIPTION_CODES_API_PATH = '/api/subscriptions/codes';

/** Эндпоинт деактивации кода (после неё код нельзя погасить). */
export function subscriptionCodeDeactivatePath(id: string): string {
  return `${SUBSCRIPTION_CODES_API_PATH}/${id}/deactivate`;
}

/** Эндпоинт возврата деактивированного кода в активные. */
export function subscriptionCodeReactivatePath(id: string): string {
  return `${SUBSCRIPTION_CODES_API_PATH}/${id}/reactivate`;
}

/** Формат даты в списке кодов (без времени). */
export const CODE_LIST_DATE_FORMAT = 'DD.MM.YYYY';

/** Формат даты со временем в детали кода. */
export const CODE_DETAIL_DATE_FORMAT = 'DD.MM.YYYY HH:mm';

/** Ограничения пачки (зеркалят валидацию бэкенда). */
export const CODES_BATCH_MIN = 1;
export const CODES_BATCH_MAX = 1000;

/**
 * Пределы срока подписки общие с сервером рассылки — переэкспортируем, чтобы
 * потребители фичи брали их отсюда.
 */
export { SUBSCRIPTION_MONTHS_MAX, SUBSCRIPTION_MONTHS_MIN };

/** Порядок тиров по возрастанию (= порядок объявления на бэкенде). */
export const REWARD_TIERS: readonly RewardTier[] = [
  'TIER_1',
  'TIER_2',
  'TIER_3',
  'TIER_4',
  'TIER_5',
  'TIER_6',
] as const;

export const SUBSCRIPTION_TYPES: readonly SubscriptionType[] = [
  'GIFT',
  'BUY',
] as const;

export const REWARD_PERKS: readonly RewardPerk[] = [
  'EARLY_ACCESS_DOWNLOAD',
  'MAP_TOKENS_DOWNLOAD',
  'ADVENTURE_DOWNLOAD',
  'DEV_CHAT_ACCESS',
  'PROFILE_BADGE',
  'AVATAR_FRAME',
  'NICKNAME_COLOR',
  'PROFILE_ICON',
  'APP_CREDITS',
] as const;

export const SUBSCRIPTION_TYPE_LABELS: Record<SubscriptionType, string> = {
  GIFT: 'Подарочная',
  BUY: 'Купленная',
};

export const REWARD_TIER_LABELS: Record<RewardTier, string> = {
  TIER_1: 'Тир 1',
  TIER_2: 'Тир 2',
  TIER_3: 'Тир 3',
  TIER_4: 'Тир 4',
  TIER_5: 'Тир 5',
  TIER_6: 'Тир 6',
};

export const REWARD_PERK_LABELS: Record<RewardPerk, string> = {
  EARLY_ACCESS_DOWNLOAD: 'Ранний доступ к скачиванию',
  MAP_TOKENS_DOWNLOAD: 'Карты и токены',
  ADVENTURE_DOWNLOAD: 'Приключение',
  DEV_CHAT_ACCESS: 'Приватный чат разработки',
  PROFILE_BADGE: 'Значок профиля',
  AVATAR_FRAME: 'Рамка аватара',
  NICKNAME_COLOR: 'Цвет никнейма',
  PROFILE_ICON: 'Иконки профиля',
  APP_CREDITS: 'Упоминание в титрах приложения',
};

/**
 * Срок подписки, зашитый в каждый тир (в месяцах). Зеркалит RewardTier.subscriptionMonths()
 * с бэкенда: TIER_1..TIER_4 — 3 мес., TIER_5 — 6, TIER_6 — 12 (0 — тир без подписки).
 * Нужен только как подсказка в форме: при выборе тира без явной подписки бэкенд всё равно
 * подставит подарочную подписку на этот срок (см. SubscriptionService.createCodes).
 */
export const TIER_SUBSCRIPTION_MONTHS: Record<RewardTier, number> = {
  TIER_1: 3,
  TIER_2: 3,
  TIER_3: 3,
  TIER_4: 3,
  TIER_5: 6,
  TIER_6: 12,
};

/** Собственные перки каждого тира (без накопления). */
const TIER_OWN_PERKS: Record<RewardTier, RewardPerk[]> = {
  TIER_1: ['EARLY_ACCESS_DOWNLOAD'],
  TIER_2: ['MAP_TOKENS_DOWNLOAD'],
  TIER_3: ['ADVENTURE_DOWNLOAD'],
  TIER_4: ['DEV_CHAT_ACCESS'],
  TIER_5: ['PROFILE_BADGE', 'AVATAR_FRAME'],
  TIER_6: ['APP_CREDITS'],
};

/**
 * Кумулятивный набор перков тира: данного и всех нижестоящих.
 * Повторяет RewardTier.perks() с бэкенда — для подсказки в форме.
 */
export function tierCumulativePerks(tier: RewardTier): RewardPerk[] {
  const result: RewardPerk[] = [];

  for (const current of REWARD_TIERS) {
    result.push(...TIER_OWN_PERKS[current]);

    if (current === tier) {
      break;
    }
  }

  return result;
}

/** Опции селектора тира (включая «без тира»). */
export const REWARD_TIER_OPTIONS: Array<{
  label: string;
  value: RewardTier | null;
}> = [
  { label: 'Без тира', value: null },
  ...REWARD_TIERS.map((tier) => ({
    label: REWARD_TIER_LABELS[tier],
    value: tier,
  })),
];

export const SUBSCRIPTION_TYPE_OPTIONS = SUBSCRIPTION_TYPES.map((type) => ({
  label: SUBSCRIPTION_TYPE_LABELS[type],
  value: type,
}));

export const REWARD_PERK_OPTIONS = REWARD_PERKS.map((perk) => ({
  label: REWARD_PERK_LABELS[perk],
  value: perk,
}));

/**
 * Начальное состояние полей содержимого кода.
 *
 * @param rewardTier тир по умолчанию (в рассылке он предвыбран)
 */
export function getInitialCodeContent(
  rewardTier: RewardTier | null = null,
): CodeContentFormState {
  return {
    rewardTier,
    includeSubscription: false,
    subscriptionType: 'GIFT',
    subscriptionMonths: 1,
    perks: [],
    achievements: [],
  };
}

/**
 * Подсказка под селектором тира по умолчанию (форма выпуска кодов).
 */
export const CODE_TIER_HELP =
  'Главное содержимое кода. Тир кумулятивен — включает награды всех нижестоящих тиров.';

/** Подсказки под дополнительными перками и достижениями. */
export const CODE_PERKS_HELP = 'Выдаются сверх перков тира.';

export const CODE_ACHIEVEMENTS_HELP = 'Коды достижений; добавляйте по одному.';

/** Подписи тумблера подписки: обычная и когда тир уже несёт свою подписку. */
export const CODE_SUBSCRIPTION_SWITCH_LABEL = 'Добавить подписку';

export const CODE_SUBSCRIPTION_OVERRIDE_SWITCH_LABEL =
  'Переопределить подписку тира';

export const CODE_SUBSCRIPTION_SWITCH_DESCRIPTION =
  'Код зарегистрирует подписку; пользователь активирует её сам.';

/**
 * Пояснение тумблера, когда тир уже несёт подписку.
 *
 * @param months срок подписки, зашитый в тир
 */
export function codeSubscriptionOverrideDescription(months: number): string {
  return `Задать свой срок и тип вместо пресета тира (${months} мес., подарочная).`;
}

/** Начальное состояние формы выпуска кодов. */
export function getInitialCreateCodesForm(): CreateCodesFormState {
  return {
    ...getInitialCodeContent(),
    count: 1,
    label: '',
  };
}

/**
 * Несёт ли код хоть что-то: тир, подписку, перки или достижения.
 *
 * @param content поля содержимого кода
 */
export function hasCodeContent(content: CodeContentFormState): boolean {
  return (
    !!content.rewardTier
    || content.includeSubscription
    || content.perks.length > 0
    || content.achievements.length > 0
  );
}

/**
 * Разворачивает поля содержимого кода в тело запроса, опуская пустые поля.
 * Подписка попадает в запрос только при включённом тумблере.
 *
 * @param content поля содержимого кода
 */
export function toCodeContentRequest(
  content: CodeContentFormState,
): CodeContentRequest {
  return {
    rewardTier: content.rewardTier ?? undefined,
    subscriptionType: content.includeSubscription
      ? content.subscriptionType
      : undefined,
    subscriptionMonths: content.includeSubscription
      ? content.subscriptionMonths
      : undefined,
    perks: content.perks.length ? [...content.perks] : undefined,
    achievements: content.achievements.length
      ? [...content.achievements]
      : undefined,
  };
}

/**
 * Разворачивает состояние формы выпуска в тело запроса.
 *
 * @param state состояние формы выпуска кодов
 */
export function toCreateCodesRequest(
  state: CreateCodesFormState,
): CreateCodesRequest {
  const trimmedLabel = state.label.trim();

  return {
    ...toCodeContentRequest(state),
    count: state.count,
    label: trimmedLabel || undefined,
  };
}

/**
 * Короткое описание содержимого кода одной строкой: «Тир 2 · подписка 6 мес. ·
 * перки: 2 · достижения: 1». Подходит и для запроса, и для выпущенного кода.
 *
 * @param content содержимое кода
 */
export function describeCodeContent(content: CodeContentSummarySource): string {
  const parts: string[] = [];

  if (content.rewardTier) {
    parts.push(REWARD_TIER_LABELS[content.rewardTier]);
  }

  if (content.subscriptionMonths) {
    const type = content.subscriptionType
      ? `, ${SUBSCRIPTION_TYPE_LABELS[content.subscriptionType].toLowerCase()}`
      : '';

    parts.push(`подписка ${content.subscriptionMonths} мес.${type}`);
  }

  if (content.perks?.length) {
    parts.push(
      `перки: ${content.perks.map((perk) => REWARD_PERK_LABELS[perk]).join(', ')}`,
    );
  }

  if (content.achievements?.length) {
    parts.push(`достижения: ${content.achievements.join(', ')}`);
  }

  return parts.join(' · ');
}

export const CODE_STATUS_LABELS: Record<CodeStatus, string> = {
  active: 'Активен',
  redeemed: 'Активирован',
  disabled: 'Деактивирован',
};

export const CODE_STATUS_COLORS: Record<
  CodeStatus,
  'success' | 'info' | 'error'
> = {
  active: 'success',
  redeemed: 'info',
  disabled: 'error',
};

/**
 * Производный статус кода: погашенный — «активирован», иначе выключенный —
 * «деактивирован», иначе «активен».
 */
export function getCodeStatus(code: RedemptionCodeResponse): CodeStatus {
  if (code.redeemedBy) {
    return 'redeemed';
  }

  if (code.disabled) {
    return 'disabled';
  }

  return 'active';
}

/** Значение фильтра по статусу, при котором фильтрация отключена («Все»). */
export const CODE_STATUS_FILTER_ALL = 'all';

/** Опции фильтра списка по статусу. */
export const CODE_STATUS_FILTER_OPTIONS: Array<{
  label: string;
  value: CodeStatusFilterValue;
}> = [
  { label: 'Все', value: CODE_STATUS_FILTER_ALL },
  { label: 'Активные', value: 'active' },
  { label: 'Активированные', value: 'redeemed' },
  { label: 'Деактивированные', value: 'disabled' },
];

/** Ключ кеша списка кодов на странице админки. */
export const CODES_LIST_DATA_KEY = 'admin-subscription-codes';

/** Заголовок страницы промокодов в админке. */
export const CODES_PAGE_TITLE = 'Промокоды';

/** Адрес страницы промокодов в админке. */
export const CODES_ADMIN_ROUTE = '/admin/subscriptions';

/** Иконка раздела промокодов в навигации админки. */
export const CODES_NAVIGATION_ICON = 'tabler:ticket';

/** SEO-заголовок страницы промокодов. */
export const CODES_PAGE_SEO_TITLE = 'Промокоды: Настройки';

/** Подпись кнопки открытия формы выпуска кодов. */
export const CODES_CREATE_BUTTON_LABEL = 'Создать код';

/** Плейсхолдер поиска по списку кодов. */
export const CODES_SEARCH_PLACEHOLDER = 'Поиск по коду или пометке';

/** Доступная подпись кнопки очистки поиска. */
export const CODES_SEARCH_CLEAR_LABEL = 'Очистить поиск';

/** Текст ошибки загрузки списка кодов. */
export const CODES_LOAD_ERROR_TEXT = 'Не удалось загрузить коды';

/** Подпись кнопки повторной загрузки списка. */
export const CODES_RETRY_BUTTON_LABEL = 'Повторить';

/** Текст пустого списка, когда кодов ещё не выпускали. */
export const CODES_EMPTY_TEXT = 'Кодов пока нет — создайте первый';

/** Текст пустого списка при активном фильтре по статусу. */
export const CODES_EMPTY_FILTERED_TEXT = 'Нет кодов с таким статусом';

/** Количество строк-скелетонов при загрузке списка кодов. */
export const CODES_LIST_SKELETON_COUNT = 6;

/**
 * Текст пустого списка, когда по поисковому запросу ничего не нашлось.
 *
 * @param query Поисковый запрос без внешних пробелов.
 */
export function codesSearchEmptyText(query: string): string {
  return `По запросу «${query}» ничего не найдено`;
}

/** Подпись включённой оплаты: она же подпись переключателя и тост после включения. */
const SUBSCRIPTION_SALES_ENABLED_LABEL = 'Оплата подписки включена';

/** Строка переключателя оплаты подписки в группе «Пользователи» на главной админки. */
export const SUBSCRIPTION_SALES_SWITCH_TEXT = {
  title: 'Оплата подписки',
  enabledStatus: 'Включена',
  disabledStatus: 'Выключена',
  enabledDescription: 'Кнопка «Оформить» работает, новые платежи создаются.',
  disabledDescription:
    'У всех кнопка «Оформить» неактивна с пометкой «скоро», новые платежи не создаются.',
  switchLabel: SUBSCRIPTION_SALES_ENABLED_LABEL,
  enabledToast: SUBSCRIPTION_SALES_ENABLED_LABEL,
  disabledToast: 'Оплата подписки выключена',
  errorToast: 'Не удалось изменить настройку оплаты',
};

/**
 * Строка оплаты — табло состояния: цвет, значок и подпись меняются вместе, чтобы
 * выключенную оплату было видно с первого взгляда. При выключенной карта перечёркнута,
 * а что из этого следует, говорит подсказка.
 */
export const SUBSCRIPTION_SALES_SWITCH_ENABLED_STATE: SubscriptionSalesSwitchState =
  {
    color: 'success',
    description: SUBSCRIPTION_SALES_SWITCH_TEXT.enabledDescription,
    icon: 'tabler:credit-card',
    iconClass: 'text-success',
    rootClass: 'bg-success/10',
    status: SUBSCRIPTION_SALES_SWITCH_TEXT.enabledStatus,
  };

export const SUBSCRIPTION_SALES_SWITCH_DISABLED_STATE: SubscriptionSalesSwitchState =
  {
    color: 'warning',
    description: SUBSCRIPTION_SALES_SWITCH_TEXT.disabledDescription,
    icon: 'tabler:credit-card-off',
    iconClass: 'text-warning',
    rootClass: 'bg-warning/10',
    status: SUBSCRIPTION_SALES_SWITCH_TEXT.disabledStatus,
  };
