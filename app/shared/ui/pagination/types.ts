/** Раскладка пагинации — набор того, что она показывает при данной ширине. */
export interface PaginationLayout {
  /** Максимум соседних номеров вокруг текущего. */
  maxSiblingCount: number;
  /** Показывать первую и последнюю страницы с многоточиями (`show-edges`). */
  showEdges: boolean;
  /** Показывать кнопки «в начало» и «в конец». */
  showEdgeControls: boolean;
}

/** Итоговые настройки пагинации, подобранные под ширину контейнера. */
export interface PaginationSettings {
  /** Сколько соседних номеров показать вокруг текущего. */
  siblingCount: number;
  /** Показывать первую и последнюю страницы с многоточиями. */
  showEdges: boolean;
  /** Показывать кнопки «в начало» и «в конец». */
  showEdgeControls: boolean;
}
