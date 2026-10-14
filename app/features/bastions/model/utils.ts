import type { GroupKey } from '~ui/grouped-list';

import type {
  BastionFacilityCreate,
  BastionFacilityDetailResponse,
  FacilityChoice,
  FacilityEnlargementForm,
  FacilityOrderOption,
} from './types';

import {
  BASTION_BASIC_GROUP_LABEL,
  BASTION_BODY_LABELS,
  EMPTY_ENLARGEMENT,
} from './constants';

/**
 * Подставляет значения в шаблон подписи вида `с {level} уровня`.
 *
 * @param template - Шаблон с плейсхолдерами в фигурных скобках
 * @param values - Значения плейсхолдеров
 * @returns Готовая подпись
 */
export function fillTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    key in values ? String(values[key]) : placeholder,
  );
}

/**
 * Подпись группы списка сооружений по уровню. Пустой ключ — у базовых
 * сооружений уровня нет.
 *
 * @param level - Ключ группы (уровень)
 * @returns Подпись разделителя
 */
export function getBastionGroupLabel(level: GroupKey): string {
  return level === '' ? BASTION_BASIC_GROUP_LABEL : `${level} уровень`;
}

/**
 * Порядок групп списка: базовые сооружения, затем уровни по возрастанию.
 * Ключи приходят строками, поэтому сравниваются как числа — иначе 13 встал бы
 * раньше 5.
 *
 * @param firstLevel - Ключ первой группы
 * @param secondLevel - Ключ второй группы
 * @returns Результат сравнения для сортировки
 */
export function compareBastionGroups(
  firstLevel: GroupKey,
  secondLevel: GroupKey,
): number {
  return Number(firstLevel || 0) - Number(secondLevel || 0);
}

/**
 * Краткая строка условий варианта приказа: срок, цена, уровень.
 *
 * @param option - Вариант приказа
 * @returns Строка вида «7 дн. · 10 зм · с 9 уровня»; пустая, если чисел нет
 */
export function getOrderOptionTerms(option: FacilityOrderOption): string {
  const parts: Array<string> = [];

  if (option.days) {
    parts.push(`${option.days} ${BASTION_BODY_LABELS.days}`);
  }

  if (option.cost === 0) {
    parts.push(BASTION_BODY_LABELS.free);
  } else if (option.cost) {
    parts.push(`${option.cost} ${BASTION_BODY_LABELS.gold}`);
  } else if (option.costNote) {
    parts.push(option.costNote);
  }

  if (option.minLevel) {
    parts.push(
      fillTemplate(BASTION_BODY_LABELS.fromLevel, { level: option.minLevel }),
    );
  }

  return parts.join(' · ');
}

/**
 * Строка «сколько выбирается» у выбора сооружения.
 *
 * @param choice - Выбор сооружения
 * @returns Подпись количества; пустая, если количество не задано
 */
export function getChoiceCountText(choice: FacilityChoice): string {
  const parts: Array<string> = [];

  if (choice.count) {
    parts.push(
      fillTemplate(BASTION_BODY_LABELS.choiceCount, { count: choice.count }),
    );
  }

  if (choice.enlargedCount) {
    parts.push(
      fillTemplate(BASTION_BODY_LABELS.enlargedChoiceCount, {
        count: choice.enlargedCount,
      }),
    );
  }

  return parts.join(', ');
}

/**
 * Подзаголовок сооружения, как в книге: «Уровень 5, сооружение бастиона». У
 * базовых сооружений уровня нет, у них — «Базовое сооружение бастиона».
 *
 * @param facility - Сооружение
 * @returns Подзаголовок карточки
 */
export function getFacilitySubtitle(
  facility: Pick<BastionFacilityDetailResponse, 'level' | 'category'>,
): string {
  if (facility.level) {
    return fillTemplate(BASTION_BODY_LABELS.levelSubtitle, {
      level: facility.level,
    });
  }

  return facility.category?.value === 'BASIC'
    ? BASTION_BODY_LABELS.basicSubtitle
    : BASTION_BODY_LABELS.defaultSubtitle;
}

/**
 * Подпись пространства с площадью: «Вместительное (16 кв.)».
 *
 * @param facility - Сооружение
 * @returns Подпись пространства; пустая, если пространство не задано
 */
export function getSpaceText(
  facility: Pick<BastionFacilityDetailResponse, 'space'>,
): string {
  if (!facility.space) {
    return '';
  }

  return `${facility.space.name} (${facility.space.squares} ${BASTION_BODY_LABELS.squares})`;
}

/**
 * Рекурсивно убирает поля со значением `null`: бэкенд отдаёт так пустые поля,
 * а поля ввода формы ждут `undefined`. Элементы-`null` в массивах тоже
 * выбрасываются.
 *
 * @param value - Значение из ответа бэкенда
 * @returns То же значение без `null`
 */
function omitNullDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .filter((element) => element !== null)
      .map((element) => omitNullDeep(element));
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, fieldValue]) => fieldValue !== null)
      .map(([key, fieldValue]) => [key, omitNullDeep(fieldValue)]),
  );
}

/**
 * Даёт выбору сооружения список вариантов: без вариантов бэкенд отдаёт `null`.
 *
 * @param choice - Выбор из ответа бэкенда
 * @returns Выбор с массивом вариантов
 */
function normalizeLoadedChoice(choice: unknown): unknown {
  if (typeof choice !== 'object' || choice === null) {
    return choice;
  }

  const options = 'options' in choice ? choice.options : undefined;

  return { ...choice, options: Array.isArray(options) ? options : [] };
}

/**
 * Приводит загруженную форму к виду редактора: снимает `null` (см.
 * `omitNullDeep`) и даёт спискам массивы там, где блок не заполняли.
 * Расширение без записи остаётся `null` из начального состояния формы.
 *
 * @param raw - Ответ `GET /bastions/{url}/raw`
 * @returns Нормализованные данные для слияния с начальным состоянием
 */
export function normalizeLoadedBastion(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const cleaned = omitNullDeep(raw);

  const record =
    typeof cleaned === 'object' && cleaned !== null && !Array.isArray(cleaned)
      ? Object.fromEntries(Object.entries(cleaned))
      : {};

  return {
    ...record,
    orders: record.orders ?? [],
    orderOptions: record.orderOptions ?? [],
    features: record.features ?? [],
    choices: Array.isArray(record.choices)
      ? record.choices.map(normalizeLoadedChoice)
      : [],
    repeatable: record.repeatable ?? false,
  };
}

/**
 * Проверяет, что в строке есть непустой текст.
 *
 * @param value - Строка из формы
 * @returns `true`, если после обрезки пробелов что-то осталось
 */
function hasText(value: string | undefined): boolean {
  return !!value && value.trim().length > 0;
}

/**
 * Готовит форму к отправке: выбрасывает пустые строки списков, снимает
 * расширение без пространства, а у базового сооружения — уровень, требование
 * и приказы. Бэкенд перезаписывает блоки целиком, поэтому пустая строка в
 * форме иначе стала бы пустой записью в справочнике и в мини-игре.
 *
 * @param state - Состояние формы
 * @returns Тело запроса
 */
export function transformBastionBeforeSubmit(
  state: BastionFacilityCreate,
): BastionFacilityCreate {
  const isBasic = state.category === 'BASIC';

  return {
    ...state,
    level: isBasic ? undefined : state.level,
    prerequisite: isBasic ? undefined : state.prerequisite,
    orders: isBasic ? [] : state.orders,
    orderOptions: isBasic
      ? []
      : state.orderOptions.filter(
          (option) => option.order && state.orders.includes(option.order),
        ),
    features: state.features.filter(
      (feature) => hasText(feature.name) || hasText(feature.description),
    ),
    choices: state.choices
      .filter((choice) => hasText(choice.name))
      .map((choice) => ({
        ...choice,
        options: choice.options.filter((option) => hasText(option.name)),
      })),
    enlargement: state.enlargement?.space ? state.enlargement : null,
  };
}

/**
 * Пустое расширение для включения блока в форме.
 *
 * @returns Новый объект расширения
 */
export function createEnlargement(): FacilityEnlargementForm {
  return { ...EMPTY_ENLARGEMENT };
}
