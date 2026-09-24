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
  hirelings: 'наёмников',
  squares: 'кв.',
} as const;

/** Значение вкладки «Бастионы» на странице игры. */
export const GAME_BASTIONS_TAB_VALUE = 'bastions';

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
    'Бастионы видят все участники игры. Менять бастион могут мастер и игроки, которым он дал доступ.',
  create: 'Создать бастион',
  empty: 'В игре пока нет бастионов',
  emptyMaster: 'Создайте бастион и дайте к нему доступ игрокам',
  emptyPlayer: 'Мастер ещё не создал бастионы',
  open: 'Открыть',
  edit: 'Изменить',
  archive: 'В архив',
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
  updated: 'Бастион сохранён',
  archived: 'Бастион отправлен в архив',
  saveError: 'Не удалось сохранить бастион',
} as const;

export const BASTION_FORM_LABELS = {
  createTitle: 'Новый бастион',
  editTitle: 'Бастион',
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
  members: 'Игроки и персонажи',
  notFound: 'Бастион не найден',
  forbidden: 'Бастион видят только участники игры',
  loadError: 'Не удалось открыть бастион',
  seoTitle: 'Бастион',
} as const;
