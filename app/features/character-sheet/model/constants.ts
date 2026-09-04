import type { ListPresentationConfig } from '~infrastructure/list-presentation/model';

import type {
  AbilityBonusMode,
  AbilityKey,
  ArmorDexterityMod,
  ArmorProficiencyGroup,
  CharacterClassResource,
  CharacterCustomBonus,
  CharacterCustomCurrency,
  ClassChoiceKind,
  CurrencyKey,
  CustomArmorType,
  CustomArmorTypeMeta,
  CustomBonusBaseSource,
  CustomBonusKind,
  CustomBonusSourceOption,
  CustomInventoryItemDraft,
  CustomInventoryKind,
  CustomSpellField,
  DamageRollSource,
  FeatGrantedSpeedKey,
  FeatSpeedEqualsWalkKey,
  FeatureOrigin,
  FeatureOriginGroup,
  HitPointsGainMode,
  InventoryBonusMode,
  InventoryItemBonus,
  InventoryItemCategory,
  InventoryMagicState,
  InventoryStatRollKind,
  LanguageProficiencyGroup,
  LevelUpAbilityImprovement,
  MagicItemCatalogGrouping,
  MagicItemCatalogItem,
  MagicItemCatalogSorting,
  MagicItemRarityKey,
  PersonalityTextField,
  PreparedKindLabels,
  PreparedSpellKind,
  ProficiencyBaseSource,
  ProficiencyGroupKey,
  ResourceMaxSource,
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
import { range } from 'es-toolkit';

import { AbilityKey as ApiAbilityKey } from '~/shared/types';
import { CasterType } from '~classes/model';
import { DAMAGE_TYPE_LABELS } from '~ui/damage-formula';

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

/**
 * Класс кнопки правки, которую на широком экране проявляет наведение: ниже `lg`
 * (1024px) она видна всегда. Порог по ширине окна, а не по типу указателя
 * (`pointer-coarse`): узкому окну кнопка нужна одинаково — и на планшете с
 * телефоном, где ховера нет вовсе, и на десктопе с мышью, где лист открыт в
 * половину экрана.
 */
export const SHEET_REVEAL_CONTROL_CLASS = 'max-lg:opacity-100';

/**
 * Кнопка действия в заголовке панели (шестерёнка настроек, карандаш правки,
 * справка). Значок в цвете акцента и без подложки: кнопка стоит в потоке
 * легенды, обводку рамки под ней разрывает сама легенда, а приглушённый серый
 * на 14 пикселях терялся — значок должен бросаться в глаза.
 */
export const SHEET_TITLE_ACTION_CLASS =
  'flex cursor-pointer items-center text-primary transition-colors hover:text-highlighted';

/**
 * Действие заголовка, которое проявляет наведение на панель: ниже `lg` (1024px)
 * оно видно всегда — тот же порог, что и у {@link SHEET_REVEAL_CONTROL_CLASS}.
 * Прозрачность гасит значок, пока колонка действий ещё разъезжается
 * (см. `SheetPanel`).
 */
export const SHEET_TITLE_ACTION_REVEAL_CLASS = `opacity-0 transition-opacity duration-200 group-hover/panel:opacity-100 focus-visible:opacity-100 ${SHEET_REVEAL_CONTROL_CLASS}`;

/**
 * Плитка-кнопка в шапке вкладки листа (заклинательство, подготовленные
 * заклинания, переносимый вес): открывает настройку своего значения. Класс
 * общий, чтобы шапки вкладок выглядели одинаково — плитка узнаётся по рамке и
 * потеплению под курсором, а не по подписи.
 */
const SHEET_STAT_TILE_CLASS =
  'flex h-7 items-center gap-3 rounded-lg border border-default/50 bg-elevated/20 px-3 transition-colors';

export const SHEET_HEADER_STAT_CLASS = `${SHEET_STAT_TILE_CLASS} cursor-pointer hover:border-primary/60`;

/**
 * Плитка, которая ничего не открывает: у заклинательства черты характеристику
 * назвали при её взятии, и менять её на листе нечем. Своей строкой, а не
 * добавкой класса поверх: `cursor-default` и `cursor-pointer` — одна и та же
 * утилита, и какая из них победит, решает порядок в собранном css, а не порядок
 * в атрибуте.
 */
export const SHEET_STATIC_STAT_CLASS = `${SHEET_STAT_TILE_CLASS} cursor-default`;

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

/**
 * Ключи характеристик в формате API и калькулятора (`STRENGTH`) — обратное
 * соответствие к `parseApiAbilityKey`.
 */
export const API_ABILITY_KEYS: Record<AbilityKey, ApiAbilityKey> = {
  strength: ApiAbilityKey.STRENGTH,
  dexterity: ApiAbilityKey.DEXTERITY,
  constitution: ApiAbilityKey.CONSTITUTION,
  intelligence: ApiAbilityKey.INTELLIGENCE,
  wisdom: ApiAbilityKey.WISDOM,
  charisma: ApiAbilityKey.CHARISMA,
};

/** Варианты характеристик для селектов листа — в порядке отображения. */
export const ABILITY_OPTIONS: Array<{ label: string; value: AbilityKey }> =
  ABILITY_ORDER.map((key) => ({ label: ABILITY_LABELS[key], value: key }));

/**
 * Ключи характеристик по названию — обратное соответствие к `ABILITY_LABELS`.
 * Нужно там, где пикер отдаёт подпись, а записи листа хранят ключ.
 */
export const ABILITY_KEY_BY_LABEL: Record<string, AbilityKey> =
  Object.fromEntries(
    ABILITY_ORDER.map((key): [string, AbilityKey] => [
      ABILITY_LABELS[key],
      key,
    ]),
  );

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

/** Начало идентификаторов классовых умений (дальше — url класса и ключ умения). */
export const CLASS_FEATURE_ID_PREFIX = 'class:';

/** Разделитель классов в подписи мультикласса («Паладин 3 · Волшебник 2»). */
export const CLASSES_LABEL_SEPARATOR = ' · ';

/**
 * Начало идентификаторов производных ресурсов класса (дальше — url класса и
 * название колонки таблицы прогрессии).
 */
export const CLASS_RESOURCE_ID_PREFIX = 'class:res:';

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

/**
 * Начало идентификаторов ресурсов, заведённых чертой (дальше — id записи черты
 * и ключ ресурса из механики). По нему панель отличает их от своих: правит их
 * справочник, а не игрок.
 */
export const FEAT_RESOURCE_ID_PREFIX = 'feat:res:';

/** Значение короткого отдыха в механике справочника. */
export const API_SHORT_REST_RECOVERY = 'SHORT_REST';

/**
 * Значение «один заряд коротким отдыхом, все — продолжительным» в механике
 * справочника: так восстанавливаются «Второе дыхание» и вдохновение барда.
 */
export const API_SHORT_REST_ONE_RECOVERY = 'SHORT_REST_ONE';

/** Обозначение бонуса мастерства в формуле максимума ресурса. */
export const RESOURCE_FORMULA_PROFICIENCY = '@prof';

/** Обозначение уровня персонажа в формуле максимума ресурса. */
export const RESOURCE_FORMULA_LEVEL = '@level';

/** Приставка модификатора характеристики в формуле максимума ресурса. */
export const RESOURCE_FORMULA_ABILITY_PREFIX = '@mod.';

/**
 * Аббревиатуры характеристик в формулах справочника. Своя карта, а не
 * `AbilityShortKey`: там у Харизмы `chr`, а формулы механики знают только `cha`.
 */
export const RESOURCE_FORMULA_ABILITIES: Record<string, AbilityKey> = {
  str: 'strength',
  dex: 'dexterity',
  con: 'constitution',
  int: 'intelligence',
  wis: 'wisdom',
  cha: 'charisma',
};

/**
 * Характеристика правила максимума по умолчанию: у источников, кроме
 * модификатора характеристики, она в счёт не идёт, но поле обязано быть
 * заполненным — иначе переключение источника открывало бы пустой селект.
 */
export const RESOURCE_MAX_DEFAULT_ABILITY: AbilityKey = 'constitution';

/** Названия источников максимума ресурса. */
export const RESOURCE_MAX_SOURCE_LABELS: Record<ResourceMaxSource, string> = {
  fixed: 'Своё число',
  proficiency: 'Бонус мастерства',
  ability: 'Модификатор характеристики',
  level: 'Уровень персонажа',
};

/** Варианты источника максимума для селекта в настройке ресурса. */
export const RESOURCE_MAX_SOURCE_OPTIONS: Array<{
  label: string;
  value: ResourceMaxSource;
}> = [
  { label: RESOURCE_MAX_SOURCE_LABELS.fixed, value: 'fixed' },
  { label: RESOURCE_MAX_SOURCE_LABELS.proficiency, value: 'proficiency' },
  { label: RESOURCE_MAX_SOURCE_LABELS.ability, value: 'ability' },
  { label: RESOURCE_MAX_SOURCE_LABELS.level, value: 'level' },
];

/** Минимальная прибавка к значению источника максимума. */
export const RESOURCE_MAX_OFFSET_MIN = -9;

/** Максимальная прибавка к значению источника максимума. */
export const RESOURCE_MAX_OFFSET_MAX = 9;

/** Подпись поля прибавки к источнику максимума. */
export const RESOURCE_MAX_OFFSET_LABEL = 'Прибавка';

/** Подпись поля характеристики, чей модификатор идёт в максимум. */
export const RESOURCE_MAX_ABILITY_LABEL = 'Характеристика';

/** Подпись поля нижней границы максимума. */
export const RESOURCE_MAX_MINIMUM_LABEL = 'Минимум';

/**
 * Подсказка к нижней границе максимума: она подпирает расчёт снизу, а не
 * складывается с ним.
 */
export const RESOURCE_MAX_MINIMUM_HINT =
  'Сколько зарядов есть в любом случае: вдохновение барда равно модификатору Харизмы, но не меньше одного.';

/** Наименьшая нижняя граница максимума: ноль — границы нет. */
export const RESOURCE_MAX_MINIMUM_MIN = 0;

/** Наибольшая нижняя граница максимума. */
export const RESOURCE_MAX_MINIMUM_MAX = 20;

/** Подпись строки, объясняющей посчитанный максимум. */
export const RESOURCE_MAX_COMPUTED_LABEL = 'Сейчас максимум';

/**
 * Заголовок панели и окна ресурсов. Не «ресурсы класса»: рядом с классовыми
 * счётчиками там же живут ресурсы черт и свои записи игрока.
 */
export const RESOURCES_TITLE = 'Ресурсы';

/** Пометка ресурса, который завела черта: правится он только сменой черты. */
export const FEAT_RESOURCE_HINT =
  'Ресурс даёт черта — уберите её на вкладке особенностей, чтобы снять';

/** Подписи строки ресурса в списке настройки. */
export const RESOURCE_ROW_LABELS = {
  /** Подсказка кнопки правки своего ресурса. */
  edit: 'Изменить ресурс',

  /** Подсказка кнопки удаления своего ресурса. */
  remove: 'Удалить ресурс',
} as const;

/** Подпись поля «сколько зарядов» у ресурса со своим числом. */
export const RESOURCE_MAX_AMOUNT_LABEL = 'Сколько';

/** Подпись селекта источника максимума для читалки экрана. */
export const RESOURCE_MAX_SOURCE_ARIA_LABEL = 'От чего считается максимум';

/** Минимальное количество зарядов ресурса. */
export const RESOURCE_COUNT_MIN = 0;

/** Максимальное количество зарядов ресурса. */
export const RESOURCE_COUNT_MAX = 99;

/** Минимальное число зарядов, возвращаемых отдыхом. */
export const RESOURCE_RECOVERY_AMOUNT_MIN = 1;

/**
 * Сколько зарядов возвращает короткий отдых ресурсу с откатом «один заряд
 * коротким, все продолжительным»: ровно один — так написано у «Второго
 * дыхания» и вдохновения барда.
 */
export const COUNTER_SHORT_REST_ONE_AMOUNT = 1;

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
  // Максимум по умолчанию — своё число: правило заводится, только если игрок
  // сам выберет источник в форме.
  maxRule: null,
};

/** Минимальное базовое значение класса доспеха. */
export const ARMOR_CLASS_BASE_MIN = 0;

/** Максимальное базовое значение класса доспеха. */
export const ARMOR_CLASS_BASE_MAX = 40;

/** Безброневой класс доспеха (без надетой брони): база `10 + Ловкость`. */
export const UNARMORED_ARMOR_CLASS_BASE = 10;

/** Максимальный бонус Ловкости к КД средней брони (штраф по Ловкости). */
export const ARMOR_MEDIUM_DEX_CAP = 2;

/** Минимальный свой предел бонуса Ловкости от доспеха. */
export const ARMOR_DEX_LIMIT_MIN = 0;

/** Максимальный свой предел бонуса Ловкости от доспеха. */
export const ARMOR_DEX_LIMIT_MAX = 10;

/** Значение варианта «по правилу доспеха» в выборе предела Ловкости. */
export const ARMOR_DEX_LIMIT_RULE_VALUE = 'rule';

/**
 * Варианты предела бонуса Ловкости: правило доспеха и свои значения. Готовый
 * список вместо галки с полем ввода — вся настройка умещается в одну строку, а
 * подписи вариантов заодно объясняют, что предел делает.
 */
export const ARMOR_DEX_LIMIT_OPTIONS: Array<{ label: string; value: string }> =
  [
    { label: 'По правилу доспеха', value: ARMOR_DEX_LIMIT_RULE_VALUE },
    ...range(ARMOR_DEX_LIMIT_MIN, ARMOR_DEX_LIMIT_MAX + 1).map((limit) => ({
      // Название характеристики в родительном падеже, поэтому подпись текстом,
      // а не из `ABILITY_LABELS` (там именительный: «Ловкость»).
      label: limit === 0 ? 'Без Ловкости' : `Не больше +${limit}`,
      value: String(limit),
    })),
  ];

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

/** Хвост подсказки доспеха, в котором проверки Скрытности идут с помехой. */
export const ARMOR_STEALTH_HINT_LABEL = '; помеха на Скрытность';

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
  | 'dexLimitTitle'
  | 'armorTitle'
  | 'dexCappedHint'
  | 'dexLimitedHint'
  | 'dexCappedOf'
  | 'shieldTitle'
  | 'itemTitle'
  | 'featTitle'
  | 'effectTitle'
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
  // Про Ловкость подсказка молчит: её правило целиком объясняет строка предела,
  // а дублировать его абзацем — растить модалку на ровном месте. Подсказка
  // стоит под обеими строками, поэтому «этих» в ней заменено на «выбранные»:
  // указывать на строку через одну было бы неверно.
  abilitiesArmorHint:
    'Выбранные характеристики идут в КД сверх доспеха — как безброневая защита варвара и монаха или песнь клинка.',
  abilitiesArmorEmptyHint:
    'Ни одна характеристика в КД не идёт — считается только доспех со щитом.',
  abilitiesCustomHint:
    'Модификаторы этих характеристик прибавляются к значению.',
  abilitiesCustomEmptyHint:
    'Ни одна характеристика не прибавляется — КД равен значению.',
  armorTypeTitle: 'Тип доспеха',
  naturalArmor: 'Природный доспех',
  dexLimitTitle: 'Предел Ловкости',
  armorTitle: 'Доспех',
  // Подписи в родительном падеже, поэтому название характеристики здесь
  // текстом, а не из `ABILITY_LABELS` (там именительный: «Ловкость»).
  dexCappedHint: 'Ловкость ограничена доспехом',
  dexLimitedHint: 'Ловкость ограничена своим пределом',
  // Склейка «применённый бонус из полного модификатора»: одно число игрок читал
  // как предел, а это то, что дошло до КД.
  dexCappedOf: 'из',
  shieldTitle: 'Щит',
  itemTitle: 'Магические предметы',
  featTitle: 'Черты',
  effectTitle: 'Эффекты',
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

/** Характеристика инициативы по правилам. */
export const DEFAULT_INITIATIVE_ABILITY: AbilityKey = 'dexterity';

/** Источник основы бонуса мастерства «расчёт по уровню». */
export const PROFICIENCY_BASE_LEVEL_SOURCE = 'level';

/** Пояснение к разделу бонуса мастерства. */
export const CUSTOM_PROFICIENCY_BONUS_HINT =
  'Идёт в спасброски, навыки, атаку оружием и заклинательство.';

/** Пояснение к разделу инициативы. */
export const CUSTOM_INITIATIVE_BONUS_HINT =
  'Показывается в плитке инициативы и в её броске.';

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
  baseEditTitle: 'Настроить основу',
  baseSourceTitle: 'Источник',
  baseValueTitle: 'Значение',
  customBonusesTitle: 'Свои бонусы',
  customBonusAdd: 'Добавить бонус',
  customBonusRemove: 'Удалить бонус',
  customBonusLabelPlaceholder: 'Откуда бонус',
  customBonusSourcePlaceholder: 'Источник',
  // Запись от черты лист ведёт сам: правку вернула бы ближайшая сверка черт,
  // поэтому строка показана, но заперта — и подсказка говорит, как её убрать.
  customBonusFromFeat:
    'Бонус даёт черта — уберите её на вкладке особенностей, чтобы снять',
  levelProficiencyBonusTitle: 'По уровню',
  // Полные подписи итогов в плитку не влезают, поэтому на ней короткое «Итог»,
  // а полная подпись уходит в подсказку.
  totalTitle: 'Итог',
  totalProficiencyBonusTitle: 'Итоговый бонус мастерства',
  totalInitiativeTitle: 'Итоговая инициатива',
};

/** Подписи набора характеристик (калькулятор в листе персонажа). */
export const ABILITY_SCORES_LABELS = {
  menu: 'Калькулятор характеристик',
  title: 'Набор характеристик',
  description:
    'Соберите значения как в калькуляторе характеристик и запишите их в лист',
  current: 'Сейчас в листе',
  incompleteHint: 'Назначьте значения всем шести характеристикам',
  backgroundBonusPrefix: 'Предыстория',
  backgroundHint:
    'Прибавки предыстории уже входят в значения листа, поэтому они добавляются к набору сами.',
  replaceHint:
    'Набор заменяет все шесть значений целиком: прибавки за уровни и черты, уже записанные в лист, придётся выставить заново.',
  apply: 'Записать в лист',
  cancel: 'Отмена',
};

/**
 * Идентификатор источника прибавок предыстории для калькулятора. Источник
 * ровно один, поэтому идентификатор постоянный.
 */
export const ABILITY_SCORES_BACKGROUND_SOURCE_ID = 'sheet-background';

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

/** Основа пассивного значения навыка: к ней прибавляется значение навыка. */
export const PASSIVE_SKILL_BASE = 10;

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

/** Подписи видов своего бонуса. */
export const CUSTOM_BONUS_KIND_LABELS: Record<CustomBonusKind, string> = {
  ability: 'Характеристика',
  classLevel: 'Уровень класса',
  flat: 'Своё число',
  level: 'Уровень персонажа',
  proficiency: 'Бонус мастерства',
};

/** Источник своего бонуса «своё число» в общем селекторе источников. */
export const CUSTOM_BONUS_FLAT_SOURCE = 'flat';

/** Источник своего бонуса «бонус мастерства» в общем селекторе источников. */
export const CUSTOM_BONUS_PROFICIENCY_SOURCE = 'proficiency';

/** Источник своего бонуса «уровень персонажа» в общем селекторе источников. */
export const CUSTOM_BONUS_LEVEL_SOURCE = 'level';

/**
 * Начало значения источника «уровень класса» в общем селекторе: хвост — url
 * класса персонажа (`class:wizard-phb24`). Классы у каждого листа свои,
 * поэтому такие варианты собираются от персонажа, а не лежат константой (см.
 * `getCustomBonusSourceOptions`).
 */
export const CUSTOM_BONUS_CLASS_SOURCE_PREFIX = 'class:';

/**
 * Варианты источника своего бонуса: своё число, бонус мастерства, уровень
 * персонажа и все характеристики одним списком — так строка бонуса обходится
 * одним селектором вместо пары «вид + характеристика». Уровни классов встают в
 * этот же список от персонажа (см. `getCustomBonusSourceOptions`).
 */
export const CUSTOM_BONUS_SOURCE_OPTIONS: CustomBonusSourceOption[] = [
  { label: CUSTOM_BONUS_KIND_LABELS.flat, value: CUSTOM_BONUS_FLAT_SOURCE },
  {
    label: CUSTOM_BONUS_KIND_LABELS.proficiency,
    value: CUSTOM_BONUS_PROFICIENCY_SOURCE,
  },
  { label: CUSTOM_BONUS_KIND_LABELS.level, value: CUSTOM_BONUS_LEVEL_SOURCE },
  ...ABILITY_OPTIONS,
];

/**
 * Варианты источника ОСНОВЫ инициативы: своё число и все характеристики. От
 * списка источников бонуса отличается отсутствием бонуса мастерства — он бывает
 * только прибавкой сверх основы («Бдительный»), а не самой основой броска.
 * Уровней здесь нет по той же причине: сама по себе инициатива от уровня не
 * считается.
 */
export const CUSTOM_BONUS_BASE_SOURCE_OPTIONS: Array<{
  label: string;
  value: CustomBonusBaseSource;
}> = [
  { label: CUSTOM_BONUS_KIND_LABELS.flat, value: CUSTOM_BONUS_FLAT_SOURCE },
  ...ABILITY_OPTIONS,
];

/**
 * Варианты источника своего бонуса САМОГО бонуса мастерства: всё, кроме него
 * самого. Слагаемым себе он быть не может, иначе подсчёт ушёл бы в бесконечную
 * рекурсию (см. `getCharacterProficiencyBonus`), а уровни и характеристики в
 * прибавке к нему обычны — «половина уровня» и подобные умения.
 */
export const PROFICIENCY_BONUS_SOURCE_OPTIONS: CustomBonusSourceOption[] = [
  { label: CUSTOM_BONUS_KIND_LABELS.flat, value: CUSTOM_BONUS_FLAT_SOURCE },
  { label: CUSTOM_BONUS_KIND_LABELS.level, value: CUSTOM_BONUS_LEVEL_SOURCE },
  ...ABILITY_OPTIONS,
];

/**
 * Варианты источника своего бонуса к значению характеристики: своё число,
 * бонус мастерства и уровни. Модификатора характеристики в списке нет —
 * слагаемым к значению он не бывает, а пара таких бонусов друг на друга завела
 * бы подсчёт по кругу.
 */
export const ABILITY_BONUS_SOURCE_OPTIONS: CustomBonusSourceOption[] = [
  { label: CUSTOM_BONUS_KIND_LABELS.flat, value: CUSTOM_BONUS_FLAT_SOURCE },
  {
    label: CUSTOM_BONUS_KIND_LABELS.proficiency,
    value: CUSTOM_BONUS_PROFICIENCY_SOURCE,
  },
  { label: CUSTOM_BONUS_KIND_LABELS.level, value: CUSTOM_BONUS_LEVEL_SOURCE },
];

/**
 * Категории оружия справочника к группам владения листа. Словарь делит
 * категории ещё и по дальнобойности, а правила — нет: обе половины воинского
 * оружия дают одну и ту же группу. Огнестрельное (`FIREARM`, `FUTURISTIC`)
 * своей группы на листе не имеет и не переводится.
 */
export const WEAPON_GROUP_BY_API_CATEGORY: Record<
  string,
  WeaponProficiencyGroup['key']
> = {
  SIMPLE_MELEE: 'simple',
  SIMPLE_RANGED: 'simple',
  MATERIAL_MELEE: 'martial',
  MATERIAL_RANGED: 'martial',
};

/** Категории доспехов справочника к группам владения листа. */
export const ARMOR_GROUP_BY_API_CATEGORY: Record<
  string,
  ArmorProficiencyGroup['key']
> = {
  LIGHT: 'light',
  MEDIUM: 'medium',
  HEAVY: 'heavy',
  SHIELD: 'shields',
};

/**
 * Навыки справочника к названиям навыков листа. Механика черты хранит навык
 * константой словаря, а лист — названием; списки сошлись один в один, все 18.
 *
 * Отдельной картой, а не запросом словаря: разбор детали черты синхронный. Так
 * же сделаны и языки — см. {@link LANGUAGE_NAME_BY_API_KEY}.
 */
export const SKILL_NAME_BY_API_KEY: Record<string, string> = {
  ACROBATICS: 'Акробатика',
  ANIMAL_HANDLING: 'Уход за животными',
  ARCANA: 'Аркана',
  ATHLETICS: 'Атлетика',
  DECEPTION: 'Обман',
  HISTORY: 'История',
  INSIGHT: 'Проницательность',
  INTIMIDATION: 'Запугивание',
  INVESTIGATION: 'Анализ',
  MEDICINE: 'Медицина',
  NATURE: 'Природа',
  PERCEPTION: 'Внимательность',
  PERFORMANCE: 'Выступление',
  PERSUASION: 'Убеждение',
  RELIGION: 'Религия',
  SLEIGHT_OF_HAND: 'Ловкость рук',
  STEALTH: 'Скрытность',
  SURVIVAL: 'Выживание',
};

/**
 * Языки справочника к названиям языков листа. Механика черты хранит язык
 * константой словаря, а лист — названием; списки сошлись один в один, все 19,
 * хоть названия и разошлись («гномий» справочника — «Гномский» листа).
 *
 * Регистр констант неровный: у небесного языка это `Celestial`, а не
 * `CELESTIAL`, — так он лежит в словаре бэкенда, и приводить ключи к верхнему
 * регистру нельзя.
 */
export const LANGUAGE_NAME_BY_API_KEY: Record<string, string> = {
  ABYSSAL: 'Абиссальный',
  Celestial: 'Небесный',
  COMMON: 'Общий',
  COMMON_SIGN_LANGUAGE: 'Общий язык жестов',
  DEEP: 'Глубинная речь',
  DRACONIC: 'Драконий',
  DRUIDIC: 'Друидический',
  DWARVISH: 'Дварфийский',
  ELVISH: 'Эльфийский',
  GIANT: 'Гигантский',
  GNOMISH: 'Гномский',
  GOBLIN: 'Гоблинский',
  HALFLING: 'Полуросликовский',
  INFERNAL: 'Инфернальный',
  ORC: 'Оркский',
  PRIMORDIAL: 'Первоязык',
  SYLVAN: 'Сильван',
  THIEVES: 'Язык воров',
  UNDERCOMMON: 'Подземный',
};

/**
 * Начало идентификатора источника выдачи владений в журнале листа. Хвост —
 * url класса, предыстории или вида либо идентификатор записи умения.
 */
export const PROFICIENCY_SOURCE_PREFIXES = {
  class: 'class:',
  background: 'background:',
  species: 'species:',
  feature: 'feature:',
} as const;

/**
 * Уровень взятия черты происхождения. По правилам 2024 предыстория даёт её на
 * первом уровне — независимо от того, на каком уровне игрок заполнил лист.
 */
export const ORIGIN_FEAT_ACQUISITION_LEVEL = 1;

/**
 * Начало идентификатора своего бонуса, заведённого чертой листа: по нему
 * сверка находит свои записи и не трогает заведённые игроком вручную. Хвост —
 * идентификатор записи умения, поэтому у копии повторяемой черты бонус свой.
 */
export const FEAT_CUSTOM_BONUS_ID_PREFIX = 'feat-bonus:';

/**
 * Хвост идентификатора своего бонуса инициативы числом. Черта может давать и
 * бонус мастерства, и число («Бдительный» разных изданий), поэтому у второй
 * записи тот же идентификатор с пометкой — иначе записи схлопнулись бы в одну.
 */
export const FEAT_FLAT_INITIATIVE_BONUS_ID_SUFFIX = ':flat';

/**
 * Варианты основы бонуса мастерства: расчёт по уровню персонажа либо своё
 * число вместо него. Характеристики здесь ни при чём — бонус мастерства от них
 * не зависит, поэтому список свой, а не общий с бонусами.
 */
export const PROFICIENCY_BASE_OPTIONS: Array<{
  label: string;
  value: ProficiencyBaseSource;
}> = [
  {
    label: SHEET_SETTINGS_LABELS.levelProficiencyBonusTitle,
    value: PROFICIENCY_BASE_LEVEL_SOURCE,
  },
  { label: CUSTOM_BONUS_KIND_LABELS.flat, value: CUSTOM_BONUS_FLAT_SOURCE },
];

/** Подпись бонуса-числа без своей пометки в разборе значения. */
export const CUSTOM_FLAT_BONUS_LABEL = 'Свой бонус';

/** Максимальная длина пометки источника своего бонуса. */
export const CUSTOM_BONUS_LABEL_MAX_LENGTH = 40;

/**
 * Заготовка нового своего бонуса: чаще всего добавляют ровно «+1» от предмета,
 * поэтому вид по умолчанию — своё число.
 */
export const NEW_CUSTOM_BONUS: Omit<CharacterCustomBonus, 'id'> = {
  kind: 'flat',
  ability: 'strength',
  classUrl: '',
  value: 1,
  label: '',
};

/** Максимальная длина названия своего навыка. */
export const CUSTOM_SKILL_NAME_MAX_LENGTH = 40;

/**
 * Сколько своих навыков разрешено завести. Предел не от правил, а от места:
 * навыки печатаются в PDF под своей характеристикой, и десяток лишних строк
 * панель характеристик ещё выдерживает.
 */
export const CUSTOM_SKILLS_MAX = 10;

/** Характеристика нового своего навыка по умолчанию. */
export const DEFAULT_CUSTOM_SKILL_ABILITY: AbilityKey = 'intelligence';

/** Подписи модалки настройки навыков. */
export const SHEET_SKILL_SETTINGS_LABELS = {
  title: 'Настройка навыков',
  open: 'Настроить навыки',
  hint:
    'Характеристика задаёт модификатор навыка, к нему добавляется бонус '
    + 'мастерства по уровню владения. Дополнительные бонусы складываются '
    + 'сверху — их сколько угодно.',
  abilityPlaceholder: 'Характеристика',
  proficiency: 'Владение навыком',
  resetSkill: 'Вернуть навык к правилам',
  addBonus: 'Добавить бонус',
  passive: 'Пассивное',
  customTitle: 'Свой навык',
  customHint:
    'Навыка нет в правилах: он встанет в общий список по алфавиту и попадёт '
    + 'в PDF наравне с остальными.',
  customNamePlaceholder: 'Название навыка',
  customAdd: 'Добавить навык',
  customRemove: 'Удалить свой навык',
  customBadge: 'Свой',
  customDuplicate: 'Навык с таким названием уже есть',
  customLimit: `Своих навыков не больше ${CUSTOM_SKILLS_MAX}`,
  groupTitle: 'Группировать по характеристикам',
  groupHint:
    'Навыки встанут группами под своими характеристиками — как в PDF. '
    + 'Группу задаёт характеристика самого навыка: дополнительные бонусы от '
    + 'других характеристик в счёт не идут.',
} as const;

/**
 * Ключ общей группы навыков: без группировки список выводится одной группой без
 * разделителя, и характеристики у неё нет.
 */
export const SKILL_GROUP_ALL_KEY = 'all';

/**
 * Подпись разделителя группы навыков (слот `label` у `USeparator`): мелкие
 * прописные, как у групп снаряжения. Цвет добавляется на месте — в списке листа
 * подпись подсвечивается вместе с группой. Общая константа: разделитель рисуют
 * и панель навыков, и модалка их настройки.
 */
export const SKILL_GROUP_LABEL_CLASS =
  'text-[10px] font-bold tracking-wider uppercase transition-colors';

/**
 * Подписи владения спасброском: их два, а не четыре, как у навыка, — половины
 * владения и компетенции у спасбросков в правилах нет.
 */
export const SAVING_THROW_PROFICIENCY_LABELS = {
  proficient: 'Владение',
  none: 'Нет владения',
} as const;

/** Значки владения спасброском: закрашенный кружок — владение. */
export const SAVING_THROW_PROFICIENCY_ICONS = {
  proficient: 'tabler:circle-filled',
  none: 'tabler:circle',
} as const;

/** Подписи модалки настройки спасбросков. */
export const SHEET_SAVING_THROW_SETTINGS_LABELS = {
  title: 'Настройка спасбросков',
  open: 'Настроить спасброски',
  hint:
    'Характеристика задаёт модификатор спасброска, при владении к нему '
    + 'добавляется бонус мастерства. Дополнительные бонусы складываются '
    + 'сверху — их сколько угодно.',
  abilityPlaceholder: 'Характеристика',
  proficiency: 'Владение спасброском',
  resetSavingThrow: 'Вернуть спасбросок к правилам',
  addBonus: 'Добавить бонус',
  commonTitle: 'Ко всем спасброскам',
  commonHint:
    'Бонус идёт в каждый из шести спасбросков: так заводят плащ защиты или '
    + 'ауру паладина, а не повторяют одно и то же шесть раз.',
} as const;

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

/**
 * Размеры в выборе поправки грузоподъёмности по возрастанию категорий.
 * «Исполинский» в список не входит — это та же категория, что «Громадный», и
 * двумя одинаковыми вариантами выбор только запутался бы.
 */
export const CARRYING_CAPACITY_SIZE_LABELS = [
  'Крошечный',
  'Маленький',
  'Средний',
  'Большой',
  'Огромный',
  'Громадный',
];

/** Значение варианта «как у персонажа» в выборе размера для подсчёта. */
export const CARRYING_CAPACITY_SIZE_AUTO = 'auto';

/** Минимальное своё значение предела переносимого веса (в фунтах). */
export const CARRYING_CAPACITY_MIN = 0;

/** Максимальное своё значение предела переносимого веса (в фунтах). */
export const CARRYING_CAPACITY_MAX = 10_000;

/** Минимальный свой бонус к грузоподъёмности (в фунтах). */
export const CARRYING_CAPACITY_BONUS_MIN = -10_000;

/** Максимальный свой бонус к грузоподъёмности (в фунтах). */
export const CARRYING_CAPACITY_BONUS_MAX = 10_000;

/** Единица измерения веса инвентаря. */
export const WEIGHT_UNIT_LABEL = 'фнт.';

/** Подписи настройки грузоподъёмности. */
export const CARRYING_CAPACITY_LABELS = {
  title: 'Грузоподъёмность',
  open: 'Настроить грузоподъёмность',

  /** Подпись плитки в шапке вкладки снаряжения (рядом со значением веса). */
  stat: 'Переносимый вес',

  /**
   * Подсказка плитки: на узком листе подпись уступает место значку, и полное
   * название игрок получает только отсюда.
   */
  statHint:
    'Переносимый вес из предела грузоподъёмности — нажмите, чтобы его настроить',
  customToggle: 'Использовать своё значение',
  customToggleHint: 'Предел задаётся числом, а не считается по Силе и размеру',
  valueTitle: 'Предел, фнт.',
  sizeTitle: 'Размер для подсчёта',
  sizeAuto: 'Как у персонажа',
  sizeAutoUnknown: 'Как у персонажа (размер не указан)',
  bonusTitle: 'Свой бонус, фнт.',
  sizeBonusTitle: 'Поправка на размер',
  ruleTitle: 'По правилам',
  bonusRowTitle: 'Свой бонус',
  totalTitle: 'Предел переносимого веса',
  ruleHint:
    'По правилам предел равен значению Силы, умноженному на 15: у Крошечного '
    + 'он вдвое меньше, а с Большого удваивается на каждую категорию размера.',
  sizeHint:
    'Размер для подсчёта задаётся отдельно от размера персонажа — так работает '
    + '«Мощное телосложение»: существо считается на категорию крупнее только '
    + 'для переносимого веса.',
  bonusHint:
    'Свой бонус складывается с пределом в обоих режимах: отрицательный — '
    + 'уменьшает его.',
} as const;

/** Предел настроенных предметов по правилам 2024. */
export const ATTUNEMENT_RULE_LIMIT = 3;

/** Минимальное своё число настроенных предметов. */
export const ATTUNEMENT_MIN = 0;

/** Максимальное своё число настроенных предметов. */
export const ATTUNEMENT_MAX = 99;

/** Минимальный бонус к пределу настроенных предметов. */
export const ATTUNEMENT_BONUS_MIN = -99;

/** Максимальный бонус к пределу настроенных предметов. */
export const ATTUNEMENT_BONUS_MAX = 99;

/** Разделитель «настроено / всего можно» в плитке вкладки снаряжения. */
export const ATTUNEMENT_VALUE_SEPARATOR = ' / ';

/** Значение «По правилам» в селекте основы предела настройки. */
export const ATTUNEMENT_BASE_RULE = 'rule';

/**
 * Варианты основы предела настройки: правило 2024 либо модификатор выбранной
 * характеристики — так считают домашние правила и умения, меняющие число
 * настроек.
 */
export const ATTUNEMENT_BASE_OPTIONS: Array<{
  label: string;
  value: AbilityKey | typeof ATTUNEMENT_BASE_RULE;
}> = [
  {
    label: `По правилам (${ATTUNEMENT_RULE_LIMIT})`,
    value: ATTUNEMENT_BASE_RULE,
  },
  ...ABILITY_ORDER.map((key) => ({
    label: `Модификатор: ${ABILITY_LABELS[key]}`,
    value: key,
  })),
];

/** Подписи плитки настройки на предметы и её модалки. */
export const ATTUNEMENT_LABELS = {
  title: 'Настройка на предметы',
  open: 'Настроить предел настройки на предметы',

  /** Подпись плитки в шапке вкладки снаряжения (рядом с переносимым весом). */
  stat: 'Настройка',

  /** Значок плитки: на узком листе он остаётся вместо подписи. */
  icon: 'tabler:link',

  /** Начало подсказки плитки: сколько предметов уже настроено. */
  countHint: 'Настроено предметов',

  /** Хвост подсказки плитки: что делает нажатие. */
  openHint: 'нажмите, чтобы настроить предел',
  customToggle: 'Использовать своё число',
  customToggleHint: 'Предел задаётся числом, а не считается по правилам',
  valueTitle: 'Число предметов',
  baseTitle: 'Основа предела',
  bonusTitle: 'Бонус к пределу',
  baseRowTitle: 'Основа',
  bonusRowTitle: 'Свой бонус',
  totalTitle: 'Всего можно настроить',
  ruleHint:
    'По правилам 2024 персонаж настраивается не более чем на три магических '
    + 'предмета одновременно.',
  abilityHint:
    'Основой станет модификатор выбранной характеристики — так считают '
    + 'домашние правила и умения, меняющие число настроек.',
  bonusHint:
    'Бонус складывается с основой подсчёта: отрицательный — уменьшает предел.',
  limitToastTitle: 'Предел настроенных предметов',

  /** Откуда взялся предел — вторая половина подсказки плитки. */
  hints: {
    rule: 'Предел по правилам',
    ability: 'Предел по модификатору характеристики',
    custom: 'Своё число настроек: подсчёт по правилам выключен',
  },
} as const;

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

/** Способы передвижения, которые черта выдаёт числом или равенством ходьбе. */
export const FEAT_GRANTED_SPEED_KEYS: FeatGrantedSpeedKey[] = [
  'climb',
  'fly',
  'swim',
];

/** Поле механики «равна скорости ходьбы» по способу передвижения. */
export const FEAT_SPEED_EQUALS_WALK_KEYS: Record<
  FeatGrantedSpeedKey,
  FeatSpeedEqualsWalkKey
> = {
  climb: 'climbEqualsWalk',
  fly: 'flyEqualsWalk',
  swim: 'swimEqualsWalk',
};

/**
 * Наименьший свой бонус скорости. Общий предел бонусов (±10) скорости тесен:
 * она измеряется в единицах передвижения, а не в очках броска, — «Движение без
 * доспехов» монаха прибавляет к ходьбе до +30 футов. Границы те же, что у
 * бонуса скорости от предмета.
 */
export const SPEED_BONUS_MIN = -60;

/** Наибольший свой бонус скорости. */
export const SPEED_BONUS_MAX = 120;

/** Подписи окна настройки передвижения. */
export const SHEET_SPEED_LABELS = {
  title: 'Передвижение',
  hint:
    'Своё значение — скорость по виду и классу. Бонусы складываются с ним и '
    + 'растут вместе с персонажем: их дают черты, предметы и умения.',
  unitTitle: 'Единицы',
  hover: 'Парение',
  addBonus: 'Добавить бонус',
  ownValue: 'Своё значение',
  total: 'Итог с бонусами',
  // Выданная чертой скорость — не прибавка, а само значение: строкой бонуса её
  // не показать, поэтому окно объясняет её подписью под способом передвижения.
  grantedFromFeat: 'от черты',
  equalsWalk: 'равна скорости ходьбы',
} as const;

/** Варианты единиц скорости для выбора в модалке. */
export const SPEED_UNIT_OPTIONS: Array<{ label: string; value: SpeedUnit }> = [
  { label: 'Футы (ft)', value: 'feet' },
  { label: 'Метры (m)', value: 'meters' },
  { label: 'Мили (mi)', value: 'miles' },
  { label: 'Километры (km)', value: 'kilometers' },
];

/** Режим броска d20 по умолчанию: без преимущества и помехи. */
export const DEFAULT_ROLL_MODE: RollMode = 'normal';

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

/**
 * Подпись обычного зрения при нулевой дистанции. Ноль у обычного зрения — не
 * «слепой», а «видит без предела»: та же трактовка, что у дальности зрения
 * токена в VTTG и у записи вида в справочнике.
 */
export const VISION_UNLIMITED_LABEL = 'без ограничений';

/** Порядок типов зрения в модалке и подсказке. */
export const VISION_ORDER: VisionKey[] = [
  'normal',
  'darkvision',
  'blindsight',
  'tremorsense',
  'truesight',
];

/**
 * Подписи редактора зрения.
 *
 * В поле игрок правит только своё значение, а на лист идёт большее из своего и
 * выданного особенностями. Без подписи это выглядело бы ошибкой: в подсказке у
 * аватара слепое зрение есть, а в редакторе ноль.
 */
export const VISION_EDITOR_LABELS = {
  unit: 'Единицы',
  normalHint: '0 — без ограничений',
  grantsTitle: 'Выдано особенностями и снаряжением:',
  effectiveHint:
    'Лист берёт большее из своего значения и выданного особенностями, эффектами и надетым снаряжением.',
};

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

/** Уровень истощения, на котором истощения нет. */
export const EXHAUSTION_LEVEL_MIN = 0;

/** Смертельный уровень истощения (PHB 2024). */
export const EXHAUSTION_LEVEL_MAX = 6;

/** Насколько каждый уровень истощения снижает проверки к20. */
export const EXHAUSTION_D20_PENALTY_PER_LEVEL = 2;

/** На сколько футов каждый уровень истощения снижает скорость. */
export const EXHAUSTION_SPEED_PENALTY_PER_LEVEL = 5;

/**
 * Снижение скорости за уровень истощения в единицах листа. Правило записано в
 * футах, в метрах те же 5 футов — это клетка, полтора метра. Мили и километры
 * — дорожная скорость, боевой штраф её не трогает.
 */
export const EXHAUSTION_SPEED_PENALTY_BY_UNIT: Record<SpeedUnit, number> = {
  feet: EXHAUSTION_SPEED_PENALTY_PER_LEVEL,
  meters: 1.5,
  miles: 0,
  kilometers: 0,
};

/**
 * Перевод футов справочника в единицы скоростей листа. Механика черт написана
 * в футах (правила 2024 знают только их), а лист умеет считать и в метрах.
 * Мили и километры дают ноль по той же причине, что и штраф истощения: прибавка
 * в футах на таком масштабе не различима.
 */
export const SPEED_FEET_RATIO_BY_UNIT: Record<SpeedUnit, number> = {
  feet: 1,
  meters: 0.3,
  miles: 0,
  kilometers: 0,
};

/**
 * До скольких знаков округляется переведённая из футов скорость. Без округления
 * двоичная дробь вылезает в подпись плитки: 3 фута дают 0.8999999999999999 м.
 * Одного знака хватает — скорости в метрах кратны половине (1.5, 3, 4.5).
 */
export const SPEED_UNIT_FRACTION_DIGITS = 1;

/** Сколько уровней истощения снимает продолжительный отдых (PHB 2024). */
export const EXHAUSTION_LONG_REST_RECOVERY = 1;

/** Деления блока истощения: уровни от первого до смертельного. */
export const EXHAUSTION_LEVELS: number[] = Array.from(
  { length: EXHAUSTION_LEVEL_MAX },
  (_unused, index) => index + 1,
);

/** Подписи блока истощения. */
export const EXHAUSTION_LABELS: Record<
  | 'title'
  | 'level'
  | 'none'
  | 'death'
  | 'd20Effect'
  | 'speedEffect'
  | 'rulesTitle',
  string
> = {
  title: 'Истощение',
  level: 'Уровень',
  none: 'Истощения нет.',
  death: 'Персонаж умирает.',
  d20Effect: 'ко всем проверкам к20',
  speedEffect: 'скорость',
  rulesTitle: 'Правила истощения',
};

/** Пункты правил истощения (D&D 2024) для справки в блоке. */
export const EXHAUSTION_RULES: string[] = [
  'Истощение накапливается: каждый новый источник добавляет 1 уровень, а не заменяет прежний.',
  'Каждый уровень снижает все проверки к20 на 2: проверки характеристик, броски атаки и спасброски.',
  'Каждый уровень снижает все скорости персонажа на 5 футов.',
  'На 6 уровне истощения персонаж умирает.',
  'Продолжительный отдых снимает 1 уровень истощения; на нулевом уровне состояние заканчивается.',
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

/**
 * Подписи разбора максимума хитов: записанный максимум посчитан по записанному
 * Телосложению, а эффекты, снаряжение и свои бонусы двигают его сверху — без
 * разбора игрок не поймёт, почему в настройке здоровья другое число.
 */
export const MAX_HIT_POINTS_LABELS = {
  breakdownRecorded: 'Записано',
  breakdownConstitution: 'Телосложение',
  totalTitle: 'Итог с прибавками',
};

/** Подпись ячеек заклинаний договора колдуна в списке того, что вернёт отдых. */
export const PACT_SPELL_SLOTS_LABEL = 'Ячейки заклинаний договора';

/** Приставка подписи предмета, которому отдых вернёт заряды. */
export const INVENTORY_CHARGES_RECOVERY_LABEL = 'Заряды';

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
  | 'exhaustionTitle'
  | 'exhaustionRecovery'
  | 'close'
  | 'finish'
  | 'finishedTitle'
  | 'finishedHitPoints'
  | 'finishedDice'
  | 'finishedRecovery'
  | 'finishedExhaustion',
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
  exhaustionTitle: 'Истощение',
  exhaustionRecovery: 'Отдых снимет 1 уровень истощения.',
  close: 'Закрыть',
  finish: 'Завершить отдых',
  finishedTitle: 'Продолжительный отдых завершён',
  finishedHitPoints: 'Хиты восстановлены полностью.',
  finishedDice: 'Возвращено костей хитов',
  finishedRecovery: 'Вернулись',
  finishedExhaustion: 'Новый уровень истощения',
};

/** Пункты правил продолжительного отдыха (D&D 2024) для справки в модалке. */
export const LONG_REST_RULES: string[] = [
  'Отдых длится не меньше 8 часов: минимум 6 часов сна и не больше 2 часов необременительных занятий — чтения, разговоров, еды, дежурства.',
  'Прерванный час боя, ходьбы или другой утомительной деятельности обнуляет отдых: его придётся начинать заново.',
  'По окончании отдыха восстанавливаются все хиты и все потраченные ячейки заклинаний.',
  'Все потраченные кости хитов возвращаются: в редакции 2024 года отдых возвращает их полностью, а не половину.',
  'Счётчикам умений возвращается столько зарядов, сколько задано им на продолжительный отдых: обычно это все заряды.',
  'Временные хиты держатся до конца продолжительного отдыха и пропадают вместе с ним.',
  'Отдых снимает 1 уровень истощения.',
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
  'Боевая кирка',
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

/**
 * Идентификатор выбора инструмента предыстории: под ним лежит ответ игрока и
 * его же читает применение — у предыстории такой выбор один.
 */
export const BACKGROUND_TOOL_CHOICE_ID = 'background-tool';

/** Заголовок пикера выбора инструмента предыстории. */
export const BACKGROUND_TOOL_CHOICE_LABEL = 'Владение инструментами';

/** Подпись выбора боевого стиля в визарде класса. */
export const FIGHTING_STYLE_CHOICE_LABEL =
  'Выберите 1 черту категории «Боевой стиль»';

/** Ошибка: деталь выбранной черты не прошла разбор по схеме. */
export const FIGHTING_STYLE_INVALID_RESPONSE_ERROR =
  'Сервер вернул некорректную черту боевого стиля';

/** Ошибка: деталь черты, выбранной или выданной умением класса, не прошла разбор. */
export const CLASS_FEAT_INVALID_RESPONSE_ERROR =
  'Сервер вернул некорректную черту умения класса';

/** Ошибка: деталь черты, выбранной в умении вида, не прошла разбор. */
export const SPECIES_FEAT_INVALID_RESPONSE_ERROR =
  'Сервер вернул некорректную черту умения вида';

/**
 * Сегмент идентификатора особенности с выбранным боевым стилем:
 * `class:{featureKey}:fighting-style:{featUrl}`. Префикс `class:` нужен, чтобы
 * смена класса удаляла прежний выбор, а сегмент — чтобы из идентификатора
 * можно было достать url черты.
 */
export const FIGHTING_STYLE_FEATURE_ID_SEGMENT = 'fighting-style';

/**
 * Категории черт, недоступные при выборе черты без ограничения категорий:
 * черты происхождения даются предысторией, эпические — умением 19 уровня,
 * боевые стили — своим умением. Список именно запрещающий: новая категория с
 * бэка становится доступной сама. Умение, назвавшее категории явно, этим
 * списком не ограничено.
 */
export const ABILITY_IMPROVEMENT_EXCLUDED_FEAT_CATEGORIES = [
  'ORIGIN',
  'EPIC_BOON',
  'FIGHTING_STYLE',
];

/** Категория черт боевого стиля. */
export const FIGHTING_STYLE_FEAT_CATEGORY = 'FIGHTING_STYLE';

/** Категория общих черт — тех, что берут за повышение характеристик. */
export const GENERAL_FEAT_CATEGORY = 'GENERAL';

/**
 * Хвосты идентификаторов выборов черты, которые лист заводит сам по флагам
 * умения прежних лет: у записи с флагом, но без выбора черты в механике.
 */
export const LEGACY_FIGHTING_STYLE_CHOICE_KEY = 'fighting-style';
export const LEGACY_ABILITY_IMPROVEMENT_CHOICE_KEY = 'ability-improvement';

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
  featExplanation: 'Черта берётся из каталога: описание каждой — в окне выбора',
  featPlaceholder: 'Выбери черту',
  abilitiesTitle: 'Улучшение характеристик',
  abilitySlotTitle: 'Характеристика для +1',
  abilitySlotExplanation:
    'Черта повышает одну характеристику на 1 — среди тех, что она разрешает',
  abilityPlaceholder: 'Выбери характеристику',
  previewTooltip: 'Открыть описание черты',
  previewAriaLabel: 'Описание выбранной черты',
  loadError: 'Не удалось загрузить черты',
  applyError: 'Не удалось добавить выбранную черту',
  applyErrorLog: 'Ошибка добавления черты за улучшение характеристик:',
  maxHint: `Характеристика не поднимается выше ${ABILITY_IMPROVEMENT_SCORE_MAX}`,
};

/** Сколько очков раскладывает одно повышение характеристик (правило 2024 года). */
export const ABILITY_IMPROVEMENT_POINTS = 2;

/**
 * Ответ на повышение характеристик по умолчанию: прибавки, ещё не разложенные.
 * Общий у обоих мастеров — иначе каждый заводил бы свой и они разошлись бы.
 */
export const DEFAULT_ABILITY_IMPROVEMENT: LevelUpAbilityImprovement = {
  mode: 'abilities',
  increases: {},
};

/** Сколько очков одно повышение кладёт в одну характеристику максимум. */
export const ABILITY_IMPROVEMENT_POINTS_PER_ABILITY = 2;

/** Шаг раскладки очков: правило прибавляет и убавляет по одному очку. */
export const ABILITY_IMPROVEMENT_STEP = 1;

/** Подписи шага повышения характеристик — общие у мастера уровня и мастера класса. */
export const ABILITY_IMPROVEMENT_STEP_LABELS = {
  title: 'Повышение характеристик',
  stepTitle: 'Характеристики',
  modeAbilities: 'Повысить характеристики',
  modeFeat: 'Взять черту',
  distributeHint: '+2 к одной характеристике или +1 к двум',
  decrease: 'Убавить прибавку',
  increase: 'Добавить прибавку',
  pointsRemaining: 'Осталось очков',
  reset: 'Сбросить прибавки',
  featHint: 'Черта берётся вместо повышения характеристик',
  maxedHint: `Все характеристики уже на пределе (${ABILITY_IMPROVEMENT_SCORE_MAX}) — остаётся взять черту`,
};

/** Название записи листа о взятом повышении характеристик. */
export const ABILITY_IMPROVEMENT_FEATURE_NAME = 'Повышение характеристик';

/** Иконка эффекта повышения характеристик. */
export const ABILITY_IMPROVEMENT_EFFECT_ICON = 'tabler:trending-up';

/**
 * Сегмент идентификатора записи о повышении характеристик:
 * `class:{classUrl}:{featureKey}:{level}:ability-increase`. Уровень приезжает из
 * идентификатора строки умения, поэтому у каждого повышения своя запись, и
 * снятие уровня забирает ровно его прибавку.
 */
export const ABILITY_INCREASE_FEATURE_ID_SEGMENT = 'ability-increase';

/**
 * Сегмент идентификатора особенности с чертой, выбранной за улучшение
 * характеристик: `class:{featureKey}:{level}:ability-improvement:{featUrl}`.
 * Уровень в идентификаторе разводит выборы разных уровней, а префикс `class:`
 * привязывает черту к умению, которое её дало.
 */
export const ABILITY_IMPROVEMENT_FEATURE_ID_SEGMENT = 'ability-improvement';

/**
 * Сегмент идентификатора черты, выбранной в умении записи:
 * `class:{featureKey}[:{level}]:feat:{featUrl}`, у вида —
 * `species:{featureUrl}:feat:{featUrl}`. Один на все выборы черты — боевой
 * стиль и черту за повышение характеристик мастер спрашивает одним пикером;
 * прежние сегменты остались ради уже собранных листов.
 */
export const CLASS_FEAT_CHOICE_ID_SEGMENT = 'feat';

/**
 * Сегмент идентификатора черты, которую умение класса выдаёт без выбора:
 * `class:{featureKey}:granted-feat:{featUrl}`.
 */
export const CLASS_GRANTED_FEAT_ID_SEGMENT = 'granted-feat';

/**
 * Служебные сегменты идентификаторов черт, выданных умениями записи — класса
 * или вида. По ним из идентификатора достаётся url черты, поэтому такие черты
 * считаются взятыми и не предлагаются повторно.
 */
export const CLASS_FEAT_CHOICE_ID_SEGMENTS = [
  FIGHTING_STYLE_FEATURE_ID_SEGMENT,
  ABILITY_IMPROVEMENT_FEATURE_ID_SEGMENT,
  CLASS_FEAT_CHOICE_ID_SEGMENT,
  CLASS_GRANTED_FEAT_ID_SEGMENT,
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

/**
 * Подпись группы заклинаний, которые персонаж знает вне книги: врождённых
 * заклинаний вида и заклинаний, выдаваемых чертами. Место среди подготовленных
 * они не занимают, поэтому стоят отдельной группой, а не в кругах книги.
 *
 * Заклинания классовых умений в эту группу не идут: их игрок ищет в своём
 * круге наравне с книгой, а от неё их отличает значок строки
 * (см. `CLASS_SPELL_BADGE`).
 */
export const INNATE_SPELL_GROUP_LABEL = 'Врождённые и от черт';

/**
 * Значок заклинания, выданного умением класса: в круге оно стоит рядом с
 * книгой, и без пометки непонятно, почему его нельзя убрать и почему оно не
 * тратит место среди подготовленных.
 */
export const CLASS_SPELL_BADGE = {
  label: 'Класс',
  hint: 'Заклинание даёт умение класса. Место среди подготовленных оно не занимает, а убирается вместе с умением',
} as const;

/** Служебный ключ группы заклинаний вне книги, не пересекающийся с кругами 0–9. */
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

/**
 * Пометка ячеек Магии договора: у мультикласса они существуют отдельно от
 * общих ячеек и возвращаются коротким отдыхом.
 */
export const PACT_SPELL_SLOT_LABEL = 'договора';

/** Подпись ряда кружков ячеек договора в разделителе круга заклинаний. */
export const PACT_SPELL_SLOTS_ROW_LABEL = 'Договор';

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

/**
 * Начало названия колонки таблицы класса с числом заговоров. Справочник пишет
 * её и целиком («Заговоры»), и сокращённо («Заг.»), поэтому сравниваются только
 * буквы названия.
 */
export const CANTRIPS_COLUMN_PREFIX = 'заг';

/** Разделитель «подготовлено / всего можно» в блоке подготовленных. */
export const PREPARED_SPELLS_VALUE_SEPARATOR = ' / ';

/** Подписи значка подготовки в строке заклинания. */
export const PREPARED_SPELL_TOGGLE_LABELS: Record<
  'prepare' | 'unprepare' | 'innate' | 'limit',
  string
> = {
  prepare: 'Подготовить',
  unprepare: 'Снять подготовку',
  innate: 'Заклинание вне книги не занимает место среди подготовленных',
  limit: 'Больше подготовить нельзя',
};

/** Виды подготовки по порядку плиток в шапке вкладки заклинаний. */
export const PREPARED_KINDS: PreparedSpellKind[] = ['spells', 'cantrips'];

/**
 * Подписи блока и модалки подготовки по её виду: заговоры считаются отдельным
 * счётчиком со своей колонкой таблицы класса, поэтому и подписи у них свои.
 */
export const PREPARED_KIND_LABELS: Record<
  PreparedSpellKind,
  PreparedKindLabels
> = {
  spells: {
    // Ряд шапки узкий, а рядом ещё две плитки: подпись сокращена по правилу
    // «отсечение до согласной», целиком слово даёт подсказка плитки.
    stat: 'Подгот.',
    statFull: 'Подготовленные',
    icon: 'tabler:checklist',
    ariaLabel: 'Настроить подготовленные заклинания',
    title: 'Подготовленные заклинания',
    customValue: 'Число заклинаний',
    unknownClassValue:
      'Класс не даёт числа подготовленных заклинаний. Если оно должно быть, выберите класс заново или повысьте уровень — лист запомнит таблицу класса.',
    countHint: 'Подготовлено заклинаний',
    hints: {
      auto: 'Подготовленных заклинаний по таблице класса',
      custom:
        'Своё число подготовленных заклинаний: подсчёт по классу выключен',
      unknown:
        'Класс не даёт числа подготовленных заклинаний — нажмите, чтобы задать своё',
    },
    limitToastTitle: 'Предел подготовленных заклинаний',
  },
  cantrips: {
    // «Заговоры» и так короче любой осмысленной сокращённой формы.
    stat: 'Заговоры',
    statFull: 'Заговоры',
    icon: 'tabler:sparkles',
    ariaLabel: 'Настроить подготовленные заговоры',
    title: 'Подготовленные заговоры',
    customValue: 'Число заговоров',
    unknownClassValue:
      'Класс не даёт числа заговоров. Если оно должно быть, выберите класс заново или повысьте уровень — лист запомнит таблицу класса.',
    countHint: 'Подготовлено заговоров',
    hints: {
      auto: 'Заговоров по таблице класса',
      custom: 'Своё число заговоров: подсчёт по классу выключен',
      unknown: 'Класс не даёт числа заговоров — нажмите, чтобы задать своё',
    },
    limitToastTitle: 'Предел подготовленных заговоров',
  },
};

/** Подписи модалки настройки, общие для заклинаний и заговоров. */
export const PREPARED_SPELLS_LABELS: Record<
  'customToggle' | 'customHint' | 'classValue' | 'bonus' | 'total' | 'autoHint',
  string
> = {
  customToggle: 'Использовать своё число',
  customHint: 'Иначе число считается по таблице класса',
  classValue: 'Число из таблицы класса',
  bonus: 'Бонус к числу класса',
  total: 'Всего можно подготовить',
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
  preparedHint:
    'Оставить в списке только заклинания и заговоры, помеченные значком',
  // Чипы кругов — числа, у заговоров вместо номера сокращение: одной буквы «З»
  // мало, её путают с цифрой в соседних чипах.
  cantrip: 'Зг',
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

/** Заголовок модалки заклинательства; у мультикласса дополняется классом. */
export const SPELLCASTING_MODAL_TITLE = 'Заклинательство';

/**
 * Подписи чисел заклинательства: в узкую плитку вкладки идёт короткая, полное
 * название показывает подсказка по наведению. Сокращаются оба слова по правилу
 * «отсечение до согласной» — так же, как «Подгот.» у плиток подготовки;
 * подписи без подсказки (модалка заклинательства) берут `full`.
 */
export const SPELLCASTING_STAT_LABELS: Record<
  'saveDc' | 'attack',
  { short: string; full: string }
> = {
  saveDc: { short: 'Сл. спасбр.', full: 'Сложность спасброска' },
  attack: { short: 'Атака закл.', full: 'Атака заклинанием' },
};

/** Подписи плитки заклинательства для скринридера. */
export const SPELLCASTING_TILE_LABELS = {
  edit: 'Настроить заклинательство',
  fixed: 'Заклинательство черты',
} as const;

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

/** Минимальный уровень В КЛАССЕ для выбора подкласса (D&D 2024 — 3-й). */
export const SUBCLASS_SELECTION_MIN_LEVEL = 3;

/**
 * Первый уровень класса. Им помечены записи листа, которые даёт взятие класса
 * целиком, а не отдельное умение: по уровню снятие уровня забирает ровно своё.
 */
export const CLASS_FIRST_LEVEL = 1;

/**
 * Ключ владельца выборов, которые задаёт сама запись класса, а не её умение.
 * Из него собирается идентификатор выбора, поэтому ответы класса не смешиваются
 * с ответами умения с тем же ключом механики.
 */
export const CLASS_OWN_GRANTS_KEY = 'own-grants';

/**
 * Значение характеристики, необходимое для взятия уровня во втором классе
 * (правило мультиклассирования D&D 2024).
 */
export const MULTICLASS_ABILITY_REQUIREMENT = 13;

/** Начало подсказки о невыполненных требованиях мультиклассирования. */
export const MULTICLASS_REQUIREMENT_WARNING_PREFIX =
  'По правилам мультиклассирования для этого класса нужно:';

/** Подписи окна классов персонажа. */
export const CLASSES_MODAL_LABELS = {
  title: 'Классы персонажа',
  add: 'Добавить класс',
  choose: 'Выбрать класс',
  close: 'Закрыть',
  edit: 'Изменить',
  levelSuffix: 'уровень',
  remove: 'Удалить',
  totalLevel: 'Общий уровень',
  empty: 'Класс пока не выбран.',
  levelLimit:
    'Общий уровень персонажа не может превышать 20 — сперва снизьте уровень другого класса.',
  removeDescription:
    'Удалить класс? С листа уйдут его умения, счётчики и кости хитов, а максимум хитов вернётся к записанному до него. Выборы, сделанные в его умениях, восстановить будет нельзя.',
  removeConfirm: 'Удалить',
  removeCancel: 'Отмена',
  hint: 'Общий уровень персонажа — сумма уровней его классов. Бонус мастерства и опыт считаются по нему.',
} as const;

/**
 * Подписи плашки текущего выбора в мастерах вида и предыстории: что уже взято
 * и как это снять, не выбирая ничего взамен.
 */
export const CURRENT_SELECTION_LABELS = {
  remove: 'Удалить',
  removeConfirm: 'Удалить',
  removeCancel: 'Отмена',

  species: {
    title: 'Сейчас выбран вид',
    remove: 'Удалить вид',
    removeDescription:
      'Удалить вид? С листа уйдут его умения, выданные им владения и выбранные при взятии навыки, а размер, скорости и чувства вернутся к значениям листа без вида.',
  },

  background: {
    title: 'Сейчас выбрана предыстория',
    remove: 'Удалить предысторию',
    removeDescription:
      'Удалить предысторию? С листа уйдут черта происхождения и её дары, выданные инструменты с навыками и её стартовое снаряжение, а прибавки к характеристикам откатятся.',
  },
} as const;

/** Подписи мастера выбора класса, зависящие от режима (выбор или добавление). */
export const CLASS_WIZARD_LABELS = {
  primaryTitle: 'Выбор класса',
  addTitle: 'Добавление класса',
  addHint:
    'Класс добавится первым уровнем — общий уровень персонажа вырастет на единицу. Дальше его поднимают в окне опыта и уровня.',
  addSubclassHint: 'Подкласс выбирается с {level} уровня в классе.',
  listHint:
    'Класс с подклассами разворачивается стрелкой — подкласс необязателен. При применении кость хитов, хиты, спасброски, владения, ресурсы, умения по текущему уровню и выбранный вариант стартового снаряжения сразу заполнят лист.',
  resultPrefix: 'Класс:',
  hitDie: 'Кость хитов',
  hitPoints: 'Хиты',
  savingThrows: 'Спасброски',
  savingThrowsUnknown: 'не распознаны',
  proficiencies: 'Владения (распознаны, проверьте вручную)',
  proficiencyChoices: 'Выборы владений',
  /** Раздел выборов самой записи класса: владения и заклинания при взятии */
  classOwnChoices: 'Выборы при взятии класса',
  classChoiceExplanation: 'Класс даёт это владение на выбор при взятии',
  /** Подпись раздела умений; `{level}` — уровень, до которого они набраны. */
  features: 'Умения (до {level} уровня)',
  featureNotePlaceholder: 'Ваш выбор в умении (необязательно)',

  /** Подсказка пикера: сколько значений он ждёт («Выберите 2»). */
  chooseLabel: 'Выберите',

  /** То же в скобках после подписи выбора («Владение навыками (выберите 2)»). */
  chooseHint: 'выберите',

  /** Бейдж свёрнутого умения, которое ещё о чём-то спрашивает. */
  featurePendingBadge: 'Нужен выбор',

  /** Подсказка о том, что карточка умения разворачивается нажатием. */
  featureToggleHint: 'Умения свёрнуты — нажмите на умение, чтобы раскрыть его.',
} as const;

/** Сокращение уровня в подписях («3 ур.»). */
export const LEVEL_SHORT_SUFFIX = 'ур.';

/**
 * Подписи блока владений при мультиклассировании. Справочник урезанного набора
 * не отдаёт (поле `multiclassProficiency` у классов пустое), поэтому лист
 * ничего не выдаёт сам и предупреждает об этом.
 */
export const MULTICLASS_PROFICIENCY_LABELS = {
  title: 'Владения при мультиклассировании',
  hint: 'Второй класс по правилам 2024 даёт лишь часть своих владений, а справочник этот список не отдаёт — лист их не выдаёт. Ниже полный набор класса: отметьте нужное на панели владений вручную.',
  armor: 'Доспехи',
  weapon: 'Оружие',
  tool: 'Инструменты',
  skill: 'Навыки',
  empty: 'Нет',
} as const;

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

/**
 * Подписи разделов второго шага мастера предыстории.
 *
 * Шаг спрашивает сразу обо всём — прибавках, владениях, черте и снаряжении, —
 * и одной простынёй читается плохо. Разделы показываются только те, о которых
 * предыстории есть что сказать: черта и стартовое снаряжение бывают не у всех.
 */
export const BACKGROUND_WIZARD_TAB_ORDER = [
  'abilities',
  'proficiencies',
  'feat',
  'equipment',
] as const;

/** Раздел второго шага мастера предыстории. */
export type BackgroundWizardTab = (typeof BACKGROUND_WIZARD_TAB_ORDER)[number];

/** Подписи разделов; порядок вкладок задаёт `BACKGROUND_WIZARD_TAB_ORDER`. */
export const BACKGROUND_WIZARD_TAB_LABELS: Record<BackgroundWizardTab, string> =
  {
    abilities: 'Характеристики',
    proficiencies: 'Навыки и инструменты',
    feat: 'Черта',
    equipment: 'Снаряжение',
  };

/**
 * Подписи разделов второго шага мастера класса.
 *
 * Шаг спрашивает сразу обо всём — хитах, владениях, снаряжении и умениях всех
 * пройденных уровней, — и одной простынёй читается ещё хуже, чем у предыстории:
 * умений у класса до двух десятков. Разделы показываются только те, о которых
 * классу есть что сказать.
 */
export const CLASS_WIZARD_TAB_ORDER = [
  'overview',
  'equipment',
  'features',
  'abilities',
] as const;

/** Раздел второго шага мастера класса. */
export type ClassWizardTab = (typeof CLASS_WIZARD_TAB_ORDER)[number];

/**
 * Подписи разделов; порядок вкладок задаёт `CLASS_WIZARD_TAB_ORDER`.
 *
 * Владения живут в «Основном», а не своим разделом: хиты, спасброски и владения
 * — это и есть то, чем класс наделяет сразу, и делить их вкладкой не на что.
 */
export const CLASS_WIZARD_TAB_LABELS: Record<ClassWizardTab, string> = {
  overview: 'Основное',
  equipment: 'Снаряжение',
  features: 'Умения',
  abilities: 'Характеристики',
};

/** Подписи мастера предыстории, не привязанные к разделам. */
export const BACKGROUND_WIZARD_LABELS = {
  featChoice: 'Черта на выбор',
  featChoicePlaceholder: 'Выбери черту',

  /** Подписи слотов прибавок в режиме «+2 и +1». */
  abilityPlusTwo: 'Характеристика для +2',
  abilityPlusOne: 'Характеристика для +1',
} as const;

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

/** Подписи мастера вида. */
export const SPECIES_WIZARD_LABELS = {
  /** Подсказка пикера: сколько значений он ждёт («Выберите 2»). */
  chooseLabel: 'Выберите',

  /** Подсказка поля свободного выбора в умении без распознанного пикера. */
  featureChoicePlaceholder: 'Ваш выбор в особенности (необязательно)',
} as const;

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
 * Иконки кнопки «надеть» по виду предмета: щит у доспеха, меч у оружия и искры
 * у прочей магии (кольцо, амулет, плащ). Одним щитом на всё надеваемое строка
 * не обходится: магический меч и безделушка доспехом не становятся, а кнопка
 * называла их им.
 *
 * Состояние «надет» кнопка показывает подсветкой и значком «Надет» у названия;
 * парная иконка есть только там, где она нашлась в наборе — меча с галочкой в
 * нём нет.
 */
export const INVENTORY_EQUIP_ICONS: Record<
  CustomInventoryKind,
  { equipped: string; idle: string }
> = {
  weapon: { equipped: 'tabler:sword', idle: 'tabler:sword' },
  armor: { equipped: 'tabler:shield-check', idle: 'tabler:shield' },
  trinket: { equipped: 'tabler:sparkles-filled', idle: 'tabler:sparkles' },
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

  /** Подпись выбора карточки для скринридера; к ней добавляется метка. */
  selectOption: 'Выбрать вариант',

  /** Подсказка на предмете, который есть в каталоге сайта. */
  itemPreview: 'Открыть описание предмета',
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
 * Состояние магии у только что заведённой записи инвентаря: настройки нет,
 * предмет выключен, зарядов не заведено. Каталожная запись перекрывает его
 * данными раздела, своя — остаётся с ним.
 */
export const DEFAULT_INVENTORY_MAGIC_STATE: InventoryMagicState = {
  requiresAttunement: false,
  attuned: false,
  active: false,
  charges: null,
  // Условие применения и пассивное свойство приходят только из раздела
  // «Магические предметы»; у остальных записей бонусы работают надетыми.
  bonusActivation: 'equipped',
  passiveNote: '',
};

/**
 * Подписи пунктов меню о настройке — по действию, которое пункт выполнит (а не
 * по нынешнему состоянию).
 */
export const INVENTORY_ATTUNEMENT_MENU_LABELS: Record<
  'attune' | 'unattune',
  string
> = {
  attune: 'Настроиться',
  unattune: 'Снять настройку',
};

/** Подписи пунктов меню о включении предмета — по действию пункта. */
export const INVENTORY_ACTIVE_MENU_LABELS: Record<
  'activate' | 'deactivate',
  string
> = {
  activate: 'Включить',
  deactivate: 'Выключить',
};

/** Подпись пункта меню о восстановлении зарядов предмета. */
export const INVENTORY_RESTORE_CHARGES_MENU_LABEL = 'Восстановить заряды';

/** Значок предмета, на который персонаж настроен. */
export const INVENTORY_ATTUNED_BADGE_LABEL = 'Настроен';

/** Подсказка значка «Настроен»: настройка занимает место из предела листа. */
export const INVENTORY_ATTUNED_BADGE_HINT =
  'Персонаж настроен на предмет; сколько настроек занято из предела — в плитке «Настройка» над списком';

/** Значок предмета, который требует настройки, но ещё не настроен. */
export const INVENTORY_ATTUNEMENT_BADGE_LABEL = 'Нужна настройка';

/**
 * Подсказка значка «Нужна настройка»: пока настройки нет, пассивные бонусы
 * предмета в лист не идут.
 */
export const INVENTORY_ATTUNEMENT_BADGE_HINT =
  'Предмет требует настройки: его бонусы не работают, пока персонаж на него не настроен — настройка в меню предмета';

/** Значок включённого предмета. */
export const INVENTORY_ACTIVE_BADGE_LABEL = 'Включён';

/** Подсказка значка «Включён»: чем он отличается от «Надет». */
export const INVENTORY_ACTIVE_BADGE_HINT =
  'Свойство предмета включено вручную; надетым предмет при этом быть не обязан';

/** Подсказка плитки зарядов: что делает нажатие и когда оно недоступно. */
export const INVENTORY_CHARGES_HINT_LABELS = {
  spend: 'нажми, чтобы потратить заряд',
  empty: 'Заряды закончились — восстанови их в меню предмета',
};

/** Подпись броска зарядов для скринридера. */
export const INVENTORY_CHARGES_SPEND_LABEL = 'Потратить заряд';

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

/** Значок оружия, которым персонаж атакует с помехой по свойству «Тяжёлое». */
export const INVENTORY_HEAVY_BADGE_LABEL = 'Помеха';

/** Значок предмета, которого у персонажа не осталось (количество — ноль). */
export const INVENTORY_MISSING_BADGE_LABEL = 'Отсутствует';

/** Подсказка значка «Отсутствует»: что именно запрещает нулевое количество. */
export const INVENTORY_MISSING_BADGE_HINT =
  'Предмета не осталось: его нельзя надеть, им нельзя атаковать и бросать урон';

/**
 * Подписи настройки характеристики: плитка показывает значение с прибавками, а
 * правится записанное — без разбора числа расходятся.
 */
export const SHEET_ABILITY_SETTINGS_LABELS = {
  open: 'Настроить характеристику',
  description:
    'Укажите значение характеристики — модификатор рассчитается автоматически',
  scoreTitle: 'Значение',
  modifierTitle: 'Модификатор',

  /** Подпись записанного значения в разборе: «Записано 16 · Пояс силы +2». */
  breakdownScore: 'Записано',

  bonusesTitle: 'Бонусы к значению',
  bonusesHint:
    'Бонус поднимает саму характеристику, поэтому вместе с ней растут её '
    + 'модификатор, спасброски, навыки, класс доспеха и атаки.',
  totalTitle: 'Итог',
  save: 'Сохранить',
  cancel: 'Отмена',
} as const;

/** Подписи бонусов предмета для сводки в его строке. */
export const INVENTORY_BONUS_LABELS = {
  title: 'Бонусы',
  attack: 'Попадание',
  extraDamage: 'Дополнительный урон',

  /** Пояснение под сводкой, пока бонусы не работают. */
  inactiveHint: 'Бонусы заработают, когда предмет будет надет',

  /** То же для предмета, которому нужна ещё и настройка. */
  attunementHint:
    'Бонусы заработают, когда предмет будет надет, а персонаж настроен на него',
};

/** Короткие подписи плиток параметров предмета в строке инвентаря. */
export const INVENTORY_STAT_LABELS: Record<
  'armorClass' | 'attack' | 'damage' | 'cost' | 'charges',
  string
> = {
  armorClass: 'КД',
  attack: 'Атака',
  damage: 'Урон',
  cost: 'Цена',
  charges: 'Заряды',
};

/** Подписи броска с плитки оружия для скринридера. */
export const INVENTORY_ROLL_KIND_LABELS: Record<InventoryStatRollKind, string> =
  {
    attack: 'Бросок атаки',
    damage: 'Бросок урона',
  };

/** Подписи слагаемых в подсказке боевой плитки предмета. */
export const INVENTORY_STAT_HINT_LABELS = {
  /** Заголовок разбора бонуса атаки. */
  attack: 'Бонус атаки',

  /** Слагаемое бонуса мастерства. */
  proficiency: 'мастерство',

  /** Слагаемое собственного бонуса оружия — общее для атаки и урона. */
  weapon: 'оружие',

  /** Слагаемое прибавки от эффектов и своих бонусов записей. */
  effects: 'эффекты',

  /**
   * Хвост разбора атаки, когда владения этим оружием нет: без пояснения
   * пропавший бонус мастерства выглядит ошибкой подсчёта.
   */
  noProficiency: 'без владения оружием',

  /**
   * Хвост разбора атаки тяжёлым оружием, которое персонажу не по руке: на сам
   * бонус помеха не влияет, поэтому в разборе о ней сказано отдельно.
   */
  heavyDisadvantage: 'помеха: тяжёлое оружие',
};

/** Подсказка в тултипе о том, что плитка бросается по нажатию. */
export const SHEET_ROLL_HINT_LABEL = 'нажми, чтобы бросить';

/** Заголовок предупреждения о том, что тратить ячейки круга уже нечего. */
export const SPELL_SLOTS_EMPTY_TOAST_TITLE = 'Ячейки закончились';

/**
 * Названия состояний справочника (`/api/v2/dictionaries/conditions`) — для
 * иммунитетов, которые выдаёт черта. Отдельной картой, а не запросом словаря:
 * разбор снимка механики синхронный, как у навыков и языков.
 */
export const CONDITION_LABELS: Record<string, string> = {
  BLINDED: 'Ослеплённый',
  CHARMED: 'Очарованный',
  DEAFENED: 'Оглохший',
  EXHAUSTION: 'Истощённый',
  FRIGHTENED: 'Испуганный',
  GRAPPLED: 'Схваченный',
  INCAPACITATED: 'Недееспособный',
  INVISIBLE: 'Невидимый',
  PARALYZED: 'Парализованный',
  PETRIFIED: 'Окаменевший',
  POISONED: 'Отравленный',
  PRONE: 'Лежащий ничком',
  RESTRAINED: 'Опутанный',
  STUNNED: 'Ошеломлённый',
  UNCONSCIOUS: 'Бессознательный',
};

/**
 * Названия типов существ справочника (`/api/v2/dictionaries/creature/types`) —
 * для черты, которая меняет тип существа («Отмеченный драконом»).
 */
export const CREATURE_TYPE_LABELS: Record<string, string> = {
  ABERRATION: 'Аберрация',
  BEAST: 'Зверь',
  CELESTIAL: 'Небожитель',
  CONSTRUCT: 'Конструкт',
  DRAGON: 'Дракон',
  ELEMENTAL: 'Элементаль',
  FEY: 'Фея',
  FIEND: 'Исчадие',
  GIANT: 'Великан',
  HUMANOID: 'Гуманоид',
  MONSTROSITY: 'Монстр',
  PLANT: 'Растение',
  SLIME: 'Слизь',
  SWARM_OF_MEDIUM_FIENDS: 'Рой средних исчадий',
  SWARM_OF_SMALL_FIENDS: 'Рой маленьких исчадий',
  SWARM_OF_TINY_BEASTS: 'Рой крошечных зверей',
  SWARM_OF_TINY_MONSTROSITIES: 'Рой крошечных монстров',
  SWARM_OF_TINY_UNDEAD: 'Рой крошечной нежити',
  UNDEAD: 'Нежить',
};

/** Чувства черты к типам зрения листа: коды совпадают по смыслу, но не по виду. */
export const VISION_KEY_BY_FEAT_SENSE: Record<string, VisionKey> = {
  DARKVISION: 'darkvision',
  BLINDSIGHT: 'blindsight',
  TREMORSENSE: 'tremorsense',
  TRUESIGHT: 'truesight',
};

/** Подписи блока защит, которые дают черты. */
export const SHEET_DEFENCES_LABELS = {
  resistances: 'Сопротивление урону',
  immunities: 'Иммунитет к урону',
  vulnerabilities: 'Уязвимость к урону',
  conditionImmunities: 'Иммунитет к состояниям',
  creatureType: 'Тип существа',
  telepathy: 'Телепатия',
} as const;

/**
 * Значение варианта «тип урона не указан». Пустая строка в качестве значения
 * селекта запрещена, а хранится незаполненный тип именно ею — поэтому у выбора
 * есть собственное значение пустоты.
 */
export const DAMAGE_TYPE_NONE = 'none';

/**
 * Варианты типа урона своего оружия: подписи берутся из справочника типов
 * урона, порядок — по алфавиту. Устаревший `FAIR` из выбора убран — новый лист
 * должен получать только `FIRE`. Первым идёт «не указан» — иначе выбранный тип
 * нечем сбросить.
 */
export const DAMAGE_TYPE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Не указан', value: DAMAGE_TYPE_NONE },
  ...Object.entries(DAMAGE_TYPE_LABELS)
    .filter(([type]) => type !== 'FAIR')
    .map(([type, label]) => ({ label, value: type }))
    .sort((left, right) => left.label.localeCompare(right.label, 'ru')),
];

/**
 * Названия всех типов урона по алфавиту. Ими подписан пул выбора типа урона у
 * черты, когда набор в механике не задан: «выберите любой тип урона» — это
 * весь справочник, и перечислять его в каждой такой черте незачем.
 *
 * Устаревший `FAIR` в пул не идёт вслед за {@link DAMAGE_TYPE_OPTIONS}: подпись
 * у него та же, что у `FIRE`, и в списке он был бы вторым «Огненным».
 */
export const DAMAGE_TYPE_NAMES: string[] = DAMAGE_TYPE_OPTIONS.filter(
  (option) => option.value !== DAMAGE_TYPE_NONE,
).map((option) => option.label);

/**
 * Названия оружейных приёмов по ключам справочника.
 *
 * Списком, а не словарём с бэкенда: приёмов ровно восемь, и это правило D&D
 * 2024, а не данные каталога — лист подписывает ими выбор так же, как типы
 * урона и характеристики.
 */
export const WEAPON_MASTERY_PROPERTY_LABELS: Record<string, string> = {
  CLEAVE: 'Прорубание',
  GRAZE: 'Задевание',
  NICK: 'Выпад',
  PUSH: 'Толкание',
  SAP: 'Изнурение',
  SLOW: 'Замедление',
  TOPPLE: 'Опрокидывание',
  VEX: 'Подавление',
};

/**
 * Названия всех оружейных приёмов. Ими подписан пул выбора, когда набор в
 * механике не задан: «выберите любой приём» — это весь справочник.
 */
export const WEAPON_MASTERY_PROPERTY_NAMES: string[] = Object.values(
  WEAPON_MASTERY_PROPERTY_LABELS,
);

/**
 * Оружие каталога по приёму, который у него есть.
 *
 * Правило D&D 2024, а не данные каталога: приём закреплён за видом оружия
 * таблицей книги игрока, и меняться он может только вместе с правилами. Лист
 * держит его своим списком по той же причине, что и {@link WEAPON_TRAIT_ITEMS},
 * — каталог владений у него тоже свой.
 *
 * По нему выбор приёма отмечает мастерство: игрок называет «Замедление», а
 * мастерство получает всё оружие, у которого этот приём есть.
 */
export const WEAPON_NAMES_BY_MASTERY_PROPERTY: Record<
  string,
  CatalogWeaponName[]
> = {
  CLEAVE: ['Алебарда', 'Секира'],
  GRAZE: ['Глефа', 'Двуручный меч'],
  NICK: ['Кинжал', 'Лёгкий молот', 'Серп', 'Скимитар'],
  PUSH: ['Боевой молот', 'Палица', 'Пика', 'Тяжёлый арбалет'],
  SAP: ['Боевая кирка', 'Булава', 'Длинный меч', 'Копьё', 'Моргенштерн', 'Цеп'],
  SLOW: [
    'Длинный лук',
    'Дубинка',
    'Кнут',
    'Лёгкий арбалет',
    'Метательное копьё',
    'Мушкет',
    'Праща',
  ],
  TOPPLE: [
    'Боевой посох',
    'Боевой топор',
    'Длинное копьё',
    'Молот',
    'Трезубец',
  ],
  VEX: [
    'Дротик',
    'Духовая трубка',
    'Короткий лук',
    'Короткий меч',
    'Пистоль',
    'Рапира',
    'Ручной арбалет',
    'Ручной топор',
  ],
};

/**
 * Заголовки групп панели владений.
 *
 * `weaponMasteries` своей группы не имеет — мастерство помечается значком на
 * чипе оружия, — но ключ группы взят из владений листа, и запись нужна, чтобы
 * набор оставался полным.
 */
export const SHEET_PROFICIENCY_GROUP_TITLES: Record<
  ProficiencyGroupKey,
  string
> = {
  armor: 'Снаряжение',
  weapons: 'Оружие',
  weaponMasteries: 'Мастерство оружия',
  masteryProperties: 'Оружейные приёмы',
  tools: 'Инструменты',
  languages: 'Языки',
};

/**
 * Оружие каталога по НАЗВАНИЮ приёма: пикер листа отдаёт подпись, а не ключ
 * справочника.
 */
export const WEAPON_NAMES_BY_MASTERY_PROPERTY_NAME: Record<string, string[]> =
  Object.fromEntries(
    Object.entries(WEAPON_NAMES_BY_MASTERY_PROPERTY).flatMap(
      ([key, weapons]) => {
        const label = WEAPON_MASTERY_PROPERTY_LABELS[key];

        return label ? [[label, weapons]] : [];
      },
    ),
  );

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
  'ranged' | 'finesse' | 'heavy',
  string
> = {
  ranged: 'Дальнобойное',
  finesse: 'Фехтовальное',
  heavy: 'Тяжёлое',
};

/**
 * Минимальное значение характеристики, при котором тяжёлое оружие бьёт без
 * помехи (правила 2024).
 */
export const HEAVY_WEAPON_ABILITY_MINIMUM = 13;

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

/** Приставки подписей целей, которым нужен ключ: без них «Сила» неоднозначна. */
export const INVENTORY_BONUS_TARGET_PREFIXES: Record<
  'ability' | 'ability-check' | 'skill' | 'saving-throw' | 'speed',
  string
> = {
  'ability': 'Характеристика',
  'ability-check': 'Проверки',
  'skill': 'Навык',
  'saving-throw': 'Спасбросок',
  'speed': 'Скорость',
};

/** Подписи целей бонуса, которые говорят сами за себя. */
export const INVENTORY_BONUS_TARGET_LABELS: Record<
  | 'all-saving-throws'
  | 'all-speeds'
  | 'armor-class'
  | 'initiative'
  | 'spell-attack'
  | 'spell-save-dc'
  | 'melee-attack'
  | 'ranged-attack'
  | 'proficiency-bonus'
  | 'hit-points-max',
  string
> = {
  'all-saving-throws': 'Все спасброски',
  'all-speeds': 'Все скорости',
  'armor-class': 'Класс доспеха',
  'spell-save-dc': 'Сложность заклинаний',
  'spell-attack': 'Атака заклинанием',
  'melee-attack': 'Атака рукопашным оружием',
  'ranged-attack': 'Атака дальнобойным оружием',
  'proficiency-bonus': 'Бонус мастерства',
  'initiative': 'Инициатива',
  'hit-points-max': 'Максимум хитов',
};

/**
 * Подписи режимов бонуса для сводки предмета: прибавку показывает знак числа, а
 * остальным режимам нужно слово — иначе «Интеллект 19» читалось бы как «+19».
 */
export const INVENTORY_BONUS_MODE_LABELS: Record<
  Exclude<InventoryBonusMode, 'add'>,
  string
> = {
  override: '=',
  upgrade: 'не ниже',
  downgrade: 'не выше',
};

/** Заголовки групп в селекторе цели бонуса. */
export const INVENTORY_BONUS_GROUP_LABELS = {
  abilities: 'Характеристики',
  checks: 'Проверки характеристик',
  skills: 'Навыки',
  savingThrows: 'Спасброски',
  speeds: 'Скорости',
  other: 'Прочее',
};

/** Разделитель вида цели и её ключа в значении селектора (`ability:strength`). */
export const INVENTORY_BONUS_TARGET_SEPARATOR = ':';

/** Цель бонуса по умолчанию у только что добавленной строки. */
export const NEW_INVENTORY_BONUS: Omit<InventoryItemBonus, 'id'> = {
  kind: 'ability',
  key: 'strength',
  value: 1,
};

/** Подписи списка бонусов в форме своего предмета. */
export const INVENTORY_BONUS_ROW_LABELS = {
  add: 'Добавить бонус',
  remove: 'Убрать бонус',
  targetPlaceholder: 'Куда идёт бонус',
  searchPlaceholder: 'Поиск цели',
};

/** Минимальный бонус предмета: у проклятых предметов он отрицательный. */
export const ITEM_BONUS_MIN = -10;

/** Максимальный бонус предмета. */
export const ITEM_BONUS_MAX = 10;

/** Минимальная прибавка предмета к скорости (сапоги бывают и с помехой). */
export const ITEM_SPEED_BONUS_MIN = -60;

/** Максимальная прибавка предмета к скорости. */
export const ITEM_SPEED_BONUS_MAX = 120;

/**
 * Границы величины бонуса в режимах, доводящих значение до заданного: там она —
 * само значение листа (характеристика, класс доспеха, скорость), а не прибавка.
 */
export const ITEM_BONUS_VALUE_MIN = 0;

/** Верхняя граница величины бонуса в тех же режимах. */
export const ITEM_BONUS_VALUE_MAX = 999;

/** Минимум зарядов предмета (0 — зарядов у него нет). */
export const INVENTORY_CHARGES_MIN = 0;

/** Максимум зарядов предмета. */
export const INVENTORY_CHARGES_MAX = 99;

/**
 * Каталожные доспехи, в которых Скрытность идёт с помехой, — для листов,
 * сохранённых до того, как помеха попала в запись предмета. Снимок доспеха
 * такого листа хранит только КД, правило Ловкости и признак щита, а по ним
 * стёганый доспех (помеха есть) неотличим от кожаного (помехи нет), поэтому
 * восстанавливать помеху приходится по url каталожной записи. Набор
 * канонический — это все доспехи PHB с пометкой «Помеха на Скрытность».
 */
export const LEGACY_STEALTH_DISADVANTAGE_ARMOR_URLS: ReadonlySet<string> =
  new Set([
    'padded-armor-phb',
    'scale-mail-phb',
    'half-plate-armor-phb',
    'ring-mail-phb',
    'chain-mail-phb',
    'splint-armor-phb',
    'plate-armor-phb',
  ]);

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
  stealthDisadvantage: false,
  weaponCategory: 'simple',
  ranged: false,
  finesse: false,
  heavy: false,
  damageDiceCount: 1,
  damageDiceFaces: 6,
  damageBonus: 0,
  damageType: '',
  versatile: false,
  versatileDiceCount: 1,
  versatileDiceFaces: 8,
  attackBonus: 0,
  extraDamageDiceCount: 0,
  extraDamageDiceFaces: 6,
  extraDamageType: '',
  bonuses: [],
  requiresAttunement: false,
  maxCharges: 0,
  description: [],
};

/** Подписи полей формы своего предмета. */
export const CUSTOM_ITEM_FIELD_LABELS = {
  createTitle: 'Свой предмет',
  editTitle: 'Редактирование предмета',
  createAction: 'Добавить',
  editAction: 'Сохранить',
  kind: 'Что за предмет',
  name: 'Название',
  namePlaceholder: 'Название предмета',
  quantity: 'Количество',
  weaponCategory: 'Категория',
  damageType: 'Тип урона',
  damage: 'Урон',
  damageHint:
    'Модификатор характеристики лист добавит сам; ноль костей — оружие без броска урона.',
  attackBonus: 'Бонус к попаданию',

  /** Что в бонус к попаданию входит, а что лист посчитает без него. */
  attackBonusHint:
    'Бонус мастерства и модификатор характеристики лист добавит сам — здесь только собственный бонус оружия (например, «+1» у магического).',
  armorType: 'Тип доспеха',
  armorStealthDisadvantage: 'Помеха на Скрытность',

  /** Продолжение подсказки типа доспеха: что делать с ним на листе. */
  armorHint:
    'Надеть доспех можно кнопкой в строке снаряжения — класс доспеха пересчитается сам.',
  cost: 'Стоимость',
  costPlaceholder: 'Например: 75 зм',
  weight: `Вес, ${WEIGHT_UNIT_LABEL}`,
  description: 'Описание',
  descriptionPlaceholder: 'Опиши предмет',
};

/** Значение и слот вкладки основных параметров своего предмета. */
export const CUSTOM_ITEM_MAIN_TAB = 'main';

/** Значение и слот вкладки магических свойств своего предмета. */
export const CUSTOM_ITEM_MAGIC_TAB = 'magic';

/**
 * Вкладки формы своего предмета: боевые и бытовые параметры отдельно от магии —
 * форма со всеми полями сразу не читалась, а магия нужна не каждому предмету.
 */
export const CUSTOM_ITEM_TABS = [
  {
    label: 'Основное',
    value: CUSTOM_ITEM_MAIN_TAB,
    slot: CUSTOM_ITEM_MAIN_TAB,
    icon: 'tabler:backpack',
  },
  {
    label: 'Магические свойства',
    value: CUSTOM_ITEM_MAGIC_TAB,
    slot: CUSTOM_ITEM_MAGIC_TAB,
    icon: 'tabler:sparkles',
  },
];

/** Заголовки блоков параметров на вкладке «Основное». */
export const CUSTOM_ITEM_SECTION_LABELS = {
  weapon: 'Параметры оружия',
  armor: 'Параметры доспеха',
  properties: 'Свойства оружия',
};

/**
 * Заготовка предмета для предпросмотра бонусов в форме: она никогда не попадает
 * в лист, но сборка записи требует и ссылки, и названия.
 */
export const CUSTOM_ITEM_PREVIEW_URL = `${CUSTOM_INVENTORY_URL_PREFIX}preview`;

/** Название предмета-заготовки для предпросмотра бонусов. */
export const CUSTOM_ITEM_PREVIEW_NAME = 'Предмет';

/** Подписи блока магии в форме своего предмета. */
export const CUSTOM_ITEM_MAGIC_LABELS = {
  hint: 'Пассивные бонусы работают, пока предмет надет; предмету с настройкой — пока персонаж на него настроен. Надеть и настроиться можно в строке снаряжения и в её меню.',

  /** Подпись переключателя, открывающего поля вкладки. */
  enable: CUSTOM_MAGIC_ITEM_LABEL,

  /** Что даёт переключатель, кроме самих полей. */
  enableHint: `Предмет попадёт в группу «${INVENTORY_CATEGORY_TITLES.MAGIC_ITEM}», а поля вкладки станут доступны.`,

  /** Заголовок карточки с настройкой и зарядами. */
  attunementSection: 'Настройка и заряды',

  /** Заголовок карточки с бонусами оружия, которые даёт только магия. */
  weaponSection: 'Бонусы оружия',

  /** Заголовок карточки с бонусами, которые предмет даёт самому листу. */
  sheetSection: 'Бонусы листа',

  /** Заголовок сводки того, что предмет даёт листу. */
  summary: 'Что даёт предмет',

  /** Подпись пустой сводки. */
  summaryEmpty: 'Пока ничего — заполните бонусы выше.',

  attunement: 'Требует настройки',
  charges: 'Зарядов, максимум',
  chargesHint: 'Ноль — зарядов у предмета нет.',
  extraDamage: 'Дополнительный урон',
  extraDamageHint:
    'Кости сверх основного урона со своим типом (например, 2к6 огнём). Ноль костей — дополнительного урона нет.',
  bonusesHint:
    'Бонус на строку: выберите цель (характеристика, навык, спасбросок, скорость, класс доспеха) и величину. Прибавка к КД доспеха тоже задаётся здесь.',
};

/** Пояснение свойства «Тяжёлое» в форме своего оружия. */
export const CUSTOM_ITEM_HEAVY_HINT = `Тяжёлым оружием атакуют с помехой, пока характеристика меньше ${HEAVY_WEAPON_ABILITY_MINIMUM}: у рукопашного — «${ABILITY_LABELS.strength}», у дальнобойного — «${ABILITY_LABELS.dexterity}».`;

/** Подписи свойства «Универсальное» в форме своего оружия. */
export const CUSTOM_ITEM_VERSATILE_LABELS = {
  label: 'Универсальное',
  damage: 'Урон двумя руками',
  hint: 'Универсальным оружием можно бить двумя руками — тогда урон катится большей костью. Хват переключается в меню предмета.',
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
  background: 'Предыстория',
  none: 'Своё',
};

/**
 * Порядок чипов отбора по источнику на вкладке особенностей: сперва то, что
 * лист выдал сам (вид, класс, черты), свои записи — последними.
 */
export const FEATURE_ORIGIN_GROUP_ORDER: FeatureOriginGroup[] = [
  'species',
  'class',
  'background',
  'feat',
  'none',
];

/** Подсказки чипов отбора особенностей по источнику. */
export const FEATURE_ORIGIN_GROUP_HINTS: Record<FeatureOriginGroup, string> = {
  species: 'Оставить в списке особенности вида и подвида',
  class: 'Оставить в списке особенности класса',
  background: 'Оставить в списке дары предыстории',
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

/** Заголовок подтверждения удаления особенности. */
export const FEATURE_REMOVE_CONFIRM_TITLE = 'Удалить особенность?';

/** Подпись кнопки подтверждения удаления особенности. */
export const FEATURE_REMOVE_CONFIRM_LABEL = 'Удалить';

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

/** Подписи блока своего языка в модалке владения языками. */
export const SHEET_LANGUAGE_LABELS = {
  customTitle: 'Свой язык',
  customHint:
    'Языка нет в списке — впишите название, оно попадёт в лист как есть.',
  customPlaceholder: 'Название языка',
  customEmpty: 'Своих языков пока нет',
  addCustom: 'Добавить',
  removeCustom: 'Удалить язык',
};

/** Ограничение длины названия своего языка. */
export const CUSTOM_LANGUAGE_NAME_MAX_LENGTH = 80;

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
  { slot: 'effects', label: 'Эффекты' },
  { slot: 'personality', label: 'Личность' },
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
  'equipment' | 'spells' | 'features' | 'effects' | 'notes',
  string
> = {
  equipment: 'Инвентарь пуст',
  spells: 'Книга заклинаний пуста',
  features: 'Нет особенностей',
  effects: 'Эффектов нет — ни наложенных, ни от умений и снаряжения',
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
  | 'apply'
  | 'classLevelsTitle'
  | 'classLevelsHint'
  | 'totalLevel'
  | 'skipPreparation'
  | 'skipPreparationHint'
  | 'skipPreparationIdleHint'
  | 'stepClassPrefix'
  | 'modalTitle'
  | 'modalTitleLevelUp'
  | 'progressStepSubtitle'
  | 'levelWord'
  | 'hitPointsShort'
  | 'levelStepSubtitleEmpty'
  | 'subclassExplanation'
  | 'subclassChosenBadge'
  | 'railAriaLabel'
  | 'pendingBadgeAriaLabel'
  | 'featureDescriptionTitle'
  | 'experienceTitle'
  | 'currentExperience'
  | 'additionalExperience'
  | 'totalExperience',
  string
> = {
  progressStep: 'Уровень и опыт',
  modalTitle: 'Опыт и уровень',
  modalTitleLevelUp: 'Повышение уровня',
  progressStepSubtitle: 'Опыт и уровни классов',
  levelWord: 'уровень',
  hitPointsShort: 'хиты',
  levelStepSubtitleEmpty: 'Умений на этом уровне нет',
  subclassExplanation:
    'На этом уровне класс выбирает подкласс: его умения добавятся к умениям класса',
  subclassChosenBadge: 'Подкласс',
  railAriaLabel: 'Шаги повышения уровня',
  pendingBadgeAriaLabel: 'Не сделано выборов',
  featureDescriptionTitle: 'Описание умения',
  experienceTitle: 'Опыт',
  currentExperience: 'Текущий опыт',
  additionalExperience: 'Добавить опыт',
  totalExperience: 'Итого опыта',
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
  classLevelsTitle: 'Уровни классов',
  classLevelsHint:
    'Уровень поднимается у каждого класса отдельно; общий уровень персонажа — их сумма (правило D&D).',
  totalLevel: 'Общий уровень',
  skipPreparation: 'Пропустить подготовку',
  skipPreparationHint:
    'Уровень поднимется сразу, без выбора умений и броска на хиты: максимум вырастет на среднее значение кости класса. Умения новых уровней при этом не добавятся — их можно взять позже, выбрав класс заново.',
  skipPreparationIdleHint:
    'Пропускать пока нечего: поднимите уровень класса, и подготовку можно будет пропустить.',
  stepClassPrefix: 'Класс',
};

/** Подписи вкладки «Эффекты». */
export const SHEET_EFFECT_LABELS = {
  conditionsTitle: 'Состояния',
  add: 'Добавить эффект',
  edit: 'Редактировать эффект',
  remove: 'Удалить эффект',
  toggle: 'Включить или выключить эффект',
  disabledBadge: 'Выключен',
  noDescription: 'Без описания',
  cancel: 'Отмена',
  save: 'Сохранить',
  removeConfirmTitle: 'Удалить эффект?',
  removeConfirmDescription:
    'Эффект исчезнет с листа вместе со своими флагами и модификаторами. '
    + 'Наложить его заново придётся вручную.',
  removeConfirmApply: 'Удалить',
} as const;

/** Иконка эффекта, у которого своя не задана. */
export const SHEET_EFFECT_FALLBACK_ICON = 'tabler:sparkles';

/**
 * Откуда эффект пришёл на лист. Тремя списками подряд они читались плохо: у
 * пустого листа это три пустые рамки подряд, а у заполненного одно и то же
 * приходится искать в трёх местах. Список один, а источник — чип отбора.
 */
export const EFFECT_SOURCE_GROUP_ORDER = [
  'own',
  'feature',
  'equipment',
] as const;

/** Источник эффекта на листе. */
export type EffectSourceGroup = (typeof EFFECT_SOURCE_GROUP_ORDER)[number];

/** Подписи источников: ими же подписаны чипы отбора. */
export const EFFECT_SOURCE_GROUP_LABELS: Record<EffectSourceGroup, string> = {
  own: 'Наложенные',
  feature: 'Умения и черты',
  equipment: 'Снаряжение',
};

/** Пояснения к чипам отбора: чем этот источник отличается от прочих. */
export const EFFECT_SOURCE_GROUP_HINTS: Record<EffectSourceGroup, string> = {
  own: 'Состояния и свои эффекты — их накладывают и снимают вручную',
  feature:
    'Приходят с умением, чертой, видом или классом — снять нельзя, можно выключить',
  equipment: 'Дают надетые предметы — снимаются вместе с предметом',
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

/** Свободные поля вкладки «Личность» — порядок плиток и полей формы. */
export const PERSONALITY_TEXT_FIELDS: PersonalityTextField[] = [
  { key: 'age', label: 'Возраст', placeholder: '27 лет' },
  { key: 'height', label: 'Рост', placeholder: '178 см' },
  { key: 'weight', label: 'Вес', placeholder: '74 кг' },
  { key: 'eyes', label: 'Цвет глаз', placeholder: 'Серо-зелёные' },
  { key: 'hair', label: 'Цвет волос', placeholder: 'Русые' },
  { key: 'skin', label: 'Кожа', placeholder: 'Смуглая' },
];

/**
 * Предел длины свободного поля «Личности». Приметы — это пара слов; всё, что
 * длиннее, место на плитке уже не находит и относится к подробному описанию.
 */
export const PERSONALITY_FIELD_MAX_LENGTH = 40;

/** Значение незаполненной плитки «Личности». */
export const PERSONALITY_EMPTY_VALUE = '—';

/** Подписи вкладки «Личность» и её модалок. */
export const SHEET_PERSONALITY_LABELS = {
  appearanceTitle: 'Приметы',
  alignmentField: 'Мировоззрение',
  alignmentUnknown: 'Записано на листе (в справочнике такого нет):',
  editAppearance: 'Изменить приметы',
  appearanceModalTitle: 'Приметы персонажа',
  backgroundTitle: 'Предыстория',
  backgroundHint: 'Подставляется с листа: меняется вместе с выбором в шапке',
  backgroundSelect: 'Выбрать предысторию',
  backgroundChange: 'Сменить предысторию',
  backgroundPreview: 'Открыть описание',
  backgroundCustomHint: 'Своя предыстория — описания в справочнике у неё нет.',
  descriptionTitle: 'Подробное описание',
  descriptionModalTitle: 'Подробное описание персонажа',
  editDescription: 'Изменить подробное описание',
  addDescription: 'Добавить описание',
  descriptionEmpty:
    'Расскажите о персонаже: характер, привычки, прошлое, цели и связи.',
  descriptionPlaceholder:
    'Внешность, характер, привычки, прошлое, цели, страхи, отношения с другими…',
  reset: 'Сбросить',
  cancel: 'Отмена',
  apply: 'Применить',
} as const;

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

/**
 * Подписи модалки добавления черты: шаг выбора и подсказки. Тексты вынесены из
 * компонента — правки формулировок не должны требовать правки разметки.
 */
export const SHEET_FEAT_MODAL_LABELS = {
  choiceHint:
    'Черта просит выбрать при взятии. Компетентность даётся только в навыке, которым персонаж уже владеет: бонус мастерства в нём удваивается.',
  choicePlaceholder: 'Выберите значение',
  choiceEmptyOptions:
    'Выбирать пока не из чего: компетентность дают в навыке, которым персонаж уже владеет. Выберите класс или предысторию, затем добавьте черту.',
  descriptionTooltip: 'Открыть описание черты',
  abilityVariantLabel: 'Как повысить характеристики',
} as const;

/** Подписи окна «от какой характеристики считается заклинание». */
export const SHEET_SPELL_ABILITY_LABELS = {
  menu: 'Заклинательная характеристика',
  /** Подсказка бейджа строки: у заклинания характеристика не как у класса. */
  badgeHint: 'Заклинание считается от этой характеристики, а не от класса',
  hint: 'От неё считаются Сл спасброска и бонус атаки этого заклинания.',
  auto: 'От класса',
  autoUnknown: 'От класса (не определена)',
  save: 'Сохранить',
  cancel: 'Отмена',
} as const;

/**
 * Подписи просмотра описаний вариантов умения при выборе: воззвания, метамагию
 * и манёвры берут по тому, что они дают, а не по одним названиям.
 */
export const SHEET_CHOICE_OPTIONS_LABELS = {
  button: 'Описания вариантов',
  ariaLabel: 'Открыть описания вариантов',
  chosen: 'Выбрано',
  of: 'из',
} as const;

/**
 * Подписи единого пикера выбора: поле с выбранным в карточке умения и окно со
 * списком, поиском и описанием варианта. Один набор на все выборы листа —
 * навыки, заклинания, черты, подклассы, варианты умений.
 */
export const SHEET_CHOICE_PICKER_LABELS = {
  choose: 'Выбрать',
  change: 'Изменить',
  save: 'Сохранить',
  cancel: 'Отмена',
  clear: 'Снять выбор',
  allTab: 'Все',
  selectedTab: 'Выбранные',
  notChosen: 'Ещё не выбрано',
  remove: 'Убрать из выбранного',
  loading: 'Список вариантов загружается…',
  loadError: 'Не удалось загрузить список вариантов',
  retry: 'Повторить',
  noOptions: 'Вариантов для выбора нет',
  empty: 'По запросу ничего не найдено',
  searchPlaceholder: 'Поиск по названию',
  detailTooltip: 'Показать описание',
  detailAriaLabel: 'Описание варианта',
  detailPlaceholder: 'Нажмите на вариант в списке, чтобы прочитать описание',
  noDetail: 'У этого варианта нет описания',
  detailError: 'Не удалось загрузить описание',
  detailOpen: 'Открыть полное описание',
  abilityMaxed: 'на пределе',
  grantedSpells: 'Даёт заклинания',
} as const;

/** Подписи окна добавления заклинаний в книгу. */
export const SHEET_SPELL_ADD_LABELS = {
  /** Группа заклинаний, доступных сверх списка класса: от умений, черт, вида. */
  expandedGroup: 'Доступны от умений и черт',
} as const;

/** Служебный круг группы «доступны от умений и черт»: у настоящих кругов ≥ 0. */
export const SHEET_SPELL_ADD_EXPANDED_GROUP_LEVEL = -1;

/**
 * Пояснения к выбору по его виду: почему игрок здесь и сейчас что-то выбирает.
 * Подпись выбора из записи говорит «Выберите заклинание 6 круга», а не откуда
 * оно и что даёт — эту строку пикер показывает под заголовком.
 */
export const SHEET_CHOICE_EXPLANATION_LABELS: Record<ClassChoiceKind, string> =
  {
    'skill-proficiency': 'Умение даёт владение навыком на выбор',
    'skill-expertise':
      'Умение даёт компетентность в навыке, которым персонаж уже владеет',
    'language': 'Умение даёт язык на выбор',
    'tool': 'Умение даёт владение инструментом на выбор',
    'damage-type': 'Умение даёт защиту от типа урона на выбор',
    'spell': 'Умение даёт заклинание на выбор',
    'spell-list': 'Умение даёт заклинания из списка класса на выбор',
    'spellcasting-ability':
      'От выбранной характеристики считаются заклинания умения',
    'saving-throw': 'Умение даёт владение спасброском на выбор',
    'weapon-mastery': 'Умение даёт оружейный приём для оружия во владении',
    'mastery-property': 'Умение даёт оружейный приём на выбор',
    'ability-score': 'Умение повышает характеристику на выбор',
    'ability-variant': 'Умение предлагает, как повысить характеристики',
    'option': 'Умение даёт вариант на выбор',
    'feat': 'Умение даёт черту на выбор',
  };

/**
 * Части пояснения к выбору заклинания: «Умение даёт заклинание 6 круга из
 * списка класса Колдун на выбор». Собирается из фильтра пула, потому что
 * подпись выбора в записи бывает и пустой.
 */
export const SHEET_CHOICE_SPELL_EXPLANATION = {
  prefix: 'Умение даёт',
  cantrip: 'заговор',
  spell: 'заклинание',
  maxLevelPrefix: 'не выше',
  levelSuffix: 'круга',
  classPrefix: 'из списка класса',
  listedSuffix: 'из перечисленных в записи',
  suffix: 'на выбор',
} as const;

/**
 * Оформление раздела в мастерах листа: рамка карточки, общая у мастера класса и
 * мастера повышения уровня, — по ней разделы читаются блоками, а не сплошной
 * простынёй.
 */
export const SHEET_WIZARD_SECTION_CLASS =
  'flex flex-col gap-2 rounded-lg border border-default/50 bg-elevated/20 p-3';

/** Заголовок раздела в мастерах листа: капителью, как легенда панели. */
export const SHEET_WIZARD_SECTION_TITLE_CLASS =
  'text-[10px] font-bold tracking-wider text-muted uppercase';

/**
 * Карточка умения в мастерах листа: та же рамка, что у раздела, но без
 * внутренних отступов — шапка-кнопка занимает карточку целиком.
 */
export const SHEET_WIZARD_FEATURE_CARD_CLASS =
  'flex flex-col rounded-lg border border-default/50 bg-elevated/20';

/**
 * Ключ выбора класса, который лист заводит сам, когда в записи черты его нет:
 * заклинания перечисляют несколько классов, но по правилам список один.
 */
export const FEAT_SPELL_CLASS_CHOICE_KEY = 'spell-list';

/**
 * Подписи пикеров черты по умолчанию: подпись у выбора необязательна, а «Выберите
 * значение» у трёх пикеров подряд не говорит игроку, что от него хотят.
 */
export const SHEET_FEAT_CHOICE_LABELS: Partial<
  Record<ClassChoiceKind, string>
> = {
  'spell-list': 'Выберите список заклинаний класса',
  'spellcasting-ability': 'Выберите заклинательную характеристику',
  'spell': 'Выберите заклинания',
  'damage-type': 'Выберите тип урона',
  'saving-throw': 'Выберите спасбросок',
  'weapon-mastery': 'Выберите оружие с приёмом',
  'mastery-property': 'Выберите оружейный приём',
  'option': 'Выберите вариант',
  'feat': 'Выберите черту',
};

/** Формы слова «характеристика» для подписи варианта повышения. */
export const ABILITY_COUNT_FORMS: [string, string, string] = [
  'одной характеристике',
  'двум характеристикам',
  'характеристикам',
];

/**
 * Хвост идентификатора выбора повышения характеристик у черты: `ability-<номер
 * варианта>` и `ability-variant` у выбора самого варианта. Выборы синтетические
 * — в механике черты у них ключа нет, поэтому id собирается листом.
 */
export const ABILITY_CHOICE_ID_SEGMENT = 'ability';
export const ABILITY_VARIANT_CHOICE_ID_SEGMENT = 'ability-variant';

/**
 * Хвост идентификатора выбора из вариантов умения класса: `options` у выбора без
 * ступеней и `options-<уровень>` у ступени. Выбор синтетический — ключа у него в
 * записи нет, поэтому id собирает лист. Уровень через дефис, а не отдельным
 * сегментом: хвостом id ответ ложится на запись умения, и `:2` совпал бы с
 * ключом выбора механики того же уровня.
 */
export const OPTION_CHOICE_ID_SEGMENT = 'options';

/** Сколько вариантов берут, когда справочник количества не назвал. */
export const OPTION_CHOICE_DEFAULT_COUNT = 1;

/**
 * Приставка кратности в строке выбранных вариантов («Инфузия ×2»). Вариант,
 * помеченный повторяемым, берут не по одному разу, и в строке умения он иначе
 * значился бы так же, как взятый однажды.
 */
export const OPTION_CHOICE_REPEAT_PREFIX = '×';

/**
 * Сегмент идентификатора записи листа под выбранный вариант умения:
 * `class:<url>:<ключ умения>:option:<ключ варианта>`. Запись заводится рядом с
 * умением, поэтому её id начинается с его id — снятие класса забирает обе.
 */
export const FEATURE_OPTION_ID_SEGMENT = 'option';

/** Размер выдачи пула заклинаний выбора: круг одного класса в неё умещается. */
export const CHOICE_SPELL_POOL_SIZE = 200;

/** Подсказка пикера выбора: сколько значений нужно отметить. */
export const CHOICE_SELECT_PLACEHOLDER = 'Выберите';
