import type { LegalDocumentFact } from '~ui/legal-document';

import { SUPPORT_EMAIL } from '~/shared/consts';

/**
 * Реквизиты исполнителя для оферты и пользовательского соглашения.
 * Исполнитель — самозанятый, поэтому ОГРНИП и ОГРН у него нет.
 */

/** Адрес сайта, на котором действуют документы */
export const SELLER_SITE = 'ttg.club';

/** Правовой статус исполнителя */
export const SELLER_STATUS =
  'самозанятый, плательщик налога на профессиональный доход';

/** ФИО исполнителя */
export const SELLER_NAME = 'Окольский Александр Олегович';

/** ИНН исполнителя */
export const SELLER_INN = '775124102223';

/** Реквизиты исполнителя карточкой «название — значение» */
export const SELLER_REQUISITES: Array<LegalDocumentFact> = [
  { label: 'Исполнитель', value: SELLER_NAME },
  { label: 'Статус', value: SELLER_STATUS },
  { label: 'ИНН', value: SELLER_INN },
  { label: 'Электронная почта', value: SUPPORT_EMAIL },
  { label: 'Сайт', value: SELLER_SITE },
];
