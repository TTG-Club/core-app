import type { ComputedRef, DeepReadonly, Ref } from 'vue';

import type { BulkSubscriptionExtension } from '../model';

import { FetchError } from 'ofetch';

import { FetchStatus } from '~/shared/consts';

import {
  BULK_EXTENSION_API_PATH,
  BULK_EXTENSION_DATA_KEY,
  BULK_EXTENSION_ERROR_TEXT,
  BULK_EXTENSION_ERROR_TITLE,
  BULK_EXTENSION_SUCCESS_TITLE,
  formatBulkExtensionSummary,
  parseBulkSubscriptionExtension,
  parseBulkSubscriptionExtensions,
} from '../model';

/** Что отдаёт {@link useBulkSubscriptionExtension}. */
interface UseBulkSubscriptionExtensionReturn {
  /** Журнал прошлых продлений, новые сверху. */
  extensions: Ref<BulkSubscriptionExtension[]>;
  isExtensionsPending: ComputedRef<boolean>;
  hasExtensionsError: ComputedRef<boolean>;
  isExtending: DeepReadonly<Ref<boolean>>;
  startOperation: () => void;
  extend: (days: number) => Promise<boolean>;
}

/**
 * Массовое продление подписки всем активным подписчикам и журнал прошлых
 * продлений. Каждое подтверждение — своя операция (`operationId`): повтор
 * того же запроса (двойной клик, переотправка) subscriber-service не применит
 * второй раз.
 */
export function useBulkSubscriptionExtension(): UseBulkSubscriptionExtensionReturn {
  const requestFetch = useRequestFetch();
  const toast = useToast();

  // server: false — приватные данные subscriber-service грузим на клиенте.
  const {
    data: extensions,
    error: extensionsError,
    refresh: refreshExtensions,
    status: extensionsStatus,
  } = useAsyncData<BulkSubscriptionExtension[]>(
    BULK_EXTENSION_DATA_KEY,
    async () =>
      parseBulkSubscriptionExtensions(
        await requestFetch(BULK_EXTENSION_API_PATH),
      ),
    { default: () => [], server: false, lazy: true },
  );

  // 'idle' тоже ждём: на клиенте запрос стартует после первого рендера.
  const isExtensionsPending = computed(
    () =>
      extensionsStatus.value === FetchStatus.Pending
      || extensionsStatus.value === FetchStatus.Idle,
  );

  const hasExtensionsError = computed(() => !!extensionsError.value);

  const isExtending = ref(false);

  // Идентификатор выдаёт startOperation при открытии подтверждения: в браузере,
  // а не при серверной отрисовке страницы.
  const operationId = ref('');

  /**
   * Начинает новую операцию: вызывается при каждом открытии подтверждения,
   * чтобы новое продление не совпало по `operationId` с прошлым.
   */
  function startOperation(): void {
    operationId.value = crypto.randomUUID();
  }

  /**
   * Продлевает подписку всем активным подписчикам на указанное число дней и
   * обновляет журнал. Возвращает `true`, если продление прошло.
   */
  async function extend(days: number): Promise<boolean> {
    isExtending.value = true;

    try {
      const extension = parseBulkSubscriptionExtension(
        await requestFetch(BULK_EXTENSION_API_PATH, {
          method: 'POST',
          body: { days, operationId: operationId.value },
        }),
      );

      toast.add({
        title: BULK_EXTENSION_SUCCESS_TITLE,
        description: formatBulkExtensionSummary(extension),
        color: 'success',
      });

      await refreshExtensions();

      return true;
    } catch (error) {
      let description = BULK_EXTENSION_ERROR_TEXT;

      if (error instanceof FetchError) {
        description = error.data?.message || error.message;
      }

      toast.add({
        title: BULK_EXTENSION_ERROR_TITLE,
        description,
        color: 'error',
      });

      return false;
    } finally {
      isExtending.value = false;
    }
  }

  return {
    extensions,
    isExtensionsPending,
    hasExtensionsError,
    isExtending: readonly(isExtending),
    startOperation,
    extend,
  };
}
