/**
 * Позиция варианта стартового снаряжения из ответа детали класса или
 * предыстории. Название проставляет бэк по ссылке; позиция без ссылки —
 * свободное уточнение («музыкальный инструмент на выбор»).
 */
export interface StartingEquipmentItemResponse {
  url?: string | null;
  name?: string | null;
  quantity?: number | null;
  description?: string | null;
  /** Раздел карточки: `items` или `magic-items`; пусто — «Предметы». */
  section?: string | null;
}

/** Вариант стартового снаряжения: «(А) …» или «(Б) 50 зм». */
export interface StartingEquipmentOptionResponse {
  /** Буква варианта; бэк проставляет её по порядку. */
  label?: string | null;
  items?: Array<StartingEquipmentItemResponse> | null;
  coins?: number | null;
  /** Монета подписью («зм»). */
  coin?: string | null;
}
