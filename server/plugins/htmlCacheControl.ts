import {
  CACHE_CONTROL_HEADER,
  PAGE_CACHE_CONTROL,
} from '#server/domain/page-cache';

/**
 * Страницы (HTML от SSR) браузер обязан перепроверять у сервера при каждом
 * открытии. Без заголовка часть браузеров держала старый HTML после выкладки,
 * тот ссылался на удалённые чанки старой сборки, и сайт работал наполовину
 * до Ctrl+Shift+R. Чанки `/_nuxt/*` с хэшем в имени по-прежнему кэшируются
 * навсегда — этот хук их не трогает. Заголовок, уже заданный маршрутом,
 * не перезаписывается.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (pageResponse, { event }) => {
    if (getResponseHeader(event, CACHE_CONTROL_HEADER)) {
      return;
    }

    pageResponse.headers = {
      ...pageResponse.headers,
      [CACHE_CONTROL_HEADER]: PAGE_CACHE_CONTROL,
    };
  });
});
