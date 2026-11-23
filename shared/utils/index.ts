export * from './env';
export * from './faker';
export * from './getErrorResponse';
export * from './getPlural';
// `getSlug` здесь намеренно нет: он тянет библиотеку транслитерации (185 КБ),
// и вместе с barrel она попадала в стартовый скрипт каждой страницы. Берите
// его авто-импортом или напрямую из `#shared/utils/getSlug`.
export * from './getStatusMessage';
export * from './home-hero';
export * from './mailing';
export * from './maintenance';
export * from './sortString';
export * from './subscription-sales';
export * from './user-avatar';
export * from './vk-video';
export * from './vttg-docs';
