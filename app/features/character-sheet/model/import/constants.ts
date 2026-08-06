import type {
  AbilityKey,
  CurrencyKey,
  PersonalityFieldKey,
  WeaponCategory,
} from '../types';

/** Название формата-источника: показывается в тосте после импорта. */
export const LSS_SOURCE_LABEL = 'Long Story Short';

/** Признак файла LSS: этим полем помечен документ персонажа. */
export const LSS_JSON_TYPE = 'character';

/** Характеристики листа по кодам LSS. */
export const LSS_ABILITY_KEYS: Record<string, AbilityKey> = {
  str: 'strength',
  dex: 'dexterity',
  con: 'constitution',
  int: 'intelligence',
  wis: 'wisdom',
  cha: 'charisma',
};

/**
 * Названия навыков листа по ключам LSS: там навыки записаны английскими
 * названиями, у нас — русскими подписями из `DEFAULT_CHARACTER.skills`.
 */
export const LSS_SKILL_NAMES: Record<string, string> = {
  'acrobatics': 'Акробатика',
  'animal handling': 'Уход за животными',
  'arcana': 'Аркана',
  'athletics': 'Атлетика',
  'deception': 'Обман',
  'history': 'История',
  'insight': 'Проницательность',
  'intimidation': 'Запугивание',
  'investigation': 'Анализ',
  'medicine': 'Медицина',
  'nature': 'Природа',
  'perception': 'Внимательность',
  'performance': 'Выступление',
  'persuasion': 'Убеждение',
  'religion': 'Религия',
  'sleight of hand': 'Ловкость рук',
  'stealth': 'Скрытность',
  'survival': 'Выживание',
};

/**
 * Уровень владения навыком в LSS: 1 — владение, 2 — компетентность. Дробное
 * значение (половина бонуса мастерства) на нашем листе — уровень `half`.
 */
export const LSS_SKILL_EXPERTISE_VALUE = 2;

/** Размеры листа по ключам LSS. */
export const LSS_SIZE_LABELS: Record<string, string> = {
  tiny: 'Крошечный',
  small: 'Маленький',
  medium: 'Средний',
  large: 'Большой',
  huge: 'Огромный',
  gargantuan: 'Громадный',
};

/**
 * Группы каталога брони по флагам владений LSS. Ключ `armor-label` — так LSS
 * называет щиты (проверено на выгрузке: у жреца с щитом стоит именно он);
 * более говорящие варианты того же флага держим рядом.
 */
export const LSS_ARMOR_PROFICIENCY_GROUPS: Record<string, string> = {
  'armor-light': 'light',
  'armor-medium': 'medium',
  'armor-heavy': 'heavy',
  'armor-label': 'shields',
  'armor-shield': 'shields',
  'armor-shields': 'shields',
};

/**
 * Группы каталога оружия по флагам владений LSS. Флаг `weapon-other` («иное»)
 * не переносится: за ним стоит свободный текст, а не группа каталога.
 */
export const LSS_WEAPON_PROFICIENCY_GROUPS: Record<string, WeaponCategory> = {
  'weapon-simple': 'simple',
  'weapon-martial': 'martial',
};

/** Флаг владения воинским оружием в LSS: им подписывается своё оружие. */
export const LSS_MARTIAL_WEAPON_FLAG = 'weapon-martial';

/** Денежные единицы листа по кодам LSS. */
export const LSS_COIN_KEYS: Record<string, CurrencyKey> = {
  cp: 'copper',
  sp: 'silver',
  ep: 'electrum',
  gp: 'gold',
  pp: 'platinum',
};

/** Номинал кости хитов, если в файле он не указан. */
export const LSS_DEFAULT_HIT_DIE = 8;

/** Ключи текстовых блоков LSS, которые становятся особенностями листа. */
export const LSS_FEATURE_TEXT_KEYS = ['traits', 'feats'];

/** Ключ текстового блока LSS с владениями и языками. */
export const LSS_TOOLS_TEXT_KEY = 'prof';

/** Путь раздела «Предметы» на сайте: по нему в текстах LSS находятся ссылки. */
export const LSS_ITEMS_LINK_PATH = '/items';

/** Префикс идентификаторов записей, собранных импортом из блоков LSS. */
export const LSS_NOTE_ID_PREFIX = 'lss:';

/** Ключ заметки с подписями шапки (у неё нет своего блока в файле). */
export const LSS_DETAILS_NOTE_KEY = 'details';

/**
 * Ключи текстовых блоков LSS со снаряжением: их пункты списков разбираются в
 * предметы инвентаря, а всё нераспознанное остаётся заметкой.
 */
export const LSS_EQUIPMENT_TEXT_KEYS = ['equipment', 'items'];

/** Заголовки текстовых блоков LSS на нашем листе. */
export const LSS_TEXT_TITLES: Record<string, string> = {
  'allies': 'Союзники и организации',
  'background': 'Предыстория',
  'bonds': 'Привязанности',
  'equipment': 'Снаряжение',
  'feats': 'Черты',
  'flaws': 'Слабости',
  'ideals': 'Идеалы',
  'items': 'Ценности и прочее',
  'personality': 'Черты характера',
  'prof': 'Владения и языки',
  'quests': 'Задания',
  'quests-completed': 'Выполненные задания',
  'traits': 'Умения и особенности',
};

/** Шаблон ключа пронумерованных заметок LSS (`notes-1`). */
export const LSS_NOTES_KEY_PATTERN = /^notes-(\d+)$/;

/** Заголовок пронумерованной заметки LSS. */
export const LSS_NOTES_TITLE = 'Заметки';

/** Заголовок заметки с блоком, которому в шаблоне нет названия. */
export const LSS_UNKNOWN_TEXT_TITLE = 'Из листа LSS';

/** Заголовок заметки с подписями шапки, которым на листе нет полей. */
export const LSS_DETAILS_NOTE_TITLE = 'О персонаже';

/**
 * Подписи шапки LSS, у которых на листе есть своё поле личности: ключи там
 * совпадают с нашими, поэтому карта не нужна — по этим ключам приметы уходят
 * во вкладку «Личность», а всё остальное (имя игрока) остаётся заметкой.
 */
export const LSS_PERSONALITY_DETAIL_KEYS: PersonalityFieldKey[] = [
  'alignment',
  'age',
  'height',
  'weight',
  'eyes',
  'hair',
  'skin',
];

/**
 * Подписи полей шапки LSS для заметки «О персонаже». Порядок ключей — порядок
 * строк в заметке, поэтому он не алфавитный, а осмысленный.
 */
export const LSS_DETAIL_LABELS: Record<string, string> = {
  playerName: 'Игрок',
  alignment: 'Мировоззрение',
  age: 'Возраст',
  height: 'Рост',
  weight: 'Вес',
  eyes: 'Глаза',
  hair: 'Волосы',
  skin: 'Кожа',
};

/**
 * Предельная длина названия предмета: строка длиннее — это уже описание или
 * заголовок раздела, а не предмет, и она уходит в заметку целиком.
 */
export const LSS_ITEM_NAME_MAX_LENGTH = 60;

/**
 * Сколько строк снаряжения ищется в каталоге за импорт. Ограничение бережёт от
 * файла с сотней пунктов: остальное станет своими предметами без дозагрузки.
 */
export const LSS_ITEM_LOOKUP_LIMIT = 40;

/** Что LSS хранит, а наш лист не поддерживает — попадает в тост после импорта. */
export const LSS_IMPORT_WARNINGS = {
  spells:
    'Заклинания не перенесены: LSS хранит только свои внутренние идентификаторы — добавьте их из справочника.',
  bonuses:
    'Пользовательские бонусы LSS не перенесены: на листе их заменяют настройки бросков.',
  attunements: 'Настройка магических предметов не перенесена.',
};
