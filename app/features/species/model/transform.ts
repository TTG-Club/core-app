import type { FeatEditorRows } from '~feats/model';

import type { SpeciesMechanics } from './mechanics';
import type { SpeciesCreate, SpeciesCreateFeature } from './types';

import { z } from '~/utils/zod';
import {
  createFeatMechanics,
  createPrerequisiteDetails,
  featMechanicsSchema,
  fromFeatEditorRows,
  toFeatEditorRows,
  toFeatMechanicsState,
} from '~feats/model';

/**
 * Пустое ли значение с точки зрения формы: `undefined`, пустая строка, пустой
 * массив, снятый флаг или объект, у которого пусты все поля.
 *
 * Снятый флаг считается пустым намеренно: механика создаётся сразу со всеми
 * блоками, и три `…EqualsWalk: false` делали бы «пустую» механику непустой — на
 * бэк уезжал бы объект, означающий «запись размечена», хотя в нём ничего не
 * заполнено.
 *
 * @param value значение поля формы.
 * @returns истина, если отправлять нечего.
 */
function isBlank(value: unknown): boolean {
  if (value === undefined || value === null || value === '') {
    return true;
  }

  if (typeof value === 'boolean') {
    return !value;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.values(value).every(isBlank);
  }

  return false;
}

/**
 * Механика из строк редактора. Строки — модель черт целиком, поэтому и сборка
 * идёт их сборщиком; виду из результата нужны три блока, остальные у него не
 * бывают.
 *
 * Пустая механика превращается в `undefined`: `null` в справочнике означает
 * «запись только текстовая», и пустой объект вместо него заставил бы лист
 * считать её размеченной.
 *
 * @param rows строки редактора; `undefined` — форма их не завела.
 * @returns механика или `undefined`, если в ней ничего не заполнено.
 */
function buildMechanics(
  rows: FeatEditorRows | undefined,
): SpeciesMechanics | undefined {
  if (!rows) {
    return undefined;
  }

  const { mechanics } = fromFeatEditorRows(rows, createFeatMechanics());

  const built: SpeciesMechanics = {
    modifiers: mechanics.modifiers,
    proficiencies: mechanics.proficiencies,
    choices: mechanics.choices,
  };

  return isBlank(built) ? undefined : built;
}

/**
 * Умение к отправке: механика пересобирается из строк, сами строки в тело
 * запроса не уходят.
 *
 * @param feature умение из формы.
 * @returns умение для запроса.
 */
function buildFeature(feature: SpeciesCreateFeature): SpeciesCreateFeature {
  return {
    ...feature,
    mechanics: buildMechanics(feature.editorRows),
    editorRows: undefined,
  };
}

/**
 * Подготовка формы вида к отправке.
 *
 * @param state состояние формы.
 * @returns тело запроса.
 */
export function transformSpeciesBeforeSubmit(
  state: SpeciesCreate,
): SpeciesCreate {
  return {
    ...state,
    mechanics: buildMechanics(state.editorRows),
    editorRows: undefined,
    features: state.features.map(buildFeature),
  };
}

/**
 * Умения загруженной записи. Разбирается схемой, а не приведением типа: с
 * сервера приходит `unknown`, и механика умения нужна здесь разобранной — из
 * неё собираются строки редактора.
 */
const loadedFeaturesSchema = z
  .array(z.looseObject({ mechanics: z.unknown() }))
  .catch([]);

/**
 * Механика и строки редактора из ответа справочника: форма правит строки, а не
 * механику напрямую, поэтому загруженную запись надо разложить на них.
 *
 * Механика разбирается схемой черты — она же описывает механику вида. Лишние
 * для вида блоки (повышения характеристик, заклинания, ресурсы) схема сохранит,
 * но строк для них здесь нет, и обратно их соберёт `fromFeatEditorRows` из
 * пустой заготовки: у вида таких блоков не бывает.
 *
 * Предусловия у вида не бывает — сборщику строк отдаётся пустое.
 *
 * @param raw механика записи или её умения из ответа.
 * @returns поля формы: разобранная механика и её строки.
 */
function toMechanicsState(raw: unknown): {
  mechanics: SpeciesMechanics;
  editorRows: FeatEditorRows;
} {
  const parsed = featMechanicsSchema.safeParse(raw);

  const featMechanics = toFeatMechanicsState(
    parsed.success ? parsed.data : undefined,
  );

  return {
    mechanics: {
      modifiers: featMechanics.modifiers,
      proficiencies: featMechanics.proficiencies,
      choices: featMechanics.choices,
    },
    editorRows: toFeatEditorRows(featMechanics, createPrerequisiteDetails()),
  };
}

/**
 * Приводит загруженный с сервера вид к структуре формы: раскладывает механику
 * записи и каждого её умения на строки редактора.
 *
 * @param raw загруженная запись.
 * @returns состояние формы.
 */
export function normalizeLoadedSpecies(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const features = loadedFeaturesSchema.parse(raw.features).map((feature) => ({
    ...feature,
    ...toMechanicsState(feature.mechanics),
  }));

  return {
    ...raw,
    features,
    ...toMechanicsState(raw.mechanics),
  };
}
