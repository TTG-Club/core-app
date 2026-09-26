import type { BadgeProps } from '@nuxt/ui';

import type { VttgCompendiumRebuildStatus } from './types';

/** Страница версии компендиума в админке. */
export const VTTG_COMPENDIUM_ADMIN_ROUTE = '/admin/vttg-compendium';

/** Чтение (`GET`) и подъём (`PUT`) версии — ручка core-api, идёт через общий прокси. */
export const VTTG_COMPENDIUM_VERSION_API_URL =
  '/api/v2/vttg/admin/compendium-version';

/** Ключ кеша версии компендиума. */
export const VTTG_COMPENDIUM_VERSION_DATA_KEY = 'admin-vttg-compendium-version';

/** На сколько поле предлагает поднять текущую версию, и шаг кнопок поля. */
export const VTTG_COMPENDIUM_VERSION_STEP = 1;

/** Как часто спрашивать о пересборке, пока она идёт, мс. */
export const VTTG_COMPENDIUM_REBUILD_POLL_INTERVAL_MS = 3000;

export const VTTG_COMPENDIUM_DATE_FORMAT = 'DD.MM.YYYY HH:mm';

export const VTTG_COMPENDIUM_PAGE_TITLE = 'Версия компендиума VTTG';

/** Заголовок вкладки браузера — по образцу соседних страниц настроек. */
export const VTTG_COMPENDIUM_SEO_TITLE = `${VTTG_COMPENDIUM_PAGE_TITLE}: Настройки`;

export const VTTG_COMPENDIUM_PAGE_DESCRIPTION =
  'Поднять версию выгрузки — приложение VTTG перекачает компендиум целиком';

export const VTTG_COMPENDIUM_NAVIGATION_ICON = 'tabler:versions';

export const VTTG_COMPENDIUM_CURRENT_TITLE = 'Текущая версия';

export const VTTG_COMPENDIUM_UPDATED_LABEL = 'Изменена';

/** Разделитель даты изменения и автора. */
export const VTTG_COMPENDIUM_UPDATED_SEPARATOR = ' · ';

export const VTTG_COMPENDIUM_REBUILD_TITLE = 'Пересборка выгрузки';

export const VTTG_COMPENDIUM_REBUILD_STARTED_LABEL = 'Начата';

export const VTTG_COMPENDIUM_REBUILD_FINISHED_LABEL = 'Закончена';

/** Подписи состояния пересборки. */
export const VTTG_COMPENDIUM_REBUILD_STATUS_LABELS: Record<
  VttgCompendiumRebuildStatus,
  string
> = {
  IDLE: 'Не запускалась',
  RUNNING: 'Идёт',
  DONE: 'Готово',
  FAILED: 'Ошибка',
};

/** Цвет значка состояния пересборки. */
export const VTTG_COMPENDIUM_REBUILD_STATUS_COLORS: Record<
  VttgCompendiumRebuildStatus,
  BadgeProps['color']
> = {
  IDLE: 'neutral',
  RUNNING: 'info',
  DONE: 'success',
  FAILED: 'error',
};

export const VTTG_COMPENDIUM_NEXT_TITLE = 'Новая версия';

export const VTTG_COMPENDIUM_NEXT_DESCRIPTION =
  'Поднимай версию после изменения формата выгрузки. Сайт сразу пересоберёт выгрузку, а приложение VTTG, увидев новую версию, скачает компендиум заново. Ниже текущей версию поставить нельзя.';

export const VTTG_COMPENDIUM_SUBMIT_LABEL = 'Поднять версию';

/** Иконка кнопки подъёма — и на странице, и в диалоге подтверждения. */
export const VTTG_COMPENDIUM_SUBMIT_ICON = 'tabler:arrow-big-up-lines';

/** Крутящаяся иконка значка, пока идёт пересборка. */
export const VTTG_COMPENDIUM_REBUILD_RUNNING_ICON = 'tabler:loader-2';

export const VTTG_COMPENDIUM_LOAD_ERROR_ICON = 'tabler:alert-triangle';

export const VTTG_COMPENDIUM_CONFIRM_TITLE = 'Поднять версию компендиума?';

export const VTTG_COMPENDIUM_SUCCESS_MESSAGE =
  'Версия поднята, выгрузка пересобирается';

export const VTTG_COMPENDIUM_SAVE_ERROR_TITLE = 'Не удалось поднять версию';

export const VTTG_COMPENDIUM_LOAD_ERROR_TEXT =
  'Не удалось загрузить версию компендиума.';

export const VTTG_COMPENDIUM_RETRY_LABEL = 'Повторить';
