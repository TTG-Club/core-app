import { SUBSCRIPTION_SALES_API_PATH } from '#shared/consts';
import { subscriptionSalesSettingsSchema } from '#shared/utils';

import { SUBSCRIPTION_SALES_DATA_KEY } from '../model';

/**
 * Включена ли оплата подписки (переключатель в админке). Грузится ещё на
 * сервере, чтобы кнопка покупки сразу пришла в нужном виде. Пока ответа нет
 * или он с ошибкой, оплата считается выключенной — кнопка остаётся «скоро».
 */
export function useSubscriptionSales() {
  const { data, refresh } = useAsyncData(
    SUBSCRIPTION_SALES_DATA_KEY,
    async () =>
      subscriptionSalesSettingsSchema.parse(
        await $fetch<unknown>(SUBSCRIPTION_SALES_API_PATH),
      ),
    { dedupe: 'defer' },
  );

  const isSalesEnabled = computed(() => data.value?.enabled === true);

  return { isSalesEnabled, refresh };
}
