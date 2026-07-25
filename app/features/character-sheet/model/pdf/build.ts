import type { Character } from '../types';
import type { PdfBuildContext } from './types';

import { PDFDocument } from 'pdf-lib';

import { CHARACTER_SHEET_TITLE } from '../constants';
import { loadCatalogDescriptions } from './catalog';
import { PDF_META } from './constants';
import { loadPdfFonts } from './fonts';
import { drawPdfFooters } from './layout';
import { drawEquipmentPage } from './page-equipment';
import { drawMainPage } from './page-main';
import { drawReferencePage } from './page-reference';
import { drawSpellsPage } from './page-spells';

/**
 * Сборка PDF листа персонажа: первая страница — основной лист, дальше
 * снаряжение, заклинания и справочник с полными описаниями. Страницы, которым
 * нечего показать (нет заклинаний, нет описаний), не создаются.
 *
 * Всё, что есть в документе листа, считается теми же функциями, что и лист на
 * сайте, поэтому экспорт одинаково работает и из открытого листа, и из карточки
 * списка. Описания каталожных заклинаний и предметов в документе не хранятся —
 * их дозагружает `loadCatalogDescriptions`; отказ запроса лишает справочник одной
 * записи, но не срывает экспорт.
 *
 * @param character персонаж.
 * @returns байты готового PDF.
 */
export async function buildCharacterSheetPdf(
  character: Character,
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
  };

  drawMainPage(context, character);
  drawEquipmentPage(context, character);
  drawSpellsPage(context, character);
  drawReferencePage(context, character, descriptions);

  // Колонтитулы в самом конце: до этого момента общее число страниц неизвестно.
  drawPdfFooters(context);

  return document.save();
}
