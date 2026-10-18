import ms from 'ms';

import { SUBSCRIPTION_SALES_API_PATH } from '#shared/consts';
import { subscriptionSalesSettingsSchema } from '#shared/utils';

import { SUBSCRIPTION_SALES_DATA_KEY } from '../model';

/**
 * Как часто открытая страница перепроверяет, не выключили ли оплату. Запрос
 * лёгкий и кешируется на сервере, а выключение должно дойти до уже открытых
 * страниц без F5.
 */
const SALES_POLL_INTERVAL_MS = ms('30s');

/**
 * Включена ли оплата подписки (переключатель в админке). Грузится ещё на
 * сервере, чтобы кнопка покупки сразу пришла в нужном виде, а дальше
 * перепроверяется: раз в полминуты, пока вкладка видна, и сразу при
 * возвращении на неё. Пока ответа нет или он с ошибкой, оплата считается
 * выключенной — кнопка остаётся «скоро».
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

  // Перепроверка нужна только в браузере: на сервере таймер пережил бы запрос.
  if (import.meta.client) {
    const visibility = useDocumentVisibility();

    const { pause, resume } = useIntervalFn(refresh, SALES_POLL_INTERVAL_MS, {
      immediate: false,
    });

    watch(
      visibility,
      (state, previousState) => {
        if (state !== 'visible') {
          pause();

          return;
        }

        // Вернулись на вкладку — состояние могло смениться, пока её не видели.
        if (previousState === 'hidden') {
          refresh();
        }

        resume();
      },
      { immediate: true },
    );
  }

  /**
   * Перечитывает настройку и сообщает, включена ли оплата сейчас. Нужна перед
   * покупкой: кнопка могла остаться активной до очередной перепроверки.
   */
  async function checkSalesEnabled(): Promise<boolean> {
    await refresh();

    return isSalesEnabled.value;
  }

  return { isSalesEnabled, checkSalesEnabled, refresh };
}
