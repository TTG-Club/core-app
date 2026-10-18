import type { H3Event } from 'h3';

/** Путь создания платежа в subscriber-service. */
const PAYMENT_CREATE_PATH = '/api/subscriptions/payments';

/**
 * Приводит путь к виду, в котором его сопоставит subscriber-service:
 * раскодирует `%xx`, отбрасывает параметры пути (`;x=1` — их срезает
 * Tomcat), схлопывает повторные слэши и убирает конечный. Иначе запрос
 * `/api/subscriptions/payments/` или `/api/subscriptions/%70ayments` прошёл бы
 * мимо проверки, а сервис оплаты принял бы его как обычный.
 *
 * @param path путь запроса вместе с query-строкой
 * @returns нормализованный путь; `null` — путь не раскодировался
 */
function normalizePath(path: string): string | null {
  const pathname = path.split('?')[0] ?? path;

  let decoded: string;

  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  return decoded
    .split('/')
    .map((segment) => segment.split(';')[0] ?? '')
    .filter(Boolean)
    .reduce((result, segment) => `${result}/${segment}`, '')
    .toLowerCase();
}

/**
 * Запрос создаёт платёж за подписку. Нераскодируемый путь тоже считается
 * таким — пропускать в сервис оплаты то, что не удалось проверить, нельзя.
 *
 * @param event событие запроса
 */
export function isPaymentCreateRequest(event: H3Event): boolean {
  if (event.method !== 'POST') {
    return false;
  }

  const path = normalizePath(event.path);

  return path === null || path === PAYMENT_CREATE_PATH;
}
