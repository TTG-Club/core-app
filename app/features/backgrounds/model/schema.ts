import type { FeatEntityRef } from '~feats/model';

import type { BackgroundToolChoice } from './create';

import { z } from 'zod';

import { normalizeLoadedActiveEffects } from '~active-effects/model';
import {
  createPrerequisiteDetails,
  parseLoadedMechanics,
  toFeatEditorRows,
} from '~feats/model';

/**
 * Разбор блоков предыстории, пришедших с сервера.
 *
 * Данные приходят из `GET /api/v2/backgrounds/{url}/raw`, где ссылки и дары
 * лежат в JSONB: у записей, сохранённых до их появления, блоков нет вовсе.
 * Задача разбора не подставить значения, а отсеять чужое — недостающее
 * дозаполняет слияние с начальным состоянием формы внутри `useWorkshopForm`.
 */

const entityRefSchema = z.object({
  url: z.string(),
  name: z.string().optional(),
});

const entityRefListSchema = z.array(entityRefSchema);

const toolChoiceSchema = z.object({
  count: z.number().optional(),
  from: entityRefListSchema.optional(),
});

/**
 * Список ссылок на записи справочника; не прошедший разбор — пустой.
 *
 * @param raw сырое значение поля со ссылками.
 * @returns ссылки со снимками названий.
 */
function parseEntityRefs(raw: unknown): Array<FeatEntityRef> {
  const parsed = entityRefListSchema.safeParse(raw);

  return parsed.success ? parsed.data : [];
}

/**
 * Владение инструментами на выбор; не прошедшее разбор — пустой выбор.
 *
 * @param raw сырое значение блока выбора.
 * @returns блок выбора для формы.
 */
function parseToolChoice(raw: unknown): BackgroundToolChoice {
  const parsed = toolChoiceSchema.safeParse(raw);

  if (!parsed.success) {
    return createBackgroundToolChoice();
  }

  return {
    count: parsed.data.count,
    from: parsed.data.from ?? [],
  };
}

/**
 * Пустой блок выбора инструментов, с которым открывается форма.
 *
 * @returns блок выбора без количества и пула.
 */
export function createBackgroundToolChoice(): BackgroundToolChoice {
  return { count: undefined, from: [] };
}

/**
 * Приводит загруженную с сервера предысторию к структуре формы.
 *
 * Дары разбираются схемой черты — модель у них общая; здесь же собираются
 * строки редактора: форма правит их, а не блоки механики, — механику из них
 * пересобирает `transformBackgroundBeforeSubmit`.
 *
 * @param raw сырой ответ формы предыстории.
 * @returns состояние с разобранными дарами, эффектами и ссылками.
 */
export function normalizeLoadedBackground(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const mechanics = parseLoadedMechanics(raw.mechanics);

  return {
    ...raw,
    mechanics,
    // Эффекты разбирает своя схема раздела: битый эффект отбрасывается
    // поштучно, а не роняет весь список
    activeEffects: normalizeLoadedActiveEffects(raw.activeEffects),
    featChoices: parseEntityRefs(raw.featChoices),
    toolProficiencies: parseEntityRefs(raw.toolProficiencies),
    toolChoice: parseToolChoice(raw.toolChoice),
    // Требований у предыстории нет: строки собираются с пустым предусловием,
    // вкладки требований в её форме тоже нет
    editorRows: toFeatEditorRows(mechanics, createPrerequisiteDetails()),
  };
}
