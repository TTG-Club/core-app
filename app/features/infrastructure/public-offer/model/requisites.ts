import type { LegalDocumentFact } from '~ui/legal-document';

import { SUPPORT_EMAIL } from '~/shared/consts';

/**
 * Реквизиты исполнителя для оферты и пользовательского соглашения.
 * Значения в квадратных скобках — заглушки: перед подключением оплаты их нужно
 * заменить настоящими данными владельца проекта.
 */

/** Адрес сайта, на котором действуют документы */
export const SELLER_SITE = 'ttg.club';

/** Правовой статус исполнителя: самозанятый, ИП или ООО */
export const SELLER_STATUS = '[ЗАГЛУШКА: статус — самозанятый, ИП или ООО]';

/** ФИО или наименование исполнителя */
export const SELLER_NAME = '[ЗАГЛУШКА: ФИО или наименование исполнителя]';

/** ИНН исполнителя */
export const SELLER_INN = '[ЗАГЛУШКА: ИНН]';

/** ОГРНИП или ОГРН исполнителя — у самозанятого его нет */
export const SELLER_REGISTRATION_NUMBER =
  '[ЗАГЛУШКА: ОГРНИП или ОГРН, если есть]';

/** Телефон исполнителя для обращений покупателей */
export const SELLER_PHONE = '[ЗАГЛУШКА: телефон для связи]';

/** Реквизиты исполнителя карточкой «название — значение» */
export const SELLER_REQUISITES: Array<LegalDocumentFact> = [
  { label: 'Исполнитель', value: SELLER_NAME },
  { label: 'Статус', value: SELLER_STATUS },
  { label: 'ИНН', value: SELLER_INN },
  { label: 'ОГРНИП / ОГРН', value: SELLER_REGISTRATION_NUMBER },
  { label: 'Телефон', value: SELLER_PHONE },
  { label: 'Электронная почта', value: SUPPORT_EMAIL },
  { label: 'Сайт', value: SELLER_SITE },
];
