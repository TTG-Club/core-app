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
