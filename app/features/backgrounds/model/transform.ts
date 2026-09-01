import type { BackgroundCreate, BackgroundToolChoice } from './create';

import { normalizeActiveEffects } from '~active-effects/model';
import {
  buildFeatMechanics,
  createFeatMechanics,
  fromFeatEditorRows,
} from '~feats/model';

/**
 * Готовит владение инструментами на выбор: выбор без количества ничего не
 * описывает и в JSONB не пишется.
 *
 * @param choice блок выбора из состояния формы.
 * @returns блок выбора; `undefined` — выбора у предыстории нет.
 */
function buildToolChoice(
  choice: BackgroundToolChoice | undefined,
): BackgroundToolChoice | undefined {
  if (!choice?.count || choice.count < 1) {
    return undefined;
  }

  return { count: choice.count, from: choice.from };
}

/**
 * Чистит состояние формы предыстории перед отправкой.
 *
 * Дары собираются из строк редактора: форма правит их, а блоки механики — уже
 * результат. Строки в теле запроса не нужны и уходят `undefined` — такие поля
 * `JSON.stringify` выбрасывает.
 *
 * @param state состояние формы.
 * @returns тело запроса без строк редактора и пустых блоков.
 */
export function transformBackgroundBeforeSubmit(
  state: BackgroundCreate,
): BackgroundCreate {
  // Предусловий у предыстории нет — из пересобранного берутся только дары
  const built = state.editorRows
    ? fromFeatEditorRows(
        state.editorRows,
        state.mechanics ?? createFeatMechanics(),
      )
    : { mechanics: state.mechanics };

  return {
    ...state,
    editorRows: undefined,
    // Эффекты чистит общий нормализатор раздела: он же обслуживает черты,
    // заклинания и магические предметы, поэтому правило «что считать пустым»
    // одно на всех
    activeEffects: normalizeActiveEffects(state.activeEffects),
    toolChoice: buildToolChoice(state.toolChoice),
    mechanics: built.mechanics
      ? buildFeatMechanics(built.mechanics)
      : undefined,
  };
}
