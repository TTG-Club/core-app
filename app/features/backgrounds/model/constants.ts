/** Подписи полей редактора предыстории. */
export const BACKGROUND_EDITOR_LABELS = {
  featClass: 'Класс черты',
  featClassHint:
    'Уточнение к черте, которое видно в описании предыстории: «Посвящённый в '
    + 'магию (Волшебник)». Его же читает лист персонажа — он не станет '
    + 'спрашивать класс у черты, а сразу соберёт пул заклинаний названного.',
} as const;

/** Подписи блока параметров на странице предыстории. */
export const BACKGROUND_DETAIL_LABELS = {
  listSeparator: ', ',
  choiceSeparator: ' или ',
  toolChoicePrefix: 'На выбор',
  anyTool: 'любой инструмент',
} as const;

/** Вкладки редактора предыстории. */
export const BACKGROUND_EDITOR_TABS = {
  main: 'Основное',
  params: 'Параметры',
  equipment: 'Снаряжение',
  grants: 'Владения',
  spells: 'Заклинания',
  effects: 'Эффекты',
} as const;

/** Подписи вкладки «Основное». */
export const BACKGROUND_MAIN_TAB_LABELS = {
  descriptionTitle: 'Описание',
  descriptionPlaceholder: 'Введи описание',
} as const;

/** Подписи вкладки «Параметры». */
export const BACKGROUND_PARAMS_TAB_LABELS = {
  detailsTitle: 'Подробности',
  abilities: 'Характеристики',
  abilitiesHelp:
    'В предыстории перечислены 3 из ваших характеристик персонажа. Увеличьте '
    + 'одну из них на 2, а другую на 1; или увеличьте каждую из 3 на 1.',
  skills: 'Навыки',
  skillsHelp:
    'Предыстория даёт вашему персонажу владение двумя определёнными навыками.',
  featTitle: 'Черта происхождения',
  feat: 'Черта',
  featModeFixed: 'Одна черта',
  featModeChoice: 'Черта на выбор игрока',
  featChoices: 'Черты, из которых выбирает игрок',
  toolsTitle: 'Владение инструментами',
  tools: 'Инструменты',
  toolsHint:
    'Инструменты выбираются карточками раздела «Предметы»: по ним лист '
    + 'персонажа выдаёт владение, а выгрузка находит инструмент в справочнике '
    + 'стола. Текст ниже остаётся у записей, которые на карточки ещё не '
    + 'перевели, и показывается на странице.',
  toolChoiceCount: 'Сколько выбирает игрок',
  toolChoiceFrom: 'Из чего выбирает',
  toolChoiceFromHint:
    'Пустой список — выбирают любой инструмент, как это написано в книге.',
  toolLegacy: 'Владение инструментами текстом',
  toolLegacyPlaceholder: 'Введи инструменты',
  equipment: 'Снаряжение текстом',
  equipmentPlaceholder: 'Введи снаряжение',
} as const;

/** Подписи вкладок даров, заклинаний и эффектов. */
export const BACKGROUND_GRANTS_TAB_LABELS = {
  grantsTitle: 'Владения и дары',
  grantsHint:
    'То, что предыстория даёт сверх характеристик, навыков, инструментов и '
    + 'черты: языки, защиты, чувства и выборы игрока.',
  grantedSpellsTitle: 'Выдаваемые заклинания',
  spellChoicesTitle: 'Выбор заклинаний игроком',
  spellListTitle: 'Расширение списка заклинаний',
  spellcastingAbilityTitle: 'Заклинательная характеристика',
} as const;
