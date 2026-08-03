export interface AdminOnlineCounters {
  guests: number;
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

/**
 * Карточка сетки: площадка известна всегда (в каркасе — из констант), а числа
 * уже приведены к строке — без данных там прочерк, шаблону считать нечего.
 */
export interface AdminOnlineSiteCard {
  guests: string;
  guestsLabel: string;
  registered: string;
  siteId: string;
  siteLabel: string;
  total: string;
}
