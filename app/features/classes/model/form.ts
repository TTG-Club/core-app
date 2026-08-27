import type { ActiveEffect } from '~active-effects/model';
import type { FeatEditorRows, FeatMechanics } from '~feats/model';

import type { ClassCreate, ClassFeatureCreate } from './create';

import { z } from 'zod';

import {
  normalizeActiveEffects,
  normalizeLoadedActiveEffects,
} from '~active-effects/model';
import {
  buildFeatMechanics,
  createFeatMechanics,
  createPrerequisiteDetails,
  fromFeatEditorRows,
  parseLoadedMechanics,
  toFeatEditorRows,
} from '~feats/model';

/**
 * Разбор загруженного класса и подготовка формы к отправке.
 *
 * Дары и эффекты приходят из `GET /api/v2/classes/{url}/raw` блоками JSONB: у
 * записей, сохранённых до их появления, блоков нет вовсе. Задача разбора не
 * подставить значения, а отсеять чужое — недостающее дозаполняет слияние с
 * начальным состоянием формы внутри `useWorkshopForm`.
 */

/** Носитель даров: и сама запись класса, и любое его умение. */
interface MechanicsHolder {
  mechanics: FeatMechanics | undefined;
  editorRows: FeatEditorRows | undefined;
}

const featureSchema = z.object({
  informationalOnly: z.boolean().optional(),
});

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
 * Собирает у носителя даров разобранную механику, эффекты и строки редактора.
 *
 * Предусловий у класса нет: строки собираются с пустым предусловием, вкладки
 * требований в его форме тоже нет.
 *
 * @param raw сырой носитель даров из ответа сервера.
 * @returns блоки формы: механика, эффекты и строки редактора.
 */
function parseMechanicsHolder(raw: unknown): {
  mechanics: FeatMechanics;
  activeEffects: Array<ActiveEffect>;
  editorRows: FeatEditorRows;
} {
  const source = isRecord(raw) ? raw : {};
  const mechanics = parseLoadedMechanics(source.mechanics);

  return {
    mechanics,
    // Эффекты разбирает своя схема раздела: битый эффект отбрасывается
    // поштучно, а не роняет весь список
    activeEffects: normalizeLoadedActiveEffects(source.activeEffects),
    editorRows: toFeatEditorRows(mechanics, createPrerequisiteDetails()),
  };
}

/**
 * Пересобирает дары носителя из строк редактора и чистит блок перед отправкой.
 *
 * @param holder механика и строки одного носителя даров.
 * @returns готовая к отправке механика; `undefined` — даров нет.
 */
function buildMechanics(holder: MechanicsHolder): FeatMechanics | undefined {
  const built = holder.editorRows
    ? fromFeatEditorRows(
        holder.editorRows,
        holder.mechanics ?? createFeatMechanics(),
      ).mechanics
    : holder.mechanics;

  return built ? buildFeatMechanics(built) : undefined;
}

/**
 * Приводит умение класса к структуре формы.
 *
 * @param raw сырое умение из ответа сервера.
 * @returns умение с разобранными дарами и эффектами.
 */
function parseFeature(raw: unknown): Record<string, unknown> {
  const source = isRecord(raw) ? raw : {};
  const parsed = featureSchema.safeParse(source);

  return {
    ...source,
    informationalOnly: parsed.success
      ? (parsed.data.informationalOnly ?? false)
      : false,
    ...parseMechanicsHolder(source),
  };
}

/**
 * Приводит загруженный с сервера класс к структуре формы.
 *
 * @param raw сырой ответ формы класса.
 * @returns состояние с разобранными дарами, эффектами и умениями.
 */
export function normalizeLoadedClass(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...raw,
    ...parseMechanicsHolder(raw),
    features: Array.isArray(raw.features) ? raw.features.map(parseFeature) : [],
  };
}

/**
 * Готовит умение класса к отправке: дары из строк, эффекты через общий
 * нормализатор, строки редактора наружу не уходят.
 *
 * @param feature умение из состояния формы.
 * @returns умение для тела запроса.
 */
function transformFeature(feature: ClassFeatureCreate): ClassFeatureCreate {
  return {
    ...feature,
    mechanics: buildMechanics(feature),
    activeEffects: normalizeActiveEffects(feature.activeEffects),
    editorRows: undefined,
  };
}

/**
 * Чистит состояние формы класса перед отправкой.
 *
 * @param state состояние формы.
 * @returns тело запроса без строк редактора и пустых блоков.
 */
export function transformClassBeforeSubmit(state: ClassCreate): ClassCreate {
  return {
    ...state,
    editorRows: undefined,
    mechanics: buildMechanics(state),
    // Эффекты чистит общий нормализатор раздела: он же обслуживает черты,
    // заклинания и магические предметы, поэтому правило «что считать пустым»
    // одно на всех
    activeEffects: normalizeActiveEffects(state.activeEffects),
    features: state.features.map(transformFeature),
  };
}
