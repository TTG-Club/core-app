import type { BadgeProps, TabsItem } from '@nuxt/ui';

import type { PublicationPlatform } from './types';

import { FIND_GAME_API_PREFIX } from '#shared/consts';

export const PUBLICATION_ROUTE = '/admin/game-publications';
// Прежний путь API позволяет обновлять сайт и сервис игр по очереди.
export const PUBLICATION_API = `${FIND_GAME_API_PREFIX}/admin/discord-publications`;
export const PUBLICATION_ICON = 'tabler:send';
export const PUBLICATION_LEGACY_ROUTE = '/admin/discord-publications';
export const PUBLICATION_DEFAULT_PLATFORM = 'DISCORD';
export const PUBLICATION_PLATFORMS = {
  DISCORD: { label: 'Discord', value: 'DISCORD', icon: 'ttg:discord' },
  TELEGRAM: { label: 'Telegram', value: 'TELEGRAM', icon: 'ttg:telegram' },
  VK: { label: 'ВКонтакте', value: 'VK', icon: 'ttg:vk' },
} satisfies Record<
  PublicationPlatform,
  { label: string; value: PublicationPlatform; icon: string }
>;
export const PUBLICATION_PLATFORM_OPTIONS = Object.values(
  PUBLICATION_PLATFORMS,
);
/** ID группы или канала Telegram: минус и до 16 цифр без ведущего нуля. */
export const PUBLICATION_TELEGRAM_ID_PATTERN = /^-[1-9]\d{0,15}$/;
/** Нижняя граница ID Telegram: за ней число теряет точность в JavaScript. */
export const PUBLICATION_TELEGRAM_ID_LIMIT = -4_503_599_627_370_495;
/** ID сообщества ВКонтакте: число; минус из owner_id допускается, сервис его отбросит. */
export const PUBLICATION_VK_ID_PATTERN = /^-?[1-9]\d{0,11}$/;
export const PUBLICATION_TELEGRAM_ID_VISIBILITY = {
  hidden: {
    type: 'password',
    icon: 'tabler:eye',
    label: 'Показать введённый ID',
  },
  visible: {
    type: 'text',
    icon: 'tabler:eye-off',
    label: 'Скрыть введённый ID',
  },
};
/** Ошибки расписания: и у самого поля, и у любого его слота. */
export const PUBLICATION_SCHEDULE_ERROR_PATTERN = /^schedule(?:\.|$)/;
export const PUBLICATION_ICONS = {
  add: 'tabler:plus',
  remove: 'tabler:x',
  refresh: 'tabler:refresh',
  external: 'tabler:external-link',
  test: 'tabler:send',
  schedule: 'tabler:calendar-clock',
  edit: 'tabler:settings',
};
export const PUBLICATION_FETCH_KEYS = {
  settings: 'admin-game-publications-settings',
  preview: 'admin-game-publications-preview',
  history: 'admin-game-publications-history',
};
/** Предел дней и времени в одном расписании. */
export const PUBLICATION_MAX_SLOTS = 14;
/** Предел каналов в ответе сервиса. */
export const PUBLICATION_MAX_CHANNELS = 100;
/** Сколько игр попадает в одну подборку. */
export const PUBLICATION_MAX_GAMES = 8;
// Во время обновления API ещё может вернуть подборку прежнего размера.
export const PUBLICATION_LEGACY_MAX_GAMES = 10;
/** Предел длины перечисления жанров игры в подборке. */
export const PUBLICATION_MAX_GENRES_LENGTH = 80;
/** Сколько последних отправок отдаёт журнал. */
export const PUBLICATION_MAX_HISTORY = 50;
/** Заготовка нового слота расписания: пятница, вечер. */
export const PUBLICATION_DEFAULT_SLOT = { day: 5, time: '19:00' };
/** Версия ещё не сохранённого канала. */
export const PUBLICATION_INITIAL_REVISION = 0;
/** Предел ожидания ответа сервиса публикаций, мс. */
export const PUBLICATION_REQUEST_TIMEOUT = 20_000;
export const PUBLICATION_DATE_FORMAT = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Europe/Moscow',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
export const PUBLICATION_DAYS = [
  { label: 'Понедельник', value: 1 },
  { label: 'Вторник', value: 2 },
  { label: 'Среда', value: 3 },
  { label: 'Четверг', value: 4 },
  { label: 'Пятница', value: 5 },
  { label: 'Суббота', value: 6 },
  { label: 'Воскресенье', value: 7 },
];
export const PUBLICATION_STATUS_LABELS = {
  SENDING: 'Отправляется',
  SENT: 'Опубликовано',
  RETRY: 'Ожидает повтора',
  FAILED: 'Ошибка отправки',
  UNKNOWN: 'Нужно проверить канал',
  SKIPPED: 'Пропущено',
};
export const PUBLICATION_TEXT = {
  title: 'Публикации игр',
  description:
    'Игры разных систем по расписанию — в ваши каналы Discord, Telegram и ВКонтакте.',
  selection: `До ${PUBLICATION_MAX_GAMES} игр с открытым набором: по одной от каждой системы, затем следующий круг. Внутри системы — порядок каталога. Название, система, места, жанры и ссылка на сайт.`,
  timezone: 'Все дни и время указаны по Москве (UTC+3).',
  global: 'Общее расписание',
  enabled: 'Публикации включены',
  globalHint: 'Действует для всех каналов без индивидуального расписания.',
  globalActive: 'Публикации включены',
  globalPaused: 'Публикации приостановлены',
  configure: 'Настроить',
  close: 'Закрыть',
  channels: 'Каналы',
  channelSettings: 'Настройки канала',
  addChannel: 'Добавить канал',
  noChannels: 'Добавьте канал Discord, Telegram или сообщество ВКонтакте.',
  platform: 'Платформа',
  telegramChatId: 'ID группы или канала Telegram',
  telegramChatIdPlaceholder: '-1001234567890',
  telegramHint:
    'Укажите числовой ID, начиная с минуса. Добавьте бота в группу с правом отправки сообщений или в канал администратором с правом публикации. ID хранится зашифрованным.',
  telegramSaved:
    'ID сохранён и не показывается. Оставьте поле пустым, чтобы сохранить прежний.',
  telegramUnavailable:
    'Бот Telegram ещё не подключён на сервере. Каналы можно сохранить, отправка станет доступна после подключения бота.',
  invalidTelegramChatId:
    'Укажите числовой ID группы или канала, начиная с минуса',
  vkGroupId: 'ID сообщества ВКонтакте',
  vkGroupIdPlaceholder: '123456789',
  vkHint:
    'Укажите числовой ID сообщества: для vk.com/club123456789 это 123456789. Подборка публикуется записью на стене от имени сообщества ключом, заданным на сервере. Тестовая запись тоже появится на стене — удалите её вручную.',
  vkDefaultHint:
    'Оставьте поле пустым, чтобы публиковать в сообщество из настроек сервера (VK_GROUP_ID), или укажите другой числовой ID. Тестовая запись тоже появится на стене — удалите её вручную.',
  vkSaved:
    'ID сохранён и не показывается. Оставьте поле пустым, чтобы сохранить прежний.',
  vkUnavailable:
    'Ключ сообщества ВКонтакте ещё не подключён на сервере. Каналы можно сохранить, публикация станет доступна после подключения ключа.',
  invalidVkGroupId: 'Укажите числовой ID сообщества ВКонтакте',
  name: 'Название канала',
  webhook: 'Discord-вебхук',
  webhookHint:
    'Вставьте вебхук текстового канала Discord. Ссылка сохраняется в базе зашифрованной и не показывается после сохранения.',
  webhookSaved:
    'Вебхук сохранён. Оставьте поле пустым, чтобы сохранить прежний.',
  channelEnabled: 'Канал включён',
  inherit: 'Использовать общее расписание',
  override: 'Индивидуальное расписание полностью заменяет общее.',
  inherited: 'Общее расписание',
  individual: 'Индивидуальное расписание',
  paused: 'Выключен',
  active: 'Включён',
  next: 'Следующая публикация',
  notScheduled: 'Не запланирована',
  noSchedule: 'Расписание не задано',
  addSlot: 'Добавить день и время',
  removeSlot: 'Удалить время',
  day: 'День недели',
  time: 'Время',
  save: 'Сохранить',
  cancel: 'Отмена',
  edit: 'Изменить',
  test: 'Отправить тест',
  testHint:
    'Отправляет одно тестовое сообщение, даже если расписание выключено.',
  testSent: 'Тестовое сообщение доставлено.',
  testUnknown:
    'Нет подтверждения тестовой отправки. Проверьте канал перед повтором.',
  testLimited:
    'Проверка уже выполняется или действует ограничение частоты. Подождите и попробуйте позже.',
  channelMissing: 'Канал удалён. Обновите страницу.',
  remove: 'Удалить',
  confirmRemove: 'Подтвердить удаление',
  preview: 'Что будет отправлено',
  previewTab: 'Подборка',
  refresh: 'Обновить',
  previewHint:
    'Одно сообщение до 2000 символов, со вступлением и ссылкой на весь каталог. Состав и места обновляются перед отправкой.',
  noGames: 'Подходящих игр пока нет. Пустая подборка не отправляется.',
  taken: 'Занято',
  free: 'Свободно',
  genres: 'Жанры',
  more: 'Подробнее',
  history: `Последние ${PUBLICATION_MAX_HISTORY} публикаций`,
  noHistory: 'Публикаций пока не было.',
  historyCount: 'Игр в подборке',
  loading: 'Загружаем настройки…',
  unavailable:
    'Сервис публикаций временно недоступен. Попробуйте обновить страницу.',
  loadError:
    'Не удалось загрузить данные публикаций. Попробуйте обновить страницу.',
  saveError:
    'Не удалось сохранить изменения. Проверьте данные и повторите попытку.',
  conflict:
    'Настройки изменены в другой вкладке или этот адрес канала уже добавлен. Обновите данные перед повторным сохранением.',
  forbidden:
    'Недостаточно прав. Обновите страницу и проверьте вход в аккаунт администратора.',
  saved: 'Настройки сохранены.',
  deliveryHint:
    'После простоя более 15 минут выпуск пропускается. Отправленное сообщение нельзя отозвать изменением расписания. Если доставка не подтверждена, проверьте канал: автоматического повтора не будет.',
  nameRequired: 'Введите название канала',
  invalidWebhook: 'Укажите вебхук текстового канала discord.com',
  invalidSchedule: `Добавьте от 1 до ${PUBLICATION_MAX_SLOTS} разных дней и времени`,
  invalidTime: 'Укажите время в формате ЧЧ:ММ',
};

export const PUBLICATION_DEFAULT_TAB = 'channels';
export const PUBLICATION_TABS = [
  {
    label: PUBLICATION_TEXT.channels,
    value: PUBLICATION_DEFAULT_TAB,
    slot: 'channels',
  },
  { label: PUBLICATION_TEXT.previewTab, value: 'preview', slot: 'preview' },
  { label: 'История', value: 'history', slot: 'history' },
] satisfies TabsItem[];

export const PUBLICATION_CHANNEL_BADGES = {
  active: { label: PUBLICATION_TEXT.active, color: 'success' },
  paused: { label: PUBLICATION_TEXT.paused, color: 'neutral' },
} satisfies Record<'active' | 'paused', Pick<BadgeProps, 'label' | 'color'>>;
