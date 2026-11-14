/** Заглушка блока главной, чей запрос упал (сеть, 429, 5xx) */
export const HOME_LOAD_ERROR_TEXT = 'Не удалось загрузить';

/** Пояснение под заглушкой: блок сам повторит запрос */
export const HOME_LOAD_ERROR_HINT = 'Попробуем ещё раз через несколько секунд';

/** Кнопка ручного повтора в заглушке */
export const HOME_LOAD_RETRY_LABEL = 'Повторить';

/**
 * Паузы перед автоповторами упавшего запроса, по порядку; дальше — последняя.
 * Растут, чтобы при перегрузке (429) блоки главной не добивали лимит
 * запросов: окно лимитера — минута.
 */
export const HOME_LOAD_RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000];

/* --- Перелистывание новостей -------------------------------------------- */

/** Сколько секунд новость стоит на месте до смены следующей */
export const HOME_NEWS_ROTATE_SECONDS = 8;

/**
 * Сколько секунд стоит первая, самая свежая новость: читатель только открыл
 * главную и не успевает её разглядеть за обычные секунды
 */
export const HOME_NEWS_FIRST_ROTATE_SECONDS = 20;

export const HOME_NEWS_ROTATION_TEXT = {
  switcher: 'Переключатель новостей',
  pause: 'Остановить смену новостей',
  play: 'Запустить смену новостей',
  previous: 'Предыдущая новость',
  next: 'Следующая новость',
  item: 'Новость',
} as const;

export const HOME_NEWS_ROTATION_ICON = {
  pause: 'tabler:player-pause-filled',
  play: 'tabler:player-play-filled',
  previous: 'tabler:chevron-left',
  next: 'tabler:chevron-right',
} as const;

/**
 * Дорожка точки переключателя: у показанной новости — полоска отсчёта (в
 * узкой панели короче), у остальных — точка.
 */
export const HOME_NEWS_SWITCHER_TRACK_CLASS = {
  active: 'w-14 bg-current/40',
  activeCompact: 'w-8 bg-current/40',
  idle: 'w-2 bg-current group-hover/dot:text-primary',
} as const;

/**
 * Тело панели с обложкой во всю ширину: без полей, столбцом, тянется на
 * высоту панели — обложка добирает высоту, когда панель растянул ряд.
 */
export const HOME_PANEL_COVER_BODY_CLASS =
  'flex min-h-0 flex-auto flex-col p-0';

/**
 * Скелетон обложки новости: тех же пропорций, что сама обложка, — панель не
 * прыгает, когда новость приедет.
 */
export const HOME_NEWS_COVER_SKELETON_CLASS = {
  regular:
    'aspect-16/10 min-h-0 w-full flex-auto rounded-none sm:aspect-2/1 xl:aspect-21/9',
  compact:
    'aspect-16/10 min-h-0 w-full flex-auto rounded-none sm:aspect-2/1 xl:aspect-16/10',
} as const;
