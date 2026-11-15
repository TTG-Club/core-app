import type { Character } from '../types';
import type { PdfBuildContext, PdfBuildOptions } from './types';

import { PDFDocument } from 'pdf-lib';

import { CHARACTER_SHEET_TITLE } from '../constants';
import { loadCatalogDescriptions } from './catalog';
import { PDF_META } from './constants';
import { loadPdfFonts } from './fonts';
import { drawPdfFooters } from './layout';
import { drawEquipmentPage } from './page-equipment';
import { drawMainPage } from './page-main';
import { drawPersonalityPage } from './page-personality';
import { drawPhbMainPage } from './page-phb-main';
import { drawPhbSpellsPage } from './page-phb-spells';
import { drawReferencePage } from './page-reference';
import { drawSpellsPage } from './page-spells';

/**
 * Сборка PDF листа персонажа. Лист TTG: первая страница — основной лист, дальше
 * личность, снаряжение, заклинания и справочник с полными описаниями; страницы,
 * которым нечего показать, не создаются. Лист PHB: две страницы по образцу
 * печатного листа Книги игрока 2024 (вторая — всегда, даже у не-заклинателя:
 * на ней ещё внешность, снаряжение и монеты) и тот же справочник.
 *
 * Всё, что есть в документе листа, считается теми же функциями, что и лист на
 * сайте, поэтому экспорт одинаково работает и из открытого листа, и из карточки
 * списка. Описания каталожных заклинаний и предметов в документе не хранятся —
 * их дозагружает `loadCatalogDescriptions`; отказ запроса лишает справочник одной
 * записи, но не срывает экспорт.
 *
 * Если у листа включён доступ по ссылке, в шапку первой страницы ставится
 * QR-код с этой ссылкой — бумажный лист ведёт к актуальной версии на сайте.
 *
 * @param character персонаж.
 * @param options ссылка на просмотр листа и прочее, чего нет в документе.
 * @returns байты готового PDF.
 */
export async function buildCharacterSheetPdf(
  character: Character,
  options: PdfBuildOptions = {},
): Promise<Uint8Array> {
  const document = await PDFDocument.create();

  document.setTitle(`${character.name} — ${CHARACTER_SHEET_TITLE}`);
  document.setAuthor(character.name);
  document.setCreator(PDF_META.creator);
  document.setProducer(PDF_META.producer);
  document.setSubject(PDF_META.subject);

  // Шрифты и описания каталога тянутся параллельно: и то и другое — сеть, а
  // рисовать всё равно нечем, пока не встроены шрифты.
  const [fonts, descriptions] = await Promise.all([
    loadPdfFonts(document),
    loadCatalogDescriptions(character),
  ]);

  const context: PdfBuildContext = {
    document,
    fonts,
    characterName: character.name,
    pages: [],
    shareUrl: options.shareUrl ?? null,
  };

  if (options.variant === 'phb') {
    // Лист PHB — две страницы печатного листа; полные описания умений и
    // заклинаний туда не влезают, поэтому справочник остаётся и здесь.
    drawPhbMainPage(context, character);
    drawPhbSpellsPage(context, character, descriptions);
  } else {
    drawMainPage(context, character);
    drawPersonalityPage(context, character);
    drawEquipmentPage(context, character);
    drawSpellsPage(context, character);
  }

  drawReferencePage(context, character, descriptions);

  // Колонтитулы в самом конце: до этого момента общее число страниц неизвестно.
  drawPdfFooters(context);

  return document.save();
}
