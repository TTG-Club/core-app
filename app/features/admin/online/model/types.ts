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

/**
 * Работа с инструментом площадки за последние `days` суток, включая сегодня.
 * День человека засчитан, если за него набралось достаточно времени работы;
 * порог держит сервис учёта.
 */
export interface AdminOnlineUsagePeriod {
  /** Сколько засчитанных дней набралось у всех людей вместе */
  activeDays: number;
  /** Сколько минут работы пришлось на засчитанные дни */
  activeMinutes: number;
  days: number;
  /** Сколько разных людей набрали два засчитанных дня и больше */
  returning: number;
  /** Сколько разных людей набрали хотя бы один засчитанный день */
  users: number;
  /** Сколько разных людей открывали инструмент */
  visitors: number;
}

/** Статистика одного инструмента площадки по периодам. */
export interface AdminOnlineFeatureUsage {
  feature: string;
  periods: AdminOnlineUsagePeriod[];
}

export interface AdminOnlineSiteStats extends AdminOnlineCounters {
  /**
   * Срезы настроек отображения. Поле необязательное: площадки, которые настройки
   * не шлют, и online-app до обновления его не отдают.
   */
  preferences?: AdminOnlinePreferencePeriod[];
  siteId: string;
  /**
   * Работа с инструментами площадки. Поле необязательное: online-app до
   * обновления его не отдаёт.
   */
  usage?: AdminOnlineFeatureUsage[];
}

/** Инструмент, чью статистику показывает панель. */
export interface AdminOnlineUsageSection {
  /** Имя инструмента в сервисе учёта */
  feature: string;
  /** Пояснение к панели: прячется за значком у заголовка */
  hint: string;
  title: string;
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
  /** Пояснение к настройке: прячется за значком у заголовка */
  hint?: string;
  name: string;
  rows: Array<AdminOnlinePreferenceRow>;
  title: string;
  total: string;
  wide: boolean;
}

/** Вариант настройки отображения, который панель знает в лицо. */
export interface AdminOnlinePreferenceOption {
  label: string;
  value: string;
}

/** Настройка отображения и её известные варианты. */
export interface AdminOnlinePreferenceSection {
  /** Пояснение к настройке: прячется за значком у заголовка */
  hint?: string;
  name: string;
  options: ReadonlyArray<AdminOnlinePreferenceOption>;
  title: string;
  /** Вариантов много и подписи длинные — сводка идёт строкой во всю ширину панели */
  wide?: boolean;
}
