import type { FilterGroups } from '../types';

/**
 * Порядок групп источников на экране. Сервис отдаёт их в порядке своего
 * перечисления, а читателю нужен свой: сначала официальные книги — их
 * выбирают чаще всего, в конце тестовые материалы — их почти никогда.
 *
 * Ключи те же, что в `SourceTypeKey`; шаг между значениями оставлен, чтобы
 * новый тип можно было вставить в середину, не переписывая соседей.
 */
const SOURCE_GROUP_ORDER: Record<string, number> = {
  OFFICIAL: 10,
  SETTING: 20,
  MODULE: 30,
  THIRD_PARTY: 40,
  CUSTOM: 50,
  TEST: 90,
};

/**
 * Куда встают неизвестные типы: после всего знакомого, но раньше тестовых
 * материалов — новый тип источника полезнее черновиков.
 */
const UNKNOWN_SOURCE_GROUP_ORDER = 60;

/**
 * Упорядочивает группы источников для показа.
 *
 * Сортировка стабильная, поэтому группы с одинаковым весом сохраняют порядок
 * сервиса. На запросы порядок не влияет: в query уходят идентификаторы.
 *
 * @param groups Группы источников из ответа сервиса.
 */
export function sortSourceGroups(groups: FilterGroups): FilterGroups {
  return [...groups].sort(
    (leftGroup, rightGroup) =>
      (SOURCE_GROUP_ORDER[leftGroup.key] ?? UNKNOWN_SOURCE_GROUP_ORDER)
      - (SOURCE_GROUP_ORDER[rightGroup.key] ?? UNKNOWN_SOURCE_GROUP_ORDER),
  );
}
