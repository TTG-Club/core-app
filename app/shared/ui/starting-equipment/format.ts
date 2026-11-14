import type {
  StartingEquipmentItemResponse,
  StartingEquipmentOptionResponse,
} from './types';

import {
  STARTING_EQUIPMENT_DEFAULT_MARKER,
  STARTING_EQUIPMENT_FIRST_LABEL,
  STARTING_EQUIPMENT_MARKER_BY_SECTION,
  STARTING_EQUIPMENT_TEXT,
} from './constants';

/** Вариант, готовый к выводу: буква и содержимое разметкой. */
interface StartingEquipmentOptionView {
  label: string;
  content: string;
}

/**
 * Дописывает к подписи пояснения в скобках: «Болт (20)».
 *
 * @param caption подпись позиции.
 * @param details пояснения; пустые пропускаются.
 * @returns подпись с пояснениями либо подпись как есть.
 */
function withDetails(caption: string, details: Array<string>): string {
  const filledDetails = details.filter(Boolean);

  return filledDetails.length
    ? `${caption} (${filledDetails.join(STARTING_EQUIPMENT_TEXT.itemSeparator)})`
    : caption;
}

/**
 * Позиция варианта строкой разметки: ссылка на карточку и в скобках
 * количество и уточнение — «{@item Болт|url:bolt-phb} (20)». Позиция без
 * карточки — само уточнение («музыкальный инструмент»).
 *
 * @param equipmentItem позиция варианта.
 * @returns разметка позиции; пусто — у позиции нет ни названия, ни уточнения.
 */
function toItemNode(equipmentItem: StartingEquipmentItemResponse): string {
  const name = equipmentItem.name?.trim() ?? '';

  const description = equipmentItem.description?.trim() ?? '';

  const quantity =
    equipmentItem.quantity && equipmentItem.quantity > 1
      ? String(equipmentItem.quantity)
      : '';

  if (!equipmentItem.url) {
    return name
      ? withDetails(name, [quantity, description])
      : withDetails(description, [quantity]);
  }

  const marker =
    STARTING_EQUIPMENT_MARKER_BY_SECTION[equipmentItem.section ?? '']
    ?? STARTING_EQUIPMENT_DEFAULT_MARKER;

  // Ссылку без названия видно адресом — так заметно, что карточку удалили.
  const link = `{@${marker} ${name || equipmentItem.url}|url:${equipmentItem.url}}`;

  return withDetails(link, [quantity, description]);
}

/**
 * Содержимое варианта: позиции и монеты через запятую.
 *
 * @param option вариант стартового снаряжения.
 * @returns разметка содержимого; пусто — вариант ничего не даёт.
 */
function toOptionContent(option: StartingEquipmentOptionResponse): string {
  const parts = (option.items ?? []).map(toItemNode).filter(Boolean);

  if (option.coins && option.coins > 0) {
    parts.push([option.coins, option.coin].filter(Boolean).join(' '));
  }

  return parts.join(STARTING_EQUIPMENT_TEXT.itemSeparator);
}

/**
 * Буква варианта: присланная бэком либо следующая по алфавиту.
 *
 * @param option вариант стартового снаряжения.
 * @param index порядковый номер варианта.
 * @returns буква варианта.
 */
function getOptionLabel(
  option: StartingEquipmentOptionResponse,
  index: number,
): string {
  return (
    option.label?.trim()
    || String.fromCharCode(STARTING_EQUIPMENT_FIRST_LABEL.charCodeAt(0) + index)
  );
}

/**
 * Перечисление с «или» перед последним: «А или Б», «А, Б или В».
 *
 * @param labels буквы вариантов, не меньше двух.
 * @returns перечисление.
 */
function joinWithOr(labels: Array<string>): string {
  const leading = labels
    .slice(0, -1)
    .join(STARTING_EQUIPMENT_TEXT.itemSeparator);

  return `${leading} ${STARTING_EQUIPMENT_TEXT.or} ${labels.at(-1)}`;
}

/**
 * Вариант в строке выбора: «(А) …», перед последним — «или (Б) …».
 *
 * @param optionView вариант с буквой и содержимым.
 * @param isLast последний ли это вариант.
 * @returns разметка варианта.
 */
function toChoiceVariant(
  optionView: StartingEquipmentOptionView,
  isLast: boolean,
): string {
  const variant = `(${optionView.label}) ${optionView.content}`;

  return isLast ? `${STARTING_EQUIPMENT_TEXT.or} ${variant}` : variant;
}

/**
 * Стартовое снаряжение класса или предыстории строкой разметки, как в книге:
 * «Выберите А или Б: (А) Копьё, Лёгкий арбалет, …, 12 зм; или (Б) 50 зм».
 * Единственный вариант перечисляется без выбора, пустые варианты пропускаются.
 *
 * @param options варианты снаряжения из ответа детали.
 * @returns разметка строки; пусто — вариантов нет.
 */
export function getStartingEquipmentNode(
  options: Array<StartingEquipmentOptionResponse> | null | undefined,
): string {
  const optionViews: Array<StartingEquipmentOptionView> = (options ?? [])
    .map((option, index) => ({
      label: getOptionLabel(option, index),
      content: toOptionContent(option),
    }))
    .filter((optionView) => optionView.content);

  if (optionViews.length < 2) {
    return optionViews[0]?.content ?? '';
  }

  const labels = joinWithOr(optionViews.map(({ label }) => label));

  const variants = optionViews.map((optionView, index) =>
    toChoiceVariant(optionView, index === optionViews.length - 1),
  );

  return `${STARTING_EQUIPMENT_TEXT.choosePrefix} ${labels}: ${variants.join(STARTING_EQUIPMENT_TEXT.optionSeparator)}`;
}
