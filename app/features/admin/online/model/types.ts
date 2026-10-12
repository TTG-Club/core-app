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

/**
 * Плитка карточки приложения: короткая подпись, число и расшифровка для подсказки.
 * Число уже приведено к строке — без данных там прочерк.
 */
export interface AdminOnlineAppTile {
  /** Что за число: разворачивается в подсказке при наведении */
  hint: string;
  label: string;
  value: string;
}

/** Вариант настройки отображения, который карточка знает в лицо: подпись и иконка. */
export interface AdminOnlinePreferenceOption {
  icon: string;
  label: string;
  value: string;
}

/** Секция карточки настроек: одна настройка и её известные варианты. */
export interface AdminOnlinePreferenceSection {
  name: string;
  options: ReadonlyArray<AdminOnlinePreferenceOption>;
  title: string;
}

/** Строка секции: вариант настройки, сколько посетителей его выбрали и какая это доля. */
export interface AdminOnlinePreferenceRow {
  count: number;
  icon: string;
  label: string;
  /** Доля от всех посетителей секции за период, целые проценты */
  percent: number;
  /** Та же доля, подписанная для вывода */
  share: string;
  value: string;
}
