import type { ComputedRef, MaybeRefOrGetter } from 'vue';

/**
 * Готовит геттер Markdown сущности для кнопок копирования в `PageActions`
 * и `DrawerActions`.
 *
 * Отдаётся геттер, а не готовая строка: сборка разбирает всю разметку
 * сущности, поэтому откладывается до клика по кнопке. Пока сущность не
 * загружена — `undefined`, и кнопка не показывается.
 *
 * @param entity - Сущность раздела; пока она не загружена — пустое значение
 * @param build - Сборщик Markdown этого раздела
 * @returns Геттер Markdown либо `undefined`, пока сущности нет
 */
export function useEntityMarkdown<TEntity>(
  entity: MaybeRefOrGetter<TEntity | undefined | null>,
  build: (entity: TEntity) => string,
): ComputedRef<(() => string) | undefined> {
  return computed(() => {
    const value = toValue(entity);

    return value ? () => build(value) : undefined;
  });
}
