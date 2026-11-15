import type { PDFPage } from 'pdf-lib';

import type {
  AbilityKey,
  Character,
  CharacterFeature,
  CharacterInventoryItem,
  SkillProficiencyLevel,
} from '../types';
import type { PdfBuildContext, PdfMarkFill, PdfRect, PdfSlot } from './types';

import {
  ARMOR_PROFICIENCY_GROUPS,
  PASSIVE_SKILL_BASE,
  SHEET_EMPTY_LABELS,
  WEAPON_PROFICIENCY_GROUPS,
} from '../constants';
import { isMissingInventoryItem } from '../effect-engine';
import {
  collapseProficiencies,
  getAbilityModifier,
  getAbilityRows,
  getArmorClassBreakdown,
  getCharacterClasses,
  getCharacterProficiencyBonus,
  getClassesDisplayLabel,
  getEffectiveSpeed,
  getHitDicePools,
  getInitiativeBonus,
  getMaxHitPoints,
  getPrimarySpeed,
  getSavingThrowRows,
  getSkillValue,
  getSpeciesDisplayName,
  getToolNames,
  getWeaponAttackBonus,
  getWeaponDamage,
  isProficientWeapon,
} from '../utils';
import { PDF_EMPTY_VALUE, PDF_PERCEPTION_SKILL_NAME } from './constants';
import {
  createPdfPage,
  drawMark,
  drawRule,
  drawTextLine,
  drawVerticalRule,
} from './layout';
import {
  PHB_ABILITY_COLUMN_WIDTH,
  PHB_ABILITY_COLUMNS,
  PHB_ABILITY_HEAD_HEIGHT,
  PHB_ARMOR_TRAINING_LABELS,
  PHB_BANNER_HEIGHT,
  PHB_BOTTOM,
  PHB_BOTTOM_BOX_HEIGHT,
  PHB_COLORS,
  PHB_CONTENT_WIDTH,
  PHB_FONT_SIZES,
  PHB_GAP,
  PHB_HEADER_HEIGHT,
  PHB_HEADER_WIDTHS,
  PHB_INSPIRATION_BOX_HEIGHT,
  PHB_LABELS,
  PHB_MARGIN,
  PHB_MODIFIER_RADIUS,
  PHB_PADDING,
  PHB_PROFICIENCY_BOX_HEIGHT,
  PHB_RIGHT,
  PHB_ROW_HEIGHT,
  PHB_TABLE_ROW_HEIGHT,
  PHB_TILE_HEIGHT,
  PHB_TITLES,
  PHB_WEAPON_COLUMN_RATIOS,
  PHB_WEAPON_COLUMNS,
  PHB_WEAPON_NOTES,
  PHB_WEAPON_ROWS,
} from './phb-constants';
import {
  drawPhbCircle,
  drawPhbDiamond,
  drawPhbFeatureColumns,
  drawPhbField,
  drawPhbFrame,
  drawPhbLabel,
  drawPhbParagraph,
  drawPhbShield,
  drawPhbTitle,
  drawPhbValueField,
  getPhbCenteredTop,
  getPhbLineHeight,
} from './phb-layout';

/** Плитка верхнего ряда правой части: подпись, значение и приписка. */
interface PhbTile {
  title: string;
  value: string;
  note?: string;
}

/** Вид кружка владения по уровню владения навыком. */
const SKILL_MARK_FILL: Record<SkillProficiencyLevel, PdfMarkFill> = {
  none: 'none',
  half: 'half',
  proficient: 'full',
  expertise: 'full',
};

/** Ширина левой части страницы — двух колонок характеристик. */
const ABILITY_AREA_WIDTH = PHB_ABILITY_COLUMN_WIDTH * 2 + PHB_GAP;

/** Левая граница правой части страницы. */
const RIGHT_AREA_LEFT = PHB_MARGIN + ABILITY_AREA_WIDTH + PHB_GAP;

/** Ширина правой части страницы. */
const RIGHT_AREA_WIDTH = PHB_RIGHT - RIGHT_AREA_LEFT;

/**
 * Рамка имени и происхождения: имя, предыстория с классом и вид с подклассом.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param character персонаж.
 * @param rect геометрия рамки.
 */
function drawIdentityBox(
  context: PdfBuildContext,
  page: PDFPage,
  character: Character,
  rect: PdfRect,
): void {
  drawPhbFrame(page, rect);

  const left = rect.left + PHB_PADDING + 2;
  const width = rect.width - PHB_PADDING * 2 - 4;
  const halfWidth = (width - PHB_GAP * 2) / 2;

  drawPhbField(context, page, {
    left,
    top: rect.top + 6,
    width,
    label: PHB_LABELS.name,
    value: character.name,
    valueSize: PHB_FONT_SIZES.name,
    valueFont: context.fonts.display,
  });

  const subclasses = getCharacterClasses(character)
    .map((characterClass) => characterClass.subclassName)
    .filter((name): name is string => Boolean(name))
    .join(', ');

  const rows = [
    [
      {
        label: PHB_LABELS.background,
        value:
          character.characterBackground?.name ?? SHEET_EMPTY_LABELS.background,
      },
      {
        label: PHB_LABELS.className,
        value: character.characterClass
          ? getClassesDisplayLabel(character)
          : SHEET_EMPTY_LABELS.className,
      },
    ],
    [
      {
        label: PHB_LABELS.species,
        value: character.species
          ? getSpeciesDisplayName(character.species)
          : SHEET_EMPTY_LABELS.species,
      },
      { label: PHB_LABELS.subclass, value: subclasses },
    ],
  ];

  for (const [rowIndex, row] of rows.entries()) {
    for (const [columnIndex, field] of row.entries()) {
      drawPhbField(context, page, {
        left: left + (halfWidth + PHB_GAP * 2) * columnIndex,
        top: rect.top + 35 + rowIndex * 23,
        width: halfWidth,
        label: field.label,
        value: field.value,
      });
    }
  }
}

/**
 * Рамка уровня: число в круге и опыт под ним.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param character персонаж.
 * @param rect геометрия рамки.
 */
function drawLevelBox(
  context: PdfBuildContext,
  page: PDFPage,
  character: Character,
  rect: PdfRect,
): void {
  drawPhbFrame(page, rect);

  const centerLeft = rect.left + rect.width / 2;
  const centerTop = rect.top + 26;
  const radius = 19;

  drawPhbCircle(page, centerLeft, centerTop, radius);

  drawTextLine(page, {
    text: String(character.level),
    left: centerLeft - radius,
    // Круг уровня делит место с подписью под числом — центр чуть выше.
    top: getPhbCenteredTop(
      context.fonts.bold,
      PHB_FONT_SIZES.big,
      centerTop - 2,
    ),
    font: context.fonts.bold,
    size: PHB_FONT_SIZES.big,
    maxWidth: radius * 2,
    align: 'center',
  });

  drawPhbLabel(context, page, {
    text: PHB_LABELS.level,
    left: centerLeft - radius,
    top: centerTop + 7,
    width: radius * 2,
    align: 'center',
  });

  drawPhbField(context, page, {
    left: rect.left + PHB_PADDING,
    top: rect.top + 52,
    width: rect.width - PHB_PADDING * 2,
    label: PHB_LABELS.experience,
    value: `${character.experience.current} / ${character.experience.nextLevel}`,
    valueSize: PHB_FONT_SIZES.value - 0.5,
    align: 'center',
  });
}

/**
 * Щит класса доспеха и отметка щита под ним.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param character персонаж.
 * @param rect геометрия рамки.
 */
function drawArmorClassBox(
  context: PdfBuildContext,
  page: PDFPage,
  character: Character,
  rect: PdfRect,
): void {
  const breakdown = getArmorClassBreakdown(character);
  const shieldHeight = rect.height - 14;

  drawPhbShield(page, {
    left: rect.left + 2,
    top: rect.top,
    width: rect.width - 4,
    height: shieldHeight,
  });

  for (const [index, line] of PHB_TITLES.armorClass.entries()) {
    drawTextLine(page, {
      text: line,
      left: rect.left,
      top: rect.top + 5 + index * 8,
      font: context.fonts.display,
      size: 6.5,
      maxWidth: rect.width,
      align: 'center',
    });
  }

  drawTextLine(page, {
    text: String(breakdown.value),
    left: rect.left,
    top: rect.top + 26,
    font: context.fonts.bold,
    size: PHB_FONT_SIZES.big + 3,
    maxWidth: rect.width,
    align: 'center',
  });

  const shieldTop = rect.top + shieldHeight + 4;
  const labelWidth = 22;
  const groupLeft = rect.left + (rect.width - labelWidth - 10) / 2;

  drawPhbLabel(context, page, {
    text: PHB_LABELS.shield,
    left: groupLeft,
    top: shieldTop,
    width: labelWidth,
    align: 'right',
  });

  drawPhbDiamond(
    page,
    groupLeft + labelWidth + 6,
    shieldTop + PHB_FONT_SIZES.label / 2 + 0.5,
    breakdown.shieldBonus > 0,
  );
}

/**
 * Рамка хитов: текущие крупно слева, временные и максимум справа.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param character персонаж.
 * @param rect геометрия рамки.
 */
function drawHitPointsBox(
  context: PdfBuildContext,
  page: PDFPage,
  character: Character,
  rect: PdfRect,
): void {
  drawPhbFrame(page, rect);

  const titleHeight = drawPhbTitle(context, page, {
    left: rect.left,
    top: rect.top + 4,
    width: rect.width,
    title: PHB_TITLES.hitPoints,
  });

  const contentTop = rect.top + 4 + titleHeight;
  const contentLeft = rect.left + PHB_PADDING + 1;
  const contentWidth = rect.width - PHB_PADDING * 2 - 2;
  const currentWidth = contentWidth * 0.46;

  drawTextLine(page, {
    text: String(character.health.current),
    left: contentLeft,
    top: contentTop + 14,
    font: context.fonts.bold,
    size: PHB_FONT_SIZES.big + 3,
    maxWidth: currentWidth,
    align: 'center',
  });

  drawPhbLabel(context, page, {
    text: PHB_LABELS.currentHits,
    left: contentLeft,
    top: rect.top + rect.height - 11,
    width: currentWidth,
    align: 'center',
  });

  const sideLeft = contentLeft + currentWidth + PHB_GAP;
  const sideWidth = contentWidth - currentWidth - PHB_GAP;

  drawVerticalRule(page, {
    left: sideLeft - PHB_GAP / 2,
    top: contentTop,
    height: rect.top + rect.height - 6 - contentTop,
    color: PHB_COLORS.line,
  });

  drawPhbField(context, page, {
    left: sideLeft,
    top: contentTop + 4,
    width: sideWidth,
    label: PHB_LABELS.temporaryHits,
    value: String(character.health.temporary || ''),
    valueSize: PHB_FONT_SIZES.medium - 1,
    align: 'center',
  });

  drawPhbField(context, page, {
    left: sideLeft,
    top: contentTop + 30,
    width: sideWidth,
    label: PHB_LABELS.maxHits,
    value: String(getMaxHitPoints(character)),
    valueSize: PHB_FONT_SIZES.medium - 1,
    align: 'center',
  });
}

/**
 * Рамка костей хитов: потрачено и всего по номиналам.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param character персонаж.
 * @param rect геометрия рамки.
 */
function drawHitDiceBox(
  context: PdfBuildContext,
  page: PDFPage,
  character: Character,
  rect: PdfRect,
): void {
  drawPhbFrame(page, rect);

  const titleHeight = drawPhbTitle(context, page, {
    left: rect.left,
    top: rect.top + 4,
    width: rect.width,
    title: PHB_TITLES.hitDice,
    size: 6.5,
  });

  const pools = getHitDicePools(character.hitDice, character.extraHitDice);

  const spent = pools.reduce(
    (total, pool) => total + pool.max - pool.current,
    0,
  );

  const left = rect.left + PHB_PADDING;
  const width = rect.width - PHB_PADDING * 2;
  const contentTop = rect.top + 4 + titleHeight;

  drawPhbField(context, page, {
    left,
    top: contentTop + 4,
    width,
    label: PHB_LABELS.spentHitDice,
    value: String(spent),
    align: 'center',
  });

  drawPhbField(context, page, {
    left,
    top: contentTop + 30,
    width,
    label: PHB_LABELS.maxHitDice,
    value:
      pools.map((pool) => `${pool.max}${pool.label}`).join(' ')
      || PDF_EMPTY_VALUE,
    valueSize: PHB_FONT_SIZES.value - 0.5,
    align: 'center',
  });
}

/**
 * Рамка спасбросков от смерти: по три пустых ромбика на успехи и провалы.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param rect геометрия рамки.
 */
function drawDeathSavesBox(
  context: PdfBuildContext,
  page: PDFPage,
  rect: PdfRect,
): void {
  drawPhbFrame(page, rect);

  const titleHeight = drawPhbTitle(context, page, {
    left: rect.left,
    top: rect.top + 4,
    width: rect.width,
    title: PHB_TITLES.deathSaves,
    size: 6,
  });

  const contentTop = rect.top + 4 + titleHeight;
  const rows = [PHB_LABELS.successes, PHB_LABELS.failures];

  for (const [index, label] of rows.entries()) {
    const rowTop = contentTop + 6 + index * 24;
    const diamondsWidth = 3 * 9;
    const diamondsLeft = rect.left + (rect.width - diamondsWidth) / 2 + 4.5;

    for (let mark = 0; mark < 3; mark += 1) {
      drawPhbDiamond(page, diamondsLeft + mark * 9, rowTop + 3, false);
    }

    drawPhbLabel(context, page, {
      text: label,
      left: rect.left,
      top: rowTop + 9,
      width: rect.width,
      align: 'center',
    });
  }
}

/**
 * Шапка первой страницы: имя и происхождение, уровень, КД, хиты, кости хитов и
 * спасброски от смерти в один ряд.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param character персонаж.
 */
function drawHeader(
  context: PdfBuildContext,
  page: PDFPage,
  character: Character,
): void {
  const top = PHB_MARGIN;
  const height = PHB_HEADER_HEIGHT;

  let left = PHB_MARGIN;

  /**
   * Следующая рамка ряда: левый край набегает на ширину и зазор.
   *
   * @param width ширина рамки.
   * @returns геометрия рамки.
   */
  function takeRect(width: number): PdfRect {
    const rect = { left, top, width, height };

    left += width + PHB_GAP;

    return rect;
  }

  drawIdentityBox(context, page, character, takeRect(PHB_HEADER_WIDTHS.name));
  drawLevelBox(context, page, character, takeRect(PHB_HEADER_WIDTHS.level));

  drawArmorClassBox(
    context,
    page,
    character,
    takeRect(PHB_HEADER_WIDTHS.armorClass),
  );

  drawHitPointsBox(
    context,
    page,
    character,
    takeRect(PHB_HEADER_WIDTHS.hitPoints),
  );

  drawHitDiceBox(context, page, character, takeRect(PHB_HEADER_WIDTHS.hitDice));
  drawDeathSavesBox(context, page, takeRect(PHB_RIGHT - left));
}

/**
 * Полоса-заголовок листа под шапкой: название с линиями по сторонам.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param top верх полосы.
 */
function drawBanner(
  context: PdfBuildContext,
  page: PDFPage,
  top: number,
): void {
  const size = 9;
  const text = PHB_TITLES.banner.toUpperCase();
  const spacing = size * 0.18;

  const textWidth =
    context.fonts.display.widthOfTextAtSize(text, size)
    + spacing * (text.length - 1);

  const textLeft = PHB_MARGIN + (PHB_CONTENT_WIDTH - textWidth) / 2;
  const lineTop = top + PHB_BANNER_HEIGHT / 2;

  drawTextLine(page, {
    text,
    left: textLeft,
    top: lineTop - size / 2 - 1,
    font: context.fonts.display,
    size,
    letterSpacing: spacing,
  });

  for (const [lineLeft, lineWidth] of [
    [PHB_MARGIN, textLeft - PHB_MARGIN - 8],
    [textLeft + textWidth + 8, PHB_RIGHT - textLeft - textWidth - 8],
  ] as const) {
    drawRule(page, {
      left: lineLeft,
      top: lineTop,
      width: lineWidth,
      color: PHB_COLORS.frame,
      thickness: 0.9,
    });
  }
}

/**
 * Рамка с заголовком и одним крупным значением: бонус мастерства, плитки
 * правой части.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param tile подпись, значение и приписка.
 * @param rect геометрия рамки.
 */
function drawValueTile(
  context: PdfBuildContext,
  page: PDFPage,
  tile: PhbTile,
  rect: PdfRect,
): void {
  drawPhbFrame(page, rect);

  const titleHeight = drawPhbTitle(context, page, {
    left: rect.left,
    top: rect.top + 4,
    width: rect.width,
    title: tile.title,
    size: 7,
  });

  const contentTop = rect.top + 4 + titleHeight;
  const contentHeight = rect.top + rect.height - contentTop;
  const noteHeight = tile.note ? PHB_FONT_SIZES.label + 2 : 0;

  drawTextLine(page, {
    text: tile.value,
    left: rect.left,
    top:
      contentTop + (contentHeight - noteHeight - PHB_FONT_SIZES.medium) / 2 - 1,
    font: context.fonts.bold,
    size: PHB_FONT_SIZES.medium + 1,
    maxWidth: rect.width - PHB_PADDING,
    align: 'center',
  });

  if (tile.note) {
    drawPhbLabel(context, page, {
      text: tile.note,
      left: rect.left + PHB_PADDING,
      top: rect.top + rect.height - noteHeight - 3,
      width: rect.width - PHB_PADDING * 2,
      align: 'center',
    });
  }
}

/**
 * Строка спасброска или навыка: кружок владения, значение над чертой и
 * название.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param options геометрия и содержимое строки.
 * @param options.fill закраска кружка владения.
 * @param options.ring внешнее кольцо — компетентность.
 * @param options.value значение броска.
 * @param options.label название строки.
 * @param options.bold название полужирным (спасбросок).
 */
function drawCheckRow(
  context: PdfBuildContext,
  page: PDFPage,
  options: PdfSlot & {
    fill: PdfMarkFill;
    ring?: boolean;
    value: string;
    label: string;
    bold?: boolean;
  },
): void {
  const markLeft = options.left + 4;
  const valueLeft = markLeft + 6;
  const valueWidth = 15;
  const textTop = options.top + 2;

  drawMark(page, {
    centerLeft: markLeft,
    centerTop: options.top + PHB_ROW_HEIGHT / 2,
    fill: options.fill,
    ring: options.ring,
  });

  drawTextLine(page, {
    text: options.value,
    left: valueLeft,
    top: textTop,
    font: context.fonts.bold,
    size: PHB_FONT_SIZES.value - 0.5,
    maxWidth: valueWidth,
    align: 'center',
  });

  drawRule(page, {
    left: valueLeft,
    top: options.top + PHB_ROW_HEIGHT - 1.5,
    width: valueWidth,
    color: PHB_COLORS.line,
    thickness: 0.5,
  });

  drawTextLine(page, {
    text: options.label,
    left: valueLeft + valueWidth + 3,
    top: textTop,
    font: options.bold ? context.fonts.bold : context.fonts.regular,
    size: PHB_FONT_SIZES.value - 0.5,
    maxWidth: options.left + options.width - valueLeft - valueWidth - 3,
  });
}

/**
 * Блок характеристики: название, модификатор в круге, значение в поле и под
 * чертой — спасбросок с навыками этой характеристики.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param character персонаж.
 * @param ability характеристика блока.
 * @param slot место под блок.
 * @returns высота блока.
 */
function drawAbilityBlock(
  context: PdfBuildContext,
  page: PDFPage,
  character: Character,
  ability: AbilityKey,
  slot: PdfSlot,
): number {
  const abilityRow = getAbilityRows(character).find(
    (row) => row.key === ability,
  );

  const savingThrowRow = getSavingThrowRows(character).find(
    (row) => row.key === ability,
  );

  const skills = character.skills.filter((skill) => skill.ability === ability);
  const rowCount = (savingThrowRow ? 1 : 0) + skills.length;

  const height =
    PHB_ABILITY_HEAD_HEIGHT + 4 + rowCount * PHB_ROW_HEIGHT + PHB_PADDING;

  drawPhbFrame(page, { ...slot, height });

  drawPhbTitle(context, page, {
    left: slot.left,
    top: slot.top + 4,
    width: slot.width,
    title: abilityRow?.label ?? '',
  });

  const circleLeft = slot.left + 30;
  const circleTop = slot.top + 32;

  drawPhbCircle(page, circleLeft, circleTop, PHB_MODIFIER_RADIUS);

  drawTextLine(page, {
    text: abilityRow?.formattedModifier ?? '',
    left: circleLeft - PHB_MODIFIER_RADIUS,
    top: getPhbCenteredTop(
      context.fonts.bold,
      PHB_FONT_SIZES.big - 1,
      circleTop,
    ),
    font: context.fonts.bold,
    size: PHB_FONT_SIZES.big - 1,
    maxWidth: PHB_MODIFIER_RADIUS * 2,
    align: 'center',
  });

  drawPhbLabel(context, page, {
    text: PHB_LABELS.modifier,
    left: circleLeft - 26,
    top: circleTop + PHB_MODIFIER_RADIUS + 1.5,
    width: 52,
    align: 'center',
  });

  const scoreRect = {
    left: slot.left + 62,
    top: slot.top + 23,
    width: slot.width - 62 - PHB_PADDING - 4,
    height: 18,
  };

  drawPhbValueField(page, scoreRect);

  drawTextLine(page, {
    text: abilityRow ? String(abilityRow.score) : '',
    left: scoreRect.left,
    top: getPhbCenteredTop(
      context.fonts.bold,
      PHB_FONT_SIZES.medium,
      scoreRect.top + scoreRect.height / 2,
    ),
    font: context.fonts.bold,
    size: PHB_FONT_SIZES.medium,
    maxWidth: scoreRect.width,
    align: 'center',
  });

  drawPhbLabel(context, page, {
    text: PHB_LABELS.score,
    left: scoreRect.left,
    top: scoreRect.top + scoreRect.height + 1.5,
    width: scoreRect.width,
    align: 'center',
  });

  const rowsLeft = slot.left + PHB_PADDING;
  const rowsWidth = slot.width - PHB_PADDING * 2;

  drawRule(page, {
    left: rowsLeft,
    top: slot.top + PHB_ABILITY_HEAD_HEIGHT,
    width: rowsWidth,
    color: PHB_COLORS.frame,
    thickness: 0.6,
  });

  let rowTop = slot.top + PHB_ABILITY_HEAD_HEIGHT + 3;

  if (savingThrowRow) {
    drawCheckRow(context, page, {
      left: rowsLeft,
      top: rowTop,
      width: rowsWidth,
      fill: savingThrowRow.proficient ? 'full' : 'none',
      value: savingThrowRow.formattedValue,
      label: PHB_LABELS.savingThrow,
      bold: true,
    });

    rowTop += PHB_ROW_HEIGHT;
  }

  for (const skill of skills) {
    drawCheckRow(context, page, {
      left: rowsLeft,
      top: rowTop,
      width: rowsWidth,
      fill: SKILL_MARK_FILL[skill.proficiency],
      ring: skill.proficiency === 'expertise',
      value: getFormattedBonus(getSkillValue(character, skill)),
      label: skill.name,
    });

    rowTop += PHB_ROW_HEIGHT;
  }

  return height;
}

/**
 * Рамка героического вдохновения: заголовок и ромб, закрашенный при наличии
 * вдохновения.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param character персонаж.
 * @param rect геометрия рамки.
 */
function drawInspirationBox(
  context: PdfBuildContext,
  page: PDFPage,
  character: Character,
  rect: PdfRect,
): void {
  drawPhbFrame(page, rect);

  const titleHeight = drawPhbTitle(context, page, {
    left: rect.left,
    top: rect.top + 4,
    width: rect.width,
    title: PHB_TITLES.inspiration,
    size: 7,
  });

  const contentTop = rect.top + 4 + titleHeight;

  drawPhbDiamond(
    page,
    rect.left + rect.width / 2,
    contentTop + (rect.top + rect.height - contentTop) / 2,
    character.inspiration,
    5,
  );
}

/**
 * Левая часть страницы: бонус мастерства, шесть характеристик в две колонки и
 * героическое вдохновение.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param character персонаж.
 * @param top верх колонок.
 * @returns нижняя граница самой длинной колонки.
 */
function drawAbilityColumns(
  context: PdfBuildContext,
  page: PDFPage,
  character: Character,
  top: number,
): number {
  let bottom = top;

  for (const [columnIndex, abilities] of PHB_ABILITY_COLUMNS.entries()) {
    const left =
      PHB_MARGIN + (PHB_ABILITY_COLUMN_WIDTH + PHB_GAP) * columnIndex;

    let cursor = top;

    if (columnIndex === 0) {
      drawValueTile(
        context,
        page,
        {
          title: PHB_TITLES.proficiencyBonus,
          value: getFormattedBonus(getCharacterProficiencyBonus(character)),
        },
        {
          left,
          top: cursor,
          width: PHB_ABILITY_COLUMN_WIDTH,
          height: PHB_PROFICIENCY_BOX_HEIGHT,
        },
      );

      cursor += PHB_PROFICIENCY_BOX_HEIGHT + PHB_GAP;
    }

    for (const ability of abilities) {
      cursor +=
        drawAbilityBlock(context, page, character, ability, {
          left,
          top: cursor,
          width: PHB_ABILITY_COLUMN_WIDTH,
        }) + PHB_GAP;
    }

    if (columnIndex === 0) {
      drawInspirationBox(context, page, character, {
        left,
        top: cursor,
        width: PHB_ABILITY_COLUMN_WIDTH,
        height: PHB_INSPIRATION_BOX_HEIGHT,
      });

      cursor += PHB_INSPIRATION_BOX_HEIGHT + PHB_GAP;
    }

    bottom = Math.max(bottom, cursor - PHB_GAP);
  }

  return bottom;
}

/**
 * Рамка владения снаряжением: флажки групп доспехов, оружие с мастерством и
 * инструменты. Не влезающее обрезается многоточием.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param character персонаж.
 * @param rect геометрия рамки.
 */
function drawEquipmentTrainingBox(
  context: PdfBuildContext,
  page: PDFPage,
  character: Character,
  rect: PdfRect,
): void {
  drawPhbFrame(page, rect);

  const titleHeight = drawPhbTitle(context, page, {
    left: rect.left,
    top: rect.top + 4,
    width: rect.width,
    title: PHB_TITLES.equipmentTraining,
  });

  const { proficiencies } = character;
  const left = rect.left + PHB_PADDING + 2;
  const width = rect.width - PHB_PADDING * 2 - 4;
  const bottom = rect.top + rect.height - PHB_PADDING;
  const labelSize = PHB_FONT_SIZES.value;
  const bodySize = PHB_FONT_SIZES.value - 0.5;
  const lineHeight = getPhbLineHeight(bodySize);

  let cursor = rect.top + 4 + titleHeight + 1;

  drawTextLine(page, {
    text: PHB_LABELS.armor,
    left,
    top: cursor,
    font: context.fonts.bold,
    size: labelSize,
  });

  const groupsLeft = left + 40;
  const groupWidth = (width - 40) / ARMOR_PROFICIENCY_GROUPS.length;

  for (const [index, group] of ARMOR_PROFICIENCY_GROUPS.entries()) {
    const groupLeft = groupsLeft + groupWidth * index;

    const isTrained =
      proficiencies.armor.includes(group.all)
      || group.items.some((item) => proficiencies.armor.includes(item));

    drawPhbDiamond(page, groupLeft + 3, cursor + labelSize / 2 + 1, isTrained);

    drawPhbLabel(context, page, {
      text: PHB_ARMOR_TRAINING_LABELS[group.key] ?? group.title,
      left: groupLeft + 8,
      top: cursor + 1.5,
      width: groupWidth - 8,
    });
  }

  cursor += labelSize + 6;

  drawRule(page, {
    left,
    top: cursor - 2,
    width,
    color: PHB_COLORS.line,
    thickness: 0.5,
  });

  const weapons = collapseProficiencies(
    proficiencies.weapons,
    WEAPON_PROFICIENCY_GROUPS,
  );

  const masteries = proficiencies.weaponMasteries;
  const tools = getToolNames(proficiencies.tools);

  const sections = [
    {
      label: PHB_LABELS.weapons,
      text: [
        weapons.join(', '),
        masteries.length
          ? `${PHB_LABELS.masteries}: ${masteries.join(', ')}`
          : '',
      ]
        .filter(Boolean)
        .join('. '),
    },
    { label: PHB_LABELS.tools, text: tools.join(', ') },
  ];

  // Оружию отдана большая часть места: список у воина длиннее инструментов.
  const shares = [0.62, 0.38];
  const available = bottom - cursor;

  for (const [index, section] of sections.entries()) {
    const sectionHeight = available * (shares[index] ?? 0);
    const sectionTop = cursor;

    drawTextLine(page, {
      text: section.label,
      left,
      top: cursor,
      font: context.fonts.bold,
      size: labelSize,
    });

    cursor += labelSize + 3;

    drawPhbParagraph(page, {
      text: section.text,
      left,
      top: cursor,
      width,
      maxHeight: sectionTop + sectionHeight - cursor - 3,
      font: context.fonts.regular,
      size: bodySize,
      lineHeight,
    });

    cursor = sectionTop + sectionHeight;

    if (index < sections.length - 1) {
      drawRule(page, {
        left,
        top: cursor - 2,
        width,
        color: PHB_COLORS.line,
        thickness: 0.5,
      });
    }
  }
}

/**
 * Верхний ряд правой части: инициатива, скорость, размер и пассивная
 * внимательность.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param character персонаж.
 * @param top верх ряда.
 */
function drawTopTiles(
  context: PdfBuildContext,
  page: PDFPage,
  character: Character,
  top: number,
): void {
  const primarySpeed = getPrimarySpeed(getEffectiveSpeed(character));

  const perceptionSkill = character.skills.find(
    (skill) => skill.name === PDF_PERCEPTION_SKILL_NAME,
  );

  const passivePerception = perceptionSkill
    ? PASSIVE_SKILL_BASE + getSkillValue(character, perceptionSkill)
    : PASSIVE_SKILL_BASE + getAbilityModifier(character, 'wisdom');

  const tiles: PhbTile[] = [
    {
      title: PHB_TITLES.initiative,
      value: getFormattedBonus(getInitiativeBonus(character)),
    },
    {
      title: PHB_TITLES.speed,
      value: String(primarySpeed.value),
      note: `${primarySpeed.label.toLowerCase()}, ${primarySpeed.unitLabel}`,
    },
    { title: PHB_TITLES.size, value: character.size ?? PDF_EMPTY_VALUE },
    { title: PHB_TITLES.passivePerception, value: String(passivePerception) },
  ];

  const tileWidth = (RIGHT_AREA_WIDTH - PHB_GAP * (tiles.length - 1)) / 4;

  for (const [index, tile] of tiles.entries()) {
    drawValueTile(context, page, tile, {
      left: RIGHT_AREA_LEFT + (tileWidth + PHB_GAP) * index,
      top,
      width: tileWidth,
      height: PHB_TILE_HEIGHT,
    });
  }
}

/**
 * Примечания к оружию: свойства, которые меняют бросок, и дополнительный урон.
 *
 * @param item предмет-оружие.
 * @returns примечания через запятую.
 */
function getWeaponNotes(item: CharacterInventoryItem): string {
  const weapon = item.weapon;

  if (!weapon) {
    return '';
  }

  const notes = [
    weapon.ranged ? PHB_WEAPON_NOTES.ranged : '',
    weapon.finesse ? PHB_WEAPON_NOTES.finesse : '',
    weapon.heavy ? PHB_WEAPON_NOTES.heavy : '',
    weapon.versatileDamage ? PHB_WEAPON_NOTES.versatile : '',
  ].filter(Boolean);

  return notes.join(', ');
}

/**
 * Строки таблицы оружия: название, бонус атаки, урон с типом и примечания.
 *
 * @param character персонаж.
 * @returns значения строк по столбцам.
 */
function getWeaponRows(character: Character): string[][] {
  return character.inventory
    .filter((item) => item.weapon !== null && !isMissingInventoryItem(item))
    .map((item) => {
      const weapon = item.weapon;

      if (!weapon) {
        return [item.name, '', '', ''];
      }

      const attack = getWeaponAttackBonus(
        character,
        weapon,
        isProficientWeapon(character, item),
        item.attackAbility,
      );

      const damage = getWeaponDamage(
        character,
        weapon,
        item.twoHanded,
        item.attackAbility,
      );

      const damageText = damage
        ? [
            `${damage.formula}${damage.typeLabel ? ` ${damage.typeLabel.toLowerCase()}` : ''}`,
            damage.extraNotation
              ? `+${damage.extraNotation}${damage.extraTypeLabel ? ` ${damage.extraTypeLabel.toLowerCase()}` : ''}`
              : '',
          ]
            .filter(Boolean)
            .join(' ')
        : PDF_EMPTY_VALUE;

      return [
        item.name,
        getFormattedBonus(attack.value),
        damageText,
        getWeaponNotes(item),
      ];
    });
}

/**
 * Рамка оружия и заговоров с уроном: таблица с пустыми строками под запись.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param character персонаж.
 * @param top верх рамки.
 * @returns высота рамки.
 */
function drawWeaponsBox(
  context: PdfBuildContext,
  page: PDFPage,
  character: Character,
  top: number,
): number {
  const rows = getWeaponRows(character);
  const rowCount = Math.max(PHB_WEAPON_ROWS, Math.min(rows.length, 10));
  const headHeight = PHB_FONT_SIZES.label + 4;

  const height =
    18 + headHeight + rowCount * PHB_TABLE_ROW_HEIGHT + PHB_PADDING + 2;

  const rect = { left: RIGHT_AREA_LEFT, top, width: RIGHT_AREA_WIDTH, height };

  drawPhbFrame(page, rect);

  const titleHeight = drawPhbTitle(context, page, {
    left: rect.left,
    top: rect.top + 4,
    width: rect.width,
    title: PHB_TITLES.weapons,
  });

  const left = rect.left + PHB_PADDING + 2;
  const width = rect.width - PHB_PADDING * 2 - 4;
  const columnWidths = PHB_WEAPON_COLUMN_RATIOS.map((ratio) => ratio * width);

  let cursor = rect.top + 4 + titleHeight;
  let columnLeft = left;

  for (const [index, title] of PHB_WEAPON_COLUMNS.entries()) {
    const columnWidth = columnWidths[index] ?? 0;

    drawPhbLabel(context, page, {
      text: title,
      left: columnLeft,
      top: cursor,
      width: columnWidth - 3,
    });

    columnLeft += columnWidth;
  }

  cursor += headHeight;

  for (let index = 0; index < rowCount; index += 1) {
    const row = rows[index];

    if (row) {
      columnLeft = left;

      for (const [columnIndex, value] of row.entries()) {
        const columnWidth = columnWidths[columnIndex] ?? 0;

        drawTextLine(page, {
          text: value,
          left: columnLeft,
          top: cursor + 3,
          font: columnIndex === 1 ? context.fonts.bold : context.fonts.regular,
          size:
            columnIndex === 3
              ? PHB_FONT_SIZES.body
              : PHB_FONT_SIZES.value - 0.5,
          maxWidth: columnWidth - 4,
        });

        columnLeft += columnWidth;
      }
    }

    cursor += PHB_TABLE_ROW_HEIGHT;

    drawRule(page, {
      left,
      top: cursor,
      width,
      color: PHB_COLORS.line,
      thickness: 0.5,
    });
  }

  return height;
}

/**
 * Рамка списка умений: заголовок и умения в колонках.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param features умения рамки.
 * @param rect геометрия рамки.
 * @param title заголовок рамки.
 * @param columns число колонок.
 */
function drawFeaturesBox(
  context: PdfBuildContext,
  page: PDFPage,
  features: CharacterFeature[],
  rect: PdfRect,
  title: string,
  columns: number,
): void {
  drawPhbFrame(page, rect);

  const titleHeight = drawPhbTitle(context, page, {
    left: rect.left,
    top: rect.top + 4,
    width: rect.width,
    title,
  });

  const area = {
    left: rect.left + PHB_PADDING + 2,
    top: rect.top + 4 + titleHeight + 1,
    width: rect.width - PHB_PADDING * 2 - 4,
    height: rect.height - titleHeight - 4 - PHB_PADDING - 2,
  };

  // Разделитель колонок — как на печатном листе, даже если вторая пуста.
  for (let column = 1; column < columns; column += 1) {
    drawVerticalRule(page, {
      left: area.left + (area.width / columns) * column,
      top: area.top,
      height: area.height,
      color: PHB_COLORS.line,
    });
  }

  drawPhbFeatureColumns(context, page, features, area, columns);
}

/**
 * Первая страница листа PHB: шапка, характеристики с навыками, владение
 * снаряжением, боевые плитки, оружие и умения класса, вида и черты.
 *
 * @param context документ в процессе сборки.
 * @param character персонаж.
 */
export function drawPhbMainPage(
  context: PdfBuildContext,
  character: Character,
): void {
  const page = createPdfPage(context);

  drawHeader(context, page, character);

  const bannerTop = PHB_MARGIN + PHB_HEADER_HEIGHT + PHB_GAP;

  drawBanner(context, page, bannerTop);

  const bodyTop = bannerTop + PHB_BANNER_HEIGHT + PHB_GAP;

  const abilitiesBottom = drawAbilityColumns(context, page, character, bodyTop);

  const trainingTop = abilitiesBottom + PHB_GAP;

  drawEquipmentTrainingBox(context, page, character, {
    left: PHB_MARGIN,
    top: trainingTop,
    width: ABILITY_AREA_WIDTH,
    height: PHB_BOTTOM - trainingTop,
  });

  drawTopTiles(context, page, character, bodyTop);

  const weaponsTop = bodyTop + PHB_TILE_HEIGHT + PHB_GAP;
  const weaponsHeight = drawWeaponsBox(context, page, character, weaponsTop);

  const classFeaturesTop = weaponsTop + weaponsHeight + PHB_GAP;
  const bottomRowTop = PHB_BOTTOM - PHB_BOTTOM_BOX_HEIGHT;

  const classFeatures = character.features.filter(
    (feature) => feature.origin === 'class' || feature.origin === 'none',
  );

  const speciesFeatures = character.features.filter(
    (feature) => feature.origin === 'species' || feature.origin === 'lineage',
  );

  const feats = character.features.filter(
    (feature) => feature.origin === 'feat' || feature.origin === 'background',
  );

  drawFeaturesBox(
    context,
    page,
    classFeatures,
    {
      left: RIGHT_AREA_LEFT,
      top: classFeaturesTop,
      width: RIGHT_AREA_WIDTH,
      height: bottomRowTop - PHB_GAP - classFeaturesTop,
    },
    PHB_TITLES.classFeatures,
    2,
  );

  const halfWidth = (RIGHT_AREA_WIDTH - PHB_GAP) / 2;

  drawFeaturesBox(
    context,
    page,
    speciesFeatures,
    {
      left: RIGHT_AREA_LEFT,
      top: bottomRowTop,
      width: halfWidth,
      height: PHB_BOTTOM_BOX_HEIGHT,
    },
    PHB_TITLES.speciesTraits,
    1,
  );

  drawFeaturesBox(
    context,
    page,
    feats,
    {
      left: RIGHT_AREA_LEFT + halfWidth + PHB_GAP,
      top: bottomRowTop,
      width: halfWidth,
      height: PHB_BOTTOM_BOX_HEIGHT,
    },
    PHB_TITLES.feats,
    1,
  );
}
