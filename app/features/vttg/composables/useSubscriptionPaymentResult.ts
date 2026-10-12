import type { LocationQuery } from 'vue-router';

import type { SubscriptionPaymentResult } from '../model';

import {
  isSubscriptionPaymentResult,
  SUBSCRIPTION_PAYMENT_OPERATION_QUERY,
  SUBSCRIPTION_PAYMENT_RESULT_QUERY,
  SUBSCRIPTION_PAYMENT_RESULTS,
  SUBSCRIPTION_PAYMENT_SERVICE_QUERY_PREFIX,
} from '../model';

/**
 * Служебный ли параметр возврата с платёжной формы.
 */
function isPaymentQueryKey(key: string): boolean {
  return (
    key === SUBSCRIPTION_PAYMENT_RESULT_QUERY
    || key.startsWith(SUBSCRIPTION_PAYMENT_SERVICE_QUERY_PREFIX)
  );
}

/**
 * Возвращает query без служебных параметров возврата с платёжной формы.
 */
function omitPaymentQuery(query: LocationQuery): LocationQuery {
  return Object.fromEntries(
    Object.entries(query).filter(([key]) => !isPaymentQueryKey(key)),
  );
}

/**
 * Итог оплаты из адреса: наш параметр `payment`, а без него — «обрабатывается»,
 * если форма вернула номер операции.
 */
function getPaymentResult(
  query: LocationQuery,
): SubscriptionPaymentResult | null {
  const result = query[SUBSCRIPTION_PAYMENT_RESULT_QUERY];

  if (typeof result === 'string' && isSubscriptionPaymentResult(result)) {
    return result;
  }

  return query[SUBSCRIPTION_PAYMENT_OPERATION_QUERY] ? 'pending' : null;
}

/**
 * Показывает итог оплаты, когда платёжная форма вернула пользователя на страницу
 * подписки, и убирает служебные параметры из адреса, чтобы итог не повторялся
 * при обновлении страницы.
 */
export function useSubscriptionPaymentResult() {
  const route = useRoute();
  const router = useRouter();
  const toast = useToast();

  onMounted(() => {
    if (!Object.keys(route.query).some(isPaymentQueryKey)) {
      return;
    }

    const result = getPaymentResult(route.query);

    if (result) {
      toast.add(SUBSCRIPTION_PAYMENT_RESULTS[result]);
    }

    router.replace({ query: omitPaymentQuery(route.query) });
  });
}
