import type {
  AbilityBonusMode,
  AbilityKey,
  ArmorDexterityMod,
  ArmorProficiencyGroup,
  CharacterClassResource,
  CharacterCustomCurrency,
  CurrencyKey,
  CustomArmorType,
  CustomArmorTypeMeta,
  CustomInventoryItemDraft,
  CustomInventoryKind,
  CustomSpellField,
  FeatureOrigin,
  HitPointsGainMode,
  InventoryItemCategory,
  InventoryStatRollKind,
  LanguageProficiencyGroup,
  ResourceRecovery,
  RollMode,
  SheetSaveStatus,
  SheetTab,
  SkillProficiencyLevel,
  SpeedTypeKey,
  SpeedUnit,
  ToolProficiencyGroup,
  VisionKey,
  WeaponCategory,
  WeaponProficiencyGroup,
} from './types';

import bytes from 'bytes';

import { CasterType } from '~classes/model';

/** Название инструмента «Лист персонажа». */
export const CHARACTER_SHEET_TITLE = 'Лист персонажа';

/** Заголовок раздела со списком листов персонажей. */
export const CHARACTER_SHEET_LIST_TITLE = 'Листы персонажей';

/** Базовый путь раздела листов персонажей. */
export const CHARACTER_SHEET_ROUTE = '/tools/character-sheet';

/** Эндпоинт листов персонажей (проксируется на core-api). */
export const CHARACTER_SHEET_API_PATH = '/api/v2/tools/character-sheet';

/**
 * Базовый путь просмотра листа по ссылке «поделиться». Открывается без
 * авторизации и без роли: доступ решает токен ссылки, а не сессия.
 */
export const CHARACTER_SHEET_SHARED_ROUTE = `${CHARACTER_SHEET_ROUTE}/shared`;

/** Эндпоинт чтения листа по ссылке (публичный, без авторизации). */
export const CHARACTER_SHEET_SHARED_API_PATH = `${CHARACTER_SHEET_API_PATH}/shared`;

/** Эндпоинт чужих листов, сохранённых по ссылке. */
export const CHARACTER_SHEET_SAVED_API_PATH = `${CHARACTER_SHEET_API_PATH}/saved`;

/**
 * Префикс значения `?detail=` у листа, открытого по ссылке: за префиксом идёт токен, а не
 * идентификатор листа. Один query-параметр на оба вида карточек — иначе пришлось бы гасить
 * второй параметр при каждом переключении и учить это `useSectionLink`.
 */
export const SHARED_DETAIL_QUERY_PREFIX = 'shared:';

/**
 * Идентификатор несохранённого черновика (`DEFAULT_CHARACTER`). У загруженного
 * листа id — серверный UUID; черновик с этим id автосохранению не подлежит.
 */
export const DRAFT_CHARACTER_ID = 'new-character';

/** Дебаунс автосохранения листа персонажа. */
export const SHEET_SAVE_DEBOUNCE_MS = 1500;

/** Раздел S3 для изображений персонажей (первый сегмент ключа объекта). */
export const SHEET_AVATAR_S3_SECTION = 'character-sheet';

/**
 * Длина короткой стороны, до которой сервер сожмёт изображение персонажа.
 * Аватар рисуется в 96px — 512 даёт запас на экраны с высокой плотностью.
 */
export const SHEET_AVATAR_MAX_SIZE = '512';

/** Суффикс имени копии листа персонажа. */
export const SHEET_COPY_NAME_SUFFIX = ' (копия)';

/** Причина недоступности копии: свободных мест в лимите не осталось. */
export const SHEET_COPY_LIMIT_HINT = 'Достигнут лимит листов';

/** Заголовок тоста с ошибкой копирования листа. */
export const SHEET_COPY_ERROR_TITLE = 'Не удалось создать копию листа';

/** Заголовок тоста о созданной копии листа. */
export const SHEET_COPY_SUCCESS_TITLE = 'Копия листа создана';

/** Имя файла экспорта листа, когда у персонажа пустое имя. */
export const CHARACTER_FILE_NAME_FALLBACK = 'персонаж';

/** Подпись кнопки импорта листа из файла. */
export const SHEET_IMPORT_LABEL = 'Импорт JSON';

/** Пояснение к кнопке импорта: какой файл от пользователя ждут. */
export const SHEET_IMPORT_HINT =
  'Создаст лист из JSON-файла, скачанного экспортом';

/** Строка для атрибута `accept` диалога выбора файла листа. */
export const SHEET_IMPORT_ACCEPT = 'application/json,.json';

/**
 * Максимальный вес импортируемого файла: документ листа весит десятки
 * килобайт, поэтому всё, что заметно крупнее, читать в память незачем.
 */
export const SHEET_IMPORT_MAX_WEIGHT = bytes('2MB')!;

/** Заголовок тоста с ошибкой импорта листа. */
export const SHEET_IMPORT_ERROR_TITLE = 'Не удалось импортировать лист';

/** Заголовок тоста об импортированном листе. */
export const SHEET_IMPORT_SUCCESS_TITLE = 'Лист импортирован';

/** Причина отказа импорта: файл слишком большой для документа листа. */
export const SHEET_IMPORT_SIZE_ERROR =
  'Файл слишком большой для листа персонажа';

/** Причина отказа импорта: в файле не лист персонажа. */
export const SHEET_IMPORT_PARSE_ERROR =
  'Выберите JSON-файл, скачанный из листа персонажа';

/** Общее сообщение об ошибке, когда бэк не вернул текст. */
export const SHEET_UNKNOWN_ERROR_MESSAGE = 'Неизвестная ошибка';

/** Подпись пункта меню «скачать JSON». */
export const SHEET_DOWNLOAD_JSON_LABEL = 'Скачать JSON';

/** Подпись пункта меню «скачать PDF». */
export const SHEET_DOWNLOAD_PDF_LABEL = 'Скачать PDF';

/** Пояснение к пункту «скачать PDF» в меню действий. */
export const SHEET_DOWNLOAD_PDF_HINT = 'Лист для печати';

/** MIME-тип файла листа в PDF. */
export const SHEET_PDF_MIME_TYPE = 'application/pdf';

/** Заголовок тоста при сбое сборки PDF. */
export const SHEET_PDF_ERROR_TITLE = 'Не удалось собрать PDF листа';

/** Подписи и иконки статусов автосохранения листа. */
export const SHEET_SAVE_STATUS_META: Record<
  SheetSaveStatus,
  { label: string; icon: string }
> = {
  saved: { label: 'Сохранено', icon: 'tabler:cloud-check' },
  saving: { label: 'Сохранение…', icon: 'tabler:loader-2' },
  error: { label: 'Не удалось сохранить', icon: 'tabler:cloud-x' },
};

/** Сообщение при попытке редактирования заблокированного листа. */
export const SHEET_LOCKED_MESSAGE = 'Лист заблокирован от редактирования';

/**
 * Сообщение при попытке правки листа, открытого по ссылке. Страховка на случай,
 * если редактирующее действие всё же вызвано: сервер такой запрос не примет.
 */
export const SHEET_READONLY_MESSAGE =
  'Лист открыт по ссылке — доступен только просмотр';

/**
 * Класс скрытия кнопки, недоступной без прав (шестерёнки, ±, карандаши, корзины,
 * «Добавить»). Прячем видимостью, а не удалением из разметки: место за кнопкой
 * остаётся, поэтому раскладка листа в режиме просмотра совпадает с раскладкой в
 * режиме правок — ничего не съезжает.
 */
export const SHEET_HIDDEN_CONTROL_CLASS = 'invisible';

/** Подпись и подсказка режима просмотра в шапке чужого листа. */
export const SHEET_READONLY_LABELS: Record<'badge' | 'tooltip', string> = {
  badge: 'Только просмотр',
  tooltip: 'Лист открыт по ссылке: правки недоступны',
};

/**
 * Подзаголовки экрана «Лист не найден». У листа по ссылке 404 означает не
 * «чужой лист», а отозванный доступ — причина объясняется по-разному.
 */
export const SHEET_NOT_FOUND_SUBTITLES: Record<'own' | 'shared', string> = {
  own: 'Возможно, он был удалён или принадлежит другому пользователю',
  shared: 'Владелец отозвал ссылку или удалил лист',
};

/**
 * Приглашение войти на странице списка листов: раздел виден и анониму, но
 * листы хранятся в профиле — без входа их не создать и не сохранить.
 */
export const SHEET_LOGIN_PROMPT: Record<
  'title' | 'subtitle' | 'action',
  string
> = {
  title: 'Войдите, чтобы создавать листы персонажей',
  subtitle:
    'Листы хранятся в профиле и доступны после входа. Чужой лист по ссылке «поделиться» открывается и без него.',
  action: 'Войти',
};

/** Подписи модалки «Поделиться листом». */
export const SHEET_SHARE_LABELS: Record<
  | 'title'
  | 'linkTitle'
  | 'linkAriaLabel'
  | 'copy'
  | 'share'
  | 'enable'
  | 'disable'
  | 'close'
  | 'enabledHint'
  | 'disabledHint'
  | 'viewerNoteTitle'
  | 'viewerNoteDescription',
  string
> = {
  title: 'Поделиться листом',
  linkTitle: 'Ссылка на лист',
  linkAriaLabel: 'Ссылка на лист персонажа',
  copy: 'Скопировать ссылку',
  share: 'Поделиться ссылкой',
  enable: 'Включить доступ по ссылке',
  disable: 'Отключить доступ',
  close: 'Закрыть',
  enabledHint:
    'Лист откроется у любого, кто перейдёт по ссылке. Редактировать его смогут только вы.',
  disabledHint:
    'Пока доступ выключен, лист виден только вам. Ссылку можно отозвать в любой момент.',
  viewerNoteTitle: 'Гость видит лист целиком',
  viewerNoteDescription:
    'Правки, броски и настройки ему недоступны — редактирование остаётся только у вас.',
};

/**
 * Подписи поиска в модалках добавления. Разные подсказки на месте: в узком
 * сайдбаре с фильтрами помещается только короткая, в широкой форме визарда
 * уточняем, что ищем по названию.
 */
export const SHEET_SEARCH_LABELS: Record<
  'placeholder' | 'byNamePlaceholder' | 'clear',
  string
> = {
  placeholder: 'Поиск…',
  byNamePlaceholder: 'Поиск по названию…',
  clear: 'Очистить поиск',
};

/** Заголовок тоста с ошибкой доступа по ссылке. */
export const SHEET_SHARE_ERROR_TITLE = 'Не удалось изменить доступ по ссылке';

/** Заголовок тоста об отозванной ссылке. */
export const SHEET_SHARE_REVOKED_TITLE = 'Доступ по ссылке отключён';

/** Пояснение тоста об отозванной ссылке. */
export const SHEET_SHARE_REVOKED_DESCRIPTION =
  'Прежняя ссылка больше не откроет лист.';

/** Пометка в меню действий: доступ по ссылке уже включён. */
export const SHEET_SHARE_ACTIVE_HINT = 'Ссылка активна';

/**
 * Подпись кнопки быстрого просмотра листа рядом со списком: drawer в
 * стандартном режиме, правая панель в широком. Общая для карточки своего листа
 * и карточки чужого — действие у них одно и то же.
 */
export const SHEET_OPEN_IN_PANEL_LABEL = 'Открыть в панели';

/**
 * Подпись обратного действия — «развернуть» лист из drawer или правой панели на
 * отдельную страницу. Общая для шапки листа и для шапки drawer.
 */
export const SHEET_OPEN_ON_PAGE_LABEL = 'Открыть на отдельной странице';

/** Заголовок раздела с чужими листами, сохранёнными по ссылке. */
export const SAVED_SHEETS_TITLE = 'Другие листы';

/** Подписи раздела «Другие листы» в списке персонажей. */
export const SAVED_SHEETS_LABELS: Record<
  | 'empty'
  | 'limitReached'
  | 'unavailable'
  | 'unavailableHint'
  | 'readonlyBadge'
  | 'open'
  | 'remove'
  | 'removeTitle'
  | 'removeDescription',
  string
> = {
  empty:
    'Сюда попадают чужие листы, открытые вам по ссылке: сохраните лист со страницы ссылки, чтобы держать его под рукой.',
  limitReached:
    'Достигнут лимит сохранённых листов — уберите один, чтобы сохранить новый.',
  unavailable: 'Доступ к листу закрыт',
  unavailableHint:
    'Владелец отозвал ссылку или удалил лист. Попросите новую ссылку и сохраните её заново.',
  readonlyBadge: 'Только просмотр',
  open: SHEET_OPEN_IN_PANEL_LABEL,
  remove: 'Убрать',
  removeTitle: 'Убрать лист из сохранённых?',
  removeDescription:
    'Лист останется у владельца — пропадёт только ссылка на него в вашем списке.',
};

/** Подписи пунктов меню, которыми чужой лист сохраняется к себе. */
export const SHEET_SAVE_SHARED_LABELS: Record<
  'copy' | 'save' | 'saved',
  string
> = {
  copy: 'Создать копию',
  save: `Добавить в «${SAVED_SHEETS_TITLE}»`,
  saved: `Уже в «${SAVED_SHEETS_TITLE}»`,
};

/** Заголовок тоста с ошибкой сохранения чужого листа по ссылке. */
export const SHEET_SAVE_LINK_ERROR_TITLE = 'Не удалось сохранить лист';

/** Заголовок тоста о сохранённой ссылке на чужой лист. */
export const SHEET_SAVE_LINK_SUCCESS_TITLE = 'Лист сохранён';

/** Заголовок тоста с ошибкой удаления сохранённой ссылки. */
export const SHEET_SAVE_LINK_REMOVE_ERROR_TITLE =
  'Не удалось убрать лист из сохранённых';

/** Заголовок тоста с ошибкой копирования чужого листа себе. */
export const SHEET_SHARED_COPY_ERROR_TITLE = 'Не удалось скопировать лист';

/** Заголовок тоста о скопированном чужом листе. */
export const SHEET_SHARED_COPY_SUCCESS_TITLE = 'Лист скопирован';

/** Причина недоступности сохранения: свободных мест в лимите не осталось. */
export const SHEET_SAVE_LINK_LIMIT_HINT = 'Достигнут лимит сохранённых листов';

/** Порядок отображения характеристик. */
export const ABILITY_ORDER: AbilityKey[] = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
];

/** Полные названия характеристик. */
export const ABILITY_LABELS: Record<AbilityKey, string> = {
  strength: 'Сила',
  dexterity: 'Ловкость',
  constitution: 'Телосложение',
  intelligence: 'Интеллект',
  wisdom: 'Мудрость',
  charisma: 'Харизма',
};

/** Сокращённые названия характеристик. */
export const ABILITY_SHORT_LABELS: Record<AbilityKey, string> = {
  strength: 'Сил',
  dexterity: 'Лов',
  constitution: 'Тел',
  intelligence: 'Инт',
  wisdom: 'Мдр',
  charisma: 'Хар',
};

/** Порядок отображения денежных единиц. */
export const CURRENCY_ORDER: CurrencyKey[] = [
  'copper',
  'silver',
  'electrum',
  'gold',
  'platinum',
];

/** Сокращённые названия денежных единиц. */
export const CURRENCY_LABELS: Record<CurrencyKey, string> = {
  copper: 'ММ',
  silver: 'СМ',
  electrum: 'ЭМ',
  gold: 'ЗМ',
  platinum: 'ПМ',
};

/** Полные названия денежных единиц (расшифровка для тултипов). */
export const CURRENCY_NAMES: Record<CurrencyKey, string> = {
  copper: 'Медные монеты',
  silver: 'Серебряные монеты',
  electrum: 'Электрумовые монеты',
  gold: 'Золотые монеты',
  platinum: 'Платиновые монеты',
};

/** Минимальное количество денежной единицы. */
export const CURRENCY_AMOUNT_MIN = 0;

/** Максимальное количество денежной единицы. */
export const CURRENCY_AMOUNT_MAX = 9999999;

/** Монет в одном фунте веса: по правилам 2024 монета весит 1/50 фунта. */
export const COINS_PER_WEIGHT_UNIT = 50;

/** Максимальная длина сокращения пользовательской валюты. */
export const CUSTOM_CURRENCY_LABEL_MAX_LENGTH = 4;

/** Максимальная длина полного названия пользовательской валюты. */
export const CUSTOM_CURRENCY_NAME_MAX_LENGTH = 40;

/** Заготовка новой пользовательской валюты (без идентификатора). */
export const NEW_CUSTOM_CURRENCY: Omit<CharacterCustomCurrency, 'id'> = {
  name: '',
  label: '',
  amount: 0,
};

/** Минимальный уровень персонажа. */
export const LEVEL_MIN = 1;

/** Максимальный уровень персонажа. */
export const LEVEL_MAX = 20;

/** Максимальное значение опыта. */
export const EXPERIENCE_MAX = 999999;

/**
 * Суммарный опыт, необходимый для достижения уровня (индекс = уровень − 1).
 * Таблица опыта D&D 2024.
 */
export const LEVEL_XP_THRESHOLDS: number[] = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000,
  120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
];

/** Названия типов восстановления ресурса класса. */
export const RESOURCE_RECOVERY_LABELS: Record<ResourceRecovery, string> = {
  'short-rest': 'Короткий отдых',
  'long-rest': 'Продолжительный отдых',
};

/** Варианты восстановления для селекта в настройке ресурсов. */
export const RESOURCE_RECOVERY_OPTIONS: Array<{
  label: string;
  value: ResourceRecovery;
}> = [
  { label: 'Короткий отдых', value: 'short-rest' },
  { label: 'Продолжительный отдых', value: 'long-rest' },
];

/** Иконки типов восстановления ресурса класса. */
export const RESOURCE_RECOVERY_ICONS: Record<ResourceRecovery, string> = {
  'short-rest': 'tabler:campfire',
  'long-rest': 'tabler:sun',
};

/** Минимальное количество зарядов ресурса. */
export const RESOURCE_COUNT_MIN = 0;

/** Максимальное количество зарядов ресурса. */
export const RESOURCE_COUNT_MAX = 99;

/** Максимальная длина короткой подписи ресурса. */
export const RESOURCE_SHORT_LABEL_MAX_LENGTH = 4;

/** Подсказки полей ресурса класса: пример вместо подставленного текста. */
export const RESOURCE_PLACEHOLDERS: Record<'name' | 'shortLabel', string> = {
  name: 'Например, Ярость',
  shortLabel: 'ЯР',
};

/**
 * Заготовка нового ресурса класса (без идентификатора). Подписи пустые —
 * пример показывает плейсхолдер, чтобы не стирать текст перед вводом своего.
 */
export const NEW_CLASS_RESOURCE: Omit<CharacterClassResource, 'id'> = {
  name: '',
  shortLabel: '',
  recovery: 'long-rest',
  current: 1,
  max: 1,
};

/** Минимальное базовое значение класса доспеха. */
export const ARMOR_CLASS_BASE_MIN = 0;

/** Максимальное базовое значение класса доспеха. */
export const ARMOR_CLASS_BASE_MAX = 40;

/** Значение «без характеристики» в селекте класса доспеха. */
export const ARMOR_CLASS_NO_ABILITY = 'none';

/** Безброневой класс доспеха (без надетой брони): база `10 + Ловкость`. */
export const UNARMORED_ARMOR_CLASS_BASE = 10;

/** Максимальный бонус Ловкости к КД средней брони (штраф по Ловкости). */
export const ARMOR_MEDIUM_DEX_CAP = 2;

/** Подпись «без брони» для разбора класса доспеха. */
export const SHEET_UNARMORED_LABEL = 'Без брони (10 + Ловкость)';

/** Пояснение правила модификатора Ловкости к КД для подсказки на плитке брони. */
export const ARMOR_DEXTERITY_HINT_LABELS: Record<ArmorDexterityMod, string> = {
  full: ' + модификатор Ловкости',
  capped: ' + модификатор Ловкости (максимум +2)',
  none: ' (без модификатора Ловкости)',
};

/** Варианты характеристики для бонуса класса доспеха. */
export const ARMOR_CLASS_ABILITY_OPTIONS: Array<{
  label: string;
  value: AbilityKey | typeof ARMOR_CLASS_NO_ABILITY;
}> = [
  { label: 'Нет', value: ARMOR_CLASS_NO_ABILITY },
  ...ABILITY_ORDER.map((key) => ({ label: ABILITY_LABELS[key], value: key })),
];

/**
 * Характеристика бонуса атаки оружием по правилам: большинство оружия бьёт от
 * Силы. Значение по умолчанию для настройки листа.
 */
export const DEFAULT_WEAPON_ATTACK_ABILITY: AbilityKey = 'strength';

/** Значение «Авто (по правилам)» в селекте характеристики атаки оружием. */
export const WEAPON_ATTACK_ABILITY_AUTO = 'auto';

/** Варианты выбора базовой характеристики атаки оружием. */
export const WEAPON_ATTACK_ABILITY_OPTIONS: Array<{
  label: string;
  value: AbilityKey | typeof WEAPON_ATTACK_ABILITY_AUTO;
}> = [
  { label: 'Авто (по правилам)', value: WEAPON_ATTACK_ABILITY_AUTO },
  ...ABILITY_ORDER.map((key) => ({ label: ABILITY_LABELS[key], value: key })),
];

/** Пояснение к режиму «Авто» базовой характеристики атаки оружием. */
export const WEAPON_ATTACK_ABILITY_AUTO_HINT = `По правилам: ${ABILITY_LABELS[DEFAULT_WEAPON_ATTACK_ABILITY]}`;

/**
 * Пояснение к исключению из базовой характеристики: фехтовальное и
 * дальнобойное оружие считается от Ловкости независимо от настройки.
 */
export const WEAPON_ATTACK_FINESSE_HINT = `Фехтовальное и дальнобойное оружие бьёт от характеристики «${ABILITY_LABELS.dexterity}» независимо от настройки.`;

/** Минимальное значение характеристики. */
export const ABILITY_SCORE_MIN = 1;

/** Максимальное значение характеристики. */
export const ABILITY_SCORE_MAX = 30;

/** Названия уровней владения навыком. */
export const SKILL_PROFICIENCY_LABELS: Record<SkillProficiencyLevel, string> = {
  none: 'Нет владения',
  half: 'Половина владения',
  proficient: 'Владение',
  expertise: 'Компетенция',
};

/** Следующий уровень владения навыком при переключении по кругу. */
export const SKILL_PROFICIENCY_NEXT: Record<
  SkillProficiencyLevel,
  SkillProficiencyLevel
> = {
  none: 'half',
  half: 'proficient',
  proficient: 'expertise',
  expertise: 'none',
};

/** Иконки уровней владения навыком. */
export const SKILL_PROFICIENCY_ICONS: Record<SkillProficiencyLevel, string> = {
  none: 'tabler:circle',
  half: 'tabler:circle-half-2',
  proficient: 'tabler:circle-filled',
  expertise: 'tabler:square-rounded-chevrons-up',
};

/** Множители бонуса мастерства по уровню владения навыком. */
export const SKILL_PROFICIENCY_MULTIPLIERS: Record<
  SkillProficiencyLevel,
  number
> = {
  none: 0,
  half: 0.5,
  proficient: 1,
  expertise: 2,
};

/** Множитель грузоподъёмности от значения Силы. */
export const CARRYING_CAPACITY_MULTIPLIER = 15;

/**
 * Поправка грузоподъёмности на размер (правила 2024): у Крошечного она вдвое
 * меньше, а с Большого удваивается на каждую категорию. Ключи — подписи размеров
 * в нижнем регистре: размер лист хранит русским словом из словаря сайта.
 * «Исполинский» — та же категория, что «Громадный», в текстах встречаются оба.
 */
export const CARRYING_CAPACITY_SIZE_MULTIPLIERS: Record<string, number> = {
  крошечный: 0.5,
  маленький: 1,
  средний: 1,
  большой: 2,
  огромный: 4,
  громадный: 8,
  исполинский: 8,
};

/** Единица измерения веса инвентаря. */
export const WEIGHT_UNIT_LABEL = 'фнт.';

/** Названия типов передвижения. */
export const SPEED_TYPE_LABELS: Record<SpeedTypeKey, string> = {
  walk: 'Ходьба',
  burrow: 'Копание',
  climb: 'Лазание',
  fly: 'Полёт',
  swim: 'Плавание',
};

/** Порядок типов передвижения в модалке настройки. */
export const SPEED_MODAL_ORDER: SpeedTypeKey[] = [
  'burrow',
  'climb',
  'fly',
  'swim',
  'walk',
];

/**
 * Порядок выбора основного типа передвижения: при равных скоростях приоритет у
 * ходьбы.
 */
export const SPEED_PRIMARY_ORDER: SpeedTypeKey[] = [
  'walk',
  'burrow',
  'climb',
  'fly',
  'swim',
];

/** Сокращённые обозначения единиц скорости. */
export const SPEED_UNIT_SHORT_LABELS: Record<SpeedUnit, string> = {
  feet: 'фт',
  meters: 'м',
  miles: 'ми',
  kilometers: 'км',
};

/** Варианты единиц скорости для выбора в модалке. */
export const SPEED_UNIT_OPTIONS: Array<{ label: string; value: SpeedUnit }> = [
  { label: 'Футы (ft)', value: 'feet' },
  { label: 'Метры (m)', value: 'meters' },
  { label: 'Мили (mi)', value: 'miles' },
  { label: 'Километры (km)', value: 'kilometers' },
];

/** Варианты режима броска d20. */
export const ROLL_MODE_OPTIONS: Array<{
  value: RollMode;
  label: string;
  icon?: string;
}> = [
  { value: 'normal', label: 'Обычный' },
  { value: 'advantage', label: 'Преим.', icon: 'tabler:arrow-big-up-filled' },
  {
    value: 'disadvantage',
    label: 'Помеха',
    icon: 'tabler:arrow-big-down-filled',
  },
];

/** Нотация кубов d20 по режиму броска (нотация дайс-роллера). */
export const ROLL_MODE_DICE_NOTATION: Record<RollMode, string> = {
  normal: '1к20',
  advantage: '2к20вл1',
  disadvantage: '2к20вх1',
};

/** Минимальный дополнительный бонус броска. */
export const ROLL_BONUS_MIN = -99;

/** Максимальный дополнительный бонус броска. */
export const ROLL_BONUS_MAX = 99;

/** Названия типов зрения. */
export const VISION_LABELS: Record<VisionKey, string> = {
  normal: 'Обычное зрение',
  darkvision: 'Тёмное зрение',
  blindsight: 'Слепое зрение',
  tremorsense: 'Чувство вибрации',
  truesight: 'Истинное зрение',
};

/** Порядок типов зрения в модалке и подсказке. */
export const VISION_ORDER: VisionKey[] = [
  'normal',
  'darkvision',
  'blindsight',
  'tremorsense',
  'truesight',
];

/** Минимальная дистанция зрения. */
export const VISION_DISTANCE_MIN = 0;

/** Максимальная дистанция зрения. */
export const VISION_DISTANCE_MAX = 999;

/** Минимальное значение скорости. */
export const SPEED_VALUE_MIN = 0;

/** Максимальное значение скорости. */
export const SPEED_VALUE_MAX = 999;

/** Минимальное значение хитов. */
export const HIT_POINTS_MIN = 0;

/** Максимальное значение хитов. */
export const HIT_POINTS_MAX = 999;

/**
 * Кнопки быстрой правки хитов: шаг (урон — отрицательный, лечение —
 * положительный), подпись со знаком и семантический цвет. Общие для полной и
 * быстрой модалок хитов.
 */
export const HIT_POINT_STEP_BUTTONS: Array<{
  step: number;
  label: string;
  color: 'error' | 'success';
}> = [
  { step: -5, label: '-5', color: 'error' },
  { step: -1, label: '-1', color: 'error' },
  { step: 1, label: '+1', color: 'success' },
  { step: 5, label: '+5', color: 'success' },
];

/**
 * Минимальный прирост максимума хитов за уровень: даже с отрицательным
 * модификатором Телосложения уровень даёт хотя бы один хит (правило D&D 2024).
 */
export const HIT_POINTS_LEVEL_GAIN_MIN = 1;

/** Минимальное количество костей хитов. */
export const HIT_DICE_COUNT_MIN = 0;

/** Максимальное количество костей хитов. */
export const HIT_DICE_COUNT_MAX = 99;

/** Варианты номинала кости хитов для выбора в модалке. */
export const HIT_DIE_OPTIONS: Array<{ label: string; value: number }> = [
  { label: 'к4', value: 4 },
  { label: 'к6', value: 6 },
  { label: 'к8', value: 8 },
  { label: 'к10', value: 10 },
  { label: 'к12', value: 12 },
];

/**
 * Сколько костей в одной формуле броска кости хитов. Кости бросаются по одной:
 * минимум восстановления (0 хитов) правила применяют к каждой кости отдельно, а
 * игрок видит результат каждого броска.
 */
export const HIT_DICE_ROLL_COUNT = 1;

/** Подписи способов прироста хитов за повышение уровня. */
export const HIT_POINTS_GAIN_MODE_LABELS: Record<HitPointsGainMode, string> = {
  average: 'Взять среднее',
  roll: 'Бросить кость',
  max: 'Взять максимум',
};

/** Подписи секции «Хиты за повышение уровня» в модалке опыта. */
export const LEVEL_UP_HIT_POINTS_LABELS: Record<
  | 'title'
  | 'constitutionTitle'
  | 'perLevelSuffix'
  | 'hitPointsPerLevelSuffix'
  | 'rollModeDescriptionSuffix'
  | 'roll'
  | 'reroll'
  | 'maxHitPointsTitle'
  | 'rollPending'
  | 'growthHint'
  | 'levelDownTitle'
  | 'levelDownFeaturesTitle'
  | 'levelDownFeaturesHint'
  | 'levelDownHint'
  | 'levelDownUnknownHint',
  string
> = {
  title: 'Хиты за повышение уровня',
  constitutionTitle: 'Телосложение',
  perLevelSuffix: 'за уровень',
  hitPointsPerLevelSuffix: 'хитов за уровень',
  rollModeDescriptionSuffix: 'и модификатор Телосложения за уровень',
  roll: 'Бросить',
  reroll: 'Перебросить',
  maxHitPointsTitle: 'Максимум хитов',
  rollPending: 'бросьте кости',
  growthHint: 'Кости хитов и текущие хиты вырастут вместе с максимумом.',
  levelDownTitle: 'Что вернут снятые уровни',
  levelDownFeaturesTitle: 'Умения снятых уровней',
  levelDownFeaturesHint:
    'Эти умения класса уйдут с вкладки «Особенности» — их дают снимаемые уровни. Ручные записи и умения оставшихся уровней не тронутся.',
  levelDownHint:
    'Из максимума вернётся ровно тот прирост, который дали снимаемые уровни; кости хитов уменьшатся вместе с уровнем.',
  levelDownUnknownHint:
    'Прирост хитов за снимаемые уровни не записан (лист собран до его учёта), поэтому максимум не изменится — поправьте его в настройке здоровья при необходимости.',
};

/** Подпись ячеек заклинаний договора колдуна в списке того, что вернёт отдых. */
export const PACT_SPELL_SLOTS_LABEL = 'Ячейки заклинаний договора';

/** Подпись всех ячеек заклинаний в списке того, что вернёт отдых. */
export const ALL_SPELL_SLOTS_LABEL = 'Ячейки заклинаний';

/** Подписи модалки короткого отдыха. */
export const SHORT_REST_LABELS: Record<
  | 'title'
  | 'intro'
  | 'rulesTitle'
  | 'hitPointsTitle'
  | 'constitutionTitle'
  | 'constitutionHint'
  | 'diceTitle'
  | 'diceHint'
  | 'diceAdd'
  | 'diceRemove'
  | 'roll'
  | 'rollLogTitle'
  | 'rollTotal'
  | 'noDice'
  | 'spentDice'
  | 'recoveryTitle'
  | 'zeroHitPointsTitle'
  | 'zeroHitPointsDescription'
  | 'close'
  | 'finish'
  | 'finishedTitle'
  | 'finishedHitPoints'
  | 'finishedRecovery'
  | 'finishedEmpty',
  string
> = {
  title: 'Короткий отдых',
  intro:
    'Короткий отдых — это не меньше часа спокойного времени: персонаж ест, разговаривает, перевязывает раны или стоит на страже. В конце отдыха он тратит кости хитов и восстанавливает здоровье.',
  rulesTitle: 'Правила короткого отдыха',
  hitPointsTitle: 'Хиты',
  constitutionTitle: 'Модификатор Телосложения',
  constitutionHint: 'Прибавляется к каждой брошенной кости хитов',
  diceTitle: 'Кости хитов',
  diceHint: 'Выберите, сколько костей потратить',
  diceAdd: 'Добавить к броску кость',
  diceRemove: 'Убрать из броска кость',
  roll: 'Бросить кости',
  rollLogTitle: 'Броски отдыха',
  rollTotal: 'Итого по броскам',
  noDice: 'Кости хитов не заданы — их можно настроить в блоке «Здоровье».',
  spentDice:
    'Все кости хитов потрачены — они вернутся в продолжительный отдых.',
  recoveryTitle: 'Вернётся по окончании отдыха',
  zeroHitPointsTitle: 'Нужен хотя бы 1 хит',
  zeroHitPointsDescription:
    'Короткий отдых начинается только у персонажа с хитами: при 0 хитах сперва понадобится стабилизация или лечение.',
  close: 'Закрыть',
  finish: 'Завершить отдых',
  finishedTitle: 'Короткий отдых завершён',
  finishedHitPoints: 'Восстановлено хитов',
  finishedRecovery: 'Вернулись',
  finishedEmpty: 'Кости хитов не тратились.',
};

/** Подписи модалки продолжительного отдыха. */
export const LONG_REST_LABELS: Record<
  | 'title'
  | 'intro'
  | 'rulesTitle'
  | 'hitPointsTitle'
  | 'hitPointsRecovery'
  | 'diceTitle'
  | 'diceHint'
  | 'diceRecovery'
  | 'noDice'
  | 'fullDice'
  | 'recoveryTitle'
  | 'temporaryNote'
  | 'close'
  | 'finish'
  | 'finishedTitle'
  | 'finishedHitPoints'
  | 'finishedDice'
  | 'finishedRecovery',
  string
> = {
  title: 'Продолжительный отдых',
  intro:
    'Продолжительный отдых — не меньше 8 часов, из них минимум 6 часов сна, а остальное время — необременительные занятия. По его окончании персонаж восстанавливает все хиты, все кости хитов, все ячейки заклинаний и счётчики умений.',
  rulesTitle: 'Правила продолжительного отдыха',
  hitPointsTitle: 'Хиты',
  hitPointsRecovery: 'Восстановятся полностью.',
  diceTitle: 'Кости хитов',
  diceHint: 'Вернутся полностью',
  diceRecovery: 'Все потраченные кости хитов вернутся на лист.',
  noDice: 'Кости хитов не заданы — их можно настроить в блоке «Здоровье».',
  fullDice: 'Все кости хитов на месте — возвращать нечего.',
  recoveryTitle: 'Вернётся по окончании отдыха',
  temporaryNote: 'Временные хиты пропадают в конце отдыха.',
  close: 'Закрыть',
  finish: 'Завершить отдых',
  finishedTitle: 'Продолжительный отдых завершён',
  finishedHitPoints: 'Хиты восстановлены полностью.',
  finishedDice: 'Возвращено костей хитов',
  finishedRecovery: 'Вернулись',
};

/** Пункты правил продолжительного отдыха (D&D 2024) для справки в модалке. */
export const LONG_REST_RULES: string[] = [
  'Отдых длится не меньше 8 часов: минимум 6 часов сна и не больше 2 часов необременительных занятий — чтения, разговоров, еды, дежурства.',
  'Прерванный час боя, ходьбы или другой утомительной деятельности обнуляет отдых: его придётся начинать заново.',
  'По окончании отдыха восстанавливаются все хиты и все потраченные ячейки заклинаний.',
  'Все потраченные кости хитов возвращаются: в редакции 2024 года отдых возвращает их полностью, а не половину.',
  'Возвращаются счётчики умений и с продолжительным, и с коротким восстановлением.',
  'Временные хиты держатся до конца продолжительного отдыха и пропадают вместе с ним.',
  'За одни сутки можно получить пользу только от одного продолжительного отдыха.',
];

/** Пункты правил короткого отдыха (D&D 2024) для справки в модалке. */
export const SHORT_REST_RULES: string[] = [
  'Отдых длится не меньше часа. Всё это время персонаж не делает ничего утомительнее еды, разговоров, чтения или дежурства.',
  'Начать короткий отдых можно, имея хотя бы 1 хит.',
  'В конце отдыха тратится любое количество оставшихся костей хитов. За каждую кость бросается её номинал и прибавляется модификатор Телосложения — столько хитов и восстанавливается, но не меньше нуля за кость.',
  'Сколько костей бросить дальше, решается после каждого броска.',
  'Потраченные кости хитов возвращает только продолжительный отдых.',
  'Умения и ячейки с восстановлением «короткий отдых» возвращаются по окончании отдыха.',
];

/** Каталог брони для настройки владения: группы, пункт «вся группа» и виды. */
export const ARMOR_PROFICIENCY_GROUPS: ArmorProficiencyGroup[] = [
  {
    key: 'light',
    title: 'Лёгкая',
    all: 'Вся лёгкая броня',
    items: ['Стёганый доспех', 'Кожаный доспех', 'Проклёпанный кожаный доспех'],
  },
  {
    key: 'medium',
    title: 'Средняя',
    all: 'Вся средняя броня',
    items: [
      'Шкурный доспех',
      'Кольчужная рубаха',
      'Чешуйчатый доспех',
      'Нагрудник',
      'Полулатный доспех',
    ],
  },
  {
    key: 'heavy',
    title: 'Тяжёлая',
    all: 'Вся тяжёлая броня',
    items: ['Колечный доспех', 'Кольчуга', 'Наборный доспех', 'Латный доспех'],
  },
  {
    key: 'shields',
    title: 'Щиты',
    all: 'Все щиты',
    items: ['Щит'],
  },
];

/** Каталог оружия для настройки владения и мастерства: группы и виды. */
export const WEAPON_PROFICIENCY_GROUPS: WeaponProficiencyGroup[] = [
  {
    key: 'simple',
    title: 'Простое',
    all: 'Всё простое оружие',
    items: [
      'Дубинка',
      'Кинжал',
      'Палица',
      'Ручной топор',
      'Метательное копьё',
      'Лёгкий молот',
      'Булава',
      'Боевой посох',
      'Серп',
      'Копьё',
      'Дротик',
      'Короткий лук',
      'Лёгкий арбалет',
      'Праща',
    ],
  },
  {
    key: 'martial',
    title: 'Воинское',
    all: 'Всё воинское оружие',
    items: [
      'Боевой топор',
      'Цеп',
      'Глефа',
      'Секира',
      'Двуручный меч',
      'Алебарда',
      'Длинное копьё',
      'Длинный меч',
      'Молот',
      'Моргенштерн',
      'Пика',
      'Рапира',
      'Скимитар',
      'Короткий меч',
      'Трезубец',
      'Боевой клевец',
      'Боевой молот',
      'Кнут',
      'Духовая трубка',
      'Ручной арбалет',
      'Тяжёлый арбалет',
      'Длинный лук',
      'Мушкет',
      'Пистоль',
    ],
  },
];

/** Каталог инструментов для настройки владения: группы и виды. */
export const TOOL_PROFICIENCY_GROUPS: ToolProficiencyGroup[] = [
  {
    key: 'artisan',
    title: 'Инструменты ремесленника',
    all: 'Все инструменты ремесленника',
    items: [
      'Инструменты алхимика',
      'Инструменты пивовара',
      'Инструменты каллиграфа',
      'Инструменты плотника',
      'Инструменты картографа',
      'Инструменты сапожника',
      'Инструменты повара',
      'Инструменты стеклодува',
      'Инструменты ювелира',
      'Инструменты кожевника',
      'Инструменты каменщика',
      'Инструменты художника',
      'Инструменты гончара',
      'Инструменты кузнеца',
      'Инструменты ремонтника',
      'Инструменты ткача',
      'Инструменты резчика по дереву',
    ],
  },
  {
    key: 'gaming',
    title: 'Игровые наборы',
    all: 'Все игровые наборы',
    items: [
      'Набор костей',
      'Шахматы «Копьё дракона»',
      'Набор игральных карт',
      'Набор для игры «Три дракона»',
    ],
  },
  {
    key: 'musical',
    title: 'Музыкальные инструменты',
    all: 'Все музыкальные инструменты',
    items: [
      'Волынка',
      'Барабан',
      'Цимбалы',
      'Флейта',
      'Лютня',
      'Лира',
      'Рожок',
      'Флейта Пана',
      'Шалмей',
      'Виола',
    ],
  },
  {
    key: 'other',
    title: 'Прочие инструменты',
    all: 'Все прочие инструменты',
    items: [
      'Набор для маскировки',
      'Набор для фальсификации',
      'Набор травника',
      'Инструменты навигатора',
      'Набор отравителя',
      'Воровские инструменты',
    ],
  },
];

/** Эндпоинт поиска черт (раздел «Черты»). */
export const FEATS_SEARCH_PATH = '/api/v2/feats/search';

/**
 * Эндпоинт списка черт для выбора. В отличие от `/search`, отдаёт флаг
 * `repeatability` (можно ли взять черту несколько раз), но категорией-энумом.
 */
export const FEATS_SELECT_PATH = '/api/v2/feats/select';

/** Базовый путь деталей черты (`/{url}`). */
export const FEATS_DETAIL_BASE_PATH = '/api/v2/feats';

/** Категория черт, доступных через классовое умение выбора боевого стиля. */
export const FIGHTING_STYLE_FEAT_CATEGORIES = ['FIGHTING_STYLE'];

/** Тексты и технические значения выбора боевого стиля в мастере класса. */
export const FIGHTING_STYLE_CHOICE_LABEL =
  'Выберите 1 черту категории «Боевой стиль»';

export const FIGHTING_STYLE_CHOICE_REQUIRED_ERROR =
  'Не выбран обязательный боевой стиль';

export const FIGHTING_STYLE_INVALID_RESPONSE_ERROR =
  'Сервер вернул некорректную черту боевого стиля';

export const FIGHTING_STYLE_FEATURE_ID_SEGMENT = 'fighting-style';

export const FIGHTING_STYLE_ERROR_TOAST_COLOR = 'error';

export const FIGHTING_STYLE_ERROR_TOAST_ICON = 'tabler:alert-triangle';

export const FIGHTING_STYLE_ERROR_TOAST_TITLE =
  'Не удалось добавить выбранный боевой стиль';

export const FIGHTING_STYLE_ERROR_LOG_MESSAGE =
  'Ошибка добавления боевого стиля:';

/** Эндпоинт фильтров черт — источник глобальной настройки источников. */
export const FEATS_FILTERS_PATH = '/api/v2/feats/filters';

/** Эндпоинт поиска видов. */
export const SPECIES_SEARCH_PATH = '/api/v2/species/search';

/** Эндпоинт фильтров видов — источник глобальной настройки источников. */
export const SPECIES_FILTERS_PATH = '/api/v2/species/filters';

/** Эндпоинт поиска заклинаний. */
export const SPELLS_SEARCH_PATH = '/api/v2/spells/search';

/** Базовый путь детали заклинания (`/{url}` — слаг из каталога). */
export const SPELLS_DETAIL_BASE_PATH = '/api/v2/spells';

/** Подпись отдельной группы заклинаний, полученных от вида и происхождения. */
export const INNATE_SPELL_GROUP_LABEL = 'Врождённые';

/** Служебный ключ группы врождённых заклинаний, не пересекающийся с кругами 0–9. */
export const INNATE_SPELL_GROUP_LEVEL = -1;

/** Локаль сортировки русских названий заклинаний. */
export const SPELL_NAME_SORT_LOCALE = 'ru';

/** Эндпоинт фильтров заклинаний — источник списка классов для чипов. */
export const SPELLS_FILTERS_PATH = '/api/v2/spells/filters';

/** Размер страницы каталога заклинаний (как в разделе «Заклинания»). */
export const SPELL_CATALOG_PAGE_SIZE = 60;

/** Группировка каталога: сервер отдаёт заклинания кругами по порядку. */
export const SPELL_CATALOG_GROUPING = 'LEVEL';

/** Сортировка каталога внутри круга — по русскому названию. */
export const SPELL_CATALOG_SORTING = 'NAME';

/** Дистанция до низа списка каталога для подгрузки следующей страницы. */
export const SPELL_CATALOG_LOAD_MORE_DISTANCE = 300;

/** Дебаунс поискового запроса каталога заклинаний. */
export const SPELL_CATALOG_SEARCH_DEBOUNCE_MS = 300;

/** Круги заклинаний для быстрого фильтра (0 — заговоры). */
export const SPELL_LEVELS: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Базовая величина сложности спасброска от заклинаний (D&D 2024). */
export const SPELL_SAVE_DC_BASE = 8;

/**
 * Префикс URL своего заклинания. Каталожные ссылки — обычные слаги раздела,
 * поэтому по префиксу лист отличает свои заклинания от выбранных из базы.
 */
export const CUSTOM_SPELL_URL_PREFIX = 'custom:';

/** Школы магии в форме своего заклинания. */
export const SPELL_SCHOOL_OPTIONS: string[] = [
  'Воплощение',
  'Вызов',
  'Иллюзия',
  'Некромантия',
  'Ограждение',
  'Очарование',
  'Преобразование',
  'Прорицание',
];

/**
 * Подписи компонентов заклинания. Деталь каталога отдаёт компоненты флагами
 * (`{ v, s, m }`), а лист хранит их строкой — при дозагрузке описаний строка
 * собирается этими подписями (те же слова, что на странице заклинания).
 */
export const SPELL_COMPONENT_LABELS = {
  verbal: 'Вербальный',
  somatic: 'Соматический',
  material: 'Материальный',
} as const;

/** Текстовые поля своего заклинания: строки формы и развёрнутой карточки. */
export const CUSTOM_SPELL_FIELDS: CustomSpellField[] = [
  {
    key: 'castingTime',
    label: 'Время накладывания',
    placeholder: 'Например: 1 действие',
  },
  { key: 'range', label: 'Дистанция', placeholder: 'Например: 30 футов' },
  { key: 'components', label: 'Компоненты', placeholder: 'Например: В, С, М' },
  { key: 'duration', label: 'Длительность', placeholder: 'Например: 1 минута' },
];

/**
 * Заклинательная характеристика по базовому названию класса (режим «Авто»).
 * Ключ — название в нижнем регистре. Классы-незаклинатели (варвар, воин, монах,
 * плут) в карту не входят: у них характеристика остаётся неопределённой.
 */
export const CLASS_SPELLCASTING_ABILITIES: Record<string, AbilityKey> = {
  бард: 'charisma',
  волшебник: 'intelligence',
  друид: 'wisdom',
  жрец: 'wisdom',
  изобретатель: 'intelligence',
  колдун: 'charisma',
  паладин: 'charisma',
  следопыт: 'wisdom',
  чародей: 'charisma',
};

/**
 * Запасной тип заклинательства по базовому названию класса (ключ — название в
 * нижнем регистре). Нужен листам, сохранённым до появления `casterType`: у них
 * в документе типа нет, а перевыбирать класс ради ячеек незачем. Классы-
 * незаклинатели в карту не входят. Воин и плут получают ячейки только через
 * подкласс — см. `THIRD_CASTER_SUBCLASSES`.
 */
export const CLASS_SPELL_PROGRESSIONS: Record<string, CasterType> = {
  бард: CasterType.FULL,
  волшебник: CasterType.FULL,
  друид: CasterType.FULL,
  жрец: CasterType.FULL,
  чародей: CasterType.FULL,
  изобретатель: CasterType.HALF,
  паладин: CasterType.HALF,
  следопыт: CasterType.HALF,
  колдун: CasterType.PACT,
};

/**
 * Запасной список подклассов-треть заклинателей (названия в нижнем регистре):
 * мистический рыцарь воина и мистический ловкач плута. Как и
 * `CLASS_SPELL_PROGRESSIONS`, нужен только листам без `casterType`.
 */
export const THIRD_CASTER_SUBCLASSES: string[] = [
  'мистический рыцарь',
  'мистический ловкач',
];

/** Подпись ряда кружков ячеек в разделителе круга заклинаний. */
export const SPELL_SLOTS_LABEL = 'Ячейки';

/** Подпись кружка потраченной ячейки заклинаний (для скринридера). */
export const SPELL_SLOT_USED_LABEL = 'потрачена';

/** Подпись кружка свободной ячейки заклинаний (для скринридера). */
export const SPELL_SLOT_FREE_LABEL = 'свободна';

/** Значение «Авто (по классу)» в селекте заклинательной характеристики. */
export const SPELLCASTING_ABILITY_AUTO = 'auto';

/** Варианты выбора заклинательной характеристики (авто или конкретная). */
export const SPELLCASTING_ABILITY_OPTIONS: Array<{
  label: string;
  value: AbilityKey | typeof SPELLCASTING_ABILITY_AUTO;
}> = [
  { label: 'Авто (по классу)', value: SPELLCASTING_ABILITY_AUTO },
  ...ABILITY_ORDER.map((key) => ({ label: ABILITY_LABELS[key], value: key })),
];

/** Базовый путь деталей вида (`/{url}` и `/{url}/lineages`). */
export const SPECIES_DETAIL_BASE_PATH = '/api/v2/species';

/** Эндпоинт поиска классов (раздел «Классы»). */
export const CLASSES_SEARCH_PATH = '/api/v2/classes/search';

/** Базовый путь деталей класса (`/{url}` и `/{url}/subclasses`). */
export const CLASSES_DETAIL_BASE_PATH = '/api/v2/classes';

/** Эндпоинт фильтров классов — источник глобальной настройки источников. */
export const CLASSES_FILTERS_PATH = '/api/v2/classes/filters';

/** Минимальный уровень персонажа для выбора подкласса (D&D 2024 — 3-й). */
export const SUBCLASS_SELECTION_MIN_LEVEL = 3;

/** Эндпоинт поиска предысторий (раздел «Предыстории»). */
export const BACKGROUNDS_SEARCH_PATH = '/api/v2/backgrounds/search';

/** Базовый путь деталей предыстории (`/{url}`). */
export const BACKGROUNDS_DETAIL_BASE_PATH = '/api/v2/backgrounds';

/** Эндпоинт фильтров предысторий — источник глобальной настройки источников. */
export const BACKGROUNDS_FILTERS_PATH = '/api/v2/backgrounds/filters';

/** Варианты распределения прибавок к характеристикам от предыстории. */
export const BACKGROUND_ABILITY_MODE_OPTIONS: Array<{
  label: string;
  value: AbilityBonusMode;
}> = [
  { label: '+2 / +1', value: '2-1' },
  { label: '+1 / +1 / +1', value: '1-1-1' },
];

/** Ключевые слова групп брони для сопоставления прозы владений класса. */
export const ARMOR_MATCH_KEYWORDS: Record<
  ArmorProficiencyGroup['key'],
  string[]
> = {
  light: ['лёгк', 'легк'],
  medium: ['средн'],
  heavy: ['тяжёл', 'тяжел'],
  shields: ['щит'],
};

/** Ключевые слова групп оружия для сопоставления прозы владений класса. */
export const WEAPON_MATCH_KEYWORDS: Record<
  WeaponProficiencyGroup['key'],
  string[]
> = {
  simple: ['прост'],
  martial: ['воинск'],
};

/** Ключевые слова групп инструментов для сопоставления прозы владений класса. */
export const TOOL_MATCH_KEYWORDS: Record<
  ToolProficiencyGroup['key'],
  string[]
> = {
  artisan: ['ремесленник'],
  gaming: ['игров'],
  musical: ['музыкальн'],
  other: [],
};

/** Эндпоинт поиска предметов (раздел «Предметы»). */
export const ITEMS_SEARCH_PATH = '/api/v2/item/search';

/** Эндпоинт фильтров предметов — источник списка категорий для чипов. */
export const ITEMS_FILTERS_PATH = '/api/v2/item/filters';

/** Базовый путь деталей предмета (`/{url}`). */
export const ITEMS_DETAIL_BASE_PATH = '/api/v2/item';

/** Эндпоинт поиска магических предметов (раздел «Магические предметы»). */
export const MAGIC_ITEMS_SEARCH_PATH = '/api/v2/magic-items/search';

/** Базовый путь детали магического предмета. */
export const MAGIC_ITEMS_DETAIL_BASE_PATH = '/api/v2/magic-items';

/** Эндпоинт фильтров магических предметов. */
export const MAGIC_ITEMS_FILTERS_PATH = '/api/v2/magic-items/filters';

/**
 * Порядок групп инвентаря по категориям предмета: «Прочее» — самая длинная
 * группа, поэтому магические предметы идут перед ней, а не в самом низу списка.
 */
export const INVENTORY_CATEGORY_ORDER: InventoryItemCategory[] = [
  'WEAPON',
  'ARMOR',
  'MAGIC_ITEM',
  'ITEM',
];

/** Названия групп инвентаря по категориям предмета. */
export const INVENTORY_CATEGORY_TITLES: Record<InventoryItemCategory, string> =
  {
    WEAPON: 'Оружие',
    ARMOR: 'Доспехи',
    ITEM: 'Прочее',
    MAGIC_ITEM: 'Магические предметы',
  };

/** Иконки предметов инвентаря по категориям. */
export const INVENTORY_CATEGORY_ICONS: Record<InventoryItemCategory, string> = {
  WEAPON: 'tabler:sword',
  ARMOR: 'tabler:shield',
  ITEM: 'tabler:backpack',
  MAGIC_ITEM: 'tabler:sparkles',
};

/** Минимальное количество одного предмета в инвентаре. */
export const INVENTORY_QUANTITY_MIN = 1;

/** Максимальное количество одного предмета в инвентаре. */
export const INVENTORY_QUANTITY_MAX = 999;

/** Короткие подписи плиток параметров предмета в строке инвентаря. */
export const INVENTORY_STAT_LABELS: Record<
  'armorClass' | 'attack' | 'damage' | 'cost',
  string
> = {
  armorClass: 'КД',
  attack: 'Атака',
  damage: 'Урон',
  cost: 'Цена',
};

/** Подписи броска с плитки оружия для скринридера. */
export const INVENTORY_ROLL_KIND_LABELS: Record<InventoryStatRollKind, string> =
  {
    attack: 'Бросок атаки',
    damage: 'Бросок урона',
  };

/** Подсказка в тултипе о том, что плитка бросается по нажатию. */
export const INVENTORY_ROLL_HINT_LABEL = 'нажми, чтобы бросить';

/**
 * Названия типов урона справочника предметов
 * (`/api/v2/dictionaries/damage/types`) — для подписи урона оружия.
 */
export const DAMAGE_TYPE_LABELS: Record<string, string> = {
  ACID: 'Кислотный',
  BLUDGEONING: 'Дробящий',
  COLD: 'Холодный',
  FAIR: 'Огненный',
  FIRE: 'Огненный',
  FORCE: 'Силовое поле',
  LIGHTNING: 'Электрический',
  NECROTIC: 'Некротический',
  PIERCING: 'Колющий',
  POISON: 'Ядовитый',
  PSYCHIC: 'Психический',
  RADIANT: 'Излучение',
  SLASHING: 'Рубящий',
  THUNDER: 'Звуковой',
};

/**
 * Варианты типа урона своего оружия: подписи берутся из справочника типов
 * урона, порядок — по алфавиту. Ключ `FAIR` — дубль огненного урона из старых
 * записей справочника, в выборе он не нужен.
 */
export const DAMAGE_TYPE_OPTIONS: Array<{ label: string; value: string }> =
  Object.entries(DAMAGE_TYPE_LABELS)
    .filter(([type]) => type !== 'FAIR')
    .map(([type, label]) => ({ label, value: type }))
    .sort((left, right) => left.label.localeCompare(right.label, 'ru'));

/**
 * Префикс идентификатора и URL своего предмета инвентаря. Каталожные ссылки —
 * слаги разделов, поэтому по префиксу лист отличает предметы, заполненные
 * вручную, от добавленных из «Предметов» и «Магических предметов».
 */
export const CUSTOM_INVENTORY_URL_PREFIX = 'custom:';

/** Виды своего предмета для селекта формы. */
export const CUSTOM_INVENTORY_KIND_OPTIONS: Array<{
  label: string;
  value: CustomInventoryKind;
}> = [
  { label: 'Оружие', value: 'weapon' },
  { label: 'Доспех', value: 'armor' },
  { label: 'Безделушка', value: 'trinket' },
];

/** Категория инвентаря по виду своего предмета (группа и иконка в списке). */
export const CUSTOM_INVENTORY_KIND_CATEGORIES: Record<
  CustomInventoryKind,
  InventoryItemCategory
> = {
  weapon: 'WEAPON',
  armor: 'ARMOR',
  trinket: 'ITEM',
};

/** Подпись типов своего предмета вида «Безделушка». */
export const CUSTOM_TRINKET_TYPES_LABEL = 'Безделушка';

/**
 * Подпись пометки «магический»: ею подписан и чекбокс формы своего предмета, и
 * типы магической безделушки в строке снаряжения — параметров, которые стоило
 * бы назвать точнее, у неё нет.
 */
export const CUSTOM_MAGIC_ITEM_LABEL = 'Магический предмет';

/** Пояснение к пометке: она переносит предмет в группу магических. */
export const CUSTOM_MAGIC_ITEM_HINT = `${CUSTOM_MAGIC_ITEM_LABEL} попадёт в группу «${INVENTORY_CATEGORY_TITLES.MAGIC_ITEM}».`;

/** Названия категорий владения оружием. */
export const WEAPON_CATEGORY_LABELS: Record<WeaponCategory, string> = {
  simple: 'Простое оружие',
  martial: 'Воинское оружие',
};

/** Варианты категории владения оружием для селекта формы. */
export const WEAPON_CATEGORY_OPTIONS: Array<{
  label: string;
  value: WeaponCategory;
}> = [
  { label: WEAPON_CATEGORY_LABELS.simple, value: 'simple' },
  { label: WEAPON_CATEGORY_LABELS.martial, value: 'martial' },
];

/** Подписи свойств своего оружия для строки типов предмета. */
export const CUSTOM_WEAPON_PROPERTY_LABELS: Record<
  'ranged' | 'finesse',
  string
> = {
  ranged: 'Дальнобойное',
  finesse: 'Фехтовальное',
};

/** Порядок типов доспеха в селекте формы. */
const CUSTOM_ARMOR_TYPE_ORDER: CustomArmorType[] = [
  'light',
  'medium',
  'heavy',
  'shield',
];

/**
 * Правила доспеха по типу: как считается КД и как предмет подписан в списке.
 * Щит не заменяет броню, а складывается с ней — поэтому у него отдельный тип,
 * а не только правило Ловкости.
 */
export const CUSTOM_ARMOR_TYPE_META: Record<
  CustomArmorType,
  CustomArmorTypeMeta
> = {
  light: {
    label: 'Лёгкий доспех',
    armorClassLabel: 'Класс доспеха',
    hint: 'КД доспеха + модификатор Ловкости',
    dexterityMod: 'full',
    shield: false,
    typesLabel: 'Доспехи, Лёгкий доспех',
  },
  medium: {
    label: 'Средний доспех',
    armorClassLabel: 'Класс доспеха',
    hint: 'КД доспеха + модификатор Ловкости (максимум +2)',
    dexterityMod: 'capped',
    shield: false,
    typesLabel: 'Доспехи, Средний доспех',
  },
  heavy: {
    label: 'Тяжёлый доспех',
    armorClassLabel: 'Класс доспеха',
    hint: 'КД доспеха без модификатора Ловкости',
    dexterityMod: 'none',
    shield: false,
    typesLabel: 'Доспехи, Тяжёлый доспех',
  },
  shield: {
    label: 'Щит',
    armorClassLabel: 'Бонус к КД',
    hint: 'Бонус к КД поверх надетой брони',
    dexterityMod: 'none',
    shield: true,
    typesLabel: 'Доспехи, Щит',
  },
};

/** Варианты типа доспеха для селекта формы. */
export const CUSTOM_ARMOR_TYPE_OPTIONS: Array<{
  label: string;
  value: CustomArmorType;
}> = CUSTOM_ARMOR_TYPE_ORDER.map((armorType) => ({
  label: CUSTOM_ARMOR_TYPE_META[armorType].label,
  value: armorType,
}));

/**
 * Тип доспеха по правилу Ловкости — для обратного разбора сохранённого предмета
 * в значения формы. Щит распознаётся отдельным флагом.
 */
export const CUSTOM_ARMOR_TYPE_BY_DEXTERITY_MOD: Record<
  ArmorDexterityMod,
  CustomArmorType
> = {
  full: 'light',
  capped: 'medium',
  none: 'heavy',
};

/** Варианты грани кости урона своего оружия. */
export const DAMAGE_DIE_OPTIONS: Array<{ label: string; value: number }> = [
  { label: 'к4', value: 4 },
  { label: 'к6', value: 6 },
  { label: 'к8', value: 8 },
  { label: 'к10', value: 10 },
  { label: 'к12', value: 12 },
];

/** Минимальное количество костей урона (0 — оружие без броска урона). */
export const DAMAGE_DICE_COUNT_MIN = 0;

/** Максимальное количество костей урона. */
export const DAMAGE_DICE_COUNT_MAX = 20;

/** Минимальный собственный бонус урона оружия. */
export const DAMAGE_BONUS_MIN = -10;

/** Максимальный собственный бонус урона оружия. */
export const DAMAGE_BONUS_MAX = 20;

/** Минимальный вес своего предмета в фунтах. */
export const CUSTOM_ITEM_WEIGHT_MIN = 0;

/** Максимальный вес своего предмета в фунтах. */
export const CUSTOM_ITEM_WEIGHT_MAX = 999;

/** Шаг веса своего предмета: половина фунта (вес бывает дробным). */
export const CUSTOM_ITEM_WEIGHT_STEP = 0.5;

/** Знаков после запятой в весе предмета (вес бывает дробным — 0,5 фунта). */
export const WEIGHT_DECIMALS = 1;

/** Заготовка формы своего предмета (значения по умолчанию). */
export const NEW_CUSTOM_INVENTORY_ITEM: CustomInventoryItemDraft = {
  kind: 'weapon',
  name: '',
  magic: false,
  cost: '',
  weight: 0,
  quantity: 1,
  armorType: 'light',
  baseArmorClass: 11,
  weaponCategory: 'simple',
  ranged: false,
  finesse: false,
  damageDiceCount: 1,
  damageDiceFaces: 6,
  damageBonus: 0,
  damageType: '',
  description: [],
};

/** Обозначение кости в формуле броска (русская нотация дайс-роллера). */
export const DICE_NOTATION_LETTER = 'к';

/** Слова размеров для разбора строки размера вида. */
export const SIZE_LABEL_WORDS = [
  'Крошечный',
  'Маленький',
  'Средний',
  'Большой',
  'Огромный',
  'Громадный',
  'Исполинский',
];

/** Скорость ходьбы по умолчанию, если разбор строки скорости не удался. */
export const SPEED_PARSE_FALLBACK = 30;

/**
 * Дистанция тёмного зрения по умолчанию, если особенность найдена, но число в
 * тексте не распознано.
 */
export const DARKVISION_PARSE_FALLBACK = 60;

/** Подписи происхождения особенности персонажа. */
export const FEATURE_ORIGIN_LABELS: Record<FeatureOrigin, string> = {
  species: 'Вид',
  lineage: 'Подвид',
  class: 'Класс',
  feat: 'Черта',
  none: 'Нет',
};

/**
 * Подписи развёрнутой строки особенности. Источник показан строкой, а не
 * подсказкой у значка: строку целиком накрывает кнопка-раскрытие, да и на
 * сенсорном экране подсказки по наведению недоступны.
 */
export const SHEET_FEATURE_ROW_LABELS: Record<
  'origin' | 'choice' | 'emptyDescription',
  string
> = {
  origin: 'Источник:',
  choice: 'Выбор:',
  emptyDescription: 'Описание не заполнено',
};

/** Варианты происхождения при добавлении особенности вручную. */
export const FEATURE_ORIGIN_OPTIONS: Array<{
  label: string;
  value: FeatureOrigin;
}> = [
  { label: 'Нет', value: 'none' },
  { label: 'Вид', value: 'species' },
  { label: 'Класс', value: 'class' },
];

/** Каталог языков для настройки владения: группы и языки. */
export const LANGUAGE_PROFICIENCY_GROUPS: LanguageProficiencyGroup[] = [
  {
    key: 'standard',
    title: 'Стандартные',
    all: 'Все стандартные языки',
    items: [
      'Общий',
      'Дварфийский',
      'Эльфийский',
      'Гигантский',
      'Гномский',
      'Гоблинский',
      'Полуросликовский',
      'Оркский',
    ],
  },
  {
    key: 'rare',
    title: 'Редкие',
    all: 'Все редкие языки',
    items: [
      'Абиссальный',
      'Небесный',
      'Глубинная речь',
      'Драконий',
      'Инфернальный',
      'Первоязык',
      'Сильван',
      'Подземный',
    ],
  },
  {
    key: 'exotic',
    title: 'Экзотические',
    all: 'Все экзотические языки',
    items: ['Друидический', 'Язык воров'],
  },
];

/** Иконка колонки владения оружием. */
export const WEAPON_PROFICIENCY_ICON = 'tabler:circle-filled';

/** Иконка мастерства оружием. */
export const WEAPON_MASTERY_ICON = 'tabler:medal';

/** Классы цвета заголовков групп оружия в модалке владения. */
export const WEAPON_GROUP_TITLE_CLASSES: Record<
  WeaponProficiencyGroup['key'],
  string
> = {
  simple: 'text-warning',
  martial: 'text-error',
};

/** Подписи для незаполненных полей листа. */
export const SHEET_EMPTY_LABELS: Record<
  | 'species'
  | 'className'
  | 'background'
  | 'classResources'
  | 'proficiencies'
  | 'customCurrencies',
  string
> = {
  species: 'Вид не выбран',
  className: 'Класс не выбран',
  background: 'Предыстория не выбрана',
  classResources: 'Нет ресурсов',
  proficiencies: 'Нет',
  customCurrencies: 'Своих валют пока нет',
};

/**
 * Раздел, открытый по умолчанию, когда вкладки «Основное» нет. Подписи разделов
 * всегда полные — узкий ряд вкладок прокручивается свайпом, а не сокращается.
 */
export const SHEET_DEFAULT_TAB: SheetTab = {
  slot: 'equipment',
  label: 'Снаряжение',
};

/** Вкладки правой панели листа персонажа. */
export const SHEET_TABS: SheetTab[] = [
  SHEET_DEFAULT_TAB,
  { slot: 'spells', label: 'Заклинания' },
  { slot: 'features', label: 'Особенности' },
  { slot: 'notes', label: 'Заметки' },
];

/** Вкладка «Основное» — добавляется первой при ≤1023 (см. `hasMainTab`). */
export const SHEET_MAIN_TAB: SheetTab = { slot: 'main', label: 'Основное' };

/** Шаг прокрутки ленты вкладок стрелками — доля её видимой ширины. */
export const SHEET_TABS_SCROLL_STEP_RATIO = 0.6;

/**
 * Допуск позиции ленты вкладок (px). Прокрутка оставляет доли пикселя (дробные
 * ширины подписей, доводка активной вкладки), и без допуска лента у самого края
 * считается «недокрученной»: стрелка не гаснет и накрывает крайнюю вкладку.
 */
export const SHEET_TABS_SCROLL_EPSILON = 2;

/**
 * Зазор у краёв ленты (px) — место под кнопку-стрелку. На столько же ленту
 * доводят дальше нужной вкладки, чтобы стрелка не легла на её подпись.
 */
export const SHEET_TABS_SCROLL_EDGE_GAP = 32;

/**
 * Запас (px) при проверке, прокручивается ли элемент по горизонтали: при
 * `overflow-y: auto` браузер считает прокручиваемой и вторую ось, а ширина
 * содержимого расходится с шириной блока на округлении.
 */
export const SHEET_TABS_OVERFLOW_EPSILON = 1;

/**
 * Минимальная длина свайпа по содержимому раздела (px), после которой жест
 * листает вкладки. Короткие смахивания остаются случайными касаниями.
 */
export const SHEET_TABS_SWIPE_THRESHOLD = 60;

/**
 * Мёртвая зона жеста (px): пока палец не ушёл дальше, раздел стоит на месте.
 * Она же — порог, с которого `useSwipe` начинает слать движение, поэтому
 * контент трогается плавно, а не прыжком на всю длину порога переключения.
 */
export const SHEET_TABS_DRAG_DEADZONE = 8;

/**
 * Сопротивление у края ленты: листать дальше некуда, поэтому раздел отходит за
 * пальцем лишь на четверть пути — жест виден, но обещания переключения нет.
 */
export const SHEET_TABS_DRAG_RESISTANCE = 0.25;

/** Доля ширины раздела, на которой затухание под пальцем доходит до предела. */
export const SHEET_TABS_DRAG_FADE_SPAN = 0.5;

/** Предел затухания раздела под пальцем (1 — до полной прозрачности). */
export const SHEET_TABS_DRAG_MAX_FADE = 0.7;

/**
 * Путь пальца (px), на котором выбирается ось жеста: горизонталь листает
 * разделы, вертикаль отдаётся прокрутке страницы. Порог намеренно мал —
 * браузер решает, начинать ли прокрутку, на первых же пикселях, и после его
 * решения жест уже не отменить.
 */
export const SHEET_TABS_AXIS_LOCK_THRESHOLD = 4;

/** Заголовок подтверждения удаления предмета из снаряжения. */
export const INVENTORY_REMOVE_CONFIRM_TITLE = 'Убрать предмет?';

/** Подпись кнопки подтверждения удаления предмета. */
export const INVENTORY_REMOVE_CONFIRM_LABEL = 'Убрать';

/**
 * Подпись удаления в меню строки снаряжения: рядом с «Редактировать» одного
 * слова «Убрать» мало — непонятно, откуда именно исчезнет предмет.
 */
export const INVENTORY_REMOVE_MENU_LABEL = 'Убрать из снаряжения';

/** То же для строки заклинания: убирается оно из книги заклинаний. */
export const SPELL_REMOVE_MENU_LABEL = 'Убрать из книги';

/**
 * Подпись копирования каталожной записи в лист (снаряжение и заклинания). После
 * копирования запись живёт в листе как добавленная вручную: её можно
 * редактировать, а справочник остаётся нетронутым.
 */
export const CATALOG_COPY_MENU_LABEL = 'Скопировать в лист';

/** Заголовок тоста об удачном копировании предмета из справочника. */
export const INVENTORY_COPY_TOAST_TITLE = 'Предмет скопирован в лист';

/** Заголовок тоста об удачном копировании заклинания из справочника. */
export const SPELL_COPY_TOAST_TITLE = 'Заклинание скопировано в лист';

/** Пояснение тоста: копия живёт в листе и правится его формой. */
export const CATALOG_COPY_TOAST_DESCRIPTION =
  'Теперь запись правится прямо в листе — в справочнике ничего не изменится.';

/**
 * Подсказка значка «Свой» у предмета. Говорит о том, где запись хранится, а не
 * откуда взялась: своим предмет становится и после заполнения формы, и после
 * копирования из справочника — «добавлен вручную» о копии было бы неправдой.
 */
export const CUSTOM_INVENTORY_BADGE_HINT =
  'Предмет хранится в листе — его можно редактировать';

/** То же у значка «Своё» заклинания. */
export const CUSTOM_SPELL_BADGE_HINT =
  'Заклинание хранится в листе — его можно редактировать';

/** Подписи пустых вкладок листа персонажа. */
export const SHEET_TAB_EMPTY_LABELS: Record<
  'equipment' | 'spells' | 'features' | 'notes',
  string
> = {
  equipment: 'Инвентарь пуст',
  spells: 'Книга заклинаний пуста',
  features: 'Нет особенностей',
  notes: 'Нет заметок',
};

/**
 * Идентификатор заметки, в которую переносится текст листа, собранного до
 * разделения заметок на записи. Значение постоянное: при каждой загрузке такого
 * листа получается одна и та же запись.
 */
export const LEGACY_NOTE_ID = 'note:legacy';

/**
 * Ключ `useAsyncData` для источников каталога классов. Общий у визарда класса и
 * мастера повышения уровня: ответ фильтров переиспользуется между модалками.
 */
export const CLASS_SOURCES_ASYNC_DATA_KEY = 'character-sheet:class-sources';

/** Подписи мастера повышения уровня. */
export const LEVEL_UP_WIZARD_LABELS: Record<
  | 'progressStep'
  | 'levelStepTitle'
  | 'levelStepDescription'
  | 'featuresTitle'
  | 'noFeatures'
  | 'noClassHint'
  | 'featureChoicePlaceholder'
  | 'subclassTitle'
  | 'subclassHint'
  | 'subclassEmpty'
  | 'subclassError'
  | 'subclassSearchPlaceholder'
  | 'subclassPreviewTooltip'
  | 'chooseLabel'
  | 'loadError'
  | 'retry'
  | 'next'
  | 'back'
  | 'apply',
  string
> = {
  progressStep: 'Уровень и опыт',
  levelStepTitle: 'Уровень',
  levelStepDescription: 'Прирост хитов и умения этого уровня',
  featuresTitle: 'Умения уровня',
  noFeatures: 'На этом уровне класс умений не даёт',
  noClassHint:
    'Класс не выбран — умения и ресурсы за уровни не добавятся. Выберите класс в шапке листа.',
  featureChoicePlaceholder: 'Ваш выбор в умении (необязательно)',
  subclassTitle: 'Подкласс',
  subclassHint:
    'Список ограничен источниками из настройки профиля. Одноимённые подклассы различаются книгой в бейдже.',
  subclassEmpty: 'Подклассы не найдены',
  subclassError: 'Не удалось загрузить подклассы — выбор можно сделать позже',
  subclassSearchPlaceholder: 'Поиск по названию',
  subclassPreviewTooltip: 'Открыть описание подкласса',
  chooseLabel: 'Выберите',
  loadError: 'Не удалось загрузить данные класса',
  retry: 'Повторить',
  next: 'Далее',
  back: 'Назад',
  apply: 'Применить',
};

/** Подписи вкладки «Заметки» и модалки заметки. */
export const SHEET_NOTE_LABELS: Record<
  | 'add'
  | 'addTitle'
  | 'editTitle'
  | 'titleField'
  | 'titlePlaceholder'
  | 'contentField'
  | 'contentPlaceholder'
  | 'untitled'
  | 'legacyTitle'
  | 'addAction'
  | 'saveAction',
  string
> = {
  add: 'Добавить заметку',
  addTitle: 'Новая заметка',
  editTitle: 'Редактирование заметки',
  addAction: 'Добавить',
  saveAction: 'Сохранить',
  titleField: 'Заголовок',
  titlePlaceholder: 'Например: зацепки в Глубоководье',
  contentField: 'Текст',
  contentPlaceholder: 'Заметки о персонаже, зацепки, цели, союзники…',
  untitled: 'Без названия',
  legacyTitle: 'Заметки',
};

/**
 * Скелетон листа: сколько плашек рисовать в блоках, длина которых зависит от
 * самого документа. Числа подобраны под типовой лист — подложка совпадает с
 * ним по высоте, и после загрузки страница не прыгает.
 */
export const SHEET_SKELETON_COUNTS = {
  /** Кнопки статуса в шапке: замок и меню действий. */
  headerStatusControls: 2,

  /** Игровые кнопки шапки: вдохновение, короткий и продолжительный отдых. */
  headerGameControls: 3,

  /** Плитки-показатели в одном ряду сводки. */
  summaryTiles: 2,

  /** Навыки: полный список правил. */
  skills: 18,

  /** Группы владений: броня, оружие, инструменты, языки. */
  proficiencyGroups: 4,

  /** Чипы владений внутри одной группы. */
  proficiencyChips: 3,

  /** Ресурсы класса. */
  classResources: 2,

  /** Строки содержимого вкладки (снаряжение, заклинания, особенности). */
  tabRows: 6,
} as const;
