import type {
  MaintenanceGate,
  MaintenanceSiteSettings,
} from '../types/maintenance';

/**
 * Общий контракт режима «сайт закрыт на обновление»: умолчания, пределы полей
 * и роуты. Нужен и серверу (решение о заглушке, хранение настройки), и
 * клиенту (заглушка, форма в админке).
 */

/** Публичный роут: показывать ли заглушку текущему посетителю. */
export const MAINTENANCE_API_PATH = '/api/maintenance';

/** Роут админки: чтение (`GET`) и сохранение (`PUT`) настройки. */
export const MAINTENANCE_ADMIN_API_PATH = '/api/admin/maintenance';

export const MAINTENANCE_DEFAULT_TITLE =
  'Таверна закрыта: мы восстаём из пепла';

export const MAINTENANCE_DEFAULT_MESSAGE =
  'Нашу цитадель постигла беда, но жрецы уже читают «Истинное воскрешение». Мы переезжаем на новые земли, укрепляем стены и заново наполняем библиотеку.\n\nРитуал займёт немного времени — загляни позже, путник. Да не подведут тебя кости!';

/**
 * Настройка, пока админ её не сохранял: режим ВКЛЮЧЁН. Явное «выключено»
 * бывает только сохранённым из админки.
 */
export const MAINTENANCE_DEFAULT_SITE_SETTINGS: MaintenanceSiteSettings = {
  enabled: true,
  title: MAINTENANCE_DEFAULT_TITLE,
  message: MAINTENANCE_DEFAULT_MESSAGE,
  updatedAt: null,
  updatedBy: null,
};

/** Сайт открыт: заглушки нет. */
export const MAINTENANCE_OPEN_GATE: MaintenanceGate = {
  blocked: false,
  signedIn: false,
  title: '',
  message: '',
};

/**
 * Поле контекста запроса, где серверный middleware оставляет решение о
 * заглушке: его читают рендер страницы и плагин статуса ответа.
 */
export const MAINTENANCE_CONTEXT_KEY = 'maintenanceGate';

export const MAINTENANCE_TITLE_MAX_LENGTH = 120;

export const MAINTENANCE_MESSAGE_MAX_LENGTH = 2000;
