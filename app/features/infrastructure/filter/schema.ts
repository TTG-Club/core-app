import type { Filter } from './types';

import { z } from 'zod';

/**
 * Схема элемента фильтра. `looseObject` сохраняет неизвестные поля
 * (`[p: string]: unknown` в `FilterItem`), а `catch` гасит битые значения,
 * чтобы каскад не падал на некорректных данных API.
 */
const filterItemSchema = z.looseObject({
  id: z.union([z.string(), z.number()]),
  // Бэкенд для группы «Уровень» присылает `value` числом, хотя тип обещает
  // строку — приводим к строке, чтобы не терять значение.
  value: z.coerce.string().catch(''),
  name: z.string().catch(''),
  selected: z.union([z.boolean(), z.null()]).default(null),
  relations: z
    .record(z.string(), z.array(z.union([z.string(), z.number()])))
    .optional()
    .catch(undefined),
});

const filterGroupSchema = z.object({
  key: z.string(),
  name: z.string(),
  type: z.literal('filter').catch('filter'),
  supports: z
    .object({ mode: z.boolean(), union: z.boolean() })
    .optional()
    .catch(undefined),
  mode: z.boolean().optional(),
  union: z.boolean().optional(),
  values: z.array(filterItemSchema).optional(),
});

const filterSchema = z.object({
  filters: z.array(filterGroupSchema),
  sources: z.array(filterGroupSchema).optional(),
});

/**
 * Валидирует и санитизирует ответ `/api/v2/{section}/filters` перед использованием.
 *
 * Внешние данные по умолчанию не доверенные (правило Validation в AGENTS): битые
 * поля вроде `relations` отбрасываются через `catch`, чтобы каскад не падал с
 * TypeError. При полностью некорректном payload возвращает пустой фильтр.
 */
export function parseFilter(payload: unknown): Filter {
  const result = filterSchema.safeParse(payload);

  if (result.success) {
    return result.data;
  }

  consola.error('[useFilter] Некорректные данные фильтра:', result.error);

  return { filters: [] };
}
