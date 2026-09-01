/**
 * Часть урона/лечения — единица боевого движка VTTG. Одна и та же у всего, что
 * наносит урон: заклинания, оружия, активного эффекта.
 *
 * Зеркало `DamagePart` из системы D&D (`sdk/src/types/base.ts`): вид части
 * (урон, лечение, временные ХП) и тип урона задаются ТОЛЬКО токенами внутри
 * `formula` — отдельных полей под них нет.
 */

import { DAMAGE_FORMULA_TARGET_OPTIONS } from './constants';

/**
 * Цель части урона. Зеркало `DamagePartTarget` из VTTG: `selected` — выбранная
 * цель, `self` — сам носитель, `choose` — отдельная цель, указывается перед
 * броском.
 */
export type DamageFormulaTarget = 'selected' | 'self' | 'choose';

/** Цель части по умолчанию. */
export const DEFAULT_DAMAGE_FORMULA_TARGET: DamageFormulaTarget = 'selected';

/**
 * Часть урона в редакторе.
 *
 * Цель и признак «только если нанесён урон» обязательны (без `undefined`):
 * редактор сверяет свои строки с моделью через `isEqual`, и необязательный ключ
 * то появлялся бы, то исчезал — сравнение считало бы одинаковые части разными.
 */
export interface DamageFormulaPart {
  formula: string;
  target: DamageFormulaTarget;
  requiresDamage: boolean;
  /**
   * Формула при удержании оружия двумя руками (свойство «Универсальное»).
   * Только у оружия — заклинания и эффекты поле не заполняют.
   */
  versatileFormula?: string;
}

/**
 * Проверяет, что значение — цель части урона из словаря VTTG.
 *
 * @param value произвольное значение.
 * @returns `true`, если значение — известная цель части.
 */
export function isDamageFormulaTarget(
  value: unknown,
): value is DamageFormulaTarget {
  return DAMAGE_FORMULA_TARGET_OPTIONS.some((option) => option.value === value);
}

/**
 * Создаёт пустую часть урона для редактора.
 *
 * @returns часть без формулы, с целью по умолчанию.
 */
export function createEmptyDamageFormulaPart(): DamageFormulaPart {
  return {
    formula: '',
    target: DEFAULT_DAMAGE_FORMULA_TARGET,
    requiresDamage: false,
  };
}

/** Схема частей урона из «сырого» ответа: битая часть не должна ронять соседние. */
const loadedDamageFormulaPartsSchema = z
  .array(
    z.object({
      formula: z.string().catch(''),
      target: z.string().nullish().catch(null),
      requiresDamage: z.boolean().nullish().catch(null),
      versatileFormula: z.string().nullish().catch(null),
    }),
  )
  .nullish()
  .catch(null);

/**
 * Части урона из «сырого» ответа раздела. Цель и признак «только если нанесён
 * урон» доводятся до обязательных значений — редактор сверяет свои строки с
 * моделью через `isEqual`, и необязательный ключ ломал бы сравнение.
 *
 * @param raw значение поля с частями урона.
 * @returns части урона; пустой список — частей нет.
 */
export function parseLoadedDamageFormulaParts(
  raw: unknown,
): Array<DamageFormulaPart> {
  const parsed = loadedDamageFormulaPartsSchema.parse(raw);

  return (parsed ?? []).map((part) => ({
    formula: part.formula,
    target: isDamageFormulaTarget(part.target)
      ? part.target
      : DEFAULT_DAMAGE_FORMULA_TARGET,
    requiresDamage: part.requiresDamage ?? false,
    versatileFormula: part.versatileFormula ?? undefined,
  }));
}

/**
 * Части урона для отправки: незаполненные строки отбрасываются, у остальных
 * снимаются пробелы. Пустая часть — обычное состояние редактора, а не значение,
 * поэтому в запрос она не идёт.
 *
 * @param parts части урона из формы.
 * @returns части урона для запроса.
 */
export function normalizeDamageFormulaParts(
  parts: Array<DamageFormulaPart>,
): Array<DamageFormulaPart> {
  return parts
    .filter((part) => part.formula.trim().length > 0)
    .map((part) => ({
      ...part,
      formula: part.formula.trim(),
      versatileFormula: part.versatileFormula?.trim() || undefined,
    }));
}
