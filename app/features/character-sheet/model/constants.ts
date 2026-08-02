import type { ListPresentationConfig } from '~infrastructure/list-presentation/model';

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
  DamageRollSource,
  FeatureOrigin,
  FeatureOriginGroup,
  HitPointsGainMode,
  InventoryItemCategory,
  InventoryStatRollKind,
  LanguageProficiencyGroup,
  MagicItemCatalogGrouping,
  MagicItemCatalogItem,
  MagicItemCatalogSorting,
  MagicItemRarityKey,
  ResourceRecovery,
  ResourceRecoveryField,
  ResourceRecoveryMode,
  RollMode,
  SheetSaveStatus,
  SheetTab,
  SkillProficiencyLevel,
  SpeedTypeKey,
  SpeedUnit,
  ToolProficiencyGroupKey,
  VisionKey,
  WeaponCategory,
  WeaponProficiencyGroup,
  WeaponTraitKey,
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
  'Создаст лист из JSON-файла: нашего экспорта или выгрузки Long Story Short';

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
  'Выберите JSON-файл листа персонажа: наш экспорт или выгрузку Long Story Short';

/** Заголовок тоста о данных чужого формата, которым на листе нет места. */
export const SHEET_IMPORT_WARNINGS_TITLE = 'Часть данных перенести не удалось';

/**
 * Сколько держать тост с предупреждениями импорта: текста там на несколько
 * строк, и обычные пять секунд его не дают дочитать.
 */
export const SHEET_IMPORT_WARNINGS_DURATION = 15_000;

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

/**
 * Раздел профиля с подпиской и кодами: туда ведёт подсказка о лимитах — там
 * подписка и активируется, и видно её статус.
 */
export const SUBSCRIPTION_PROFILE_ROUTE = '/user/profile/activation';

/** Подпись ссылки в подсказке о расширении лимитов подпиской. */
export const SUBSCRIPTION_HINT_LINK_LABEL = 'Подписка и коды';

/** Формы слова «лист» для подписей лимитов. */
export const SHEET_PLURAL_FORMS: [string, string, string] = [
  'лист',
  'листа',
  'листов',
];

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

/** Варианты характеристик для селектов листа — в порядке отображения. */
export const ABILITY_OPTIONS: Array<{ label: string; value: AbilityKey }> =
  ABILITY_ORDER.map((key) => ({ label: ABILITY_LABELS[key], value: key }));

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

/**
 * Денежная единица по сокращению из справочника: варианты стартового
 * снаряжения приходят с подписью монеты («зм»), а не с ключом кошелька.
 * Собирается из подписей ряда валют, чтобы список единиц оставался один.
 */
export const CURRENCY_KEYS_BY_LABEL: Partial<Record<string, CurrencyKey>> =
  Object.fromEntries(
    CURRENCY_ORDER.map((key) => [CURRENCY_LABELS[key].toLowerCase(), key]),
  );

/**
 * Денежная единица варианта стартового снаряжения, если сокращение в ответе не
 * узнано: у стартовых наборов это всегда золото.
 */
export const STARTING_EQUIPMENT_DEFAULT_COIN_KEY: CurrencyKey = 'gold';

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

/** Названия видов отдыха. */
export const RESOURCE_RECOVERY_LABELS: Record<ResourceRecovery, string> = {
  'short-rest': 'Короткий отдых',
  'long-rest': 'Продолжительный отдых',
};

/** Названия режимов восстановления ресурса на отдыхе. */
export const RESOURCE_RECOVERY_MODE_LABELS: Record<
  ResourceRecoveryMode,
  string
> = {
  none: 'Ничего',
  all: 'Все заряды',
  amount: 'Своё число',
};

/** Варианты режима восстановления для селекта в настройке ресурсов. */
export const RESOURCE_RECOVERY_MODE_OPTIONS: Array<{
  label: string;
  value: ResourceRecoveryMode;
}> = [
  { label: RESOURCE_RECOVERY_MODE_LABELS.none, value: 'none' },
  { label: RESOURCE_RECOVERY_MODE_LABELS.all, value: 'all' },
  { label: RESOURCE_RECOVERY_MODE_LABELS.amount, value: 'amount' },
];

/** Правила восстановления ресурса в порядке вывода в форме и на панели. */
export const RESOURCE_RECOVERY_FIELDS: ResourceRecoveryField[] = [
  { key: 'shortRest', rest: 'short-rest' },
  { key: 'longRest', rest: 'long-rest' },
];

/** Подпись полного восстановления в подсказках и в списках отдыха. */
export const RESOURCE_RECOVERY_ALL_LABEL = 'все заряды';

/** Подпись полного восстановления в компактной пометке на панели листа. */
export const RESOURCE_RECOVERY_ALL_SHORT_LABEL = 'все';

/** Формы слова «заряд» для числа возвращаемых зарядов. */
export const RESOURCE_CHARGE_FORMS: [string, string, string] = [
  'заряд',
  'заряда',
  'зарядов',
];

/** Иконки видов отдыха. */
export const RESOURCE_RECOVERY_ICONS: Record<ResourceRecovery, string> = {
  'short-rest': 'tabler:campfire',
  'long-rest': 'tabler:sun',
};

/** Минимальное количество зарядов ресурса. */
export const RESOURCE_COUNT_MIN = 0;

/** Максимальное количество зарядов ресурса. */
export const RESOURCE_COUNT_MAX = 99;

/** Минимальное число зарядов, возвращаемых отдыхом. */
export const RESOURCE_RECOVERY_AMOUNT_MIN = 1;

/** Максимальная длина короткой подписи ресурса. */
export const RESOURCE_SHORT_LABEL_MAX_LENGTH = 4;

/** Заголовки окна ресурса класса: добавление и правка. */
export const CLASS_RESOURCE_MODAL_TITLES: Record<'add' | 'edit', string> = {
  add: 'Новый ресурс',
  edit: 'Ресурс класса',
};

/** Подсказки полей ресурса класса: пример вместо подставленного текста. */
export const RESOURCE_PLACEHOLDERS: Record<'name' | 'shortLabel', string> = {
  name: 'Например, Ярость',
  shortLabel: 'ЯР',
};

/**
 * Заготовка нового ресурса класса (без идентификатора). Подписи пустые —
 * пример показывает плейсхолдер, чтобы не стирать текст перед вводом своего.
 * Восстановление по умолчанию — продолжительный отдых целиком: так работает
 * большинство классовых счётчиков.
 */
export const NEW_CLASS_RESOURCE: Omit<CharacterClassResource, 'id'> = {
  name: '',
  shortLabel: '',
  shortRest: { mode: 'none', amount: RESOURCE_RECOVERY_AMOUNT_MIN },
  longRest: { mode: 'all', amount: RESOURCE_RECOVERY_AMOUNT_MIN },
  current: 1,
  max: 1,
};

/** Минимальное базовое значение класса доспеха. */
export const ARMOR_CLASS_BASE_MIN = 0;

/** Максимальное базовое значение класса доспеха. */
export const ARMOR_CLASS_BASE_MAX = 40;

/** Безброневой класс доспеха (без надетой брони): база `10 + Ловкость`. */
export const UNARMORED_ARMOR_CLASS_BASE = 10;

/** Максимальный бонус Ловкости к КД средней брони (штраф по Ловкости). */
export const ARMOR_MEDIUM_DEX_CAP = 2;

/** Подпись «без доспеха» для разбора класса доспеха. */
export const SHEET_UNARMORED_LABEL = 'Без доспеха';

/** Характеристика КД по правилам: к доспеху прибавляется модификатор Ловкости. */
export const DEFAULT_ARMOR_CLASS_ABILITY: AbilityKey = 'dexterity';

/** Пояснение правила модификатора Ловкости к КД для подсказки на плитке брони. */
export const ARMOR_DEXTERITY_HINT_LABELS: Record<ArmorDexterityMod, string> = {
  full: ' + модификатор Ловкости',
  capped: ' + модификатор Ловкости (максимум +2)',
  none: ' (без модификатора Ловкости)',
};

/** Подписи модалки настройки класса доспеха. */
export const ARMOR_CLASS_LABELS: Record<
  | 'title'
  | 'customToggle'
  | 'customToggleHint'
  | 'valueTitle'
  | 'abilitiesTitle'
  | 'abilitiesPlaceholder'
  | 'abilitiesArmorHint'
  | 'abilitiesArmorEmptyHint'
  | 'abilitiesCustomHint'
  | 'abilitiesCustomEmptyHint'
  | 'armorTypeTitle'
  | 'naturalArmor'
  | 'armorTitle'
  | 'dexCappedHint'
  | 'shieldTitle'
  | 'itemTitle'
  | 'totalTitle'
  | 'equipmentHint',
  string
> = {
  title: 'Класс доспеха',
  customToggle: 'Использовать своё значение',
  customToggleHint: 'Иначе КД считается автоматически по надетому доспеху',
  valueTitle: 'Значение',
  abilitiesTitle: 'Характеристики',
  abilitiesPlaceholder: 'Без модификаторов',
  abilitiesArmorHint: `Модификаторы этих характеристик идут в КД. ${ABILITY_LABELS.dexterity} учитывается по правилу надетого доспеха (средний ограничивает бонус, тяжёлый не даёт его вовсе), остальные складываются сверху — как безброневая защита варвара и монаха или песнь клинка.`,
  abilitiesArmorEmptyHint:
    'Ни одна характеристика в КД не идёт — считается только доспех со щитом.',
  abilitiesCustomHint:
    'Модификаторы этих характеристик прибавляются к значению.',
  abilitiesCustomEmptyHint:
    'Ни одна характеристика не прибавляется — КД равен значению.',
  armorTypeTitle: 'Тип доспеха',
  naturalArmor: 'Природный доспех',
  armorTitle: 'Доспех',
  // Подпись в родительном падеже, поэтому название характеристики здесь текстом,
  // а не из `ABILITY_LABELS` (там именительный: «Ловкость»).
  dexCappedHint: 'Модификатор Ловкости ограничен доспехом',
  shieldTitle: 'Щит',
  itemTitle: 'Магические предметы',
  totalTitle: 'Итоговый КД',
  equipmentHint:
    'Надевайте доспехи и щит на вкладке «Снаряжение» — в зачёт идёт доспех с наибольшим КД, щит складывается сверху.',
};

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

/** Вкладка модалки настроек листа с правилом подсчёта атаки оружием. */
export const SHEET_SETTINGS_WEAPON_TAB = 'weapon-attack';

/** Вкладка модалки настроек листа со своими бонусами. */
export const SHEET_SETTINGS_BONUSES_TAB = 'custom-bonuses';

/**
 * Вкладки модалки настроек листа: правило подсчёта атаки и свои бонусы —
 * разные задачи, показывать их разом незачем.
 */
export const SHEET_SETTINGS_TABS = [
  {
    label: 'Атака оружием',
    value: SHEET_SETTINGS_WEAPON_TAB,
    slot: SHEET_SETTINGS_WEAPON_TAB,
  },
  {
    label: 'Свои бонусы',
    value: SHEET_SETTINGS_BONUSES_TAB,
    slot: SHEET_SETTINGS_BONUSES_TAB,
  },
];

/** Минимальный свой бонус в настройках листа (мастерство, инициатива). */
export const CUSTOM_BONUS_MIN = -10;

/** Максимальный свой бонус в настройках листа (мастерство, инициатива). */
export const CUSTOM_BONUS_MAX = 10;

/**
 * Формат полей своих бонусов: знак виден и у плюса, чтобы поле читалось
 * бонусом, а не количеством.
 */
export const CUSTOM_BONUS_FORMAT_OPTIONS: Intl.NumberFormatOptions = {
  signDisplay: 'exceptZero',
};

/** Пояснение к своему бонусу мастерства. */
export const CUSTOM_PROFICIENCY_BONUS_HINT =
  'Складывается с бонусом по уровню везде, где тот участвует: спасброски, навыки, атака оружием, заклинательство.';

/** Пояснение к своему бонусу инициативы. */
export const CUSTOM_INITIATIVE_BONUS_HINT = `Складывается с модификатором характеристики «${ABILITY_LABELS.dexterity}» в плитке инициативы и в её броске.`;

/** Подписи модалки настроек листа. */
export const SHEET_SETTINGS_LABELS = {
  title: 'Настройки листа',
  weaponAbilityTitle: 'Базовая характеристика',
  normalWeaponTitle: 'Обычное оружие',
  finesseWeaponTitle: 'Фехтовальное и дальнобойное',
  abilityModifierTitle: 'Модификатор характеристики',
  proficiencyBonusTitle: 'Бонус мастерства',
  attackFormulaHint:
    'Бонус атаки = бонус мастерства + модификатор характеристики.',
  initiativeTitle: 'Инициатива',
  customBonusTitle: 'Свой бонус',
  levelProficiencyBonusTitle: 'По уровню',
  totalProficiencyBonusTitle: 'Итоговый бонус мастерства',
  totalInitiativeTitle: 'Итоговая инициатива',
};

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

/** Пометки навыка, которым персонаж уже владеет, в списках выбора. */
export const SKILL_OWNED_HINTS: Record<SkillProficiencyLevel, string> = {
  none: '',
  half: 'уже есть: половина владения',
  proficient: 'уже есть: владение',
  expertise: 'уже есть: компетенция',
};

/**
 * Предупреждение о выборе навыка, которым персонаж уже владеет. По правилам
 * 2024 бонус мастерства не складывается сам с собой, а компетенция даётся
 * только умением, где она названа прямо, — повторный выбор навыка пропадает
 * впустую.
 */
export const SKILL_DUPLICATE_WARNING =
  'Такие навыки у персонажа уже есть: по правилам 2024 повторное владение '
  + 'ничего не даёт и компетенцию не выдаёт — лучше выбрать другие навыки.';

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

/** Количество костей в броске по его режиму: преимущество и помеха катят две. */
export const ROLL_MODE_DICE_COUNT: Record<RollMode, number> = {
  normal: 1,
  advantage: 2,
  disadvantage: 2,
};

/**
 * Отбор кости по режиму броска в нотации дайс-роллера: «вл1» — взять лучшую,
 * «вх1» — худшую. Пустая строка — обычный бросок, отбирать нечего.
 */
export const ROLL_MODE_DICE_SUFFIX: Record<RollMode, string> = {
  normal: '',
  advantage: 'вл1',
  disadvantage: 'вх1',
};

/** Значение «Авто» в селекте характеристики броска. */
export const ROLL_ABILITY_AUTO = 'auto';

/** Варианты характеристики, чей модификатор идёт в бросок. */
export const ROLL_ABILITY_OPTIONS: Array<{
  label: string;
  value: AbilityKey | typeof ROLL_ABILITY_AUTO;
}> = [
  { label: 'Авто', value: ROLL_ABILITY_AUTO },
  ...ABILITY_ORDER.map((key) => ({ label: ABILITY_LABELS[key], value: key })),
];

/** Надпись кнопки в модалке броска проверки по умолчанию. */
export const ROLL_CHECK_ACTION_LABEL = 'Бросить проверку';

/** Надпись кнопки в модалке броска урона по умолчанию. */
export const DAMAGE_ROLL_ACTION_LABEL = 'Бросить урон';

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
    'Продолжительный отдых — не меньше 8 часов, из них минимум 6 часов сна, а остальное время — необременительные занятия. По его окончании персонаж восстанавливает все хиты, все кости хитов, все ячейки заклинаний и заряды счётчиков умений.',
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
  'Счётчикам умений возвращается столько зарядов, сколько задано им на продолжительный отдых: обычно это все заряды.',
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
  'По окончании отдыха возвращаются ячейки договора колдуна, а счётчикам умений — столько зарядов, сколько задано им на короткий отдых.',
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

/** Виды простого оружия каталога владений. */
const SIMPLE_WEAPON_ITEMS = [
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
] as const;

/** Виды воинского оружия каталога владений. */
const MARTIAL_WEAPON_ITEMS = [
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
] as const;

/** Название оружия каталога владений — ключ списков признаков ниже. */
type CatalogWeaponName =
  | (typeof SIMPLE_WEAPON_ITEMS)[number]
  | (typeof MARTIAL_WEAPON_ITEMS)[number];

/** Дальнобойное оружие каталога; остальное считается рукопашным. */
const RANGED_WEAPON_ITEMS: CatalogWeaponName[] = [
  'Дротик',
  'Короткий лук',
  'Лёгкий арбалет',
  'Праща',
  'Духовая трубка',
  'Ручной арбалет',
  'Тяжёлый арбалет',
  'Длинный лук',
  'Мушкет',
  'Пистоль',
];

/** Оружие каталога со свойством «Фехтовальное». */
const FINESSE_WEAPON_ITEMS: CatalogWeaponName[] = [
  'Кинжал',
  'Дротик',
  'Рапира',
  'Скимитар',
  'Короткий меч',
  'Кнут',
];

/**
 * Оружие каталога со свойством «Лёгкое». Свойство задаётся списком, а не
 * названием: «Лёгкий арбалет» и «Лёгкий молот» — разный случай, лёгкое из них
 * только второе.
 */
const LIGHT_WEAPON_ITEMS: CatalogWeaponName[] = [
  'Дубинка',
  'Кинжал',
  'Ручной топор',
  'Лёгкий молот',
  'Серп',
  'Скимитар',
  'Короткий меч',
  'Ручной арбалет',
];

/** Каталог оружия для настройки владения и мастерства: группы и виды. */
export const WEAPON_PROFICIENCY_GROUPS: WeaponProficiencyGroup[] = [
  {
    key: 'simple',
    title: 'Простое',
    all: 'Всё простое оружие',
    items: [...SIMPLE_WEAPON_ITEMS],
  },
  {
    key: 'martial',
    title: 'Воинское',
    all: 'Всё воинское оружие',
    items: [...MARTIAL_WEAPON_ITEMS],
  },
];

/** Оружие каталога по признакам, которыми проза владений сужает группу. */
export const WEAPON_TRAIT_ITEMS: Record<WeaponTraitKey, string[]> = {
  finesse: [...FINESSE_WEAPON_ITEMS],
  light: [...LIGHT_WEAPON_ITEMS],
  ranged: [...RANGED_WEAPON_ITEMS],
  melee: [...SIMPLE_WEAPON_ITEMS, ...MARTIAL_WEAPON_ITEMS].filter(
    (weapon) => !RANGED_WEAPON_ITEMS.includes(weapon),
  ),
};

/**
 * Устаревшие названия инструментов из листов и ответов API. Это НЕ каталог —
 * каталог целиком приходит из раздела «Предметы»; карта нужна лишь чтобы старая
 * запись листа сошлась с записью каталога и не выглядела своим инструментом.
 */
export const TOOL_NAME_ALIASES: Record<string, string> = {
  'набор костей': 'Игральные кости',
  'набор игральных карт': 'Игральные карты',
  'шахматы «копье дракона»': 'Набор драконьих шахмат',
  'набор для игры «три дракона»': 'Набор Ставка трех драконов',
  'флейта пана': 'Свирель',
  'инструменты жестянщика': 'Инструменты ремонтника',
};

/**
 * Категории раздела «Предметы», из которых собирается каталог инструментов, в
 * порядке отображения. `TOOL` — надмножество ремесленных и прочих инструментов,
 * поэтому «прочие» получаются вычитанием ремесленных.
 */
export const TOOL_CATALOG_ITEM_TYPES: Record<ToolProficiencyGroupKey, string> =
  {
    artisan: 'ARTISAN_S_TOOLS',
    gaming: 'GAMING_SET',
    musical: 'INSTRUMENT',
    other: 'TOOL',
  };

/** Порядок групп каталога инструментов в модалке владения. */
export const TOOL_CATALOG_GROUP_ORDER: ToolProficiencyGroupKey[] = [
  'artisan',
  'gaming',
  'musical',
  'other',
];

/**
 * Подпись группы «прочие инструменты». Категория `TOOL` в разделе называется
 * просто «Инструменты», а в модалке она стоит рядом с ремесленными — без своей
 * подписи колонка читалась бы как дубль.
 */
export const TOOL_CATALOG_OTHER_GROUP_TITLE = 'Прочие инструменты';

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

/** Подпись выбора боевого стиля в визарде класса. */
export const FIGHTING_STYLE_CHOICE_LABEL =
  'Выберите 1 черту категории «Боевой стиль»';

/** Ошибка: деталь выбранной черты не прошла разбор по схеме. */
export const FIGHTING_STYLE_INVALID_RESPONSE_ERROR =
  'Сервер вернул некорректную черту боевого стиля';

/**
 * Сегмент идентификатора особенности с выбранным боевым стилем:
 * `class:{featureKey}:fighting-style:{featUrl}`. Префикс `class:` нужен, чтобы
 * смена класса удаляла прежний выбор, а сегмент — чтобы из идентификатора
 * можно было достать url черты.
 */
export const FIGHTING_STYLE_FEATURE_ID_SEGMENT = 'fighting-style';

/**
 * Категории черт, недоступные при выборе за классовое улучшение характеристик:
 * черты происхождения даются предысторией, эпические — умением 19 уровня.
 * Список именно запрещающий: новая категория с бэка становится доступной сама.
 */
export const ABILITY_IMPROVEMENT_EXCLUDED_FEAT_CATEGORIES = [
  'ORIGIN',
  'EPIC_BOON',
];

/** Предел характеристики для прибавок от черты (правило D&D 2024). */
export const ABILITY_IMPROVEMENT_SCORE_MAX = 20;

/**
 * Названия классового умения, дающего черту (в нижнем регистре, без «ё»).
 * Справочник пишет его по-разному: у колдуна это «Увеличение характеристик».
 */
export const ABILITY_IMPROVEMENT_FEATURE_NAMES = [
  'улучшение характеристик',
  'увеличение характеристик',
];

/** Начало url черты «Улучшение характеристик» (у каждого источника свой суффикс). */
export const ABILITY_IMPROVEMENT_FEAT_URL_PREFIX = 'ability-score-improvement';

/** Тексты выбора черты за улучшение характеристик в мастере повышения уровня. */
export const ABILITY_IMPROVEMENT_LABELS = {
  featTitle: 'Выберите черту',
  featPlaceholder: 'Выбери черту',
  abilitiesTitle: 'Улучшение характеристик',
  abilityPlaceholder: 'Выбери характеристику',
  previewTooltip: 'Открыть описание черты',
  previewAriaLabel: 'Описание выбранной черты',
  loadError: 'Не удалось загрузить черты',
  applyError: 'Не удалось добавить выбранную черту',
  applyErrorLog: 'Ошибка добавления черты за улучшение характеристик:',
  maxHint: `Характеристика не поднимается выше ${ABILITY_IMPROVEMENT_SCORE_MAX}`,
};

/**
 * Сегмент идентификатора особенности с чертой, выбранной за улучшение
 * характеристик: `class:{featureKey}:{level}:ability-improvement:{featUrl}`.
 * Уровень в идентификаторе разводит выборы разных уровней, а префикс `class:`
 * привязывает черту к умению, которое её дало.
 */
export const ABILITY_IMPROVEMENT_FEATURE_ID_SEGMENT = 'ability-improvement';

/**
 * Служебные сегменты идентификаторов черт, выданных классовыми умениями. По ним
 * из идентификатора достаётся url черты, поэтому такие черты считаются взятыми
 * и не предлагаются повторно.
 */
export const CLASS_FEAT_CHOICE_ID_SEGMENTS = [
  FIGHTING_STYLE_FEATURE_ID_SEGMENT,
  ABILITY_IMPROVEMENT_FEATURE_ID_SEGMENT,
];

/** Эндпоинт фильтров черт — источник глобальной настройки источников. */
export const FEATS_FILTERS_PATH = '/api/v2/feats/filters';

/**
 * Ключ `useAsyncData` для источников каталога черт. Общий у модалки черт,
 * визарда класса и мастера повышения уровня: ответ фильтров переиспользуется
 * между модалками.
 */
export const FEAT_SOURCES_ASYNC_DATA_KEY = 'character-sheet:feat-sources';

/** Эндпоинт поиска видов. */
export const SPECIES_SEARCH_PATH = '/api/v2/species/search';

/** Эндпоинт фильтров видов — источник глобальной настройки источников. */
export const SPECIES_FILTERS_PATH = '/api/v2/species/filters';

/** Эндпоинт поиска заклинаний. */
export const SPELLS_SEARCH_PATH = '/api/v2/spells/search';

/** Базовый путь детали заклинания (`/{url}` — слаг из каталога). */
export const SPELLS_DETAIL_BASE_PATH = '/api/v2/spells';

/**
 * Хвост пути «сырого» ответа заклинания: публичная деталь урон не отдаёт, его
 * формулы лежат только в ответе для редактора (как и боевые числа предметов).
 */
export const SPELLS_RAW_DETAIL_PATH_SUFFIX = 'raw';

/** Ключ общего кэша формул урона заклинаний (каталожные данные, не листа). */
export const SPELL_DAMAGE_STATE_KEY = 'character-sheet:spell-damage';

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

/** Круг заговора: ячеек у него нет, накладывается он без них. */
export const CANTRIP_SPELL_LEVEL = 0;

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

/** Подпись блока подготовленных заклинаний на вкладке заклинаний. */
export const PREPARED_SPELLS_LABEL = 'Подготовленные';

/** Значение блока, когда число подготовленных заклинаний не определено. */
export const PREPARED_SPELLS_EMPTY_VALUE = '—';

/** Минимальное своё число подготовленных заклинаний. */
export const PREPARED_SPELLS_MIN = 0;

/** Максимальное своё число подготовленных заклинаний. */
export const PREPARED_SPELLS_MAX = 99;

/** Минимальный бонус к числу подготовленных заклинаний. */
export const PREPARED_SPELLS_BONUS_MIN = -99;

/** Максимальный бонус к числу подготовленных заклинаний. */
export const PREPARED_SPELLS_BONUS_MAX = 99;

/**
 * Начало названия колонки таблицы класса с числом подготовленных заклинаний.
 * Справочник сокращает название по-разному («Подг. закл.», «Подг. Закл»),
 * поэтому сравниваются только буквы названия.
 */
export const PREPARED_SPELLS_COLUMN_PREFIX = 'подг';

/** Обязательная часть названия той же колонки (отсекает «Подготовка» и т. п.). */
export const PREPARED_SPELLS_COLUMN_KEYWORD = 'закл';

/** Разделитель «подготовлено / всего можно» в блоке подготовленных. */
export const PREPARED_SPELLS_VALUE_SEPARATOR = ' / ';

/** Подписи значка подготовки в строке заклинания. */
export const PREPARED_SPELL_TOGGLE_LABELS: Record<
  'prepare' | 'unprepare' | 'cantrip' | 'innate' | 'limit',
  string
> = {
  prepare: 'Подготовить',
  unprepare: 'Снять подготовку',
  cantrip: 'Заговор подготавливать не нужно — он всегда доступен',
  innate: 'Врождённое заклинание подготавливать не нужно',
  limit: 'Больше заклинаний подготовить нельзя',
};

/** Начало подсказки блока подготовленных: сколько заклинаний отмечено. */
export const PREPARED_SPELLS_COUNT_HINT = 'Подготовлено заклинаний';

/** Заголовок предупреждения о достигнутом пределе подготовленных заклинаний. */
export const PREPARED_SPELLS_LIMIT_TOAST_TITLE =
  'Предел подготовленных заклинаний';

/** Подсказки блока подготовленных заклинаний на вкладке заклинаний. */
export const PREPARED_SPELLS_HINTS: Record<
  'auto' | 'custom' | 'unknown',
  string
> = {
  auto: 'Подготовленных заклинаний по таблице класса',
  custom: 'Своё число подготовленных заклинаний: подсчёт по классу выключен',
  unknown:
    'Класс не даёт числа подготовленных заклинаний — нажмите, чтобы задать своё',
};

/** Подписи модалки настройки подготовленных заклинаний. */
export const PREPARED_SPELLS_LABELS: Record<
  | 'title'
  | 'customToggle'
  | 'customHint'
  | 'customValue'
  | 'classValue'
  | 'bonus'
  | 'total'
  | 'unknownClassValue'
  | 'autoHint',
  string
> = {
  title: 'Подготовленные заклинания',
  customToggle: 'Использовать своё число',
  customHint: 'Иначе число считается по таблице класса',
  customValue: 'Число заклинаний',
  classValue: 'Число из таблицы класса',
  bonus: 'Бонус к числу класса',
  total: 'Всего можно подготовить',
  unknownClassValue:
    'Класс не даёт числа подготовленных заклинаний. Если оно должно быть, выберите класс заново или повысьте уровень — лист запомнит таблицу класса.',
  autoHint:
    'Число берётся из таблицы класса на текущем уровне; бонус прибавляется к нему (например, от черты или предмета).',
};

/**
 * Общие подписи ряда отбора на вкладках листа: сброс и пустое место под отбором
 * одинаковы и у заклинаний, и у особенностей.
 */
export const SHEET_FILTER_LABELS: Record<
  'reset' | 'resetHint' | 'empty',
  string
> = {
  reset: 'Сбросить',
  resetHint: 'Снять отбор и вернуть список целиком',
  empty: 'Под отбор ничего не подошло',
};

/** Подписи чипов отбора заклинаний на вкладке заклинаний. */
export const SPELL_FILTER_LABELS: Record<
  'prepared' | 'preparedHint' | 'cantrip',
  string
> = {
  prepared: 'Подготовленные',
  preparedHint: 'Оставить в списке только заклинания, помеченные значком',
  cantrip: 'З',
};

/** Общая часть оформления чипа отбора (каталог заклинаний, вкладка). */
export const FILTER_CHIP_CLASS =
  'cursor-pointer rounded border px-2 py-1 text-xs transition-colors';

/** Невыбранный чип отбора: рамка теплеет только под курсором. */
export const FILTER_CHIP_IDLE_CLASS =
  'border-default text-toned hover:border-warning/60';

/** Выбранный чип отбора: горит тёплым, как отмеченное значком заклинание. */
export const FILTER_CHIP_SELECTED_CLASS =
  'border-warning bg-warning/10 text-warning';

/**
 * Подписи чисел заклинательства: в узкую плитку вкладки идёт короткая, полное
 * название показывает подсказка по наведению.
 */
export const SPELLCASTING_STAT_LABELS: Record<
  'saveDc' | 'attack',
  { short: string; full: string }
> = {
  saveDc: { short: 'Сл. спасброска', full: 'Сложность спасброска' },
  attack: { short: 'Атака закл.', full: 'Атака заклинанием' },
};

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

/**
 * Префикс URL своей предыстории. Ссылки на раздел у неё нет, поэтому запись
 * листа получает свой идентификатор (как свои предметы и заклинания) — так своя
 * предыстория не путается с предысторией каталога.
 */
export const CUSTOM_BACKGROUND_URL_PREFIX = 'custom:';

/**
 * Категория черт происхождения (`/api/v2/feats/select`). Такие черты даёт
 * предыстория, поэтому в своей предыстории выбор ограничен ими.
 */
export const ORIGIN_FEAT_CATEGORY = 'ORIGIN';

/** Сколько навыков даёт своя предыстория (правило D&D 2024). */
export const CUSTOM_BACKGROUND_SKILL_COUNT = 2;

/** Сколько инструментов даёт своя предыстория (правило D&D 2024). */
export const CUSTOM_BACKGROUND_TOOL_COUNT = 1;

/** Ограничение длины названия своей предыстории. */
export const CUSTOM_BACKGROUND_NAME_MAX_LENGTH = 80;

/**
 * Подписи слотов прибавок своей предыстории по режиму распределения: в «+2/+1»
 * игрок называет две характеристики, в «+1/+1/+1» — три.
 */
export const CUSTOM_BACKGROUND_ABILITY_SLOT_LABELS: Record<
  AbilityBonusMode,
  string[]
> = {
  '2-1': ['+2 к характеристике', '+1 к характеристике'],
  '1-1-1': [
    '+1 к характеристике',
    '+1 к характеристике',
    '+1 к характеристике',
  ],
};

/** Подписи формы своей предыстории. */
export const CUSTOM_BACKGROUND_LABELS = {
  openButton: 'Своя предыстория',
  title: 'Своя предыстория',
  nameTitle: 'Название',
  namePlaceholder: 'Например: Странствующий книготорговец',
  abilitiesTitle: 'Характеристики',
  abilityPlaceholder: 'Характеристика',
  skillsTitle: `Навыки (${CUSTOM_BACKGROUND_SKILL_COUNT})`,
  skillsPlaceholder: `Выберите ${CUSTOM_BACKGROUND_SKILL_COUNT}`,
  toolTitle: 'Инструмент',
  toolPlaceholder: `Выберите ${CUSTOM_BACKGROUND_TOOL_COUNT}`,
  toolEmpty: 'Каталог инструментов недоступен',
  featTitle: 'Черта происхождения',
  featPlaceholder: 'Выберите черту',
  featEmpty: 'Без черты',
  featPreview: 'Открыть описание черты',
  featPreviewAriaLabel: 'Описание выбранной черты',
  featLoadError: 'Не удалось загрузить черты происхождения',
  featLoadErrorLog: 'Ошибка загрузки черт происхождения:',
  featDetailError: 'Не удалось загрузить выбранную черту',
  featDetailErrorLog: 'Ошибка загрузки черты своей предыстории:',
  hint:
    'Своя предыстория применяется как каталожная: навыки, инструмент, черта и '
    + 'прибавки к характеристикам сразу заполнят лист.',
  apply: 'Создать',
};

/**
 * Префикс URL своего вида. Ссылки на раздел у него нет, поэтому запись листа
 * получает свой идентификатор (как своя предыстория) — так свой вид не
 * путается с видом каталога.
 */
export const CUSTOM_SPECIES_URL_PREFIX = 'custom:';

/** Ограничение длины названия своего вида. */
export const CUSTOM_SPECIES_NAME_MAX_LENGTH = 80;

/** Ограничение длины названия особенности своего вида. */
export const CUSTOM_SPECIES_FEATURE_NAME_MAX_LENGTH = 120;

/** Размер своего вида по умолчанию; значение из `SIZE_LABEL_WORDS`. */
export const CUSTOM_SPECIES_DEFAULT_SIZE = 'Средний';

/** Скорость ходьбы своего вида по умолчанию, футы. */
export const CUSTOM_SPECIES_DEFAULT_SPEED = 30;

/** Дистанция новой строки зрения своего вида по умолчанию, футы. */
export const CUSTOM_SPECIES_DEFAULT_VISION = 60;

/** Подписи формы своего вида. */
export const CUSTOM_SPECIES_LABELS = {
  openButton: 'Свой вид',
  title: 'Свой вид',
  nameTitle: 'Название',
  namePlaceholder: 'Например: Пепельный странник',
  sizeTitle: 'Размер',
  speedTitle: 'Передвижение, футы',
  speedAdd: 'Добавить передвижение',
  speedRemove: 'Убрать передвижение',
  speedEmpty: 'Передвижение не задано',
  hoverLabel: 'Парение',
  visionTitle: 'Зрение, футы',
  visionAdd: 'Добавить зрение',
  visionRemove: 'Убрать зрение',
  visionEmpty: 'Зрение не задано',
  distanceTypePlaceholder: 'Тип',
  featuresTitle: 'Особенности',
  featureNamePlaceholder: 'Название особенности',
  featureDescriptionPlaceholder: 'Опиши особенность',
  featureAdd: 'Добавить особенность',
  featureRemove: 'Удалить особенность',
  featuresEmpty:
    'Особенностей нет — их можно добавить и позже, на вкладке «Особенности».',
  hint:
    'Свой вид применяется как каталожный: размер, передвижение, зрение и '
    + 'особенности сразу заполнят лист.',
  apply: 'Создать',
};

/**
 * Префикс URL своего класса: ссылки на раздел у него нет, поэтому запись листа
 * получает свой идентификатор (как своя предыстория и свой вид) — так свой
 * класс не путается с классом каталога.
 */
export const CUSTOM_CLASS_URL_PREFIX = 'custom:';

/** Ограничение длины названия своего класса и его подкласса. */
export const CUSTOM_CLASS_NAME_MAX_LENGTH = 80;

/** Ограничение длины названия умения своего класса. */
export const CUSTOM_CLASS_FEATURE_NAME_MAX_LENGTH = 120;

/** Кость хитов своего класса по умолчанию; номинал из `HIT_DIE_OPTIONS`. */
export const CUSTOM_CLASS_DEFAULT_HIT_DIE = 8;

/** Сколько спасбросков даёт класс по правилам D&D. */
export const CUSTOM_CLASS_SAVING_THROW_COUNT = 2;

/**
 * Варианты заклинательства своего класса: тип задаёт прогрессию ячеек, поэтому
 * каждый подписан классами-примерами — иначе выбор пришлось бы сверять с
 * правилами.
 */
export const CUSTOM_CLASS_CASTER_TYPE_OPTIONS: Array<{
  label: string;
  value: CasterType;
}> = [
  { label: 'Класс не даёт заклинаний', value: CasterType.NONE },
  { label: 'Полный заклинатель (волшебник, жрец)', value: CasterType.FULL },
  {
    label: 'Половина заклинателя (паладин, следопыт)',
    value: CasterType.HALF,
  },
  {
    label: 'Треть заклинателя (мистический рыцарь)',
    value: CasterType.THIRD,
  },
  { label: 'Заклинатель договора (колдун)', value: CasterType.PACT },
];

/** Подписи формы своего класса. */
export const CUSTOM_CLASS_LABELS = {
  openButton: 'Свой класс',
  title: 'Свой класс',
  nameTitle: 'Название',
  namePlaceholder: 'Например: Охотник за бурями',
  subclassTitle: 'Подкласс (необязательно)',
  subclassPlaceholder: 'Например: Путь громового шага',
  hitDieTitle: 'Кость хитов',
  savingThrowsTitle: `Спасброски (обычно ${CUSTOM_CLASS_SAVING_THROW_COUNT})`,
  savingThrowsPlaceholder: 'Выберите характеристики',
  skillsTitle: 'Владение навыками',
  skillsPlaceholder: 'Выберите навыки',
  casterTypeTitle: 'Заклинательство',
  featuresTitle: 'Умения',
  featureNamePlaceholder: 'Название умения',
  featureDescriptionPlaceholder: 'Опиши умение',
  featureAdd: 'Добавить умение',
  featureRemove: 'Удалить умение',
  featuresEmpty:
    'Умений нет — их можно добавить и позже, на вкладке «Особенности».',
  hint:
    'Свой класс применяется как каталожный: кость хитов, хиты, спасброски, '
    + 'владение навыками, ячейки заклинаний и умения сразу заполнят лист. '
    + 'Владения бронёй, оружием и инструментами задаются на панели владений, '
    + 'ресурсы класса — на панели ресурсов.',
  apply: 'Создать',
};

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

/** Ключевые слова признаков, которыми проза владений сужает группу оружия. */
export const WEAPON_TRAIT_MATCH_KEYWORDS: Record<WeaponTraitKey, string[]> = {
  finesse: ['фехтовальн'],
  light: ['лёгк', 'легк'],
  melee: ['рукопашн'],
  ranged: ['дальнобойн'],
};

/**
 * Оси признаков оружия: внутри оси признаки объединяются («фехтовальное или
 * лёгкое» — любое из двух), между осями пересекаются («воинское рукопашное
 * фехтовальное» — и рукопашное, и фехтовальное).
 */
export const WEAPON_TRAIT_AXES: WeaponTraitKey[][] = [
  ['finesse', 'light'],
  ['melee', 'ranged'],
];

/**
 * Корни слов, по которым в прозе владений («Выберите один вид ремесленных
 * инструментов») опознаётся группа каталога. Это языковая эвристика, а не
 * список инструментов: сами инструменты приходят из раздела «Предметы».
 */
export const TOOL_MATCH_KEYWORDS: Record<ToolProficiencyGroupKey, string[]> = {
  artisan: ['ремесленн'],
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

/**
 * Хвост пути «сырого» ответа раздела: у предмета в нём числовой КД доспеха и
 * урон оружия, у магического — редкость и связанные немагические предметы.
 * Публичная деталь ни того, ни другого не отдаёт.
 */
export const RAW_DETAIL_PATH_SUFFIX = 'raw';

/** Эндпоинт поиска магических предметов (раздел «Магические предметы»). */
export const MAGIC_ITEMS_SEARCH_PATH = '/api/v2/magic-items/search';

/** Базовый путь детали магического предмета. */
export const MAGIC_ITEMS_DETAIL_BASE_PATH = '/api/v2/magic-items';

/** Эндпоинт фильтров магических предметов. */
export const MAGIC_ITEMS_FILTERS_PATH = '/api/v2/magic-items/filters';

/**
 * Редкость «редкость варьируется»: под такой записью раздел держит сразу
 * несколько предметов («Оружие +1, +2 или +3»), поэтому ни цены магии, ни одной
 * немагической основы у неё нет — в лист её не добавляют.
 */
export const MAGIC_ITEM_VARIES_RARITY: MagicItemRarityKey = 'VARIES';

/**
 * Цена магии по редкости в золотых монетах — её прибавляют к стоимости
 * немагической основы. Редкости без цены (варьируется, не определена) в
 * таблице нет, артефакт бесценен.
 */
export const MAGIC_ITEM_RARITY_COSTS: Partial<
  Record<MagicItemRarityKey, number>
> = {
  COMMON: 100,
  UNCOMMON: 400,
  RARE: 4000,
  VERY_RARE: 40000,
  LEGENDARY: 200000,
};

/** Подпись стоимости артефакта: цены у него нет. */
export const MAGIC_ITEM_ARTIFACT_COST_LABEL = 'Бесценный';

/**
 * Стоимость денежной единицы в золотых монетах: справочник отдаёт цены
 * предметов в разных монетах («5 см»), а цена магии задана в золоте.
 */
export const CURRENCY_GOLD_RATES: Record<CurrencyKey, number> = {
  copper: 0.01,
  silver: 0.1,
  electrum: 0.5,
  gold: 1,
  platinum: 10,
};

/** Подписи групп каталога для предметов без значения поля группировки. */
export const MAGIC_ITEM_CATALOG_EMPTY_GROUP_LABELS: Record<
  Exclude<MagicItemCatalogGrouping, 'NONE'>,
  string
> = {
  RARITY: 'Без редкости',
  CATEGORY: 'Без категории',
};

/**
 * Представление каталога магических предметов в модалке добавления:
 * группировка та же, что в разделе «Магические предметы», а порядок внутри
 * группы один (по русскому названию) — меню сортировки поэтому не появляется.
 */
export const MAGIC_ITEM_CATALOG_PRESENTATION_CONFIG: ListPresentationConfig<
  MagicItemCatalogItem,
  MagicItemCatalogGrouping,
  MagicItemCatalogSorting
> = {
  sectionKey: 'character-sheet:magic-item-catalog',
  defaultGrouping: 'RARITY',
  defaultSorting: 'NAME',
  groupingOptions: [
    { label: 'По редкости', value: 'RARITY', apiValue: 'RARITY' },
    { label: 'По категории', value: 'CATEGORY', apiValue: 'CATEGORY' },
    { label: 'Без группировки', value: 'NONE', apiValue: 'NONE' },
  ],
  sortingOptions: [
    { label: 'По русскому названию', value: 'NAME', apiValue: 'NAME' },
  ],
};

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

/**
 * Минимальное количество одного предмета в инвентаре. Ноль разрешён: у
 * потраченного расходника запись остаётся в списке (её не приходится искать в
 * каталоге заново), но предмет считается отсутствующим — его нельзя надеть,
 * им нельзя атаковать.
 */
export const INVENTORY_QUANTITY_MIN = 0;

/** Максимальное количество одного предмета в инвентаре. */
export const INVENTORY_QUANTITY_MAX = 999;

/**
 * Идентификатор позиции стартового снаряжения, которой нет в каталоге. Она
 * заводится как свой предмет листа, но с устойчивым идентификатором от
 * названия: повторный выбор того же класса складывает количество, а не плодит
 * одинаковые строки, как случайный `uuid`.
 */
export const STARTING_EQUIPMENT_CUSTOM_ID_SEGMENT = 'starting:';

/**
 * Значение переключателя «не добавлять» стартовое снаряжение. Отдельная строка,
 * а не пустая: пустое значение переключатель считает несделанным выбором и не
 * подсвечивает строку. С метками вариантов («А», «Б») она не столкнётся.
 */
export const STARTING_EQUIPMENT_SKIP_VALUE = 'skip';

/** Подписи блока стартового снаряжения в мастерах класса и предыстории. */
export const STARTING_EQUIPMENT_LABELS = {
  title: 'Стартовое снаряжение',
  hint: 'Предметы варианта попадут в «Снаряжение», монеты — в кошелёк.',
  skipLabel: 'Не добавлять',
  skipDescription: 'Снаряжение и кошелёк останутся как есть',
  emptyOptionDescription: 'Без предметов',

  /** Подпись варианта без метки в ответе; к ней добавляется номер по порядку. */
  optionFallbackLabel: 'Вариант',

  /** Приставка количества в подписи предмета («Кинжал ×2»). */
  quantityPrefix: '×',
};

/** Подписи кнопки доспеха в строке инвентаря по его текущему состоянию. */
export const INVENTORY_EQUIP_ACTION_LABELS: Record<
  'equip' | 'unequip',
  string
> = {
  equip: 'Надеть',
  unequip: 'Снять',
};

/**
 * Подписи пункта меню о смене хвата универсального оружия — по хвату, в который
 * его после нажатия возьмут (а не по нынешнему).
 */
export const INVENTORY_GRIP_MENU_LABELS: Record<
  'oneHanded' | 'twoHanded',
  string
> = {
  oneHanded: 'Взять в одну руку',
  twoHanded: 'Взять в две руки',
};

/** Значок универсального оружия, взятого двумя руками. */
export const INVENTORY_TWO_HANDED_BADGE_LABEL = 'Двумя руками';

/** Подсказка значка «Двумя руками»: почему у оружия выросла кость урона. */
export const INVENTORY_TWO_HANDED_BADGE_HINT =
  'Универсальное оружие взято двумя руками: урон катится большей костью';

/** Значок предмета, которого у персонажа не осталось (количество — ноль). */
export const INVENTORY_MISSING_BADGE_LABEL = 'Отсутствует';

/** Подсказка значка «Отсутствует»: что именно запрещает нулевое количество. */
export const INVENTORY_MISSING_BADGE_HINT =
  'Предмета не осталось: его нельзя надеть, им нельзя атаковать и бросать урон';

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
export const SHEET_ROLL_HINT_LABEL = 'нажми, чтобы бросить';

/** Заголовок предупреждения о том, что тратить ячейки круга уже нечего. */
export const SPELL_SLOTS_EMPTY_TOAST_TITLE = 'Ячейки закончились';

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

/** Префикс тега типа урона в формулах заклинаний (`8к6@dmg.fire`). */
export const SPELL_DAMAGE_TYPE_TAG_PREFIX = 'dmg.';

/**
 * Названия типов урона заклинаний по тегам формул: справочник заклинаний
 * записывает тип не ключом словаря (`FIRE`), а тегом формулы (`dmg.fire`).
 */
export const SPELL_DAMAGE_TYPE_TAG_LABELS: Record<string, string> =
  Object.fromEntries(
    Object.entries(DAMAGE_TYPE_LABELS).map(([damageType, label]) => [
      `${SPELL_DAMAGE_TYPE_TAG_PREFIX}${damageType.toLowerCase()}`,
      label,
    ]),
  );

/**
 * Условия, при которых катится своя формула урона: у части заклинаний кость
 * зависит от состояния цели, и справочник помечает такие формулы тегом.
 */
export const SPELL_DAMAGE_CONDITION_TAG_LABELS: Record<string, string> = {
  'target.full': 'Цель с полными хитами',
  'target.notFull': 'Цель с неполными хитами',
};

/** Тег формулы, подставляющий модификатор заклинательной характеристики. */
export const SPELL_DAMAGE_ABILITY_MODIFIER_TAG = 'mod.spell';

/** Разделитель типов урона одного броска («Кислотный/Холодный» — на выбор). */
export const SPELL_DAMAGE_TYPE_SEPARATOR = '/';

/** Короткая подпись плитки урона заклинания — та же, что и у оружия. */
export const SPELL_DAMAGE_STAT_LABEL = 'Урон';

/** Подпись кнопки броска урона заклинанием для скринридера. */
export const SPELL_DAMAGE_ROLL_LABEL = 'Бросок урона заклинанием';

/**
 * Подсказка плитки урона заклинания круга: бросок из окна настройки считается
 * накладыванием и, в отличие от плитки оружия, ещё и занимает ячейку. У
 * заговоров подсказка обычная — ячеек они не тратят.
 */
export const SPELL_DAMAGE_ROLL_HINT_LABEL =
  'нажми, чтобы настроить бросок; ячейка тратится при броске';

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

/** Номиналы костей, доступные в модалках броска. */
export const ROLL_DICE_FACES = [4, 6, 8, 10, 12, 20, 100];

/** Варианты номинала кости для селекта в модалках броска. */
export const ROLL_DICE_FACES_OPTIONS: Array<{
  label: string;
  value: number;
}> = ROLL_DICE_FACES.map((faces) => ({
  label: `${DICE_NOTATION_LETTER}${faces}`,
  value: faces,
}));

/** Номинал кости проверки по умолчанию. */
export const DEFAULT_ROLL_DICE_FACES = 20;

/** Номинал кости, с которым добавляется новая кость урона. */
export const DEFAULT_DAMAGE_DICE_FACES = 6;

/**
 * Минимальное количество костей в группе броска урона: верхнюю границу группа
 * делит с формой своего оружия (`DAMAGE_DICE_COUNT_MAX`), а нулевая группа в
 * броске бессмысленна — вместо неё кость убирают из списка.
 */
export const DAMAGE_ROLL_DICE_COUNT_MIN = 1;

/**
 * Максимум групп костей в модалке урона: больше в бросок не набирают, а список
 * перестал бы помещаться в окно.
 */
export const DAMAGE_DICE_GROUPS_MAX = 6;

/**
 * Пустой бросок урона: заглушка для создания модалки настройки — настоящий
 * разбор приходит в `open()` вместе с оружием или заклинанием.
 */
export const EMPTY_DAMAGE_ROLL_SOURCE: DamageRollSource = {
  diceNotation: '',
  flatBonus: 0,
  ability: null,
  abilityModifierCount: 0,
  typeLabel: '',
};

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

/**
 * Подписи происхождения особенности персонажа. Особенность без источника
 * добавлена в лист руками, поэтому подписана «Своё» — как своё заклинание или
 * свой предмет.
 */
export const FEATURE_ORIGIN_LABELS: Record<FeatureOrigin, string> = {
  species: 'Вид',
  lineage: 'Подвид',
  class: 'Класс',
  feat: 'Черта',
  none: 'Своё',
};

/**
 * Порядок чипов отбора по источнику на вкладке особенностей: сперва то, что
 * лист выдал сам (вид, класс, черты), свои записи — последними.
 */
export const FEATURE_ORIGIN_GROUP_ORDER: FeatureOriginGroup[] = [
  'species',
  'class',
  'feat',
  'none',
];

/** Подсказки чипов отбора особенностей по источнику. */
export const FEATURE_ORIGIN_GROUP_HINTS: Record<FeatureOriginGroup, string> = {
  species: 'Оставить в списке особенности вида и подвида',
  class: 'Оставить в списке особенности класса',
  feat: 'Оставить в списке черты',
  none: 'Оставить в списке свои особенности',
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

/**
 * Варианты происхождения при добавлении особенности вручную: те же группы, что
 * и у чипов отбора вкладки, — «Своё» стоит первым, оно же и по умолчанию.
 */
export const FEATURE_ORIGIN_OPTIONS: Array<{
  label: string;
  value: FeatureOrigin;
}> = [
  { label: FEATURE_ORIGIN_LABELS.none, value: 'none' },
  { label: FEATURE_ORIGIN_LABELS.species, value: 'species' },
  { label: FEATURE_ORIGIN_LABELS.class, value: 'class' },
  { label: FEATURE_ORIGIN_LABELS.feat, value: 'feat' },
];

/** Каталог языков для настройки владения: группы и языки. */
export const LANGUAGE_PROFICIENCY_GROUPS: LanguageProficiencyGroup[] = [
  {
    key: 'standard',
    title: 'Стандартные',
    all: 'Все стандартные языки',
    items: [
      'Общий',
      'Общий язык жестов',
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

/** Подписи модалки и чипов владения инструментами. */
export const SHEET_TOOL_LABELS = {
  title: 'Владение инструментами',
  preview: 'Открыть описание инструмента',
  removeCustom: 'Удалить инструмент',
  selectAll: 'Выбрать все',
  catalogEmpty:
    'В разделе «Предметы» инструментов нет — впишите нужный как свой.',
  customTitle: 'Свой инструмент',
  customHint: 'Инструмента нет на сайте — описание у него не откроется.',
  customPlaceholder: 'Название инструмента',
  customEmpty: 'Своих инструментов пока нет',
};

/** Ограничение длины названия своего инструмента. */
export const CUSTOM_TOOL_NAME_MAX_LENGTH = 80;

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
 * То же для врождённого заклинания: в книгу оно не входит, а приходит от вида,
 * поэтому убирается именно из листа. Вернуть его можно, заново выбрав вид.
 */
export const INNATE_SPELL_REMOVE_MENU_LABEL = 'Убрать из листа';

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
 * То же для врождённого заклинания: копия уходит в книгу заклинаний, поэтому
 * из группы врождённых оно пропадает — иначе стояло бы в листе дважды.
 */
export const INNATE_SPELL_COPY_TOAST_DESCRIPTION =
  'Заклинание переехало в книгу и теперь правится прямо в листе.';

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
