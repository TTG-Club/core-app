import type { ExternalImportResult, LssCharacter } from './types';

import { enrichFromCatalog } from './catalog';
import { LSS_IMPORT_WARNINGS, LSS_SOURCE_LABEL } from './constants';
import { convertLssCharacter } from './convert';
import { parseLssDocument } from './schema';

/**
 * Что из файла на лист не переехало: полей под это в модели нет, и молчать об
 * этом нельзя — иначе пропажа обнаружится посреди игры.
 *
 * @param source персонаж LSS.
 * @returns предупреждения для тоста; пустой список — перенеслось всё.
 */
function getWarnings(source: LssCharacter): string[] {
  const warnings: string[] = [];

  const hasSpellcasting =
    Boolean(source.spellcastingAbility)
    || [...source.spellSlots, ...source.pactSpellSlots].some(
      (slot) => slot.max > 0,
    );

  if (hasSpellcasting) {
    warnings.push(LSS_IMPORT_WARNINGS.spells);
  }

  if (source.hasBonuses) {
    warnings.push(LSS_IMPORT_WARNINGS.bonuses);
  }

  if (source.hasAttunements) {
    warnings.push(LSS_IMPORT_WARNINGS.attunements);
  }

  return warnings;
}

/**
 * Импорт листа персонажа из файла чужого формата. Сейчас поддерживается один
 * формат — Long Story Short; для остальных файлов возвращается null, и импорт
 * объясняет отказ так же, как раньше.
 *
 * @param input разобранное содержимое JSON-файла.
 * @returns персонаж листа с предупреждениями; null — формат не распознан.
 */
export async function importExternalCharacter(
  input: unknown,
): Promise<ExternalImportResult | null> {
  const source = parseLssDocument(input);

  if (!source) {
    return null;
  }

  const character = await enrichFromCatalog(
    convertLssCharacter(source),
    source,
  );

  return {
    character,
    sourceLabel: LSS_SOURCE_LABEL,
    warnings: getWarnings(source),
  };
}
