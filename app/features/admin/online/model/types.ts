import type { AdminStatFigure } from '~admin/dashboard/model';

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

/** Имя настройки отображения → значение → число уникальных посетителей. */
export type AdminOnlinePreferenceCounts = Record<
  string,
  Record<string, number>
>;

/** Чем пользовались посетители площадки за последние `days` суток, включая сегодня. */
export interface AdminOnlinePreferencePeriod {
  days: number;
  preferences: AdminOnlinePreferenceCounts;
}

export interface AdminOnlineSiteStats extends AdminOnlineCounters {
  /**
   * Срезы настроек отображения. Поле необязательное: площадки, которые настройки
   * не шлют, и online-app до обновления его не отдают.
   */
  preferences?: AdminOnlinePreferencePeriod[];
  siteId: string;
}

export interface AdminOnlineStatsResponse {
  sites: AdminOnlineSiteStats[];
  total: AdminOnlineCounters;
  windowMinutes: number;
}

/**
 * Плитка площадки: главное число — все посетители, под ним расшифровка. Площадка
 * известна всегда (в каркасе — из констант), а числа без данных — прочерки.
 */
export interface AdminOnlineSiteTile {
  figures: Array<AdminStatFigure>;
  siteId: string;
  value: string;
}

/**
 * Строка варианта настройки: подпись, число с долей и сама доля в процентах — для
 * полосы. Без данных вместо числа прочерк, а доля нулевая.
 */
export interface AdminOnlinePreferenceRow {
  label: string;
  /** Доля варианта от итога настройки, 0–100 */
  share: number;
  value: string;
}

/** Сводка одной настройки за период: варианты и итог. */
export interface AdminOnlinePreferenceSummary {
  name: string;
  rows: Array<AdminOnlinePreferenceRow>;
  title: string;
  total: string;
}

/** Вариант настройки отображения, который панель знает в лицо. */
export interface AdminOnlinePreferenceOption {
  label: string;
  value: string;
}

/** Настройка отображения и её известные варианты. */
export interface AdminOnlinePreferenceSection {
  name: string;
  options: ReadonlyArray<AdminOnlinePreferenceOption>;
  title: string;
}
