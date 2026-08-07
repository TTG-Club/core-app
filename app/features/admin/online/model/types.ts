export interface AdminOnlineCounters {
  guests: number;
  /**
   * Сколько посетителей сейчас в игровых мирах. Это подмножество гостей и
   * зарегистрированных, а не отдельное слагаемое: играть можно и с аккаунтом, и без него.
   * Поле необязательное — online-app отдаёт его не всегда.
   */
  players?: number;
  registered: number;
  total: number;
}

export interface AdminOnlineSiteStats extends AdminOnlineCounters {
  siteId: string;
}

export interface AdminOnlineStatsResponse {
  sites: AdminOnlineSiteStats[];
  total: AdminOnlineCounters;
  windowMinutes: number;
}

/** Где строку карточки отделяет линия от соседних. */
export type AdminOnlineSiteCardDivider = 'above' | 'below' | 'none';

/**
 * Строка карточки: подпись слева, число справа. Число уже приведено к строке — без
 * данных там прочерк, шаблону считать нечего.
 */
export interface AdminOnlineSiteCardRow {
  divider: AdminOnlineSiteCardDivider;
  /** Итог площадки — крупнее остальных строк. */
  isTotal: boolean;
  label: string;
  value: string;
}

/**
 * Карточка сетки: площадка известна всегда (в каркасе — из констант), а набор строк
 * зависит от площадки — у приложения и у сайтов считаются разные вещи.
 */
export interface AdminOnlineSiteCard {
  rows: AdminOnlineSiteCardRow[];
  siteId: string;
  siteLabel: string;
}
