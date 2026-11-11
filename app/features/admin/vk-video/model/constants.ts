export const VK_VIDEO_ADMIN_PAGE_TITLE = 'Мой ВК для обложек';

/** Заголовок вкладки браузера — по образцу соседних страниц настроек. */
export const VK_VIDEO_ADMIN_SEO_TITLE = `${VK_VIDEO_ADMIN_PAGE_TITLE}: Настройки`;

export const VK_VIDEO_ADMIN_NAVIGATION_ICON = 'tabler:brand-vk';

/** Иконки состояния подключения и действий. */
export const VK_VIDEO_ICONS = {
  connect: 'tabler:brand-vk',
  connected: 'tabler:circle-check',
  disconnected: 'tabler:circle-dashed',
  disconnect: 'tabler:plug-connected-x',
  loadError: 'tabler:alert-triangle',
  cover: 'tabler:photo-video',
} as const;

/** Страница аккаунта ВК по его id. */
export const VK_PROFILE_URL_BASE = 'https://vk.com/id';

/** Подпись ссылки на аккаунт ВК — как id в самом ВК. */
export const VK_PROFILE_LABEL_PREFIX = 'id';

/** Ключ данных состояния подключения. */
export const VK_VIDEO_ADMIN_DATA_KEY = 'admin-vk-video-status';

/** Имя всплывающего окна входа: по нему страница понимает, что она в окне. */
export const VK_VIDEO_LOGIN_WINDOW_NAME = 'ttg-vk-video-login';

/** Размер всплывающего окна входа. */
export const VK_VIDEO_LOGIN_WINDOW_FEATURES = 'popup,width=600,height=720';

/** Тип сообщения окна входа открывшей его странице. */
export const VK_VIDEO_LOGIN_MESSAGE_TYPE = 'ttg:vk-video-login';

/** Как часто проверять, не закрыли ли окно входа вручную (мс). */
export const VK_VIDEO_LOGIN_WINDOW_POLL_MS = 500;

export const VK_VIDEO_ADMIN_PAGE_HINT =
  'У роликов ВК нет открытой ссылки на превью, как у YouTube. Чтобы взять кадр ролика обложкой записи, сайт спрашивает его у ВК от вашего имени. Каждый редактор подключает свой аккаунт ВК — общим аккаунтом никто не пользуется. Кадр берётся при правке записи и сохраняется на сайте как обычная обложка. Если вы не брали обложки около полугода, доступ истечёт — тогда подключите заново.';

export const VK_VIDEO_ADMIN_TEXT = {
  connected: 'Ваш ВК подключён',
  disconnected: 'Ваш ВК не подключён',
  account: 'Аккаунт ВК',
  connectedAt: 'Подключено',
  connect: 'Подключить ВК',
  reconnect: 'Подключить заново',
  disconnect: 'Отключить',
  cancel: 'Отмена',
  loadError: 'Не удалось узнать состояние подключения',
  connectSuccess: 'ВК подключён',
  connectError: 'ВК не подключился',
  connectStartError: 'Не удалось начать вход через ВК',
  popupBlocked:
    'Браузер не открыл окно входа ВК — разрешите всплывающие окна для сайта',
  disconnectSuccess: 'ВК отключён',
  disconnectError: 'Не удалось отключить ВК',
  disconnectConfirm:
    'Отключить ваш ВК? Ключ погасится и в самом ВК. Уже взятые обложки останутся.',
} as const;

/** Тексты блока обложки из ролика в редакторах записей. */
export const VK_VIDEO_COVER_TEXT = {
  take: 'Взять обложку из ролика',
  retake: 'Взять кадр из ролика заново',
  connectHint:
    'Подключите свой ВК — и обложка подставится из кадра ролика сама.',
  connectedHint: 'Обложка берётся из кадра ролика через ваш ВК.',
  success: 'Обложка взята из ролика ВК',
  error: 'Не удалось взять обложку из ролика',
} as const;

/** Формат даты подключения. */
export const VK_VIDEO_ADMIN_DATE_FORMAT = 'D MMMM YYYY, HH:mm';
