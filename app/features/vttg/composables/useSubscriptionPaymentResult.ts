import type { LocationQuery } from 'vue-router';

import {
  isSubscriptionPaymentResult,
  SUBSCRIPTION_PAYMENT_RESULT_QUERY,
  SUBSCRIPTION_PAYMENT_RESULTS,
  SUBSCRIPTION_PAYMENT_TRANSACTION_QUERY,
} from '../model';

/**
 * Возвращает query без служебных параметров возврата с платёжной формы.
 */
function omitPaymentQuery(query: LocationQuery): LocationQuery {
  return Object.fromEntries(
    Object.entries(query).filter(
      ([key]) =>
        key !== SUBSCRIPTION_PAYMENT_RESULT_QUERY
        && key !== SUBSCRIPTION_PAYMENT_TRANSACTION_QUERY,
    ),
  );
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
    const result = route.query[SUBSCRIPTION_PAYMENT_RESULT_QUERY];

    if (!(typeof result === 'string' && result)) {
      return;
    }

    if (isSubscriptionPaymentResult(result)) {
      toast.add(SUBSCRIPTION_PAYMENT_RESULTS[result]);
    }

    router.replace({ query: omitPaymentQuery(route.query) });
  });
}
