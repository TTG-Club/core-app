import type { SpeciesMechanics } from './mechanics';
import type { SpeciesCreate, SpeciesCreateFeature } from './types';

/**
 * Пустое ли значение с точки зрения формы: `undefined`, пустая строка, пустой
 * массив, снятый флаг или объект, у которого пусты все поля.
 *
 * Снятый флаг считается пустым намеренно: механика создаётся сразу со всеми
 * блоками, и `alwaysPrepared: false` вместе с тремя `…EqualsWalk: false`
 * делали бы «пустой» механику непустой — на бэк уезжал бы объект, означающий
 * «умение размечено», хотя в нём ничего не заполнено.
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
 * Механика к отправке — и у самой записи, и у её умения: форма держит все блоки
 * заполненными объектами, чтобы селекторам было куда писать, а справочнику
 * пустая механика не нужна. `null` в нём означает «запись только текстовая», и
 * пустой объект вместо него заставил бы лист считать её размеченной.
 *
 * @param mechanics механика из формы.
 * @returns механика или `undefined`, если в ней ничего не заполнено.
 */
function buildMechanics(
  mechanics: SpeciesMechanics | undefined,
): SpeciesMechanics | undefined {
  if (!mechanics || isBlank(mechanics)) {
    return undefined;
  }

  return mechanics;
}

/**
 * Умение к отправке: пустая механика отбрасывается целиком.
 *
 * @param feature умение из формы.
 * @returns умение для запроса.
 */
function buildFeature(feature: SpeciesCreateFeature): SpeciesCreateFeature {
  return {
    ...feature,
    mechanics: buildMechanics(feature.mechanics),
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
    mechanics: buildMechanics(state.mechanics),
    features: state.features.map(buildFeature),
  };
}
