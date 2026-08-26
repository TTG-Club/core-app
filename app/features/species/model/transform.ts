import type { SpeciesCreate, SpeciesFeatureCreate } from './types';

import { normalizeActiveEffects } from '~active-effects/model';
import {
  buildFeatMechanics,
  createFeatMechanics,
  fromFeatEditorRows,
} from '~feats/model';

/** Носитель даров: и сама запись вида, и любое её умение. */
interface MechanicsHolder {
  mechanics: SpeciesCreate['mechanics'];
  editorRows: SpeciesCreate['editorRows'];
}

/**
 * Пересобирает дары из строк редактора и чистит блок перед отправкой.
 *
 * Форма правит строки, а механика — уже результат: собрать её на месте дешевле,
 * чем держать два источника правды и сводить их при каждом сохранении.
 *
 * @param holder механика и строки одного носителя даров.
 * @returns готовая к отправке механика; `undefined` — даров нет.
 */
function buildMechanics(holder: MechanicsHolder): SpeciesCreate['mechanics'] {
  // Предусловий у вида нет — из пересобранного берутся только дары
  const built = holder.editorRows
    ? fromFeatEditorRows(
        holder.editorRows,
        holder.mechanics ?? createFeatMechanics(),
      ).mechanics
    : holder.mechanics;

  return built ? buildFeatMechanics(built) : undefined;
}

/**
 * Готовит умение вида к отправке: дары из строк, эффекты через общий
 * нормализатор, строки редактора наружу не уходят.
 *
 * @param feature умение из состояния формы.
 * @returns умение для тела запроса.
 */
function transformFeature(feature: SpeciesFeatureCreate): SpeciesFeatureCreate {
  return {
    ...feature,
    // Первый уровень — значение по умолчанию у потребителя, и писать его
    // каждому умению незачем
    level: feature.level && feature.level > 1 ? feature.level : undefined,
    mechanics: buildMechanics(feature),
    activeEffects: normalizeActiveEffects(feature.activeEffects),
    editorRows: undefined,
  };
}

/**
 * Чистит состояние формы вида перед отправкой.
 *
 * @param state состояние формы.
 * @returns тело запроса без строк редактора и пустых блоков.
 */
export function transformSpeciesBeforeSubmit(
  state: SpeciesCreate,
): SpeciesCreate {
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
