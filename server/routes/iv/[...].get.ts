/**
 * Страницы статей / новостей для Telegram Instant View: `/iv/articles/{slug}` отдаёт core-api
 * (см. ArticleInstantViewController). Здесь только проксирование — HTML собирает бэк, чтобы
 * шаблон Instant View опирался на стабильную разметку, а не на хеши классов Nuxt.
 */
export default defineEventHandler(proxy);
