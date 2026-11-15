import type { Color, PDFFont, PDFPage } from 'pdf-lib';

import type { CharacterFeature } from '../types';
import type { PdfBuildContext, PdfRect, PdfSlot, PdfTextAlign } from './types';

import { PDF_ELLIPSIS, PDF_PAGE_HEIGHT } from './constants';
import { drawRule, drawTextLine, truncateText, wrapPlainText } from './layout';
import { toPdfPlainText } from './markup-text';
import {
  PHB_CHAMFER,
  PHB_COLORS,
  PHB_DIAMOND_SIZE,
  PHB_DIGIT_HEIGHT_RATIO,
  PHB_FEATURE_MAX_LINES,
  PHB_FONT_SIZES,
  PHB_GAP,
  PHB_LABELS,
  PHB_PADDING,
} from './phb-constants';

/** Параметры рамки листа PHB. */
interface PhbFrameOptions {
  /** Заливка; по умолчанию — светлая заливка рамок. */
  fill?: Color;

  /** Срез углов; 0 — прямоугольник. */
  chamfer?: number;
}

/** Параметры заголовка рамки. */
export interface PhbTitleOptions extends PdfSlot {
  /** Заголовок; массив — заранее разбитые строки. */
  title: string | string[];

  /** Кегль заголовка. */
  size?: number;
}

/** Параметры поля «значение над линией, подпись под ней». */
export interface PhbFieldOptions extends PdfSlot {
  label: string;
  value: string;
  valueSize?: number;
  valueFont?: PDFFont;
  align?: PdfTextAlign;
}

/** Параметры абзаца с переносом и пределом высоты. */
export interface PhbParagraphOptions extends PdfSlot {
  text: string;
  maxHeight: number;
  font: PDFFont;
  size: number;
  lineHeight: number;
  color?: Color;
}

/**
 * Верх строки, при котором цифры встают по центру заданной линии. `drawTextLine`
 * отсчитывает строку от верхнего выносного элемента, а у цифр его нет — без
 * поправки число в круге или поле съезжает вниз.
 *
 * @param font шрифт числа.
 * @param size кегль числа.
 * @param centerTop вертикальный центр места под число.
 * @returns координата верха строки для `drawTextLine`.
 */
export function getPhbCenteredTop(
  font: PDFFont,
  size: number,
  centerTop: number,
): number {
  const ascent = font.heightAtSize(size, { descender: false });

  return centerTop + (size * PHB_DIGIT_HEIGHT_RATIO) / 2 - ascent;
}

/**
 * Высота строки абзаца по кеглю: общий множитель для всех мелких текстов листа.
 *
 * @param size кегль.
 * @returns межстрочное расстояние.
 */
export function getPhbLineHeight(size: number): number {
  return size * 1.22;
}

/**
 * Контур многоугольника со срезанными углами в координатах SVG-пути
 * (отсчёт от левого верхнего угла, ось Y вниз).
 *
 * @param width ширина.
 * @param height высота.
 * @param chamfer срез углов.
 * @returns строка SVG-пути.
 */
function getChamferPath(
  width: number,
  height: number,
  chamfer: number,
): string {
  const cut = Math.min(chamfer, width / 2, height / 2);

  return [
    `M ${cut} 0`,
    `L ${width - cut} 0`,
    `L ${width} ${cut}`,
    `L ${width} ${height - cut}`,
    `L ${width - cut} ${height}`,
    `L ${cut} ${height}`,
    `L 0 ${height - cut}`,
    `L 0 ${cut}`,
    'Z',
  ].join(' ');
}

/**
 * Рамка листа PHB: скошенные углы и двойной контур — толстый снаружи и тонкий
 * внутри, как у печатного листа.
 *
 * @param page страница.
 * @param rect геометрия рамки.
 * @param options заливка и срез углов.
 */
export function drawPhbFrame(
  page: PDFPage,
  rect: PdfRect,
  options: PhbFrameOptions = {},
): void {
  const chamfer = options.chamfer ?? PHB_CHAMFER;

  page.drawSvgPath(getChamferPath(rect.width, rect.height, chamfer), {
    x: rect.left,
    y: PDF_PAGE_HEIGHT - rect.top,
    color: options.fill ?? PHB_COLORS.fill,
    borderColor: PHB_COLORS.frame,
    borderWidth: 1.1,
  });

  const inset = 2;

  page.drawSvgPath(
    getChamferPath(
      rect.width - inset * 2,
      rect.height - inset * 2,
      Math.max(0, chamfer - 1),
    ),
    {
      x: rect.left + inset,
      y: PDF_PAGE_HEIGHT - rect.top - inset,
      borderColor: PHB_COLORS.line,
      borderWidth: 0.35,
    },
  );
}

/**
 * Поле значения: белый прямоугольник с рамкой (значение характеристики, КД).
 *
 * @param page страница.
 * @param rect геометрия поля.
 */
export function drawPhbValueField(page: PDFPage, rect: PdfRect): void {
  page.drawSvgPath(getChamferPath(rect.width, rect.height, 2), {
    x: rect.left,
    y: PDF_PAGE_HEIGHT - rect.top,
    color: PHB_COLORS.field,
    borderColor: PHB_COLORS.frame,
    borderWidth: 0.7,
  });
}

/**
 * Заголовок рамки: строки акцидентным шрифтом по центру и черта под ними.
 * Не влезающий в ширину заголовок переносится по словам.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param options геометрия и текст заголовка.
 * @returns высота заголовка вместе с чертой.
 */
export function drawPhbTitle(
  context: PdfBuildContext,
  page: PDFPage,
  options: PhbTitleOptions,
): number {
  const size = options.size ?? PHB_FONT_SIZES.title;
  const innerWidth = options.width - PHB_PADDING * 2;
  const font = context.fonts.display;

  const lines = Array.isArray(options.title)
    ? options.title
    : wrapPlainText(options.title, font, size, innerWidth);

  const lineHeight = size + 1.5;

  for (const [index, line] of lines.entries()) {
    drawTextLine(page, {
      text: line,
      left: options.left + PHB_PADDING,
      top: options.top + lineHeight * index,
      font,
      size,
      maxWidth: innerWidth,
      align: 'center',
    });
  }

  const ruleTop = options.top + lineHeight * lines.length + 1;

  drawRule(page, {
    left: options.left + PHB_PADDING,
    top: ruleTop,
    width: innerWidth,
    color: PHB_COLORS.ink,
    thickness: 0.8,
  });

  return ruleTop - options.top + 3;
}

/**
 * Мелкая подпись поля.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param options геометрия, текст и выравнивание.
 * @param options.text текст подписи.
 * @param options.align выравнивание внутри ширины.
 */
export function drawPhbLabel(
  context: PdfBuildContext,
  page: PDFPage,
  options: PdfSlot & { text: string; align?: PdfTextAlign },
): void {
  drawTextLine(page, {
    text: options.text,
    left: options.left,
    top: options.top,
    font: context.fonts.regular,
    size: PHB_FONT_SIZES.label,
    color: PHB_COLORS.label,
    maxWidth: options.width,
    align: options.align ?? 'left',
  });
}

/**
 * Поле «значение над линией, подпись под линией» — так на листе записаны имя,
 * класс, опыт и прочие строковые поля.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param options геометрия, подпись и значение.
 * @returns занятая высота.
 */
export function drawPhbField(
  context: PdfBuildContext,
  page: PDFPage,
  options: PhbFieldOptions,
): number {
  const valueSize = options.valueSize ?? PHB_FONT_SIZES.value;

  drawTextLine(page, {
    text: options.value,
    left: options.left + 1,
    top: options.top,
    font: options.valueFont ?? context.fonts.bold,
    size: valueSize,
    color: PHB_COLORS.ink,
    maxWidth: options.width - 2,
    align: options.align ?? 'left',
  });

  const lineTop = options.top + valueSize + 3;

  drawRule(page, {
    left: options.left,
    top: lineTop,
    width: options.width,
    color: PHB_COLORS.line,
    thickness: 0.5,
  });

  drawPhbLabel(context, page, {
    text: options.label,
    left: options.left,
    top: lineTop + 1.5,
    width: options.width,
    align: options.align,
  });

  return lineTop + 1.5 + PHB_FONT_SIZES.label - options.top;
}

/**
 * Ромбик отметки (вдохновение, спасброски от смерти, ячейки, доспехи).
 *
 * @param page страница.
 * @param centerLeft центр по горизонтали.
 * @param centerTop центр по вертикали от верха страницы.
 * @param filled закрашен ли ромбик.
 * @param size половина диагонали.
 */
export function drawPhbDiamond(
  page: PDFPage,
  centerLeft: number,
  centerTop: number,
  filled: boolean,
  size = PHB_DIAMOND_SIZE,
): void {
  page.drawSvgPath(`M 0 ${-size} L ${size} 0 L 0 ${size} L ${-size} 0 Z`, {
    x: centerLeft,
    y: PDF_PAGE_HEIGHT - centerTop,
    color: filled ? PHB_COLORS.ink : PHB_COLORS.field,
    borderColor: PHB_COLORS.ink,
    borderWidth: 0.7,
  });
}

/**
 * Щит класса доспеха: прямой верх, борта и сходящийся к острию низ.
 *
 * @param page страница.
 * @param rect геометрия щита.
 */
export function drawPhbShield(page: PDFPage, rect: PdfRect): void {
  const { width, height } = rect;

  page.drawSvgPath(
    [
      `M 0 0`,
      `L ${width} 0`,
      `L ${width} ${height * 0.5}`,
      `Q ${width} ${height * 0.82} ${width / 2} ${height}`,
      `Q 0 ${height * 0.82} 0 ${height * 0.5}`,
      'Z',
    ].join(' '),
    {
      x: rect.left,
      y: PDF_PAGE_HEIGHT - rect.top,
      color: PHB_COLORS.fill,
      borderColor: PHB_COLORS.frame,
      borderWidth: 1.1,
    },
  );
}

/**
 * Кружок с рамкой — круг уровня и модификатора характеристики.
 *
 * @param page страница.
 * @param centerLeft центр по горизонтали.
 * @param centerTop центр по вертикали от верха страницы.
 * @param radius радиус.
 */
export function drawPhbCircle(
  page: PDFPage,
  centerLeft: number,
  centerTop: number,
  radius: number,
): void {
  page.drawCircle({
    x: centerLeft,
    y: PDF_PAGE_HEIGHT - centerTop,
    size: radius,
    color: PHB_COLORS.field,
    borderColor: PHB_COLORS.frame,
    borderWidth: 1.1,
  });
}

/**
 * Абзац с переносом по словам в пределах высоты: не влезшая часть обрезается
 * многоточием в последней строке.
 *
 * @param page страница.
 * @param options геометрия, текст и шрифт.
 * @returns занятая высота.
 */
export function drawPhbParagraph(
  page: PDFPage,
  options: PhbParagraphOptions,
): number {
  const maxLines = Math.max(
    0,
    Math.floor((options.maxHeight + 0.01) / options.lineHeight),
  );

  if (!options.text || !maxLines) {
    return 0;
  }

  const lines = wrapPlainText(
    options.text,
    options.font,
    options.size,
    options.width,
  );

  const visible = lines.slice(0, maxLines);

  if (lines.length > maxLines && visible.length) {
    const lastIndex = visible.length - 1;

    visible[lastIndex] = truncateText(
      `${visible[lastIndex]}${PDF_ELLIPSIS}`,
      options.font,
      options.size,
      options.width,
    );
  }

  for (const [index, line] of visible.entries()) {
    drawTextLine(page, {
      text: line,
      left: options.left,
      top: options.top + options.lineHeight * index,
      font: options.font,
      size: options.size,
      color: options.color ?? PHB_COLORS.ink,
      maxWidth: options.width,
    });
  }

  return visible.length * options.lineHeight;
}

/**
 * Сводит описание умения в одну строку прозы: на листе описания идут сплошным
 * текстом, абзацы и списки там только съели бы место.
 *
 * @param feature умение.
 * @returns описание одной строкой.
 */
function getFeatureSummary(feature: CharacterFeature): string {
  return toPdfPlainText(feature.description).replace(/\s+/g, ' ').trim();
}

/**
 * Заголовок умения: название, выбор игрока и уровень получения.
 *
 * @param feature умение.
 * @returns заголовок строки.
 */
function getFeatureHeading(feature: CharacterFeature): string {
  const choice = feature.choice ? ` (${feature.choice})` : '';

  return `${feature.name}${choice}`;
}

/**
 * Умения в колонках: жирное название и сокращённое описание. Когда место
 * кончается, вместо оставшихся умений ставится отсылка к справочнику — там они
 * напечатаны полностью.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param features умения по порядку.
 * @param area область содержимого.
 * @param columns число колонок.
 */
export function drawPhbFeatureColumns(
  context: PdfBuildContext,
  page: PDFPage,
  features: CharacterFeature[],
  area: PdfRect,
  columns: number,
): void {
  const columnGap = PHB_GAP * 2;
  const columnWidth = (area.width - columnGap * (columns - 1)) / columns;
  const nameSize = PHB_FONT_SIZES.value;
  const nameLineHeight = getPhbLineHeight(nameSize);
  const bodySize = PHB_FONT_SIZES.body;
  const bodyLineHeight = getPhbLineHeight(bodySize);
  const bottom = area.top + area.height;
  const hintHeight = bodyLineHeight + 2;

  let column = 0;
  let cursor = area.top;

  for (const [index, feature] of features.entries()) {
    const isLast = index === features.length - 1;

    const nameLines = wrapPlainText(
      getFeatureHeading(feature),
      context.fonts.bold,
      nameSize,
      columnWidth,
    ).slice(0, 2);

    const summary = getFeatureSummary(feature);

    const bodyLines = summary
      ? Math.min(
          PHB_FEATURE_MAX_LINES,
          wrapPlainText(summary, context.fonts.regular, bodySize, columnWidth)
            .length,
        )
      : 0;

    const height =
      nameLines.length * nameLineHeight + bodyLines * bodyLineHeight + 3;

    // В последней колонке держим место под отсылку, пока умения не кончились.
    const getReserve = (): number =>
      column === columns - 1 && !isLast ? hintHeight : 0;

    // Не влезло — переходим в следующую колонку. Переход только из непустой
    // колонки: так цикл не крутится на умении выше целой колонки.
    if (
      cursor + height > bottom - getReserve()
      && column < columns - 1
      && cursor > area.top
    ) {
      column += 1;
      cursor = area.top;
    }

    if (cursor + height > bottom - getReserve()) {
      drawTextLine(page, {
        text: `${PHB_LABELS.moreFeatures} ${features.length - index} — ${PHB_LABELS.referenceHint}`,
        left: area.left + (columnWidth + columnGap) * column,
        top: Math.min(cursor, bottom - hintHeight) + 1,
        font: context.fonts.italic,
        size: bodySize,
        color: PHB_COLORS.label,
        maxWidth: columnWidth,
      });

      return;
    }

    cursor += drawFeatureEntry(context, page, {
      left: area.left + (columnWidth + columnGap) * column,
      top: cursor,
      width: columnWidth,
      nameLines,
      summary,
      bodyLines,
    });
  }
}

/**
 * Одно умение в колонке: строки названия и обрезанное описание.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param options геометрия и заранее разбитый текст.
 * @param options.nameLines строки названия.
 * @param options.summary описание одной строкой.
 * @param options.bodyLines сколько строк описания печатать.
 * @returns занятая высота.
 */
function drawFeatureEntry(
  context: PdfBuildContext,
  page: PDFPage,
  options: PdfSlot & {
    nameLines: string[];
    summary: string;
    bodyLines: number;
  },
): number {
  const nameSize = PHB_FONT_SIZES.value;
  const nameLineHeight = getPhbLineHeight(nameSize);
  const bodySize = PHB_FONT_SIZES.body;
  const bodyLineHeight = getPhbLineHeight(bodySize);

  for (const [index, line] of options.nameLines.entries()) {
    drawTextLine(page, {
      text: line,
      left: options.left,
      top: options.top + nameLineHeight * index,
      font: context.fonts.bold,
      size: nameSize,
      maxWidth: options.width,
    });
  }

  const nameHeight = options.nameLines.length * nameLineHeight;

  const bodyHeight = drawPhbParagraph(page, {
    text: options.summary,
    left: options.left,
    top: options.top + nameHeight,
    width: options.width,
    maxHeight: options.bodyLines * bodyLineHeight,
    font: context.fonts.regular,
    size: bodySize,
    lineHeight: bodyLineHeight,
  });

  return nameHeight + bodyHeight + 3;
}
