import { consola } from 'consola';
import { createError } from 'h3';

import { getErrorResponse, getPlural } from '#shared/utils';

/**
 * Авто-импорты Nuxt, которыми пользуется проверяемый код.
 *
 * Подставляются настоящие реализации из проекта, а не заглушки: тест должен
 * ловить ошибки в самих модулях, а не в подмене их окружения. Исключение —
 * `getOrigin`: он читает адрес текущего запроса Nuxt, которого вне приложения
 * нет, поэтому здесь возвращается фиксированный origin.
 */
const TEST_ORIGIN = 'https://ttg.club';

Object.assign(globalThis, {
  consola,
  createError,
  getErrorResponse,
  getPlural,
  getOrigin: () => TEST_ORIGIN,
});

export { TEST_ORIGIN };
