import type { DiceHelpRow, DicePreset } from './types';

/** Маршрут страницы калькулятора бросков. */
export const DICE_CALCULATOR_ROUTE = '/tools/dice-calculator';

/** Название инструмента в меню и заголовке страницы. */
export const DICE_CALCULATOR_TITLE = 'Калькулятор бросков';

/** Ключ localStorage с последней введённой формулой. */
export const DICE_FORMULA_STORAGE_KEY = 'dice-calculator:last-formula';

/** Предел длины формулы в поле ввода. */
export const DICE_FORMULA_MAX_LENGTH = 200;

/** Минимальное число костей в одном броске. */
export const DICE_MIN_COUNT = 1;

/** Максимальное число костей в одном броске. */
export const DICE_MAX_COUNT = 100;

/** Минимальное число граней у кости. */
export const DICE_MIN_SIDES = 2;

/** Максимальное число граней у кости. */
export const DICE_MAX_SIDES = 1000;

/** Число граней процентной кости `d%`. */
export const PERCENTILE_DIE_SIDES = 100;

/** Число граней двадцатигранника: по нему считаются криты и режимы броска. */
export const D20_SIDES = 20;

/** Кости на кнопках быстрого добавления. */
export const QUICK_DICE_SIDES: ReadonlyArray<number> = [
  4, 6, 8, 10, 12, 20, 100,
];

/** Контуры кубиков для кнопок быстрого добавления. */
export const DICE_SHAPE_PATHS: Readonly<Record<number, string>> = {
  4: 'M12 3 21 20H3z',
  6: 'M5 5h14v14H5z',
  8: 'M12 2 21 12l-9 10L3 12z',
  10: 'M12 2l9 8-9 12L3 10z',
  12: 'M12 2l9.5 7-3.6 11h-11.8L2.5 9z',
  20: 'M12 2l8.7 5v10L12 22 3.3 17V7z',
  100: 'M12 2l8.7 5v10L12 22 3.3 17V7z',
};

/** Насколько кнопки `+1` и `−1` меняют модификатор формулы. */
export const MODIFIER_STEP = 1;

/** Место в шаблоне формулы пресета, куда подставляется введённое число. */
export const PRESET_VALUE_PLACEHOLDER = '{value}';

/** Наименьшие КД и СЛ, которые можно указать в пресетах. */
export const PRESET_TARGET_MIN = 1;

/** Наибольшие КД и СЛ, которые можно указать в пресетах. */
export const PRESET_TARGET_MAX = 40;

/** КД, предложенный в пресете атаки по умолчанию. */
export const PRESET_ARMOR_CLASS_DEFAULT = 10;

/** СЛ, предложенная в пресете спасброска по умолчанию. */
export const PRESET_DIFFICULTY_CLASS_DEFAULT = 10;

/** Готовые формулы под полем ввода. */
export const DICE_PRESETS: ReadonlyArray<DicePreset> = [
  { id: 'ability', label: 'Характеристика', hint: '4d6kh3', formula: '4d6kh3' },
  {
    id: 'attack',
    label: 'Атака по КД',
    formula: `(d20 + 5 КД ${PRESET_VALUE_PLACEHOLDER}) * (2d6 + 3)`,
    prompt: {
      label: 'КД цели',
      min: PRESET_TARGET_MIN,
      max: PRESET_TARGET_MAX,
      defaultValue: PRESET_ARMOR_CLASS_DEFAULT,
    },
  },
  {
    id: 'save',
    label: 'Спасбросок',
    formula: `d20 + 6 СЛ ${PRESET_VALUE_PLACEHOLDER} * 8d6 save half`,
    prompt: {
      label: 'Сложность (СЛ)',
      min: PRESET_TARGET_MIN,
      max: PRESET_TARGET_MAX,
      defaultValue: PRESET_DIFFICULTY_CLASS_DEFAULT,
    },
  },
];

/** Справка по синтаксису формул. */
export const DICE_HELP_ROWS: ReadonlyArray<DiceHelpRow> = [
  {
    syntax: 'd20',
    description: 'Одна кость на 20 граней. Русская «к» тоже работает: к20',
  },
  { syntax: '2d6 + 4', description: 'Две шестигранки и модификатор' },
  {
    syntax: '2d20kh1',
    description: 'Преимущество: из двух d20 остаётся лучшая (keep highest)',
  },
  {
    syntax: '2d20kl1',
    description: 'Помеха: из двух d20 остаётся худшая (keep lowest)',
  },
  {
    syntax: '4d6kh3',
    description: 'Бросок характеристики: из четырёх d6 остаются три лучших',
  },
  {
    syntax: 'd20r1',
    description:
      'Переброс: кости с результатом 1 и ниже перебрасываются один раз',
  },
  { syntax: 'd%', description: 'Процентная кость, то же что d100' },
  {
    syntax: '(2d6 + 3) * 2',
    description: 'Скобки и умножение — например, уязвимость к урону',
  },
  {
    syntax: '(2d6 + 6) / 2',
    description:
      'Деление с округлением вниз — например, сопротивление урону. Знак «÷» и «:» тоже работают',
  },
  {
    syntax: 'd20 + 6 СЛ 15',
    description:
      'Проверка против сложности: успех или провал. Вместо «СЛ» можно писать «DC»',
  },
  {
    syntax: '(d20 + 5 КД 15) * (2d6 + 3)',
    description:
      'Атака против КД: урон при попадании. Натуральная 20 — всегда попадание с удвоением костей, 1 — всегда промах. Вместо «КД» можно писать «AC»',
  },
  {
    syntax: '(d20 + 5 КД 15) * (2d6 + 3) crit (2d6 + 3 + 2d10)',
    description:
      'Свой урон при крите — на случай, когда он не сводится к удвоению костей',
  },
  {
    syntax: 'd20 + 6 СЛ 15 * 8d6 save half',
    description:
      'Спасбросок против урона — как у огненного шара: успех снимает половину, провал оставляет полный',
  },
];

/** Сколько виртуальных бросков делает оценка методом Монте-Карло. */
export const MONTE_CARLO_SAMPLES = 60_000;

/** Предел размера промежуточной свёртки при точном расчёте суммы костей. */
export const CONVOLUTION_SIZE_LIMIT = 40_000;

/** Предел «число костей × число граней» для точного расчёта простой суммы. */
export const DICE_SUM_EXACT_LIMIT = 8_000;

/** Предел числа комбинаций для полного перебора при `kh` / `kl`. */
export const KEEP_ENUMERATION_LIMIT = 600_000;

/** Предел числа пар значений при точной свёртке двух распределений. */
export const BINARY_COMBINATION_LIMIT = 400_000;

/** Ниже этой вероятности значение не попадает в точное распределение. */
export const DISTRIBUTION_PROBABILITY_EPSILON = 1e-12;

/** Максимальное число столбцов гистограммы. */
export const CHART_MAX_BINS = 120;

/** Высота гистограммы в пикселях. */
export const CHART_HEIGHT = 220;

/** Отступы области построения гистограммы. */
export const CHART_PADDING = {
  left: 40,
  right: 8,
  top: 10,
  bottom: 24,
} as const;

/** Число горизонтальных линий сетки гистограммы. */
export const CHART_GRID_LINES = 4;

/** Максимальное число подписей на оси значений. */
export const CHART_MAX_AXIS_LABELS = 8;

/** Размер шрифта подписей на гистограмме в пикселях. */
export const CHART_LABEL_FONT_SIZE = 11;

/** Сколько «прокруток» показывает число результата перед остановкой. */
export const RESULT_SPIN_TICKS = 8;

/** Длительность одной «прокрутки» результата в миллисекундах. */
export const RESULT_SPIN_INTERVAL = 40;
