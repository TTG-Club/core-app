import type { PlayerBastionStatus } from './schema';

export const PLAYER_BASTIONS_API_PATH = '/api/v2/player-bastions';

/** Справочник сооружений для экрана выбора (раздел «Бастионы» сайта). */
export const BASTION_FACILITY_CATALOG_API_PATH = '/api/v2/bastions/search';

/** Пространства стартовых базовых сооружений: одно тесное, одно вместительное. */
export const STARTING_BASIC_SPACES = ['CRAMPED', 'ROOMY'] as const;

export const STARTING_BASIC_SPACE_LABELS: Record<
  (typeof STARTING_BASIC_SPACES)[number],
  string
> = {
  CRAMPED: 'Тесное',
  ROOMY: 'Вместительное',
};

export const FACILITY_SETUP_LABELS = {
  title: 'Сооружения персонажа',
  choose: 'Выбрать сооружения',
  basicTitle: 'Базовые сооружения',
  basicHint:
    'Бесплатно: одно тесное и одно вместительное. Игровых эффектов не дают, но оживляют бастион.',
  basicPlaceholder: 'Выберите сооружение',
  specialTitle: 'Специализированные сооружения',
  specialCounter: 'Выбрано {count} из {limit}',
  specialNone:
    'Персонажу ниже 5 уровня специализированные сооружения не положены.',
  levelGroup: '{level} уровень',
  repeatable: 'можно несколько',
  prerequisite: 'Требование',
  prerequisitePending: 'Ждёт подтверждения мастера',
  prerequisiteConfirmed: 'Требование подтверждено',
  confirm: 'Подтвердить',
  unconfirm: 'Снять подтверждение',
  choicePlaceholder: 'Выберите вариант',
  save: 'Сохранить',
  cancel: 'Отмена',
  saved: 'Сооружения сохранены',
  saveError: 'Не удалось сохранить сооружения',
  catalogError: 'Не удалось загрузить справочник сооружений',
  empty: 'Сооружения ещё не выбраны',
  basicMissing: 'Не выбраны стартовые базовые сооружения',
  add: 'Добавить',
  remove: 'Убрать',
  hirelings: 'Наёмники: {count}',
  hirelingsMissing:
    'Наёмники: {count}. Ещё {missing} забрало событие, замену найдут бесплатно',
  defenders: 'Защитники: {count} из {capacity}',
  creatures: 'Зверинец: {names}. Свободно {free} из {capacity} больших мест',
  creaturesEmpty: 'Зверинец пуст. Свободно {free} из {capacity} больших мест',
  creatureNotDefender: '{name} (не защитник)',
  squares: 'кв.',
} as const;

/** Значение вкладки «Бастионы» на странице игры. */
export const GAME_BASTIONS_TAB_VALUE = 'bastions';

/** Страница «Мои бастионы». */
export const MY_BASTIONS_ROUTE = '/tools/bastion';

/** Бастион по ссылке «поделиться»: открывается кем угодно, только на чтение. */
export const SHARED_BASTION_ROUTE = '/tools/bastion/shared';

export const BASTION_SHARE_LABELS = {
  share: 'Поделиться',
  title: 'Поделиться бастионом',
  hint: 'По ссылке бастион и его план открываются только на чтение. Право на правку человек попросит у вас.',
  enable: 'Включить ссылку',
  disable: 'Отключить ссылку',
  disableHint:
    'Ссылка перестанет работать, а все выданные права на правку снимутся.',
  copy: 'Скопировать ссылку',
  copied: 'Ссылка скопирована',
  editors: 'Право на правку',
  noEditors: 'Запросов пока нет',
  pending: 'Просит право на правку',
  approved: 'Может править',
  approve: 'Разрешить',
  decline: 'Отклонить',
  revoke: 'Отозвать',
  requests: 'Запросов на правку: {count}',
  error: 'Не удалось изменить доступ',
  sharedTitle: 'Бастион по ссылке',
  readOnly: 'Только просмотр',
  notFound: 'Бастион недоступен',
  notFoundHint: 'Ссылка неверна или владелец отключил доступ по ней',
  toHome: 'На главную',
  signIn: 'Войдите, чтобы попросить право на правку',
  requestEdit: 'Попросить право на правку',
  requested: 'Запрос отправлен владельцу',
  requestSent: 'Запрос отправлен',
  open: 'Открыть бастион',
  sharedWithMe: 'Доступные мне',
  sharedWithMeHint: 'Чужие бастионы, которые владельцы разрешили вам править',
} as const;

/** Уровень персонажа, с которого у него появляется бастион. */
export const BASTION_START_LEVEL = 5;
export const CHARACTER_LEVEL_MIN = 1;
export const CHARACTER_LEVEL_MAX = 20;
export const BASTION_NAME_MAX_LENGTH = 100;

export const PLAYER_BASTION_STATUS_LABELS: Record<PlayerBastionStatus, string> =
  {
    SETUP: 'Закладка',
    ACTIVE: 'Действует',
    ARCHIVED: 'В архиве',
  };

export const PLAYER_BASTION_STATUS_COLORS: Record<
  PlayerBastionStatus,
  'info' | 'success' | 'neutral'
> = {
  SETUP: 'info',
  ACTIVE: 'success',
  ARCHIVED: 'neutral',
};

export const BASTION_GAME_LABELS = {
  panelTitle: 'Бастионы игры',
  panelDescription:
    'Бастионы видят все участники игры. Ведёт бастион мастер, менять его могут игроки с доступом.',
  add: 'Добавить бастион',
  empty: 'В игре пока нет бастионов',
  emptyDescription: 'Добавьте в игру свой бастион из «Моих бастионов»',
  open: 'Открыть',
  edit: 'Изменить',
  archive: 'В архив',
  leaveGame: 'Убрать из игры',
  leaveGameConfirmTitle: 'Убрать бастион из игры?',
  leaveGameConfirmDescription:
    'Бастион вернётся к владельцу со всеми сооружениями, планом и журналами.',
  leaveGameConfirm: 'Убрать',
  leftGame: 'Бастион убран из игры',
  inGame: 'В игре',
  archiveConfirmTitle: 'Отправить бастион в архив?',
  archiveConfirmDescription:
    'Бастион останется для просмотра, но менять его больше будет нельзя.',
  archiveConfirm: 'Отправить в архив',
  cancel: 'Отмена',
  yours: 'Ваш',
  turn: 'Ход',
  treasury: 'Казна',
  gold: 'зм',
  noMembers: 'Доступ пока ни у кого',
  level: 'ур.',
  specialFacilities: 'спец. сооружений',
  loadError: 'Не удалось загрузить бастионы',
  retry: 'Повторить',
  created: 'Бастион создан',
  added: 'Бастион добавлен в игру',
  updated: 'Бастион сохранён',
  archived: 'Бастион отправлен в архив',
  saveError: 'Не удалось сохранить бастион',
} as const;

export const BASTION_FORM_LABELS = {
  createTitle: 'Новый бастион',
  editTitle: 'Бастион',
  owner: 'Ваш персонаж',
  ownerHint:
    'Персонаж владельца сразу получает доступ. Лимит специализированных сооружений считается по его уровню.',
  outsideGame:
    'Дать доступ другим игрокам можно, когда бастион добавлен в игру.',
  name: 'Название',
  namePlaceholder: 'Вороний утёс',
  players: 'Доступ игрокам',
  playersHint:
    'Лимит специализированных сооружений считается на персонажа по его уровню.',
  noPlayers:
    'В игре пока нет игроков с одобренной заявкой — доступ можно дать позже.',
  characterName: 'Персонаж',
  characterNamePlaceholder: 'Имя персонажа',
  characterLevel: 'Уровень',
  belowStartLevel: 'Бастион появляется с 5 уровня',
  save: 'Сохранить',
  create: 'Создать',
  cancel: 'Отмена',
  nameRequired: 'Введите название бастиона',
} as const;

export const BASTION_DETAIL_LABELS = {
  back: 'К игре',
  backToMine: 'Мои бастионы',
  members: 'Игроки и персонажи',
  notFound: 'Бастион не найден',
  forbidden:
    'Бастион видят его владелец, игроки с доступом и участники его игры',
  loadError: 'Не удалось открыть бастион',
  activate: 'Запустить бастион',
  activateHint:
    'Когда у всех персонажей выбраны базовые сооружения, бастион можно запустить: закладка заканчивается, начинаются ходы. В игре это делает мастер.',
  activated: 'Бастион запущен',
  activateError: 'Не удалось запустить бастион',
  seoTitle: 'Бастион',
} as const;

export const MY_BASTIONS_LABELS = {
  title: 'Мои бастионы',
  description:
    'Бастионы принадлежат вам, как листы персонажа. Здесь их создают, меняют и удаляют, а в игру бастион добавляется со страницы игры.',
  create: 'Создать бастион',
  empty: 'У вас пока нет бастионов',
  emptyDescription:
    'Создайте бастион, выберите стартовые сооружения и нарисуйте план.',
  counter: '{count} из {limit}',
  limitReached: 'Достигнут лимит бастионов. Удалите один из существующих.',
  subscriberHint: 'С подпиской можно создать до {limit} бастионов.',
  remove: 'Удалить',
  removeConfirmTitle: 'Удалить бастион?',
  removeConfirmDescription:
    'Бастион удалится вместе с сооружениями, планом и журналами. Это нельзя отменить.',
  removeConfirm: 'Удалить',
  removed: 'Бастион удалён',
  loadError: 'Не удалось загрузить бастионы',
} as const;

export const BASTION_JOIN_LABELS = {
  title: 'Добавить бастион в игру',
  description:
    'Бастион может быть только в одной игре. Вести его в игре будет мастер.',
  empty: 'Свободных бастионов нет: все уже в играх или ещё не созданы.',
  createLink: 'Мои бастионы',
  submit: 'Добавить',
  cancel: 'Отмена',
  loadError: 'Не удалось загрузить ваши бастионы',
} as const;

/**
 * Значки инструментов ремесленников по основе названия («Инструменты
 * кузнеца» → молот). Ищется первое совпадение в названии без учёта регистра.
 */
export const ARTISAN_TOOL_ICONS: ReadonlyArray<
  readonly [stem: string, icon: string]
> = [
  ['алхимик', 'tabler:flask'],
  ['пивовар', 'tabler:beer'],
  ['каллиграф', 'tabler:writing'],
  ['плотник', 'tabler:axe'],
  ['картограф', 'tabler:map'],
  ['сапожник', 'tabler:shoe'],
  ['повар', 'tabler:chef-hat'],
  ['стеклодув', 'tabler:glass-full'],
  ['ювелир', 'tabler:diamond'],
  ['кожевник', 'tabler:needle'],
  ['каменщик', 'tabler:wall'],
  ['художник', 'tabler:palette'],
  ['гончар', 'tabler:cup'],
  ['кузнец', 'tabler:hammer'],
  ['жестянщик', 'tabler:tools'],
  ['ремонтник', 'tabler:tools'],
  ['ткач', 'tabler:needle-thread'],
  ['резчик', 'tabler:tree'],
];

/** Сколько четвертей места занимает большое существо в вольерах зверинца. */
export const MENAGERIE_LARGE_SPACE = 4;

/** Размеры существ, которых держат в вольерах зверинца. */
export const MENAGERIE_SIZES = [
  { value: 'TINY', label: 'Крошечный' },
  { value: 'SMALL', label: 'Маленький' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'LARGE', label: 'Большой' },
] as const;

export type MenagerieSizeCode = (typeof MENAGERIE_SIZES)[number]['value'];
