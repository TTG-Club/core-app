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

/**
 * Посещаемость площадки за одни сутки. Сутки без данных — сервис ещё не копил
 * или лежал — приходят с датой и `null` в числах: на графике это разрыв, а не ноль.
 */
export interface AdminOnlineHistoryDay {
  /** Средний онлайн за сутки по замерам сервиса */
  averageOnline: number | null;
  /** Дата суток в формате `YYYY-MM-DD` */
  date: string;
  guests: number | null;
  /** Самый большой онлайн за сутки */
  peakOnline: number | null;
  /** Когда случился пик, ISO-время */
  peakAt: string | null;
  registered: number | null;
  /** Сколько разных людей заходило за сутки: гости и вошедшие вместе */
  visitors: number | null;
}

/** История посещаемости одной площадки, от старых суток к новым. */
export interface AdminOnlineHistorySite {
  days: AdminOnlineHistoryDay[];
  siteId: string;
}

export interface AdminOnlineHistoryResponse {
  sites: AdminOnlineHistorySite[];
  /** Все площадки вместе: посетители — объединение, а не сумма */
  total: Pick<AdminOnlineHistorySite, 'days'>;
}

/** Что показывает график посещаемости. */
export type AdminOnlineHistoryMetric =
  | 'averageOnline'
  | 'peakOnline'
  | 'visitors';

/** Показатель посещаемости: подпись плитки, подсказка и то, как его сводить за период. */
export interface AdminOnlineHistoryMetricSection {
  hint: string;
  label: string;
  metric: AdminOnlineHistoryMetric;
  /** Что говорит плитка за период: среднее по суткам или лучшие сутки */
  summary: 'average' | 'maximum';
}

/** Плитка-переключатель показателя: итог за период и подпись к нему. */
export interface AdminOnlineHistoryMetricTile extends AdminOnlineHistoryMetricSection {
  /** Пояснение под числом: за какие сутки или «в среднем за сутки» */
  caption: string;
  value: string;
}

/** Плитка показателя в панели: с признаком выбора и классами под него. */
export interface AdminOnlineHistoryMetricView extends AdminOnlineHistoryMetricTile {
  className: string;
  isActive: boolean;
}

/** Точка графика: сутки и значение показателя, `null` — разрыв линии. */
export interface AdminOnlineHistoryPoint {
  day: AdminOnlineHistoryDay;
  value: number | null;
}
