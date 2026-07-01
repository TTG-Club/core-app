/**
 * Описание вставляемого через тулбар кастомного тега разметки {@...} / Markdown.
 *
 * Итоговая строка вставки формируется как `${before}${выделение|placeholder}${after}`.
 * Используется РЕЖИМОМ КОДА (сырой текст в textarea). В визуальном режиме
 * форматирование идёт марками, а заголовки/списки — командами TipTap, но набор
 * и порядок кнопок совпадает (см. toolbar-items.ts), чтобы оба режима выглядели
 * одинаково.
 */
export interface MarkupTag {
  /** Уникальный ключ тега. */
  key: string;
  /** Подпись кнопки/пункта меню. */
  label: string;
  /** Иконка из коллекции tabler. */
  icon: string;
  /** Текст, вставляемый перед выделением. */
  before: string;
  /** Текст, вставляемый после выделения. */
  after: string;
  /** Значение-заглушка, если выделение пустое. */
  placeholder: string;
}

/**
 * Инлайновое форматирование (жирный/курсив/подчёркнутый/зачёркнутый/индексы/
 * выделение). В коде — Markdown или {@...}, в визуале — марки того же порядка.
 */
export const FORMAT_TAGS: MarkupTag[] = [
  {
    key: 'bold',
    label: 'Жирный',
    icon: 'tabler:bold',
    before: '**',
    after: '**',
    placeholder: 'текст',
  },
  {
    key: 'italic',
    label: 'Курсив',
    icon: 'tabler:italic',
    before: '*',
    after: '*',
    placeholder: 'текст',
  },
  {
    key: 'underline',
    label: 'Подчёркнутый',
    icon: 'tabler:underline',
    before: '{@u ',
    after: '}',
    placeholder: 'текст',
  },
  {
    key: 'strike',
    label: 'Зачёркнутый',
    icon: 'tabler:strikethrough',
    before: '~~',
    after: '~~',
    placeholder: 'текст',
  },
  {
    key: 'superscript',
    label: 'Верхний индекс',
    icon: 'tabler:superscript',
    before: '{@sup ',
    after: '}',
    placeholder: 'текст',
  },
  {
    key: 'subscript',
    label: 'Нижний индекс',
    icon: 'tabler:subscript',
    before: '{@sub ',
    after: '}',
    placeholder: 'текст',
  },
  {
    key: 'highlight',
    label: 'Выделение',
    icon: 'tabler:highlight',
    before: '{@mark ',
    after: '}',
    placeholder: 'текст',
  },
];

/**
 * Блочный/структурный Markdown (заголовки H1–H3, списки, цитата, ссылка).
 * Порядок и набор совпадают с блочными кнопками визуального тулбара.
 */
export const BLOCK_TAGS: MarkupTag[] = [
  {
    key: 'heading-1',
    label: 'Заголовок 1',
    icon: 'tabler:h-1',
    before: '# ',
    after: '',
    placeholder: 'Заголовок',
  },
  {
    key: 'heading-2',
    label: 'Заголовок 2',
    icon: 'tabler:h-2',
    before: '## ',
    after: '',
    placeholder: 'Заголовок',
  },
  {
    key: 'heading-3',
    label: 'Заголовок 3',
    icon: 'tabler:h-3',
    before: '### ',
    after: '',
    placeholder: 'Заголовок',
  },
  {
    key: 'bullet-list',
    label: 'Маркированный список',
    icon: 'tabler:list',
    before: '- ',
    after: '',
    placeholder: 'пункт',
  },
  {
    key: 'ordered-list',
    label: 'Нумерованный список',
    icon: 'tabler:list-numbers',
    before: '1. ',
    after: '',
    placeholder: 'пункт',
  },
  {
    key: 'quote',
    label: 'Цитата',
    icon: 'tabler:quote',
    before: '> ',
    after: '',
    placeholder: 'цитата',
  },
  {
    key: 'md-link',
    label: 'Ссылка',
    icon: 'tabler:link',
    before: '[',
    after: '](https://)',
    placeholder: 'текст',
  },
];

/**
 * Листовые инлайновые теги без markdown-аналога, которые остаются {@...}-чипами
 * (не форматирование). Сейчас — только клавиша.
 */
export const INLINE_TAGS: MarkupTag[] = [
  {
    key: 'kbd',
    label: 'Клавиша',
    icon: 'tabler:keyboard',
    before: '{@kbd ',
    after: '}',
    placeholder: 'Ctrl',
  },
];

/**
 * Интерактивные теги (бросок кубика, бейдж) — доменная логика TTG, аналога в
 * Markdown нет.
 */
export const INTERACTIVE_TAGS: MarkupTag[] = [
  {
    key: 'dice',
    label: 'Бросок кубика',
    icon: 'tabler:dice',
    before: '{@dice ',
    after: '}',
    placeholder: '2d6',
  },
  {
    key: 'badge',
    label: 'Бейдж',
    icon: 'tabler:badge',
    before: '{@badge ',
    after: ' | color:primary}',
    placeholder: 'текст',
  },
];

/**
 * Ссылки на разделы сайта (открывают дровер сущности). Требуют атрибут `url`
 * (slug сущности), который автор заполняет вручную после вставки.
 */
export const SECTION_TAGS: MarkupTag[] = [
  {
    key: 'spell',
    label: 'Заклинание',
    icon: 'tabler:sparkles',
    before: '{@spell ',
    after: ' | url:}',
    placeholder: 'название',
  },
  {
    key: 'creature',
    label: 'Существо',
    icon: 'tabler:paw',
    before: '{@creature ',
    after: ' | url:}',
    placeholder: 'название',
  },
  {
    key: 'class',
    label: 'Класс',
    icon: 'tabler:sword',
    before: '{@class ',
    after: ' | url:}',
    placeholder: 'название',
  },
  {
    key: 'feat',
    label: 'Черта',
    icon: 'tabler:award',
    before: '{@feat ',
    after: ' | url:}',
    placeholder: 'название',
  },
  {
    key: 'background',
    label: 'Предыстория',
    icon: 'tabler:book',
    before: '{@background ',
    after: ' | url:}',
    placeholder: 'название',
  },
  {
    key: 'magicItem',
    label: 'Магический предмет',
    icon: 'tabler:wand',
    before: '{@magicItem ',
    after: ' | url:}',
    placeholder: 'название',
  },
  {
    key: 'item',
    label: 'Предмет',
    icon: 'tabler:briefcase',
    before: '{@item ',
    after: ' | url:}',
    placeholder: 'название',
  },
  {
    key: 'glossary',
    label: 'Глоссарий',
    icon: 'tabler:vocabulary',
    before: '{@glossary ',
    after: ' | url:}',
    placeholder: 'термин',
  },
];
