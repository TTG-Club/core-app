import type { SpeciesFeatureCreate } from './types';

import { z } from 'zod';

import { normalizeLoadedActiveEffects } from '~active-effects/model';
import {
  createPrerequisiteDetails,
  parseLoadedMechanics,
  toFeatEditorRows,
} from '~feats/model';

/**
 * Разбор блоков вида, пришедших с сервера.
 *
 * Данные приходят из `GET /api/v2/species/{url}/raw`, где дары и эффекты лежат
 * в JSONB: у записей, сохранённых до их появления, блоков нет вовсе. Задача
 * разбора не подставить значения, а отсеять чужое — недостающее дозаполняет
 * слияние с начальным состоянием формы внутри `useWorkshopForm`.
 */

const featureSchema = z.object({
  name: z
    .object({
      rus: z.string().optional(),
      eng: z.string().optional(),
    })
    .optional(),
  description: z.string().optional(),
  level: z.number().optional(),
});

/**
 * Приводит умение вида к структуре формы.
 *
 * Дары умения разбираются схемой черты — модель у них общая; строки редактора
 * собираются здесь же, потому что правит форма именно их.
 *
 * @param raw сырое умение из ответа сервера.
 * @returns умение для формы.
 */
function parseFeature(raw: unknown): SpeciesFeatureCreate {
  const parsed = featureSchema.safeParse(raw);
  const source = parsed.success ? parsed.data : {};

  const mechanics = parseLoadedMechanics(
    isRecord(raw) ? raw.mechanics : undefined,
  );

  return {
    name: {
      rus: source.name?.rus ?? '',
      eng: source.name?.eng ?? '',
    },
    description: source.description ?? '',
    level: source.level,
    mechanics,
    activeEffects: normalizeLoadedActiveEffects(
      isRecord(raw) ? raw.activeEffects : undefined,
    ),
    // Предусловий у вида нет: строки собираются с пустым предусловием, вкладки
    // требований в его форме тоже нет
    editorRows: toFeatEditorRows(mechanics, createPrerequisiteDetails()),
  };
}

/**
 * Проверяет, что значение — объект: у полей, которые схема не описывает
 * (`mechanics`, `activeEffects`), свои разборщики, и обратиться к ним можно
 * только у объекта.
 *
 * @param value сырое значение.
 * @returns признак объекта.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Приводит загруженный с сервера вид к структуре формы.
 *
 * @param raw сырой ответ формы вида.
 * @returns состояние с разобранными дарами, эффектами и умениями.
 */
export function normalizeLoadedSpecies(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const mechanics = parseLoadedMechanics(raw.mechanics);

  return {
    ...raw,
    mechanics,
    // Эффекты разбирает своя схема раздела: битый эффект отбрасывается
    // поштучно, а не роняет весь список
    activeEffects: normalizeLoadedActiveEffects(raw.activeEffects),
    features: Array.isArray(raw.features) ? raw.features.map(parseFeature) : [],
    editorRows: toFeatEditorRows(mechanics, createPrerequisiteDetails()),
  };
}
