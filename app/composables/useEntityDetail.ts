import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue';

import { ref, shallowRef, toValue, watch } from 'vue';

/** Состояние загрузки записи: ещё нечего грузить, грузится, готово, сбой. */
export type EntityDetailStatus = 'idle' | 'pending' | 'success' | 'error';

/** Запись раздела и состояние её загрузки. */
export interface EntityDetail<Detail> {
  /** Загруженная запись; пока её нет — `undefined`. */
  data: ShallowRef<Detail | undefined>;
  status: Ref<EntityDetailStatus>;
}

/**
 * Запись раздела по адресу, который может меняться: дровер записи
 * переиспользуется и на повторном открытии лишь получает другой адрес.
 *
 * Показанная запись всегда та, чей адрес задан сейчас: при смене адреса
 * прежняя запись сразу убирается, а ответ, пришедший к уже неактуальному
 * адресу, отбрасывается. Общего кеша между компонентами нет намеренно: с
 * общим кешем по ключу запрос одного дровера мог выполниться с адресом
 * другого, и под именем одной записи оказывалась другая.
 *
 * Побочные действия: запрос к серверу при создании и при каждой смене
 * адреса. На сервере ничего не грузит — дроверы открываются в браузере.
 *
 * @param address - Адрес записи в API; пустая строка — грузить нечего
 * @param load - Загрузка записи по адресу; по умолчанию — обычный запрос
 * @returns Запись и состояние её загрузки
 */
export function useEntityDetail<Detail>(
  address: MaybeRefOrGetter<string>,
  load: (requestedAddress: string) => Promise<Detail> = (requestedAddress) =>
    $fetch<Detail>(requestedAddress),
): EntityDetail<Detail> {
  const data = shallowRef<Detail>();
  const status = ref<EntityDetailStatus>('idle');

  if (import.meta.server) {
    return { data, status };
  }

  watch(
    () => toValue(address),
    async (requestedAddress) => {
      data.value = undefined;

      if (!requestedAddress) {
        status.value = 'idle';

        return;
      }

      status.value = 'pending';

      try {
        const loaded = await load(requestedAddress);

        // Пока грузили, дровер открыли с другой записью: её ответ придёт
        // своим запросом, этот уже ни к чему
        if (toValue(address) !== requestedAddress) {
          return;
        }

        data.value = loaded;
        status.value = 'success';
      } catch {
        if (toValue(address) === requestedAddress) {
          status.value = 'error';
        }
      }
    },
    { immediate: true },
  );

  return { data, status };
}
